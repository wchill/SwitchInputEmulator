#include "multiinput.h"
#include "ui_multiinput.h"

MultiInput::MultiInput(QWidget *parent) :
    QWidget(parent),
    ui(new Ui::MultiInput)
{
    ui->setupUi(this);

    connect(ui->serialPortSelect, SIGNAL(currentIndexChanged(int)), this, SLOT(serialPortIndexChanged(int)));
    connect(ui->startButton, SIGNAL(clicked()), this, SLOT(onStartButtonClicked()));

    this->availableSerialPorts = QSerialPortInfo::availablePorts();
    for (const auto &portInfo : availableSerialPorts) {
        ui->serialPortSelect->addItem(portInfo.portName());
    }
    ui->serialPortSelect->addItem("Emulator");

    if (this->availableSerialPorts.length() > 0) {
        const auto &info = availableSerialPorts.at(0);
        currentPort = info.portName();
        ui->serialPortDescription->setText("Description: " + info.description() + "\n" +
                                           "Manufacturer: " + info.manufacturer());
    }
}

void MultiInput::serialPortIndexChanged(int index) {
    if (index >= this->availableSerialPorts.length()) {
        currentPort = "/dev/faketty0";
        ui->serialPortDescription->setText("Use socat emulated serial port on /dev/faketty0");
    } else {
        const auto &info = this->availableSerialPorts.at(index);
        currentPort = info.portName();
        ui->serialPortDescription->setText("Description: " + info.description() + "\n" +
                                           "Manufacturer: " + info.manufacturer());
    }
}

MultiInput::~MultiInput()
{
    //controllerThread.quit();
    //controllerThread.wait();
    delete controllerWindow;
    delete ui;
}

void MultiInput::onStartButtonClicked()
{
    ui->startButton->setEnabled(false);
    ui->serialPortSelect->setEnabled(false);

    /*
    controller = std::make_shared<Controller>(currentPort);
    controller.get()->moveToThread(&controllerThread);
    connect(controller.get(), SIGNAL(error(QString)), this, SLOT(logError(QString)));
    connect(controller.get(), SIGNAL(warning(QString)), this, SLOT(logWarning(QString)));
    connect(controller.get(), SIGNAL(message(QString)), this, SLOT(logMessage(QString)));
    controllerThread.start();
    */

    controllerWindow = new ControllerWindow(currentPort, this);
    connect(controllerWindow, SIGNAL(controllerWindowClosing()), this, SLOT(onControllerWindowClosed()));
    connect(controllerWindow, SIGNAL(message(QString)), this, SLOT(logMessage(QString)));
    connect(controllerWindow, SIGNAL(warning(QString)), this, SLOT(logWarning(QString)));
    connect(controllerWindow, SIGNAL(error(QString)), this, SLOT(logError(QString)));
    controllerWindow->show();
}

void MultiInput::onControllerWindowClosed() {
    disconnect(controllerWindow, SIGNAL(controllerWindowClosing()), this, SLOT(onControllerWindowClosed()));
    ui->startButton->setEnabled(true);
    ui->serialPortSelect->setEnabled(true);
}

void MultiInput::logMessage(const QString &message) {
    ui->eventLog->setTextBackgroundColor(Qt::white);
    ui->eventLog->setTextColor(Qt::black);
    ui->eventLog->append(message);
}

void MultiInput::logWarning(const QString &message) {
    ui->eventLog->setTextBackgroundColor(Qt::yellow);
    ui->eventLog->setTextColor(Qt::black);
    ui->eventLog->append(message);
}

void MultiInput::logError(const QString &message) {
    ui->eventLog->setTextBackgroundColor(Qt::red);
    ui->eventLog->setTextColor(Qt::white);
    ui->eventLog->append(message);
}
