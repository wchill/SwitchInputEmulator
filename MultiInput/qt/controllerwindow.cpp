#include <QtGui>
#include <QPixmap>
#include <QLabel>
#include <QImage>
#include <QBrush>
#include <QColor>
#include <QDebug>
#include <QLayout>
#include <QtGamepad/QGamepad>
#include "controllerwindow.h"
#include "ui_controllerwindow.h"
#include <iostream>

using std::cout;
using std::endl;

ControllerWindow::ControllerWindow(std::shared_ptr<QGamepad> gamepad, QWidget *parent) :
    QDialog(parent),
    gamepad(gamepad),
    ui(new Ui::ControllerWindow)
{
    ui->setupUi(this);

    this->setSizeGripEnabled(false);

    image = std::unique_ptr<QImage>(new QImage(":/images/switch.png"));
    zl = std::unique_ptr<QImage>(new QImage(":/images/btn_ZL.png"));
    zr = std::unique_ptr<QImage>(new QImage(":/images/btn_ZR.png"));

    if (gamepad) {
        std::cout << "Can't find gamepad" << std::endl;
        emit warning("Gamepad not provided.");
    } else {
        //gamepad = std::unique_ptr<QGamepad>(new QGamepad(*gamepads.begin(), this));

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

        std::cout << "Found gamepad" << std::endl;
        emit message(tr("Gamepad %1 initialized").arg(gamepad.get()->deviceId()));
    }

    QImage scaledImage = image->scaled(this->width(), this->height(), Qt::KeepAspectRatio, Qt::SmoothTransformation);
    scaleFactor = scaledImage.width() / (double) image->width();
    QImage zlScaled = zl->scaled(zl->width() * scaleFactor, zl->height() * scaleFactor, Qt::KeepAspectRatio, Qt::SmoothTransformation);
    QImage zrScaled = zr->scaled(zr->width() * scaleFactor, zr->height() * scaleFactor, Qt::KeepAspectRatio, Qt::SmoothTransformation);
    image_scaled.convertFromImage(scaledImage);
    zl_scaled.convertFromImage(zlScaled);
    zr_scaled.convertFromImage(zrScaled);
    zl_mask = zl_scaled.createMaskFromColor(QColor(85, 85, 85), Qt::MaskOutColor);
    zr_mask = zr_scaled.createMaskFromColor(QColor(85, 85, 85), Qt::MaskOutColor);

    connect(&redrawTimer, SIGNAL(timeout()), this, SLOT(invalidateUi()));
    redrawTimer.start(16);
}

ControllerWindow::~ControllerWindow() {
    delete ui;
}

void ControllerWindow::setSerialPortWriter(std::shared_ptr<SerialPortWriter> newWriter) {
    if (writer) {
        disconnect(writer.get(), SIGNAL(writeComplete()), this, SLOT(onUSBPacketSent()));
    }
    writer = newWriter;
}

quint8 ControllerWindow::quantizeDouble(double const val) {
    double scaled = (val + 1.0) * 128.0;
    if (scaled < 0) scaled = 0;
    else if (scaled > 255) scaled = 255;
    return (quint8) scaled;
}

quint8 ControllerWindow::calculateCrc8Ccitt(quint8 inCrc, quint8 inData) {
    quint8 data = inCrc ^ inData;

    for (int i = 0; i < 8; i++ )
    {
        if (( data & 0x80 ) != 0 )
        {
            data <<= 1;
            data ^= 0x07;
        }
        else
        {
            data <<= 1;
        }
    }
    return data;
}
void ControllerWindow::onControllerChange() {
    lastState = getData();
    writer.get()->changeData(lastState);
}
void ControllerWindow::onUSBPacketSent() {
    QByteArray newState = getData();
    if (newState != lastState) {
        lastState = newState;
        writer.get()->changeData(lastState);
    }
}

void ControllerWindow::getState(quint8 *outLx, quint8 *outLy, quint8 *outRx, quint8 *outRy, Dpad_t *outDpad, Button_t *outButtons, uint8_t *outVendorspec) {
    quint8 lx = STICK_CENTER;
    quint8 ly = STICK_CENTER;
    quint8 rx = STICK_CENTER;
    quint8 ry = STICK_CENTER;
    Dpad_t press = DPAD_NONE;
    Button_t button = BUTTON_NONE;

    lx = checkDeadZone(quantizeDouble(gamepad->axisLeftX()));
    ly = checkDeadZone(quantizeDouble(gamepad->axisLeftY()));
    rx = checkDeadZone(quantizeDouble(gamepad->axisRightX()));
    ry = checkDeadZone(quantizeDouble(gamepad->axisRightY()));

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

    *outLx = lx;
    *outLy = ly;
    *outRx = rx;
    *outRy = ry;
    *outDpad = press;
    *outButtons = button;
    *outVendorspec = 0;
}

