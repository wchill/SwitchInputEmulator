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
        ui->serialPortDescription->setText(currentPort.description());
    }
}

void MultiInput::serialPortIndexChanged(int index) {
    const auto &info = this->availableSerialPorts.at(index);
    currentPort = info;
    ui->serialPortDescription->setText(info.description());
    QString s = QObject::tr("Port: ") + info.portName() + "\n"
                        + QObject::tr("Location: ") + info.systemLocation() + "\n"
                        + QObject::tr("Description: ") + info.description() + "\n"
                        + QObject::tr("Manufacturer: ") + info.manufacturer() + "\n"
                        + QObject::tr("Serial number: ") + info.serialNumber() + "\n"
                        + QObject::tr("Vendor Identifier: ") + (info.hasVendorIdentifier() ? QString::number(info.vendorIdentifier(), 16) : QString()) + "\n"
                        + QObject::tr("Product Identifier: ") + (info.hasProductIdentifier() ? QString::number(info.productIdentifier(), 16) : QString()) + "\n"
                        + QObject::tr("Busy: ") + (info.isBusy() ? QObject::tr("Yes") : QObject::tr("No")) + "\n";
    //ui->eventLog->append(s);
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
