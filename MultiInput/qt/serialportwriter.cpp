#include "serialportwriter.h"

#include <QTime>
#include <QSerialPort>
#include <QMutexLocker>
#include <QCoreApplication>
#include <iostream>

using std::cout;
using std::cerr;
using std::endl;

SerialPortWriter::SerialPortWriter(const QString &portName, QObject *parent) : QObject(parent) {
    m_portName = portName;
    m_waitTimeout = 1000;
}

SerialPortWriter::~SerialPortWriter() {
    m_quit = true;
    wait();
}

void SerialPortWriter::changeData(const QByteArray &newData) {
    data = newData;
}

bool SerialPortWriter::writeAndExpectResponse(QSerialPort *serial, uint8_t send, uint8_t expect) {
    uint8_t readBuf[128];
    serial->clear();
    serial->write((const char*) &send, 1);
    if (!serial->waitForReadyRead(100)) {
        return false;
    }
    int numRead = serial->read((char*) readBuf, 128);
    if (!(numRead > 0 && readBuf[numRead - 1] == expect)) {
        return false;
    }
    return true;
}

void SerialPortWriter::doWork(const QByteArray &newData) {
    data = newData;

    QSerialPort serial;

    if (m_portName.isEmpty()) {
        emit error(tr("No port name specified"));
        return;
    }
    serial.setPortName(m_portName);
    serial.setBaudRate(19200);
    if (!serial.open(QIODevice::ReadWrite)) {
        emit error(tr("Can't open %1, error code %2")
                   .arg(m_portName).arg(serial.error()));
        return;
    }
    emit message(tr("Serial port opened"));
    emit message(tr("Synchronizing hardware"));

    bool synced = false;

    while(!m_quit && !synced) {
        QCoreApplication::processEvents();

        if(writeAndExpectResponse(&serial, sync_bytes[0], sync_resp[0]))
            emit message(tr("Handshake stage 1 complete"));
        else continue;

        if(writeAndExpectResponse(&serial, sync_bytes[1], sync_resp[1]))
            emit message(tr("Handshake stage 2 complete"));
        else emit timeout(tr("Handshake failed at stage 2, retrying..."));

        if(writeAndExpectResponse(&serial, sync_bytes[2], sync_resp[2]))
            emit message(tr("Handshake stage 3 complete"));
        else emit timeout(tr("Handshake failed at stage 3, retrying..."));

        synced = true;
    }
    emit message(tr("Synced successfully"));

    while (!m_quit) {
        serial.write(data);
        if (!serial.waitForBytesWritten(m_waitTimeout)) {
            emit timeout(tr("Wait write response timeout %1").arg(QTime::currentTime().toString()));
        } else if(!serial.waitForReadyRead(m_waitTimeout)) {
            emit timeout(tr("Wait read response timeout %1").arg(QTime::currentTime().toString()));
        } else {
            serial.readAll();
            QCoreApplication::processEvents();
        }
    }

    serial.close();
}
