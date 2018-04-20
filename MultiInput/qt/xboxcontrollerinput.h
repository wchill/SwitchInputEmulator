#ifndef XBOXCONTROLLERINPUT_H
#define XBOXCONTROLLERINPUT_H

#include <QGamepad>
#include "controllerinput.h"

class XboxControllerInput : public ControllerInput
{
    Q_OBJECT
public:
    XboxControllerInput(int deviceId, std::shared_ptr<SerialPortWriter> writer, QObject *parent = nullptr);
    virtual void begin();
    virtual void getState(quint8 *outLx, quint8 *outLy, quint8 *outRx, quint8 *outRy, Dpad_t *outDpad, Button_t *outButtons, uint8_t *outVendorspec);
private:
    std::unique_ptr<QGamepad> gamepad;
    QByteArray lastState;
};

#endif // XBOXCONTROLLERINPUT_H
