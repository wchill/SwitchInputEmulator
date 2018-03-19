#ifndef CONTROLLER_H
#define CONTROLLER_H

#include <QObject>
#include <QPair>
#include <QByteArray>
#include <QTimer>
#include "controllerconstants.h"
#include "serialportwriter.h"
#include "ilogger.h"

class Controller : public QObject
{
    Q_OBJECT
public:
    explicit Controller(const QString &portName, QObject *parent = nullptr, ILogger *parentLogger = nullptr);
    ~Controller();

    void start();

    Controller *reset();
    Controller *pressButtons(Button_t pressed);
    Controller *releaseButtons(Button_t released);
    Controller *pressDpad(Dpad_t pressed);
    Controller *releaseDpad();
    Controller *moveLeftStick(const quint8 newLx, const quint8 newLy);
    Controller *moveRightStick(const quint8 newRx, const quint8 newRy);
    Controller *moveLeftStickX(const quint8 newLx);
    Controller *moveLeftStickY(const quint8 newLx);
    Controller *moveRightStickX(const quint8 newRx);
    Controller *moveRightStickY(const quint8 newRy);

    Controller *pushButtons(Button_t pushed, unsigned long waitMsecs);
    Controller *pushDpad(Dpad_t pushed, unsigned long waitMsecs);
    Controller *pushButtons(Button_t pushed);
    Controller *pushDpad(Dpad_t pushed);
    Controller *wait(unsigned long waitMsecs);
    Controller *wait();

    void getState(quint8 *outLx, quint8 *outLy, quint8 *outRx, quint8 *outRy, Dpad_t *outDpad, Button_t *outButtons, uint8_t *outVendorspec);
    QByteArray getStateAsBytes();
    bool isStateDifferent(QByteArray oldState);
signals:
    void stateChanged();
public slots:
    void changeState(const quint8 newLx, const quint8 newLy, const quint8 newRx, const quint8 newRy, const Dpad_t newDpad, const Button_t newButtons, const uint8_t newVendorspec=0x00);
    void sendUpdate();
private:
    QPair<quint8, quint8> ls;
    QPair<quint8, quint8> rs;
    Dpad_t dpad;
    Button_t buttons;
    quint8 vendorspec;

    QString portName;
    SerialPortWriter *port;
    ILogger *logger;

    QByteArray lastState;
    QTimer updateTimer;
};

#endif // CONTROLLER_H
