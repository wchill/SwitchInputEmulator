#include <QtWidgets>
#include <QGamepadManager>
#include "multiinput.h"

MultiInput::MultiInput(QWidget *parent) :
    QWidget(parent)
{
    setupUi();
    connect(QGamepadManager::instance(), SIGNAL(gamepadConnected(int)), this, SLOT(onGamepadConnected(int)));
    connect(QGamepadManager::instance(), SIGNAL(gamepadDisconnected(int)), this, SLOT(onGamepadDisconnected(int)));
}

void MultiInput::serialPortIndexChanged(int index) {
    if (index >= availableSerialPorts.length()) {
        currentPort = "/tmp/faketty0";
        serialPortDescription->setText(tr("Use socat emulated serial port on /tmp/faketty0"));
    } else {
        const auto &info = availableSerialPorts.at(index);
        currentPort = info.portName();
        serialPortDescription->setText(info.description());
    }
}

MultiInput::~MultiInput()
{
}

void MultiInput::setupUi()
{
    createSerialPortGroupBox();
    createInputGroupBox();

    QVBoxLayout *mainLayout = new QVBoxLayout();
    mainLayout->addWidget(serialPortGroupBox);
    mainLayout->addWidget(inputGroupBox);

    eventLog = new QTextEdit();
    eventLog->setReadOnly(true);
    eventLog->setUpdatesEnabled(true);
    mainLayout->addWidget(eventLog);

    startButton = new QPushButton();
    startButton->setText(tr("Start"));
    connect(startButton, SIGNAL(clicked()), this, SLOT(onStartButtonClicked()));
    mainLayout->addWidget(startButton);

    setLayout(mainLayout);

    setWindowTitle(tr("Multi Input"));
}

void MultiInput::createInputGroupBox() {
    inputDescription = new QLabel(tr("No input method selected"));

    inputSelect = new QComboBox();
    const QList<int> gamepads = QGamepadManager::instance()->connectedGamepads();
    for (const int gamepad : gamepads) {
        QGamepad temp(gamepad);
        inputSelect->addItem(tr("Gamepad ") + QString::number(temp.deviceId()));
    }
    inputSelect->addItem(tr("Use TCP server"));

    QGridLayout *layout = new QGridLayout();
    layout->addWidget(new QLabel(tr("Input method")), 0, 0, 1, 1);
    layout->addWidget(inputSelect, 0, 1, 1, 1);
    layout->addWidget(inputDescription, 1, 0, 2, 2);

    layout->setColumnStretch(0, 10);
    layout->setColumnStretch(1, 30);

    inputGroupBox = new QGroupBox(tr("Input method"));
    inputGroupBox->setLayout(layout);
}

void MultiInput::enumerateInputDevices() {
    const QList<int> gamepads = QGamepadManager::instance()->connectedGamepads();
    inputSelect->clear();
    for (const int gamepad : gamepads) {
        inputSelect->addItem(tr("Gamepad ") + QString::number(gamepad));
    }
    inputSelect->addItem(tr("Use TCP server"));
    inputSelect->setCurrentIndex(0);
    this->layout()->update();
}

void MultiInput::createSerialPortGroupBox() {
    serialPortDescription = new QLabel(tr("No serial port selected"));

    serialPortSelect = new QComboBox();
    enumerateSerialPorts();

    QGridLayout *layout = new QGridLayout();
    layout->addWidget(new QLabel(tr("Serial port")), 0, 0, 1, 1);
    layout->addWidget(serialPortSelect, 0, 1, 1, 1);
    layout->addWidget(serialPortDescription, 1, 0, 2, 2);

    layout->setColumnStretch(0, 10);
    layout->setColumnStretch(1, 30);

    serialPortGroupBox = new QGroupBox(tr("Serial port"));
    serialPortGroupBox->setLayout(layout);
}

