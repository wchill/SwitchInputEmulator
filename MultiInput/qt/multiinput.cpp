#include <QtWidgets>
#include <QGamepadManager>
#include "multiinput.h"

MultiInput::MultiInput(QWidget *parent) :
    QWidget(parent)
{
    setupUi();
}

void MultiInput::serialPortIndexChanged(int index) {
    if (index >= availableSerialPorts.length()) {
        currentPort = "/dev/faketty0";
        serialPortDescription->setText("Use socat emulated serial port on /dev/faketty0");
    } else {
        const auto &info = availableSerialPorts.at(index);
        currentPort = info.portName();
        serialPortDescription->setText("Description: " + info.description() + "\n" +
                                           "Manufacturer: " + info.manufacturer());
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
    mainLayout->addWidget(eventLog);

    startButton = new QPushButton();
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
        inputSelect->addItem(QString::number(QGamepad(gamepad).deviceId()));
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

void MultiInput::createSerialPortGroupBox() {
    serialPortDescription = new QLabel(tr("No serial port selected"));

    serialPortSelect = new QComboBox();
    connect(serialPortSelect, SIGNAL(currentIndexChanged(int)), this, SLOT(serialPortIndexChanged(int)));
    availableSerialPorts = QSerialPortInfo::availablePorts();
    for (const auto &portInfo : availableSerialPorts) {
        serialPortSelect->addItem(portInfo.portName());
    }
    serialPortSelect->addItem("Emulator");

    if (availableSerialPorts.length() > 0) {
        const auto &info = availableSerialPorts.at(0);
        currentPort = info.portName();
        serialPortDescription->setText("Description: " + info.description() + "\n" +
                                       "Manufacturer: " + info.manufacturer());
    }

    QGridLayout *layout = new QGridLayout();
    layout->addWidget(new QLabel(tr("Serial port")), 0, 0, 1, 1);
    layout->addWidget(serialPortSelect, 0, 1, 1, 1);
    layout->addWidget(serialPortDescription, 1, 0, 2, 2);

    layout->setColumnStretch(0, 10);
    layout->setColumnStretch(1, 30);

    serialPortGroupBox = new QGroupBox(tr("Serial port"));
    serialPortGroupBox->setLayout(layout);
}

void MultiInput::onStartButtonClicked()
{
    startButton->setEnabled(false);
    serialPortSelect->setEnabled(false);

    controllerWindow = new ControllerWindow(currentPort, this);
    controllerWindow->setAttribute(Qt::WA_DeleteOnClose);
    connect(controllerWindow, SIGNAL(controllerWindowClosing()), this, SLOT(onControllerWindowClosed()));
    connect(controllerWindow, SIGNAL(message(QString)), this, SLOT(logMessage(QString)));
    connect(controllerWindow, SIGNAL(warning(QString)), this, SLOT(logWarning(QString)));
    connect(controllerWindow, SIGNAL(error(QString)), this, SLOT(logError(QString)));
    controllerWindow->show();
}

void MultiInput::onControllerWindowClosed() {
    startButton->setEnabled(true);
    serialPortSelect->setEnabled(true);
}

void MultiInput::logMessage(const QString &message) {
    eventLog->setTextBackgroundColor(Qt::white);
    eventLog->setTextColor(Qt::black);
    eventLog->append(message);
}

void MultiInput::logWarning(const QString &message) {
    eventLog->setTextBackgroundColor(Qt::yellow);
    eventLog->setTextColor(Qt::black);
    eventLog->append(message);
}

void MultiInput::logError(const QString &message) {
    eventLog->setTextBackgroundColor(Qt::red);
    eventLog->setTextColor(Qt::white);
    eventLog->append(message);
}
