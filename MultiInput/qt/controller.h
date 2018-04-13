#ifndef CONTROLLER_H
#define CONTROLLER_H

#include <QObject>
#include <QPair>
#include <QByteArray>
#include <QTime>
#include <QThread>
#include "controllerconstants.h"
#include "serialportwriter.h"

class Controller : public QObject
{
    Q_OBJECT
public:
    explicit Controller(QString const &portName, QObject *parent = nullptr);
    ~Controller();

    void start();

    void getState(quint8 *outLx, quint8 *outLy, quint8 *outRx, quint8 *outRy, Dpad_t *outDpad, Button_t *outButtons, uint8_t *outVendorspec);
    QByteArray getData();
    bool isStateDifferent(QByteArray const oldState);
signals:
    void stateChanged();
    void operate(const QByteArray &);
    void error(const QString &error);
    void warning(const QString &warning);
    void message(const QString &message);
public slots:
    void changeState(quint8 const newLx, quint8 const newLy, quint8 const newRx, quint8 const newRy, Dpad_t const newDpad, Button_t const newButtons, uint8_t const newVendorspec=0x00, bool update=true);

    void onLeftStickXDouble(double const value);
    void onLeftStickYDouble(double const value);
    void onLeftStickXYDouble(double const x, double const y);
    void onLeftStickX(quint8 const value);
    void onLeftStickY(quint8 const value);
    void onRightStickXDouble(double const value);
    void onRightStickYDouble(double const value);
    void onRightStickXYDouble(double const x, double const y);
    void onRightStickX(quint8 const value);
    void onRightStickY(quint8 const value);
    void onButtonZLChange(bool const value);
    void onButtonZRChange(bool const value);
    void onButtonAChange(bool const pressed);
    void onButtonBChange(bool const pressed);
    void onButtonXChange(bool const pressed);
    void onButtonYChange(bool const pressed);
    void onHatChange(Dpad_t const pressed);
    void onButtonLChange(bool const pressed);
    void onButtonRChange(bool const pressed);
    void onButtonL3Change(bool const pressed);
    void onButtonR3Change(bool const pressed);
    void onButtonMinusChange(bool const pressed);
    void onButtonPlusChange(bool const pressed);
    void onButtonHomeChange(bool const pressed);
    void onButtonCaptureChange(bool const pressed);
    void onButtonPress(Button_t const pressed);
    void onButtonRelease(Button_t const released);
    void onWait(unsigned long const waitMsecs = WAIT_TIME);
    void onReset();
private slots:
    void sendUpdate();
private:
    quint8 quantizeDouble(double const val);

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
    Controller *wait(unsigned long const waitMsecs = WAIT_TIME);

    QPair<quint8, quint8> ls;
    QPair<quint8, quint8> rs;
    Dpad_t dpad;
    Button_t buttons;
    quint8 vendorspec;

    QString portName;
    SerialPortWriter *port;

    QByteArray lastState;
    QTime lastUpdateTime;
};

#endif // CONTROLLER_H
