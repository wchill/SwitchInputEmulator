#include "twitchircbot.h"
#include "ircresponse.h"
#include <QTime>
#include <cmath>

TwitchIrcBot::TwitchIrcBot(QString const &username, QString const &password, std::shared_ptr<Controller> controller, QObject *parent) : QObject(parent), username(username), password(password), controller(controller)
{
    connection = new QTcpSocket(this);
    connect(connection, SIGNAL(readyRead()), this, SLOT(readData()));

    connect(this, SIGNAL(changeHat(Dpad_t)), controller.get(), SLOT(onHatChange(Dpad_t)));
    connect(this, SIGNAL(holdButtons(Button_t)), controller.get(), SLOT(onButtonPress(Button_t)));
    connect(this, SIGNAL(releaseButtons(Button_t)), controller.get(), SLOT(onButtonRelease(Button_t)));
    connect(this, SIGNAL(changeLeftStick(double,double)), controller.get(), SLOT(onLeftStickXYDouble(double, double)));
    connect(this, SIGNAL(changeRightStick(double,double)), controller.get(), SLOT(onRightStickXYDouble(double, double)));
    connect(this, SIGNAL(controllerWait(ulong)), controller.get(), SLOT(onWait(ulong)));

    hatCommands["up"]           = DPAD_UP;
    hatCommands["uplt"]         = DPAD_UP_LEFT;
    hatCommands["uprt"]         = DPAD_UP_RIGHT;
    hatCommands["dn"]           = DPAD_DOWN;
    hatCommands["dnlt"]         = DPAD_DOWN_LEFT;
    hatCommands["dnrt"]         = DPAD_DOWN_RIGHT;
    hatCommands["lt"]           = DPAD_LEFT;
    hatCommands["rt"]           = DPAD_RIGHT;
    hatCommands["upleft"]       = DPAD_UP_LEFT;
    hatCommands["upright"]      = DPAD_UP_RIGHT;
    hatCommands["down"]         = DPAD_DOWN;
    hatCommands["downleft"]     = DPAD_DOWN_LEFT;
    hatCommands["downright"]    = DPAD_DOWN_RIGHT;
    hatCommands["left"]         = DPAD_LEFT;
    hatCommands["right"]        = DPAD_RIGHT;

    buttonCommands["a"]         = BUTTON_A;
    buttonCommands["b"]         = BUTTON_B;
    buttonCommands["x"]         = BUTTON_X;
    buttonCommands["y"]         = BUTTON_Y;
    buttonCommands["l"]         = BUTTON_L;
    buttonCommands["r"]         = BUTTON_R;
    buttonCommands["zl"]        = BUTTON_ZL;
    buttonCommands["zr"]        = BUTTON_ZR;
    buttonCommands["l3"]        = BUTTON_LCLICK;
    buttonCommands["r3"]        = BUTTON_RCLICK;
    buttonCommands["plus"]      = BUTTON_PLUS;
    buttonCommands["minus"]     = BUTTON_MINUS;
    //buttonCommands["home"]      = BUTTON_HOME;
    //buttonCommands["capture"]   = BUTTON_CAPTURE;

    analogStickCommands << "ls" << "rs";
}

void TwitchIrcBot::connectToServer() {
    emit connecting();
    connection->connectToHost(QString("irc.chat.twitch.tv"), 6667);
    send("PASS " + password);
    send("NICK " + username);
    send("CAP REQ :twitch.tv/membership");
    send("CAP REQ :twitch.tv/tags");
    send("CAP REQ :twitch.tv/commands");
}

void TwitchIrcBot::readData() {
    while (connection->canReadLine()) {
        QString line = connection->readLine().trimmed();
        IrcResponse response(line);
        std::cout << ">" << line.toStdString() << std::endl;

        if (response.command() == "376") {
            emit loggedIn(username);
        } else if (response.command() == "PING") {
            send("PONG :tmi.twitch.tv");
        } else if (response.command() == "PRIVMSG") {
            emit newPrivmsg(response);
            handleControllerCommand(response);
        } else if (response.command() == "WHISPER") {
            emit newWhisper(response);
        }
    }
}

