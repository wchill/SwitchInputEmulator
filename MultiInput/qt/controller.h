#ifndef CONTROLLER_H
#define CONTROLLER_H

#include <QObject>
#include <QVector2D>
#include <QByteArray>
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

    Controller *reset(bool update=true);
    Controller *pressButtons(Button_t pressed, bool update=true);
    Controller *releaseButtons(Button_t released, bool update=true);
    Controller *pressDpad(Dpad_t pressed, bool update=true);
    Controller *releaseDpad(bool update=true);
    Controller *moveLeftStick(const QVector2D newLs, bool update=true);
    Controller *moveRightStick(const QVector2D newRs, bool update=true);

    Controller *pushButtons(Button_t pushed, unsigned long waitMsecs, bool update=true);
    Controller *pushDpad(Dpad_t pushed, unsigned long waitMsecs, bool update=true);
    Controller *pushButtons(Button_t pushed, bool update=true);
    Controller *pushDpad(Dpad_t pushed, bool update=true);
    Controller *wait(unsigned long waitMsecs);
    Controller *wait();

    void getLeftStickAsByte(uint8_t *outX, uint8_t *outY);
    void getRightStickAsByte(uint8_t *outX, uint8_t *outY);

    void getState(QVector2D *outLs, QVector2D *outRs, Dpad_t *outDpad, Button_t *outButtons, uint8_t *outVendorspec);
    QByteArray getStateAsBytes();
signals:
    void stateChanged();
public slots:
    void changeState(const QVector2D &newLs, const QVector2D &newRs, const Dpad_t newDpad, const Button_t newButtons, const uint8_t newVendorspec=0x00, bool update=true);
private slots:
    void sendUpdate();
private:
    QVector2D ls;
    QVector2D rs;
    Dpad_t dpad;
    Button_t buttons;
    uint8_t vendorspec;

    QString portName;
    SerialPortWriter *port;
    ILogger *logger;
};

#endif // CONTROLLER_H
