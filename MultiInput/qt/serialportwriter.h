#ifndef SERIALPORTWRITER_H
#define SERIALPORTWRITER_H

#include <QObject>
#include <QByteArray>
#include <QWaitCondition>
#include <QSerialPort>

class SerialPortWriter : public QObject
{
    Q_OBJECT
public:
    explicit SerialPortWriter(const QString &portName, QObject *parent = nullptr);
    ~SerialPortWriter();

signals:
    void error(const QString &s);
    void timeout(const QString &s);
    void message(const QString &s);
    void writeComplete();

public slots:
    void doWork(const QByteArray &newData);
    void changeData(const QByteArray &newData);

private:
    bool writeAndExpectResponse(QSerialPort *serial, uint8_t send, uint8_t expect);

    QString m_portName;
    QByteArray m_request;
    int m_waitTimeout = 0;
    bool m_quit = false;

    QByteArray data;

    const uint8_t sync_bytes[3] = {0xFF, 0x33, 0xCC};
    const uint8_t sync_resp[3] = {0xFF, 0xCC, 0x33};
};

#endif // SERIALPORTWRITER_H
