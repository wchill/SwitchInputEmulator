#include "serialportwriter.h"

#include <QSerialPort>
#include <QTime>

SerialPortWriter::SerialPortWriter(QObject *parent, ILogger *parentLogger) : QThread(parent) {
    logger = new ILogger(parentLogger);
    //connect(this, SIGNAL(error(QString)), this, SLOT(onError(QString)));
    //connect(this, SIGNAL(timeout(QString)), this, SLOT(onTimeout(QString)));
}

SerialPortWriter::~SerialPortWriter() {
    m_mutex.lock();
    m_quit = true;
    m_cond.wakeOne();
    m_mutex.unlock();
    wait();
}

void SerialPortWriter::onError(const QString &s) {
    logger->logError(s);
}

void SerialPortWriter::onTimeout(const QString &s) {
    logger->logWarning(s);
}

void SerialPortWriter::transaction(const QString &portName, int waitTimeout, const QByteArray &request) {
    const QMutexLocker locker(&m_mutex);
    m_portName = portName;
    m_waitTimeout = waitTimeout;
    m_request = request;

    if (!isRunning()) {
        //logger->logMessage("Opening serial port " + m_portName);
        start();
    } else {
        m_cond.wakeOne();
    }
}

void SerialPortWriter::run() {
    bool currentPortNameChanged = false;

    m_mutex.lock();
    QString currentPortName;
    if (currentPortName != m_portName) {
        currentPortName = m_portName;
        currentPortNameChanged = true;
    }

    int currentWaitTimeout = m_waitTimeout;
    QString currentRequest = m_request;
    m_mutex.unlock();
    QSerialPort serial;

    if (currentPortName.isEmpty()) {
        emit error(tr("No port name specified"));
        return;
    }

    while (!m_quit) {
        if (currentPortNameChanged) {
            serial.close();
            serial.setPortName(currentPortName);

            if (!serial.open(QIODevice::ReadWrite)) {
                emit error(tr("Can't open %1, error code %2")
                           .arg(m_portName).arg(serial.error()));
                return;
            }
        }
        // write request
        //logger->logMessage("Writing to serial port");
        serial.write(m_request);
        if (!serial.waitForBytesWritten(m_waitTimeout)) {
            emit timeout(tr("Wait write request timeout %1")
                         .arg(QTime::currentTime().toString()));
        }
        m_mutex.lock();
        m_cond.wait(&m_mutex);
        if (currentPortName != m_portName) {
            currentPortName = m_portName;
            currentPortNameChanged = true;
        } else {
            currentPortNameChanged = false;
        }
        currentWaitTimeout = m_waitTimeout;
        currentRequest = m_request;
        m_mutex.unlock();
    }
}
