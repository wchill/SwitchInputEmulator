#include <QtEndian>
#include "controllerinput.h"

ControllerInput::ControllerInput(std::shared_ptr<SerialPortWriter> writer, QObject *parent) : QObject(parent), writer(writer)
{
}

const QByteArray ControllerInput::getData() {
    quint8 lx;
    quint8 ly;
    quint8 rx;
    quint8 ry;
    Dpad_t press;
    Button_t button;
    quint8 vendorSpec;

    getState(&lx, &ly, &rx, &ry, &press, &button, &vendorSpec);

    quint8 buf[9];
    qToBigEndian(button, &buf[0]);
    buf[2] = press;
    buf[3] = lx;
    buf[4] = ly;
    buf[5] = rx;
    buf[6] = ry;
    buf[7] = 0;

    quint8 crc = 0;
    for(int i = 0; i < 8; i++) {
        crc = calculateCrc8Ccitt(crc, buf[i]);
    }
    buf[8] = crc;

    return QByteArray((char*) buf, 9);
}

void ControllerInput::onPacketSent() {
    QByteArray newState = getData();
    if (newState != lastState) {
        lastState = newState;
        writer.get()->changeData(lastState);
        emit controllerStateChanged(lastState);
    }
}

void ControllerInput::onControllerChange() {
    lastState = getData();
    writer.get()->changeData(lastState);
    emit controllerStateChanged(lastState);
}

const QByteArray ControllerInput::getInitialData() {
    const uint8_t state[] = {0x00, 0x00, 0x00, 0x80, 0x80, 0x80, 0x80, 0x00};
    QByteArray data = QByteArray((const char*) state, sizeof(state));
    quint8 crc = 0;
    for (auto it = data.begin(); it != data.end(); ++it) {
        crc = calculateCrc8Ccitt(crc, *it);
    }
    data.push_back(crc);
    return data;
}

quint8 ControllerInput::quantizeDouble(const double val) {
    double scaled = (val + 1.0) * 128.0;
    if (scaled < 0) scaled = 0;
    else if (scaled > 255) scaled = 255;
    return (quint8) scaled;
}

quint8 ControllerInput::calculateCrc8Ccitt(quint8 inCrc, quint8 inData) {
    quint8 data = inCrc ^ inData;

    for (int i = 0; i < 8; i++ )
    {
        if (( data & 0x80 ) != 0 )
        {
            data <<= 1;
            data ^= 0x07;
        }
        else
        {
            data <<= 1;
        }
    }
    return data;
}
