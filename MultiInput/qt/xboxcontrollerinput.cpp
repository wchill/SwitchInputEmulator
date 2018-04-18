#include "xboxcontrollerinput.h"

XboxControllerInput::XboxControllerInput(int deviceId, std::shared_ptr<SerialPortWriter> writer, QObject *parent) : ControllerInput(writer, parent)
{
    gamepad = std::unique_ptr<QGamepad>(new QGamepad(deviceId));

    connect(gamepad.get(), SIGNAL(axisLeftXChanged(double)), this, SLOT(onControllerChange()));
    connect(gamepad.get(), SIGNAL(axisLeftYChanged(double)), this, SLOT(onControllerChange()));
    connect(gamepad.get(), SIGNAL(axisRightXChanged(double)), this, SLOT(onControllerChange()));
    connect(gamepad.get(), SIGNAL(axisRightYChanged(double)), this, SLOT(onControllerChange()));
    connect(gamepad.get(), SIGNAL(buttonL2Changed(double)), this, SLOT(onControllerChange()));
    connect(gamepad.get(), SIGNAL(buttonR2Changed(double)), this, SLOT(onControllerChange()));
    connect(gamepad.get(), SIGNAL(buttonL1Changed(bool)), this, SLOT(onControllerChange()));
    connect(gamepad.get(), SIGNAL(buttonR1Changed(bool)), this, SLOT(onControllerChange()));
    connect(gamepad.get(), SIGNAL(buttonL3Changed(bool)), this, SLOT(onControllerChange()));
    connect(gamepad.get(), SIGNAL(buttonR3Changed(bool)), this, SLOT(onControllerChange()));
    connect(gamepad.get(), SIGNAL(buttonAChanged(bool)), this, SLOT(onControllerChange()));
    connect(gamepad.get(), SIGNAL(buttonBChanged(bool)), this, SLOT(onControllerChange()));
    connect(gamepad.get(), SIGNAL(buttonXChanged(bool)), this, SLOT(onControllerChange()));
    connect(gamepad.get(), SIGNAL(buttonYChanged(bool)), this, SLOT(onControllerChange()));
    connect(gamepad.get(), SIGNAL(buttonUpChanged(bool)), this, SLOT(onControllerChange()));
    connect(gamepad.get(), SIGNAL(buttonDownChanged(bool)), this, SLOT(onControllerChange()));
    connect(gamepad.get(), SIGNAL(buttonLeftChanged(bool)), this, SLOT(onControllerChange()));
    connect(gamepad.get(), SIGNAL(buttonRightChanged(bool)), this, SLOT(onControllerChange()));
    connect(gamepad.get(), SIGNAL(buttonSelectChanged(bool)), this, SLOT(onControllerChange()));
    connect(gamepad.get(), SIGNAL(buttonStartChanged(bool)), this, SLOT(onControllerChange()));
    connect(gamepad.get(), SIGNAL(buttonGuideChanged(bool)), this, SLOT(onControllerChange()));
    connect(gamepad.get(), SIGNAL(buttonCenterChanged(bool)), this, SLOT(onControllerChange()));

    connect(gamepad.get(), &QGamepad::connectedChanged, [=](bool connected) { emit controllerConnectionStateChanged(connected); });
}

void XboxControllerInput::getState(quint8 *outLx, quint8 *outLy, quint8 *outRx, quint8 *outRy, Dpad_t *outDpad, Button_t *outButtons, uint8_t *outVendorspec) {
    quint8 lx = STICK_CENTER;
    quint8 ly = STICK_CENTER;
    quint8 rx = STICK_CENTER;
    quint8 ry = STICK_CENTER;
    Dpad_t press = DPAD_NONE;
    Button_t button = BUTTON_NONE;

    lx = quantizeDouble(gamepad->axisLeftX());
    ly = quantizeDouble(gamepad->axisLeftY());
    rx = quantizeDouble(gamepad->axisRightX());
    ry = quantizeDouble(gamepad->axisRightY());

    bool up = gamepad->buttonUp();
    bool right = gamepad->buttonRight();
    bool down = gamepad->buttonDown();
    bool left = gamepad->buttonLeft();

    if (up) {
        if (right) press = DPAD_UP_RIGHT;
        else if (left) press = DPAD_UP_LEFT;
        else press = DPAD_UP;
    } else if (down) {
        if (right) press = DPAD_DOWN_RIGHT;
        else if (left) press = DPAD_DOWN_LEFT;
        else press = DPAD_DOWN;
    } else if (right) {
        press = DPAD_RIGHT;
    } else if (left) {
        press = DPAD_LEFT;
    } else {
        press = DPAD_NONE;
    }

    if (gamepad->buttonA()) button |= BUTTON_B;
    if (gamepad->buttonB()) button |= BUTTON_A;
    if (gamepad->buttonX()) button |= BUTTON_Y;
    if (gamepad->buttonY()) button |= BUTTON_X;
    if (gamepad->buttonL1()) button |= BUTTON_L;
    if (gamepad->buttonL2() > 0.6) button |= BUTTON_ZL;
    if (gamepad->buttonL3()) button |= BUTTON_LCLICK;
    if (gamepad->buttonR1()) button |= BUTTON_R;
    if (gamepad->buttonR2() > 0.6) button |= BUTTON_ZR;
    if (gamepad->buttonR3()) button |= BUTTON_RCLICK;
    if (gamepad->buttonSelect()) button |= BUTTON_MINUS;
    if (gamepad->buttonStart()) button |= BUTTON_PLUS;
    if (gamepad->buttonGuide() || gamepad->buttonCenter()) button |= BUTTON_HOME;

    if (outLx) *outLx = lx;
    if (outLy) *outLy = ly;
    if (outRx) *outRx = rx;
    if (outRy) *outRy = ry;
    if (outDpad) *outDpad = press;
    if (outButtons) *outButtons = button;
    if (outVendorspec) *outVendorspec = 0;
}