QByteArray ControllerWindow::getData() {
    quint8 lx;
    quint8 ly;
    quint8 rx;
    quint8 ry;
    Dpad_t press;
    Button_t button;
    quint8 vendorSpec;

    getState(&lx, &ly, &rx, &ry, &press, &button, &vendorSpec);

    quint8 buf[9];
    qToBigEndian(button, &buf[0]);
    buf[2] = press;
    buf[3] = lx;
    buf[4] = ly;
    buf[5] = rx;
    buf[6] = ry;
    buf[7] = 0;

    quint8 crc = 0;
    for(int i = 0; i < 8; i++) {
        crc = calculateCrc8Ccitt(crc, buf[i]);
    }
    buf[8] = crc;

    return QByteArray((char*) buf, 9);
}

void ControllerWindow::invalidateUi() {
    update();
}

void ControllerWindow::drawFilledRect(QPainter &painter, const QRectF &rect) {
    QPen oldPen = painter.pen();

    QPainterPath path;
    path.addRoundedRect(rect, 10, 10);
    QPen pen(Qt::white, 5);
    painter.setPen(pen);
    painter.fillPath(path, Qt::blue);
    painter.drawPath(path);

    painter.setPen(oldPen);
}

void ControllerWindow::drawFilledEllipse(QPainter &painter, const QPointF &center, qreal rx, qreal ry) {
    QPen oldPen = painter.pen();

    QPainterPath path;
    path.addEllipse(center, rx, ry);
    QPen pen(Qt::white, 5);
    painter.setPen(pen);
    painter.fillPath(path, Qt::blue);
    painter.drawPath(path);

    painter.setPen(oldPen);
}

void ControllerWindow::drawFilledPath(QPainter &painter, const std::vector<QPointF> &points) {
    QPen oldPen = painter.pen();

    QPainterPath path(points[0]);
    for(size_t i = 1; i < points.size(); i += 2) {
        QPointF midPoint = points[i];
        QPointF endPoint = points[i+1];
        path.cubicTo(midPoint, midPoint, endPoint);
    }
    QPen pen(Qt::white, 5);
    painter.setPen(pen);
    painter.fillPath(path, Qt::blue);
    painter.drawPath(path);

    painter.setPen(oldPen);
}

void ControllerWindow::renderDpad(QPainter &painter, Dpad_t dpad) {
    QRectF left(475, 575, 90, 90);
    QRectF right(659, 575, 90, 90);
    QRectF up(567, 483, 90, 90);
    QRectF down(567, 667, 90, 90);

    switch (dpad) {
    case DPAD_UP:
    case DPAD_UP_LEFT:
    case DPAD_UP_RIGHT:
        drawFilledRect(painter, up);
        break;
    case DPAD_DOWN:
    case DPAD_DOWN_LEFT:
    case DPAD_DOWN_RIGHT:
        drawFilledRect(painter, down);
        break;
    default:
        break;
    }

    switch (dpad) {
    case DPAD_LEFT:
    case DPAD_UP_LEFT:
    case DPAD_DOWN_LEFT:
        drawFilledRect(painter, left);
        break;
    case DPAD_RIGHT:
    case DPAD_UP_RIGHT:
    case DPAD_DOWN_RIGHT:
        drawFilledRect(painter, right);
        break;
    default:
        break;
    }
}

void ControllerWindow::renderButtons(QPainter &painter, const Button_t buttons) {
    if (buttons & BUTTON_Y)
        drawFilledEllipse(painter, QPointF(1220, 373), 60, 60);
    if (buttons & BUTTON_A)
        drawFilledEllipse(painter, QPointF(1500, 373), 60, 60);
    if (buttons & BUTTON_X)
        drawFilledEllipse(painter, QPointF(1360, 252), 60, 60);
    if (buttons & BUTTON_B)
        drawFilledEllipse(painter, QPointF(1360, 496), 60, 60);

    if (buttons & BUTTON_HOME)
        drawFilledEllipse(painter, QPointF(1014, 373), 40, 40);
    if (buttons & BUTTON_CAPTURE)
        drawFilledRect(painter, QRectF(728, 341, 64, 64));

    if (buttons & BUTTON_PLUS)
        drawFilledEllipse(painter, QPointF(1106, 240), 36, 36);
    if (buttons & BUTTON_MINUS)
        drawFilledEllipse(painter, QPointF(666, 240), 36, 36);

    if (buttons & BUTTON_L) {
        std::vector<QPointF> pointsL;
        pointsL.push_back(QPointF(634, 39));
        pointsL.push_back(QPointF(372, 55));
        pointsL.push_back(QPointF(195, 144));
        pointsL.push_back(QPointF(265, 34));
        pointsL.push_back(QPointF(424, 11));
        pointsL.push_back(QPointF(540, 0));
        pointsL.push_back(QPointF(634, 39));
        drawFilledPath(painter, pointsL);
    }

    if (buttons & BUTTON_R) {
        std::vector<QPointF> pointsR;
        pointsR.push_back(QPointF(1144, 39));
        pointsR.push_back(QPointF(1406, 55));
        pointsR.push_back(QPointF(1583, 144));
        pointsR.push_back(QPointF(1513, 34));
        pointsR.push_back(QPointF(1354, 11));
        pointsR.push_back(QPointF(1238, 0));
        pointsR.push_back(QPointF(1144, 39));
        drawFilledPath(painter, pointsR);
    }

    if (buttons & BUTTON_ZL)
        drawFilledRect(painter, QRectF(602, 943, 120, 120));
    if (buttons & BUTTON_ZR)
        drawFilledRect(painter, QRectF(1055, 943, 120, 120));

    if (buttons & BUTTON_LCLICK)
        drawFilledEllipse(painter, QPointF(395, 373), 80, 80);
    if (buttons & BUTTON_RCLICK)
        drawFilledEllipse(painter, QPointF(1123, 620), 80, 80);
}

