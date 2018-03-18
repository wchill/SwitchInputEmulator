#ifndef SERIALPORTWRITER_H
#define SERIALPORTWRITER_H

#include <QObject>
#include <QByteArray>
#include <QMutex>
#include <QThread>
#include <QWaitCondition>

class SerialPortWriter : public QThread
{
    Q_OBJECT
public:
    explicit SerialPortWriter(QObject *parent = nullptr);
    ~SerialPortWriter();

    void transaction(const QString &portName, int waitTimeout, const QByteArray &request);

signals:
    void error(const QString &s);
    void timeout(const QString &s);

private:
    void run() override;

    QString m_portName;
    QByteArray m_request;
    int m_waitTimeout = 0;
    QMutex m_mutex;
    QWaitCondition m_cond;
    bool m_quit = false;
};

#endif // SERIALPORTWRITER_H
