#include "serialportwriter.h"

#include <QTime>
#include <QThread>
#include <QSerialPort>
#include <QMutexLocker>
#include <QCoreApplication>
#include <iostream>
#include "controllerwindow.h"

using std::cout;
using std::cerr;
using std::endl;

SerialPortWriter::SerialPortWriter(const QString &portName, const QByteArray &data, QObject *parent) : QThread(parent) {
    m_portName = portName;
    m_waitTimeout = 40;
    this->data = data;
}

SerialPortWriter::~SerialPortWriter() {
    m_mutex.lock();
    m_quit = true;
    m_cond.wakeOne();
    m_mutex.unlock();
    wait();
}

void SerialPortWriter::changeData(const QByteArray &newData) {
    const QMutexLocker locker(&m_mutex);
    data = newData;
    m_cond.wakeOne();
}

bool SerialPortWriter::writeAndExpectResponse(QSerialPort *serial, uint8_t send, uint8_t expect) {
    uint8_t readBuf;
    std::cout << "Writing and expecting: " << std::hex << static_cast<int>(send) << " " << std::hex << static_cast<int>(expect) << std::endl;
    serial->write((const char*) &send, 1);
    if (!serial->waitForReadyRead(100)) {
        std::cout << "Timed out" << std::endl;
        return false;
    }
    int numRead = serial->read((char*) &readBuf, 1);
    std::cout << "Got back " << std::hex << static_cast<int>(readBuf) << std::endl;
    return (numRead > 0 && readBuf == expect);
}

void SerialPortWriter::run() {
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
        serial.clear();
        if(writeAndExpectResponse(&serial, sync_bytes[0], sync_resp[0]))
            emit message(tr("Handshake stage 1 complete"));
        else continue;

        if(writeAndExpectResponse(&serial, sync_bytes[1], sync_resp[1]))
            emit message(tr("Handshake stage 2 complete"));
        else {
            emit timeout(tr("Handshake failed at stage 2, retrying..."));
            continue;
        }

        if(writeAndExpectResponse(&serial, sync_bytes[2], sync_resp[2]))
            emit message(tr("Handshake stage 3 complete"));
        else {
            emit timeout(tr("Handshake failed at stage 3, retrying..."));
            continue;
        }

        synced = true;
    }
    emit message(tr("Synced successfully"));

    QByteArray lastSent;
    m_mutex.lock();
    QByteArray pending = data;
    m_mutex.unlock();

    while (!m_quit) {
        if (lastSent != pending) {
            std::cout << "Writing: " << QString(pending.toHex()).toStdString() << std::endl;

            serial.write(pending);
            lastSent = pending;

            if(!serial.waitForReadyRead(40)) {
                emit timeout(tr("Wait read response timeout %1").arg(QTime::currentTime().toString()));
            } else {
                QByteArray result = serial.read(1);
                if (result.length() > 0) {
                    quint8 val = (quint8) result.at(0);
                    if (val == 0x92)
                        emit timeout(tr("Got a NACK %1").arg(QTime::currentTime().toString()));
                    else if (val != 0x90)
                        emit timeout(tr("Got unexpected value %1 %2").arg(val).arg(QTime::currentTime().toString()));
                    else
                        emit writeComplete();
                } else {
                    emit timeout(tr("Read returned no data %1").arg(QTime::currentTime().toString()));
                }
            }
        }
        m_mutex.lock();
        m_cond.wait(&m_mutex);
        pending = data;
        m_mutex.unlock();
    }

    serial.close();
}