void ControllerWindow::renderLeftStick(QPainter &painter, const quint8 lx, const quint8 ly) {
    if (lx == STICK_CENTER && ly == STICK_CENTER) return;

    int cx = 395 - (128 - lx);
    int cy = 373 - (128 - ly);
    drawFilledEllipse(painter, QPointF(cx, cy), 20, 20);
    QPen oldPen = painter.pen();
    QPen pen(Qt::white, 5);
    painter.setPen(pen);
    painter.drawLine(QPointF(395, 373), QPointF(cx, cy));
    painter.setPen(oldPen);
}

void ControllerWindow::renderRightStick(QPainter &painter, const quint8 rx, const quint8 ry) {
    if (rx == STICK_CENTER && ry == STICK_CENTER) return;

    int cx = 1123 - (128 - rx);
    int cy = 620 - (128 - ry);
    drawFilledEllipse(painter, QPointF(cx, cy), 20, 20);
    QPen oldPen = painter.pen();
    QPen pen(Qt::white, 5);
    painter.setPen(pen);
    painter.drawLine(QPointF(1123, 620), QPointF(cx, cy));
    painter.setPen(oldPen);
}

void ControllerWindow::paintEvent(QPaintEvent *) {

    QPainter painter;
    painter.begin(this);
    QFlags<QPainter::RenderHint> hints;
    hints.setFlag(QPainter::Antialiasing);
    hints.setFlag(QPainter::TextAntialiasing);
    hints.setFlag(QPainter::SmoothPixmapTransform);
    painter.setRenderHints(hints);
    painter.fillRect(0, 0, this->width(), this->height(), Qt::green);
    painter.drawPixmap((this->width() - image_scaled.width()) / 2.0, (this->height() - image_scaled.height()) / 2.0, image_scaled);
    painter.setPen(Qt::white);
    painter.drawPixmap((this->width() / 2.0) - (2 * zl_scaled.width()), 0.5 * this->height() + 0.25 * image_scaled.height(), zl_mask);
    painter.drawPixmap((this->width() / 2.0) + zr_scaled.width(), 0.5 * this->height() + 0.25 * image_scaled.height(), zr_mask);
    double translateX = ((this->width() - image_scaled.width()) / 2.0);
    double translateY = ((this->height() - image_scaled.height()) / 2.0);
    painter.translate(translateX, translateY);
    painter.scale(scaleFactor, scaleFactor);
    painter.setPen(Qt::NoPen);

    quint8 lx;
    quint8 ly;
    quint8 rx;
    quint8 ry;
    Dpad_t dpad;
    Button_t button;
    quint8 vendorSpec;
    getState(&lx, &ly, &rx, &ry, &dpad, &button, &vendorSpec);
    //controller.get()->getState(&lx, &ly, &rx, &ry, &dpad, &button, nullptr);

    renderDpad(painter, dpad);
    renderButtons(painter, button);
    renderLeftStick(painter, lx, ly);
    renderRightStick(painter, rx, ry);

    painter.end();
}

QSize ControllerWindow::minimumSizeHint() const {
    return QSize(886, 616);
    //return QSize(888, 620);
}

QSize ControllerWindow::sizeHint() const {
    return QSize(886, 616);
    //return QSize(888, 620);
}

QSize ControllerWindow::maximumSizeHint() const {
    return QSize(1772, 1232);
    //return QSize(1774, 1238);
}

void ControllerWindow::closeEvent(QCloseEvent *event) {
    emit controllerWindowClosing();
    event->accept();
}
