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
    this->data = data;
}

SerialPortWriter::~SerialPortWriter() {
    m_quit = true;
    wait();
}

void SerialPortWriter::changeData(const QByteArray &newData) {
    const QMutexLocker locker(&m_mutex);
    data = newData;
}

bool SerialPortWriter::writeAndExpectResponse(QSerialPort *serial, uint8_t send, uint8_t expect) {
    serial->clear();
    uint8_t readBuf;
    std::cout << "Writing and expecting: " << std::hex << static_cast<int>(send) << " " << std::hex << static_cast<int>(expect) << std::endl;
    serial->write((const char*) &send, 1);
    if (!serial->waitForBytesWritten(100) || !serial->waitForReadyRead(100)) {
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

    //this->setPriority(QThread::TimeCriticalPriority);
    bool isSynced = false;

    while(!m_quit && !isSynced) {
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

        isSynced = true;
    }

    if(m_quit) {
        serial.close();
        return;
    }
    emit synced();

    m_mutex.lock();
    QByteArray pending = data;
    m_mutex.unlock();

    bool alreadyReturnedNoData = false;
    bool errorState = false;

    while (!m_quit) {
        if (!errorState) {
            serial.write(pending);
            serial.waitForReadyRead(16);
            QByteArray result = serial.read(1);
            if (result.length() > 0) {
                quint8 val = (quint8) result.at(0);
                if (val == 0x92) {
                    std::cout << "Writing: " << QString(pending.toHex()).toStdString() << " Response: NACK 0x" << std::hex << (unsigned int) val << std::endl;
                    emit error(tr("Got a NACK %1").arg(QTime::currentTime().toString()));
                    errorState = true;
                } else if (val != 0x90) {
                    std::cout << "Writing: " << QString(pending.toHex()).toStdString() << " Response: 0x" << std::hex << (unsigned int) val << std::endl;
                    emit timeout(tr("Got unexpected value %1 %2").arg(val).arg(QTime::currentTime().toString()));
                } else {
                    emit writeComplete();
                }
                alreadyReturnedNoData = false;
            } else if (!alreadyReturnedNoData) {
                alreadyReturnedNoData = true;
                emit timeout(tr("Read returned no data %1").arg(QTime::currentTime().toString()));
            }
            m_mutex.lock();
            pending = data;
            m_mutex.unlock();
        } else {
            msleep(10);
        }
    }

    std::cout << "Closing" << std::endl;

    serial.close();
}