void MultiInput::enumerateSerialPorts() {
    availableSerialPorts = QSerialPortInfo::availablePorts();
    disconnect(serialPortSelect, SIGNAL(currentIndexChanged(int)), this, SLOT(serialPortIndexChanged(int)));
    serialPortSelect->clear();
    for (const auto &portInfo : availableSerialPorts) {
        serialPortSelect->addItem(portInfo.portName());
    }
    serialPortSelect->addItem(tr("Emulator"));
    connect(serialPortSelect, SIGNAL(currentIndexChanged(int)), this, SLOT(serialPortIndexChanged(int)));
    serialPortSelect->setCurrentIndex(0);
    this->layout()->update();
}

void MultiInput::onStartButtonClicked()
{
    const QList<int> gamepads = QGamepadManager::instance()->connectedGamepads();
    int inputIndex = inputSelect->currentIndex();
    if (inputIndex < gamepads.length()) {
        startButton->setEnabled(false);
        serialPortSelect->setEnabled(false);
        inputSelect->setEnabled(false);

        gamepad = std::shared_ptr<QGamepad>(new QGamepad(inputIndex));
        connect(gamepad.get(), &QGamepad::connectedChanged, [=](bool connected) { if (!connected) controllerWindow->close(); });

        controllerWindow = new ControllerWindow(gamepad, this);
        controllerWindow->setAttribute(Qt::WA_DeleteOnClose);
        connect(controllerWindow, SIGNAL(controllerWindowClosing()), this, SLOT(onControllerWindowClosed()));
        connect(controllerWindow, SIGNAL(message(QString)), this, SLOT(logMessage(QString)));
        connect(controllerWindow, SIGNAL(warning(QString)), this, SLOT(logWarning(QString)));
        connect(controllerWindow, SIGNAL(error(QString)), this, SLOT(logError(QString)));

        writer = std::shared_ptr<SerialPortWriter>(new SerialPortWriter(currentPort, controllerWindow->getData()));
        connect(writer.get(), SIGNAL(error(QString)), this, SLOT(onSerialPortError(QString)));
        connect(writer.get(), SIGNAL(timeout(QString)), this, SLOT(logWarning(QString)));
        connect(writer.get(), SIGNAL(message(QString)), this, SLOT(logMessage(QString)));
        connect(writer.get(), SIGNAL(synced()), this, SLOT(onSerialPortSync()));
        controllerWindow->setSerialPortWriter(writer);
        writer->start();
        controllerWindow->show();
    } else {
        logMessage(tr("TCP server not supported yet."));
    }
}

void MultiInput::onSerialPortError(const QString &message) {
    logError(message);
    controllerWindow->close();
}

void MultiInput::onSerialPortSync() {
    controllerWindow->show();
}

void MultiInput::onGamepadDisconnected(int deviceId) {
    logMessage(tr("Gamepad %1 disconnected").arg(deviceId));
    enumerateInputDevices();
}

void MultiInput::onGamepadConnected(int deviceId) {
    logMessage(tr("Gamepad %1 connected").arg(deviceId));
    enumerateInputDevices();
}

void MultiInput::onControllerWindowClosed() {
    gamepad = nullptr;
    writer = nullptr;

    startButton->setEnabled(true);
    serialPortSelect->setEnabled(true);
    inputSelect->setEnabled(true);
}

void MultiInput::logMessage(const QString &message) {
    eventLog->setTextBackgroundColor(Qt::transparent);
    eventLog->setTextColor(Qt::black);
    eventLog->append(message);
    eventLog->repaint();
}

void MultiInput::logWarning(const QString &message) {
    eventLog->setTextBackgroundColor(Qt::yellow);
    eventLog->setTextColor(Qt::black);
    eventLog->append(message);
    eventLog->repaint();
}

void MultiInput::logError(const QString &message) {
    eventLog->setTextBackgroundColor(Qt::red);
    eventLog->setTextColor(Qt::white);
    eventLog->append(message);
    eventLog->repaint();
}
