#include "multiinput.h"
#include "ui_multiinput.h"

MultiInput::MultiInput(QWidget *parent) :
    QWidget(parent),
    ILogger(),
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
    delete controllerWindow;
    delete ui;
}

void MultiInput::onStartButtonClicked()
{
    ui->startButton->setEnabled(false);
    ui->serialPortSelect->setEnabled(false);
    controllerWindow = new ControllerWindow(currentPort.portName(), this, this);
    connect(controllerWindow, SIGNAL(controllerWindowClosing()), this, SLOT(onControllerWindowClosed()));
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
    ui->eventLog->append("\n");
}

void MultiInput::logWarning(const QString &message) {
    ui->eventLog->setTextBackgroundColor(Qt::yellow);
    ui->eventLog->setTextColor(Qt::black);
    ui->eventLog->append(message);
    ui->eventLog->append("\n");
}

void MultiInput::logError(const QString &message) {
    ui->eventLog->setTextBackgroundColor(Qt::red);
    ui->eventLog->setTextColor(Qt::white);
    ui->eventLog->append(message);
    ui->eventLog->append("\n");
}
