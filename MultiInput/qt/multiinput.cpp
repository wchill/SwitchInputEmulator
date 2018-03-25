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

    if (this->availableSerialPorts.length() > 0) {
        currentPort = availableSerialPorts.at(0);
        ui->serialPortDescription->setText("Description: " + currentPort.description() + "\n" +
                                           "Manufacturer: " + currentPort.manufacturer());
    }
}

void MultiInput::serialPortIndexChanged(int index) {
    const auto &info = this->availableSerialPorts.at(index);
    currentPort = info;
    ui->serialPortDescription->setText("Description: " + info.description() + "\n" +
                                       "Manufacturer: " + info.manufacturer());
}

MultiInput::~MultiInput()
{
    controllerThread.quit();
    controllerThread.wait();
    delete controllerWindow;
    delete botWindow;
    delete ui;
}

void MultiInput::onStartButtonClicked()
{
    ui->startButton->setEnabled(false);
    ui->serialPortSelect->setEnabled(false);

    controller = std::make_shared<Controller>(currentPort.portName());
    controller.get()->moveToThread(&controllerThread);
    connect(controller.get(), SIGNAL(error(QString)), this, SLOT(logError(QString)));
    connect(controller.get(), SIGNAL(warning(QString)), this, SLOT(logWarning(QString)));
    connect(controller.get(), SIGNAL(message(QString)), this, SLOT(logMessage(QString)));
    controllerThread.start();
    controllerThread.setPriority(QThread::TimeCriticalPriority);

    controllerWindow = new ControllerWindow(controller, this);
    connect(controllerWindow, SIGNAL(controllerWindowClosing()), this, SLOT(onControllerWindowClosed()));
    connect(controllerWindow, SIGNAL(message(QString)), this, SLOT(logMessage(QString)));
    connect(controllerWindow, SIGNAL(warning(QString)), this, SLOT(logWarning(QString)));
    connect(controllerWindow, SIGNAL(error(QString)), this, SLOT(logError(QString)));
    controllerWindow->show();

    botWindow = new TwitchIrcBotWindow(controller, this);
    botWindow->show();
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
