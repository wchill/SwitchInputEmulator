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
void Controller::sendUpdate() {
    if (isStateDifferent(lastState)) {
        lastState = getData();
        port->changeData(getData());
        emit stateChanged();
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
