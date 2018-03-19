#include <QtEndian>
#include <QThread>
#include <QTimer>
#include "controller.h"

Controller::Controller(const QString &newPortName, QObject *parent, ILogger *parentLogger) :
    QObject(parent), ls(STICK_CENTER, STICK_CENTER), rs(STICK_CENTER, STICK_CENTER), dpad(DPAD_NONE), buttons(BUTTON_NONE), vendorspec(0x00) {
    portName = newPortName;
    logger = new ILogger(parentLogger);
    port = new SerialPortWriter(this, logger);
    connect(this, SIGNAL(stateChanged()), this, SLOT(sendUpdate()));
    logger->logMessage("Controller initialized");

    /*
    QTimer *timer = new QTimer(this);
    connect(timer, SIGNAL(timeout()), this, SLOT(updateCaption()));
    timer->start(1000);
    */
}
Controller::~Controller() {
    delete port;
    delete logger;
}
void Controller::sendUpdate() {
    //port->transaction(portName, 5000, getStateAsBytes());
}
void Controller::changeState(const QVector2D &newLs, const QVector2D &newRs, const Dpad_t newDpad, const Button_t newButtons, const uint8_t newVendorspec, bool update) {
    QByteArray oldState = getStateAsBytes();
    moveLeftStick(newLs, false);
    moveRightStick(newRs, false);
    pressDpad(newDpad, false);
    releaseButtons(BUTTON_ALL, false);
    pressButtons(newButtons, false);
    vendorspec = newVendorspec;
    if (update && (oldState != getStateAsBytes())) {
        emit stateChanged();
    }
}
Controller *Controller::reset(bool update) {
    QByteArray oldState = getStateAsBytes();
    moveLeftStick(QVector2D(STICK_CENTER, STICK_CENTER), false);
    moveRightStick(QVector2D(STICK_CENTER, STICK_CENTER), false);
    releaseDpad(false);
    releaseButtons(BUTTON_ALL, false);
    vendorspec = 0x00;
    if(update && (oldState != getStateAsBytes())) {
        emit stateChanged();
    }
    return this;
}
Controller *Controller::pressButtons(Button_t pressed, bool update) {
    Button_t oldButtons = buttons;
    buttons |= pressed;
    if(update && (oldButtons != buttons)) {
        emit stateChanged();
    }
    return this;
}
Controller *Controller::releaseButtons(Button_t released, bool update) {
    Button_t oldButtons = buttons;
    buttons &= ~released;
    if(update && (oldButtons != buttons)) {
        emit stateChanged();
    }
    return this;
}
Controller *Controller::pressDpad(Dpad_t pressed, bool update) {
    Dpad_t oldDpad = dpad;
    dpad = pressed;
    if(update && (oldDpad != dpad)) {
        emit stateChanged();
    }
    return this;
}
Controller *Controller::releaseDpad(bool update) {
    Dpad_t oldDpad = dpad;
    dpad = DPAD_NONE;
    if(update && (oldDpad != dpad)) {
        emit stateChanged();
    }
    return this;
}
Controller *Controller::moveLeftStick(const QVector2D newLs, bool update) {
    float x = newLs.x();
    float y = newLs.y();

    if (x > STICK_MAX) {
        x = STICK_MAX;
    } else if (x < STICK_MIN) {
        x = STICK_MIN;
    }

    if (y > STICK_MAX) {
        y = STICK_MAX;
    } else if (y < STICK_MIN) {
        y = STICK_MIN;
    }

    bool updated = (ls.x() != x || ls.y() != y);
    ls.setX(x);
    rs.setY(y);
    if(update && updated) {
        emit stateChanged();
    }
    return this;
}
Controller *Controller::moveRightStick(const QVector2D newRs, bool update) {
    float x = newRs.x();
    float y = newRs.y();

    if (x > STICK_MAX) {
        x = STICK_MAX;
    } else if (x < STICK_MIN) {
        x = STICK_MIN;
    }

    if (y > STICK_MAX) {
        y = STICK_MAX;
    } else if (y < STICK_MIN) {
        y = STICK_MIN;
    }

    bool updated = (rs.x() != x || rs.y() != y);
    rs.setX(x);
    rs.setY(y);
    if(update && updated) {
        emit stateChanged();
    }
    return this;
}
Controller *Controller::pushButtons(Button_t pushed, unsigned long waitMsecs, bool update) {
    Button_t oldButtons = buttons;
    pressButtons(pushed, false);
    wait(waitMsecs);
    releaseButtons(pushed, false);
    if(update && (oldButtons != buttons)) {
        emit stateChanged();
    }
    return this;
}
Controller *Controller::pushDpad(Dpad_t pushed, unsigned long waitMsecs, bool update) {
    Dpad_t oldDpad = dpad;
    pressDpad(pushed, false);
    wait(waitMsecs);
    releaseDpad(false);
    if(update && (oldDpad != dpad)) {
        emit stateChanged();
    }
    return this;
}
Controller *Controller::pushButtons(Button_t pushed, bool update) {
    return pushButtons(pushed, WAIT_TIME, update);
}
Controller *Controller::pushDpad(Dpad_t pushed, bool update) {
    return pushDpad(pushed, WAIT_TIME, update);
}
Controller *Controller::wait(unsigned long waitMsecs) {
    QThread::msleep(waitMsecs);
    return this;
}
Controller *Controller::wait() {
    return wait(WAIT_TIME);
}
void Controller::getLeftStickAsByte(uint8_t *outX, uint8_t *outY) {
    float x = ls.x();
    if (x >= STICK_MAX) *outX = 255;
    else if (x <= STICK_MIN) *outX = 0;
    else if (x == STICK_CENTER) *outX = 127;
    else *outX = (uint8_t) ((x + 1.0f) / 2 * 255);

    float y = ls.y();
    if (y >= STICK_MAX) *outY = 255;
    else if (y <= STICK_MIN) *outY = 0;
    else if (y == STICK_CENTER) *outY = 127;
    else *outY = (uint8_t) ((y + 1.0f) / 2 * 255);
}
void Controller::getRightStickAsByte(uint8_t *outX, uint8_t *outY) {
    float x = rs.x();
    if (x >= STICK_MAX) *outX = 255;
    else if (x <= STICK_MIN) *outX = 0;
    else if (x == STICK_CENTER) *outX = 127;
    else *outX = (uint8_t) ((x + 1.0f) / 2 * 255);

    float y = rs.y();
    if (y >= STICK_MAX) *outY = 255;
    else if (y <= STICK_MIN) *outY = 0;
    else if (y == STICK_CENTER) *outY = 127;
    else *outY = (uint8_t) ((y + 1.0f) / 2 * 255);
}
void Controller::getState(QVector2D *outLs, QVector2D *outRs, Dpad_t *outDpad, Button_t *outButtons, uint8_t *outVendorspec) {
    if (outLs != nullptr) *outLs = ls;
    if (outRs != nullptr) *outRs = rs;
    if (outDpad != nullptr) *outDpad = dpad;
    if (outButtons != nullptr) *outButtons = buttons;
    if (outVendorspec != nullptr) *outVendorspec = vendorspec;
}
QByteArray Controller::getStateAsBytes() {
    uint8_t buf[8];
    qToBigEndian(buttons, &buf[0]);
    buf[2] = dpad;
    getLeftStickAsByte(&buf[3], &buf[4]);
    getRightStickAsByte(&buf[5], &buf[6]);
    buf[7] = vendorspec;

    return QByteArray((char*) buf, 8);
}