void TwitchIrcBot::send(const QString &str) {
    connection->write(str.toUtf8());
    connection->write("\r\n");
    std::cout << "<" << str.toStdString() << std::endl;
}

void TwitchIrcBot::joinChannels(const QStringList &channels) {
    for (auto it = channels.begin(); it != channels.end(); it++) {
        send("JOIN " + *it);
    }
}

void TwitchIrcBot::handleControllerCommand(const IrcResponse &response) {
    if (response.params().length() < 2) return;

    QStringList paramList = response.params().at(1).toLower().split(" ");
    if (paramList.length() < 1) return;
    if (hatCommands.contains(paramList[0])) handleHatCommand(response, paramList);
    else if (buttonCommands.contains(paramList[0])) handleButtonCommand(response, paramList);
    else if (analogStickCommands.contains(paramList[0])) handleAnalogStickCommand(response, paramList);
}

void TwitchIrcBot::handleHatCommand(const IrcResponse &response, const QStringList &params) {
    QString commandName = params.at(0);
    Dpad_t dpad = hatCommands[commandName];
    if (params.length() >= 2) {
        QString action = params.at(1);
        if (action == "hold") {
            emit changeHat(dpad);
            emit playerCommandIssued(QString("%1 %2 hold")
                                     .arg(response.senderNick(), -25, ' ')
                                     .arg(commandName, 12, ' '));
            return;
        } else if (action == "release") {
            emit changeHat(DPAD_NONE);
            emit playerCommandIssued(QString("%1 %2 release")
                                     .arg(response.senderNick(), -25, ' ')
                                     .arg(commandName, 9, ' '));
            return;
        }
    }
    emit playerCommandIssued(QString("%1 %2")
                             .arg(response.senderNick(), -25, ' ')
                             .arg(commandName, 17, ' '));
    emit changeHat(dpad);
    emit controllerWait();
    emit changeHat(DPAD_NONE);
}

void TwitchIrcBot::handleButtonCommand(const IrcResponse &response, const QStringList &params) {
    QString commandName = params.at(0);
    Button_t buttons = buttonCommands[commandName];
    if (params.length() >= 2) {
        QString action = params.at(1);
        if (action == "hold") {
            emit holdButtons(buttons);
            emit playerCommandIssued(QString("%1 %2 hold")
                                     .arg(response.senderNick(), -25, ' ')
                                     .arg(commandName, 12, ' '));
            return;
        } else if (action == "release") {
            emit releaseButtons(buttons);
            emit playerCommandIssued(QString("%1 %2 release")
                                     .arg(response.senderNick(), -25, ' ')
                                     .arg(commandName, 9, ' '));
            return;
        }
    }
    emit playerCommandIssued(QString("%1 %2")
                             .arg(response.senderNick(), -25, ' ')
                             .arg(commandName, 17, ' '));
    emit holdButtons(buttons);
    emit controllerWait(100);
    emit releaseButtons(buttons);
}

void TwitchIrcBot::handleAnalogStickCommand(const IrcResponse &response, const QStringList &params) {
    #define PI 3.14159265358979
    QString commandName = params.at(0);

    if (params.length() < 3) return;
    bool ok = false;
    int magnitude = params.at(1).toInt(&ok, 10);
    if (!ok || magnitude < 0 || magnitude > 100) return;
    int degrees = params.at(2).toInt(&ok, 10);
    if (!ok || degrees < 0 || degrees > 360) return;

    double x = magnitude * cos(degrees * PI / 180) / 100;
    double y = magnitude * sin(degrees * PI / 180) / 100;

    if (commandName == "ls") {
        emit changeLeftStick(x, y);
        emit playerCommandIssued(QString("%1 %2")
                                 .arg(response.senderNick(), -25, ' ')
                                 .arg(QString("%1 %2 %3").arg(commandName).arg(magnitude).arg(degrees), 17, ' '));
    } else if (commandName == "rs") {
        emit changeRightStick(x, y);
        emit playerCommandIssued(QString("%1 %2")
                                 .arg(response.senderNick(), -25, ' ')
                                 .arg(QString("%1 %2 %3").arg(commandName).arg(magnitude).arg(degrees), 17, ' '));
    }
}
