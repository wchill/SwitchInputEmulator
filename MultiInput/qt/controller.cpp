#include <QtEndian>
#include <QThread>
#include "controller.h"

#include <iostream>
using std::cout;
using std::endl;

Controller::Controller(QString const &newPortName, QObject *parent, ILogger *parentLogger) :
    QObject(parent), ls(STICK_CENTER, STICK_CENTER), rs(STICK_CENTER, STICK_CENTER), dpad(DPAD_NONE), buttons(BUTTON_NONE), vendorspec(0x00) {
    portName = newPortName;
    logger = new ILogger(parentLogger);

    port = new SerialPortWriter(portName);
    port->moveToThread(&writerThread);
    connect(port, SIGNAL(error(QString)), this, SLOT(onSerialError(QString)));
    connect(port, SIGNAL(timeout(QString)), this, SLOT(onSerialTimeout(QString)));
    connect(port, SIGNAL(message(QString)), this, SLOT(onSerialMessage(QString)));
    connect(port, SIGNAL(writeComplete()), this, SIGNAL(stateChanged()));
    connect(this, SIGNAL(operate(QByteArray)), port, SLOT(doWork(QByteArray)));
    writerThread.start();
    writerThread.setPriority(QThread::TimeCriticalPriority);
    emit operate(getData());

    logger->logMessage("Controller initialized");
}
Controller::~Controller() {
    delete port;
    writerThread.quit();
    writerThread.wait();
    delete logger;
}
void Controller::onSerialError(const QString &error) {
    logger->logError(error);
}
void Controller::onSerialTimeout(const QString &error) {
    logger->logWarning(error);
}
void Controller::onSerialMessage(const QString &error) {
    logger->logMessage(error);
}
quint8 Controller::quantizeDouble(double const val) {
    double scaled = (val + 1.0) * 128.0;
    if (scaled < 0) scaled = 0;
    else if (scaled > 255) scaled = 255;
    return (quint8) scaled;
}
void Controller::sendUpdate() {
    if (isStateDifferent(lastState)) {
        lastState = getData();
        port->changeData(getData());
    }
}
void Controller::changeState(quint8 const newLx, quint8 const newLy, quint8 const newRx, quint8 const newRy, Dpad_t const newDpad, Button_t const newButtons, uint8_t const newVendorspec, bool update) {
    moveLeftStick(newLx, newLy, false);
    moveRightStick(newRx, newRy, false);
    pressDpad(newDpad, false);
    releaseButtons(BUTTON_ALL, false);
    pressButtons(newButtons, false);
    vendorspec = newVendorspec;
    if (update) sendUpdate();
}
Controller *Controller::reset(bool update) {
    changeState(STICK_CENTER, STICK_CENTER, STICK_CENTER, STICK_CENTER, DPAD_NONE, BUTTON_NONE, 0x00, update);
    return this;
}
Controller *Controller::pressButtons(Button_t const pressed, bool update) {
    buttons |= pressed;
    if (update) sendUpdate();
    return this;
}
Controller *Controller::releaseButtons(Button_t const released, bool update) {
    buttons &= ~released;
    if (update) sendUpdate();
    return this;
}
Controller *Controller::pressDpad(Dpad_t const pressed, bool update) {
    dpad = pressed;
    if (update) sendUpdate();
    return this;
}
Controller *Controller::releaseDpad(bool update) {
    dpad = DPAD_NONE;
    if (update) sendUpdate();
    return this;
}
Controller *Controller::moveLeftStick(quint8 const newLx, quint8 const newLy, bool update) {
    ls.first = newLx;
    ls.second = newLy;
    if (update) sendUpdate();
    return this;
}
Controller *Controller::moveRightStick(quint8 const newRx, quint8 const newRy, bool update) {
    rs.first = newRx;
    rs.second = newRy;
    if (update) sendUpdate();
    return this;
}
Controller *Controller::moveLeftStickX(quint8 const newLx, bool update) {
    ls.first = newLx;
    if (update) sendUpdate();
    return this;
}
Controller *Controller::moveLeftStickY(quint8 const newLy, bool update) {
    ls.second = newLy;
    if (update) sendUpdate();
    return this;
}
Controller *Controller::moveRightStickX(quint8 const newRx, bool update) {
    rs.first = newRx;
    if (update) sendUpdate();
    return this;
}
Controller *Controller::moveRightStickY(quint8 const newRy, bool update) {
    rs.second = newRy;
    if (update) sendUpdate();
    return this;
}
Controller *Controller::pushButtons(Button_t const pushed, unsigned long const waitMsecs) {
    pressButtons(pushed, true);
    wait(waitMsecs);
    releaseButtons(pushed, true);
    return this;
}
Controller *Controller::pushDpad(Dpad_t const pushed, unsigned long const waitMsecs) {
    pressDpad(pushed, true);
    wait(waitMsecs);
    releaseDpad(true);
    return this;
}
Controller *Controller::pushButtons(Button_t const pushed) {
    return pushButtons(pushed, WAIT_TIME);
}
Controller *Controller::pushDpad(Dpad_t const pushed) {
    return pushDpad(pushed, WAIT_TIME);
}
Controller *Controller::wait(unsigned long const waitMsecs) {
    QThread::msleep(waitMsecs);
    return this;
}
Controller *Controller::wait() {
    return wait(WAIT_TIME);
}
void Controller::onLeftStickXDouble(const double value) {
    onLeftStickX(quantizeDouble(value));
}
void Controller::onLeftStickYDouble(const double value) {
    onLeftStickY(quantizeDouble(value));
}
void Controller::onRightStickXDouble(const double value) {
    onRightStickX(quantizeDouble(value));
}
void Controller::onRightStickYDouble(const double value) {
    onRightStickY(quantizeDouble(value));
}
void Controller::onLeftStickX(const quint8 value) {
    moveLeftStickX(value);
}
void Controller::onLeftStickY(const quint8 value) {
    moveLeftStickY(value);
}
void Controller::onRightStickX(const quint8 value) {
    moveRightStickX(value);
}
void Controller::onRightStickY(const quint8 value) {
    moveRightStickY(value);
}
void Controller::onButtonAChange(const bool pressed) {
    if (pressed) pressButtons(BUTTON_A);
    else releaseButtons(BUTTON_A);
}
void Controller::onButtonBChange(const bool pressed) {
    if (pressed) pressButtons(BUTTON_B);
    else releaseButtons(BUTTON_B);
}
void Controller::onButtonXChange(const bool pressed) {
    if (pressed) pressButtons(BUTTON_X);
    else releaseButtons(BUTTON_X);
}
void Controller::onButtonYChange(const bool pressed) {
    if (pressed) pressButtons(BUTTON_Y);
    else releaseButtons(BUTTON_Y);
}
void Controller::onButtonLChange(const bool pressed) {
    if (pressed) pressButtons(BUTTON_L);
    else releaseButtons(BUTTON_L);
}
void Controller::onButtonRChange(const bool pressed) {
    if (pressed) pressButtons(BUTTON_R);
    else releaseButtons(BUTTON_R);
}
void Controller::onButtonZLChange(const bool pressed) {
    if (pressed) pressButtons(BUTTON_ZL);
    else releaseButtons(BUTTON_ZL);
}
void Controller::onButtonZRChange(const bool pressed) {
    if (pressed) pressButtons(BUTTON_ZR);
    else releaseButtons(BUTTON_ZR);
}
void Controller::onButtonL3Change(const bool pressed) {
    if (pressed) pressButtons(BUTTON_LCLICK);
    else releaseButtons(BUTTON_LCLICK);
}
void Controller::onButtonR3Change(const bool pressed) {
    if (pressed) pressButtons(BUTTON_RCLICK);
    else releaseButtons(BUTTON_RCLICK);
}
void Controller::onButtonMinusChange(const bool pressed) {
    if (pressed) pressButtons(BUTTON_MINUS);
    else releaseButtons(BUTTON_MINUS);
}
void Controller::onButtonPlusChange(const bool pressed) {
    if (pressed) pressButtons(BUTTON_PLUS);
    else releaseButtons(BUTTON_PLUS);
}
void Controller::onButtonHomeChange(const bool pressed) {
    if (pressed) pressButtons(BUTTON_HOME);
    else releaseButtons(BUTTON_HOME);
}
void Controller::onButtonCaptureChange(const bool pressed) {
    if (pressed) pressButtons(BUTTON_CAPTURE);
    else releaseButtons(BUTTON_CAPTURE);
}
void Controller::onHatChange(const Dpad_t pressed) {
    pressDpad(pressed);
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
QByteArray Controller::getData() {
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
bool Controller::isStateDifferent(QByteArray const oldState) {
    QByteArray currentState = getData();
    return currentState != oldState;
}
