#ifndef CONTROLLERINPUT_H
#define CONTROLLERINPUT_H

#include <QObject>
#include <QByteArray>
#include "serialportwriter.h"
#include "controllerconstants.h"

class ControllerInput : public QObject
{
    Q_OBJECT
public:
    ControllerInput(std::shared_ptr<SerialPortWriter> writer, QObject *parent = nullptr);
    virtual void begin() = 0;
    const QByteArray getData();
    virtual void getState(quint8 *outLx, quint8 *outLy, quint8 *outRx, quint8 *outRy, Dpad_t *outDpad, Button_t *outButtons, uint8_t *outVendorspec) = 0;
    static const QByteArray getInitialData();
signals:
    void controllerStateChanged(QByteArray data);
    void controllerConnectionStateChanged(bool connected);
    void error(const QString &s);
    void warning(const QString &s);
    void message(const QString &s);
    void controllerReady();
public slots:
    virtual void onPacketSent();
    void onControllerChange();
protected slots:
    virtual void onSerialReady();
protected:
    static quint8 quantizeDouble(double const val);
    std::shared_ptr<SerialPortWriter> writer;
private:
    static quint8 calculateCrc8Ccitt(quint8 inCrc, quint8 inData);
    QByteArray lastState;
};

#endif // CONTROLLERINPUT_H
