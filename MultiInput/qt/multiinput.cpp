#include "multiinput.h"
#include "ui_multiinput.h"
#include "controllerui.h"

MultiInput::MultiInput(QWidget *parent) :
    QWidget(parent),
    ui(new Ui::MultiInput)
{
    ui->setupUi(this);
    connect(ui->serialPortSelect, SIGNAL(currentIndexChanged(int)), this, SLOT(serialPortIndexChanged(int)));
    connect(ui->startButton, SIGNAL(clicked()), this, SLOT(on_startButton_clicked()));

    this->availableSerialPorts = QSerialPortInfo::availablePorts();
    for (const auto &portInfo : availableSerialPorts) {
        ui->serialPortSelect->addItem(portInfo.portName());
    }

    if (this->availableSerialPorts.length() > 0) {
        const auto &info = availableSerialPorts.at(0);
        ui->serialPortDescription->setText(info.description());
    }

    controllerWindow = new ControllerWindow(this);
}

void MultiInput::serialPortIndexChanged(int index) {
    const auto &info = this->availableSerialPorts.at(index);
    ui->serialPortDescription->setText(info.description());
    QString s = QObject::tr("Port: ") + info.portName() + "\n"
                        + QObject::tr("Location: ") + info.systemLocation() + "\n"
                        + QObject::tr("Description: ") + info.description() + "\n"
                        + QObject::tr("Manufacturer: ") + info.manufacturer() + "\n"
                        + QObject::tr("Serial number: ") + info.serialNumber() + "\n"
                        + QObject::tr("Vendor Identifier: ") + (info.hasVendorIdentifier() ? QString::number(info.vendorIdentifier(), 16) : QString()) + "\n"
                        + QObject::tr("Product Identifier: ") + (info.hasProductIdentifier() ? QString::number(info.productIdentifier(), 16) : QString()) + "\n"
                        + QObject::tr("Busy: ") + (info.isBusy() ? QObject::tr("Yes") : QObject::tr("No")) + "\n";
    ui->keyEventLog->append(s);
}

void MultiInput::updatePressedKeys(QKeyEvent *event)
{
    QString str = "";
    for(auto it = keys.begin(); it != keys.end(); it++) {
        if((*it).second)
            str += QKeySequence((*it).first).toString() + " ";
            //str += "0x" + QString::number((*it).first, 16) + " ";
    }
    //ui->keysPressed->setText(str);
}

MultiInput::~MultiInput()
{
    delete ui;
}

void MultiInput::keyPressEvent(QKeyEvent *event)
{
    keys[event->key()] = true;
    updatePressedKeys(event);
    int k = event->key();
    if(k != -1) {
        char buf[32];
        buf[0] = '+';
        buf[1] = (char) k;
        buf[2] = '\r';
        buf[3] = '\n';
        buf[4] = 0;
    }
}

void MultiInput::keyReleaseEvent(QKeyEvent *event)
{
    keys[event->key()] = false;
    updatePressedKeys(event);
    int k = event->key();
    if(k != -1) {
        char buf[32];
        buf[0] = '-';
        buf[1] = (char) k;
        buf[2] = '\r';
        buf[3] = '\n';
        buf[4] = 0;
    }
}

void MultiInput::on_startButton_clicked()
{
    controllerWindow->show();
}
