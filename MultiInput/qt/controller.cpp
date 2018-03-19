#include <QtEndian>
#include <QThread>
#include <QTimer>
#include "controller.h"

#include <iostream>
using std::cout;
using std::endl;

Controller::Controller(const QString &newPortName, QObject *parent, ILogger *parentLogger) :
    QObject(parent), ls(STICK_CENTER, STICK_CENTER), rs(STICK_CENTER, STICK_CENTER), dpad(DPAD_NONE), buttons(BUTTON_NONE), vendorspec(0x00), updateTimer(this) {
    portName = newPortName;
    logger = new ILogger(parentLogger);
    port = new SerialPortWriter(this, logger);

    // The controller update timer: this sends updates every 12ms to the hardware.
    // We can't update faster than about every 9ms at 9600 baud without data corruption,
    // but setting the baud rate higher risks buffer overrun on the hardware side. We set it to 12ms to be safe.
    // TODO: Minimize input lag by being smarter about the update - right now this method can have up to 28ms of input lag.
    connect(&updateTimer, SIGNAL(timeout()), this, SLOT(sendUpdate()));
    updateTimer.setTimerType(Qt::PreciseTimer);
    updateTimer.start(12);

    logger->logMessage("Controller initialized");
}
Controller::~Controller() {
    delete port;
    delete logger;
}
void Controller::sendUpdate() {
    if (isStateDifferent(lastState)) {
        lastState = getStateAsBytes();
        port->transaction(portName, 5000, lastState);
        emit stateChanged();
    }
}
void Controller::changeState(const quint8 newLx, const quint8 newLy, const quint8 newRx, const quint8 newRy, const Dpad_t newDpad, const Button_t newButtons, const uint8_t newVendorspec) {
    moveLeftStick(newLx, newLy);
    moveRightStick(newRx, newRy);
    pressDpad(newDpad);
    releaseButtons(BUTTON_ALL);
    pressButtons(newButtons);
    vendorspec = newVendorspec;
}
Controller *Controller::reset() {
    changeState(STICK_CENTER, STICK_CENTER, STICK_CENTER, STICK_CENTER, DPAD_NONE, BUTTON_NONE, 0x00);
    return this;
}
Controller *Controller::pressButtons(Button_t pressed) {
    buttons |= pressed;
    return this;
}
Controller *Controller::releaseButtons(Button_t released) {
    buttons &= ~released;
    return this;
}
Controller *Controller::pressDpad(Dpad_t pressed) {
    dpad = pressed;
    return this;
}
Controller *Controller::releaseDpad() {
    dpad = DPAD_NONE;
    return this;
}
Controller *Controller::moveLeftStick(const quint8 newLx, const quint8 newLy) {
    ls.first = newLx;
    ls.second = newLy;
    return this;
}
Controller *Controller::moveRightStick(const quint8 newRx, const quint8 newRy) {
    rs.first = newRx;
    rs.second = newRy;
    return this;
}
Controller *Controller::moveLeftStickX(const quint8 newLx) {
    ls.first = newLx;
    return this;
}
Controller *Controller::moveLeftStickY(const quint8 newLy) {
    ls.second = newLy;
    return this;
}
Controller *Controller::moveRightStickX(const quint8 newRx) {
    rs.first = newRx;
    return this;
}
Controller *Controller::moveRightStickY(const quint8 newRy) {
    rs.second = newRy;
    return this;
}
Controller *Controller::pushButtons(Button_t pushed, unsigned long waitMsecs) {
    pressButtons(pushed);
    wait(waitMsecs);
    releaseButtons(pushed);
    return this;
}
Controller *Controller::pushDpad(Dpad_t pushed, unsigned long waitMsecs) {
    pressDpad(pushed);
    wait(waitMsecs);
    releaseDpad();
    return this;
}
Controller *Controller::pushButtons(Button_t pushed) {
    return pushButtons(pushed, WAIT_TIME);
}
Controller *Controller::pushDpad(Dpad_t pushed) {
    return pushDpad(pushed, WAIT_TIME);
}
Controller *Controller::wait(unsigned long waitMsecs) {
    QThread::msleep(waitMsecs);
    return this;
}
Controller *Controller::wait() {
    return wait(WAIT_TIME);
}
void Controller::getState(quint8 *outLx, quint8 *outLy, quint8 *outRx, quint8 *outRy, Dpad_t *outDpad, Button_t *outButtons, uint8_t *outVendorspec) {
    if (outLx != nullptr) *outLx = ls.first;
    if (outLy != nullptr) *outLy = ls.second;
    if (outRx != nullptr) *outRx = rs.first;
    if (outRy != nullptr) *outRy = rs.second;
    if (outDpad != nullptr) *outDpad = dpad;
    if (outButtons != nullptr) *outButtons = buttons;
    if (outVendorspec != nullptr) *outVendorspec = vendorspec;
}
QByteArray Controller::getStateAsBytes() {
    quint8 buf[8];
    qToBigEndian(buttons, &buf[0]);
    buf[2] = dpad;
    buf[3] = ls.first;
    buf[4] = ls.second;
    buf[5] = rs.first;
    buf[6] = rs.second;
    buf[7] = vendorspec;

    return QByteArray((char*) buf, 8);
}
bool Controller::isStateDifferent(QByteArray oldState) {
    QByteArray currentState = getStateAsBytes();
    return currentState != oldState;
}
