#ifndef CONTROLLER_H
#define CONTROLLER_H

#include <QObject>
#include <QPair>
#include <QByteArray>
#include <QTimer>
#include <QThread>
#include "controllerconstants.h"
#include "serialportwriter.h"
#include "ilogger.h"

class Controller : public QObject
{
    Q_OBJECT
public:
    explicit Controller(QString const &portName, QObject *parent = nullptr, ILogger *parentLogger = nullptr);
    ~Controller();

    void start();

    Controller *reset(bool update=true);
    Controller *pressButtons(Button_t const pressed, bool update=true);
    Controller *releaseButtons(Button_t const released, bool update=true);
    Controller *pressDpad(Dpad_t const pressed, bool update=true);
    Controller *releaseDpad(bool update=true);
    Controller *moveLeftStick(quint8 const newLx, quint8 const newLy, bool update=true);
    Controller *moveRightStick(quint8 const newRx, quint8 const newRy, bool update=true);
    Controller *moveLeftStickX(quint8 const newLx, bool update=true);
    Controller *moveLeftStickY(quint8 const newLx, bool update=true);
    Controller *moveRightStickX(quint8 const newRx, bool update=true);
    Controller *moveRightStickY(quint8 const newRy, bool update=true);

    Controller *pushButtons(Button_t const pushed, unsigned long const waitMsecs);
    Controller *pushDpad(Dpad_t const pushed, unsigned long const waitMsecs);
    Controller *pushButtons(Button_t const pushed);
    Controller *pushDpad(Dpad_t const pushed);
    Controller *wait(unsigned long const waitMsecs);
    Controller *wait();

    void getState(quint8 *outLx, quint8 *outLy, quint8 *outRx, quint8 *outRy, Dpad_t *outDpad, Button_t *outButtons, uint8_t *outVendorspec);
    QByteArray getData();
    bool isStateDifferent(QByteArray const oldState);
signals:
    void stateChanged();
    void operate(const QByteArray &);
public slots:
    void changeState(quint8 const newLx, quint8 const newLy, quint8 const newRx, quint8 const newRy, Dpad_t const newDpad, Button_t const newButtons, uint8_t const newVendorspec=0x00, bool update=true);
    void onSerialError(const QString &error);
    void onSerialTimeout(const QString &error);
    void onSerialMessage(const QString &error);
private slots:
    void sendUpdate();
private:
    QPair<quint8, quint8> ls;
    QPair<quint8, quint8> rs;
    Dpad_t dpad;
    Button_t buttons;
    quint8 vendorspec;

    QString portName;
    QThread writerThread;
    SerialPortWriter *port;
    ILogger *logger;

    QByteArray lastState;
};

#endif // CONTROLLER_H
