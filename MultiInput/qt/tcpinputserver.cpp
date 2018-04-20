#include "textcommandparser.h"
#include "tcpinputserver.h"

TcpInputServer::TcpInputServer(std::shared_ptr<SerialPortWriter> writer, QObject *parent) : ControllerInput(writer, parent)
{
    currentState.lx = STICK_CENTER;
    currentState.ly = STICK_CENTER;
    currentState.rx = STICK_CENTER;
    currentState.ry = STICK_CENTER;
    currentState.dpad = DPAD_NONE;
    currentState.buttonsPressed = BUTTON_NONE;
    currentState.buttonsReleased = BUTTON_NONE;

    currentCommand.waitPackets = 0;

    connect(&commandMapWatcher, &QFileSystemWatcher::fileChanged, this, &TcpInputServer::onMappingFileChange);
    commandMapWatcher.addPath("commandMapping.txt");
}

TcpInputServer::~TcpInputServer() {
    delete tcpServer;
    tcpServer = nullptr;
    delete networkSession;
    networkSession = nullptr;
}

void TcpInputServer::onMappingFileChange(QString path) {
    QFile file(path);
    if (!file.exists()) {
        emit error(tr("File %1 does not exist.").arg(path));
        return;
    }
    if (!file.open(QIODevice::ReadOnly | QIODevice::Text)) {
        emit error(tr("Error opening file %1").arg(path));
        return;
    }
    emit message(tr("Reading mapping file %1").arg(path));
    QTextStream textStream(&file);
    commandParser.readCommandMapping(textStream.readAll());
}

void TcpInputServer::begin() {
    onMappingFileChange("commandMapping.txt");

    QNetworkConfigurationManager manager;
    if (manager.capabilities() & QNetworkConfigurationManager::NetworkSessionRequired) {
        // Get saved network configuration
        QSettings settings(QSettings::UserScope, QLatin1String("QtProject"));
        settings.beginGroup(QLatin1String("QtNetwork"));
        const QString id = settings.value(QLatin1String("DefaultNetworkConfiguration")).toString();
        settings.endGroup();

        // If the saved network configuration is not currently discovered use the system default
        QNetworkConfiguration config = manager.configurationFromIdentifier(id);
        if ((config.state() & QNetworkConfiguration::Discovered) !=
            QNetworkConfiguration::Discovered) {
            config = manager.defaultConfiguration();
        }

        networkSession = new QNetworkSession(config, this);
        connect(networkSession, &QNetworkSession::opened, this, &TcpInputServer::sessionOpened);

        emit message(tr("Opening network session."));
        networkSession->open();
    } else {
        sessionOpened();
    }

    connect(tcpServer, &QTcpServer::newConnection, this, &TcpInputServer::createConnection);
}

void TcpInputServer::onSerialReady() {
    isSerialReady = true;

    if (isSerialReady && clients.size() > 0) {
        emit controllerReady();
    }
}

void TcpInputServer::sessionOpened() {
    // Save the used configuration
    if (networkSession) {
        QNetworkConfiguration config = networkSession->configuration();
        QString id;
        if (config.type() == QNetworkConfiguration::UserChoice)
            id = networkSession->sessionProperty(QLatin1String("UserChoiceConfiguration")).toString();
        else
            id = config.identifier();

        QSettings settings(QSettings::UserScope, QLatin1String("QtProject"));
        settings.beginGroup(QLatin1String("QtNetwork"));
        settings.setValue(QLatin1String("DefaultNetworkConfiguration"), id);
        settings.endGroup();
    }

    tcpServer = new QTcpServer(this);
    if (!tcpServer->listen(QHostAddress::Any, 31337)) {
        emit warning(tr("Unable to start the TCP server: %1. Retrying with random port...").arg(tcpServer->errorString()));
        if (!tcpServer->listen()) {
            emit error(tr("Unable to start the TCP server: %1.").arg(tcpServer->errorString()));
        }
    }
    QString ipAddress;
    QList<QHostAddress> ipAddressesList = QNetworkInterface::allAddresses();
    // use the first non-localhost IPv4 address
    for (int i = 0; i < ipAddressesList.size(); ++i) {
        if (ipAddressesList.at(i) != QHostAddress::LocalHost &&
            ipAddressesList.at(i).toIPv4Address()) {
            ipAddress = ipAddressesList.at(i).toString();
            break;
        }
    }
    // if we did not find one, use IPv4 localhost
    if (ipAddress.isEmpty())
        ipAddress = QHostAddress(QHostAddress::Any).toString();
    emit message(tr("TCP server is now listening on %1:%2").arg(ipAddress).arg(tcpServer->serverPort()));
}

void TcpInputServer::createConnection() {
    QTcpSocket *client = tcpServer->nextPendingConnection();
    clients << client;
    connect(client, &QTcpSocket::disconnected, [=]() {
        cleanupConnection(client);
    });
    connect(client, &QTcpSocket::readyRead, [=]() {
        onIncomingData(client);
    });
    emit message(tr("Client connected from %1:%2").arg(client->peerAddress().toString()).arg(client->peerPort()));
    emit controllerConnectionStateChanged(true);

    if (isSerialReady && clients.size() == 1) {
        emit controllerReady();
    }
}

void TcpInputServer::cleanupConnection(QTcpSocket *client) {
    client->deleteLater();
    clients.remove(client);
    client = nullptr;

    if (clients.size() == 0)
        emit controllerConnectionStateChanged(false);
}

void TcpInputServer::onIncomingData(QTcpSocket *client) {
    while (client->canReadLine()) {
        QString line = client->readLine().simplified().toLower();

        if (line.startsWith("update ")) {
            //emit message("Update frame: " + line);
            commandQueue << commandParser.parseUpdateFrame(line);
        } else if (line.startsWith("command ")) {
            //emit message("Command frame: " + line);
            commandQueue << commandParser.parseLine(line);
        }
    }
}

void TcpInputServer::getState(quint8 *outLx, quint8 *outLy, quint8 *outRx, quint8 *outRy, Dpad_t *outDpad, Button_t *outButtons, uint8_t *outVendorspec) {
    if (outLx) *outLx = currentState.lx.value();
    if (outLy) *outLy = currentState.ly.value();
    if (outRx) *outRx = currentState.rx.value();
    if (outRy) *outRy = currentState.ry.value();
    if (outDpad) *outDpad = currentState.dpad.value();
    if (outButtons) *outButtons = currentState.buttonsPressed.value();
    if (outVendorspec) *outVendorspec = 0;
}

void TcpInputServer::onPacketSent() {
    if (currentCommand.waitPackets == 0 && !commandQueue.isEmpty()) {
        currentCommand = commandQueue.dequeue();

        if (currentCommand.lx) currentState.lx = currentCommand.lx;
        if (currentCommand.ly) currentState.ly = currentCommand.ly;
        if (currentCommand.rx) currentState.rx = currentCommand.rx;
        if (currentCommand.ry) currentState.ry = currentCommand.ry;
        if (currentCommand.dpad) currentState.dpad = currentCommand.dpad;
        if (currentCommand.buttonsPressed) currentState.buttonsPressed = currentState.buttonsPressed.value() | currentCommand.buttonsPressed.value();
        if (currentCommand.buttonsReleased) currentState.buttonsPressed = currentState.buttonsPressed.value() & ~(currentCommand.buttonsReleased.value());

        QByteArray newData = getData();
        writer.get()->changeData(newData);
        emit controllerStateChanged(newData);
    }
    if (currentCommand.waitPackets > 0) {
        currentCommand.waitPackets--;
    }
}
