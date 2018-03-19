#include <QtGui>
#include <QPixmap>
#include <QLabel>
#include <QImage>
#include <QBrush>
#include <QColor>
#include <QDebug>
#include <QtGamepad/QGamepad>
#include "controllerwindow.h"
#include "ui_controllerwindow.h"
#include <iostream>

using std::cout;
using std::endl;

ControllerWindow::ControllerWindow(const QString &portName, QWidget *parent, ILogger *parentLogger) :
    QDialog(parent),
    ui(new Ui::ControllerWindow)
{
    ui->setupUi(this);

    this->setSizeGripEnabled(false);

    image = std::unique_ptr<QImage>(new QImage(":/images/switch.png"));
    zl = std::unique_ptr<QImage>(new QImage(":/images/btn_ZL.png"));
    zr = std::unique_ptr<QImage>(new QImage(":/images/btn_ZR.png"));

    logger = new ILogger(parentLogger);

    controller = std::unique_ptr<Controller>(new Controller(portName, this, logger));
    connect(controller.get(), SIGNAL(stateChanged()), this, SLOT(invalidateUi()));

    auto gamepads = QGamepadManager::instance()->connectedGamepads();
    if (gamepads.isEmpty()) {
        return;
    }

    gamepad = std::unique_ptr<QGamepad>(new QGamepad(*gamepads.begin(), this));
    connect(gamepad.get(), SIGNAL(axisLeftXChanged(double)), this, SLOT(onLeftStickX(double)));
    connect(gamepad.get(), SIGNAL(axisLeftYChanged(double)), this, SLOT(onLeftStickY(double)));
    connect(gamepad.get(), SIGNAL(axisRightXChanged(double)), this, SLOT(onRightStickX(double)));
    connect(gamepad.get(), SIGNAL(axisRightYChanged(double)), this, SLOT(onRightStickY(double)));

    // Need to translate analog to clicks
    connect(gamepad.get(), SIGNAL(buttonL2Changed(double)), this, SLOT(onButtonZLChange(double)));
    connect(gamepad.get(), SIGNAL(buttonR2Changed(double)), this, SLOT(onButtonZRChange(double)));

    // A and B are swapped on Nintendo controllers
    connect(gamepad.get(), SIGNAL(buttonAChanged(bool)), this, SLOT(onButtonBChange(bool)));
    connect(gamepad.get(), SIGNAL(buttonBChanged(bool)), this, SLOT(onButtonAChange(bool)));
    connect(gamepad.get(), SIGNAL(buttonXChanged(bool)), this, SLOT(onButtonXChange(bool)));
    connect(gamepad.get(), SIGNAL(buttonYChanged(bool)), this, SLOT(onButtonYChange(bool)));

    // Handle hat presses with special code
    connect(gamepad.get(), SIGNAL(buttonLeftChanged(bool)), this, SLOT(onHatChange(bool)));
    connect(gamepad.get(), SIGNAL(buttonRightChanged(bool)), this, SLOT(onHatChange(bool)));
    connect(gamepad.get(), SIGNAL(buttonUpChanged(bool)), this, SLOT(onHatChange(bool)));
    connect(gamepad.get(), SIGNAL(buttonDownChanged(bool)), this, SLOT(onHatChange(bool)));

    connect(gamepad.get(), SIGNAL(buttonL1Changed(bool)), this, SLOT(onButtonLChange(bool)));
    connect(gamepad.get(), SIGNAL(buttonR1Changed(bool)), this, SLOT(onButtonRChange(bool)));

    connect(gamepad.get(), SIGNAL(buttonL3Changed(bool)), this, SLOT(onButtonL3Change(bool)));
    connect(gamepad.get(), SIGNAL(buttonR3Changed(bool)), this, SLOT(onButtonR3Change(bool)));

    connect(gamepad.get(), SIGNAL(buttonSelectChanged(bool)), this, SLOT(onButtonMinusChange(bool)));
    connect(gamepad.get(), SIGNAL(buttonStartChanged(bool)), this, SLOT(onButtonPlusChange(bool)));
    connect(gamepad.get(), SIGNAL(buttonGuideChanged(bool)), this, SLOT(onButtonHomeChange(bool)));
}

ControllerWindow::~ControllerWindow() {
    delete logger;
    delete ui;
}

quint8 ControllerWindow::quantizeDouble(double val) {
    double scaled = (val + 1.0) * 128.0;
    if (scaled < 0) scaled = 0;
    else if (scaled > 255) scaled = 255;
    return (quint8) scaled;
}

void ControllerWindow::onLeftStickX(double value) {
    controller.get()->moveLeftStickX(quantizeDouble(value));
}

void ControllerWindow::onLeftStickY(double value) {
    controller.get()->moveLeftStickY(quantizeDouble(value));
}

void ControllerWindow::onRightStickX(double value) {
    controller.get()->moveRightStickX(quantizeDouble(value));
}

void ControllerWindow::onRightStickY(double value) {
    controller.get()->moveRightStickY(quantizeDouble(value));
}

void ControllerWindow::onButtonZLChange(double value) {
    if (value > 0.6) controller.get()->pressButtons(BUTTON_ZL);
    else controller.get()->releaseButtons(BUTTON_ZL);
}

void ControllerWindow::onButtonZRChange(double value) {
    if (value > 0.6) controller.get()->pressButtons(BUTTON_ZR);
    else controller.get()->releaseButtons(BUTTON_ZR);
}

void ControllerWindow::onButtonAChange(bool pressed) {
    if (pressed) controller.get()->pressButtons(BUTTON_A);
    else controller.get()->releaseButtons(BUTTON_A);
}

void ControllerWindow::onButtonBChange(bool pressed) {
    if (pressed) controller.get()->pressButtons(BUTTON_B);
    else controller.get()->releaseButtons(BUTTON_B);
}

void ControllerWindow::onButtonXChange(bool pressed) {
    if (pressed) controller.get()->pressButtons(BUTTON_X);
    else controller.get()->releaseButtons(BUTTON_X);
}

void ControllerWindow::onButtonYChange(bool pressed) {
    if (pressed) controller.get()->pressButtons(BUTTON_Y);
    else controller.get()->releaseButtons(BUTTON_Y);
}

void ControllerWindow::onButtonLChange(bool pressed) {
    if (pressed) controller.get()->pressButtons(BUTTON_L);
    else controller.get()->releaseButtons(BUTTON_L);
}

void ControllerWindow::onButtonRChange(bool pressed) {
    if (pressed) controller.get()->pressButtons(BUTTON_R);
    else controller.get()->releaseButtons(BUTTON_R);
}

void ControllerWindow::onButtonL3Change(bool pressed) {
    if (pressed) controller.get()->pressButtons(BUTTON_LCLICK);
    else controller.get()->releaseButtons(BUTTON_LCLICK);
}

void ControllerWindow::onButtonR3Change(bool pressed) {
    if (pressed) controller.get()->pressButtons(BUTTON_RCLICK);
    else controller.get()->releaseButtons(BUTTON_RCLICK);
}

void ControllerWindow::onButtonMinusChange(bool pressed) {
    if (pressed) controller.get()->pressButtons(BUTTON_MINUS);
    else controller.get()->releaseButtons(BUTTON_MINUS);
}

void ControllerWindow::onButtonPlusChange(bool pressed) {
    if (pressed) controller.get()->pressButtons(BUTTON_PLUS);
    else controller.get()->releaseButtons(BUTTON_PLUS);
}

void ControllerWindow::onButtonHomeChange(bool pressed) {
    if (pressed) controller.get()->pressButtons(BUTTON_HOME);
    else controller.get()->releaseButtons(BUTTON_HOME);
}

void ControllerWindow::onHatChange(bool pressed) {
    bool up = gamepad.get()->buttonUp();
    bool right = gamepad.get()->buttonRight();
    bool down = gamepad.get()->buttonDown();
    bool left = gamepad.get()->buttonLeft();

    if (up) {
        if (right) controller.get()->pressDpad(DPAD_UP_RIGHT);
        else if (left) controller.get()->pressDpad(DPAD_UP_LEFT);
        else controller.get()->pressDpad(DPAD_UP);
    } else if (down) {
        if (right) controller.get()->pressDpad(DPAD_DOWN_RIGHT);
        else if (left) controller.get()->pressDpad(DPAD_DOWN_LEFT);
        else controller.get()->pressDpad(DPAD_DOWN);
    } else if (right) {
        controller.get()->pressDpad(DPAD_RIGHT);
    } else if (left) {
        controller.get()->pressDpad(DPAD_LEFT);
    } else {
        controller.get()->pressDpad(DPAD_NONE);
    }
}

void ControllerWindow::invalidateUi() {
    repaint();
}

void ControllerWindow::drawFilledRect(QPainter &painter, const QRectF &rect) {
    QPen oldPen = painter.pen();

    QPainterPath path;
    path.addRoundedRect(rect, 10, 10);
    QPen pen(Qt::white, 5);
    painter.setPen(pen);
    painter.fillPath(path, Qt::red);
    painter.drawPath(path);

    painter.setPen(oldPen);
}

void ControllerWindow::drawFilledEllipse(QPainter &painter, const QPointF &center, qreal rx, qreal ry) {
    QPen oldPen = painter.pen();

    QPainterPath path;
    path.addEllipse(center, rx, ry);
    QPen pen(Qt::white, 5);
    painter.setPen(pen);
    painter.fillPath(path, Qt::red);
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
    painter.fillPath(path, Qt::red);
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
    QImage scaledImage = image->scaled(this->width(), this->height(), Qt::KeepAspectRatio, Qt::SmoothTransformation);
    double scaleFactor = scaledImage.width() / (double) image->width();
    QImage zlScaled = zl->scaled(zl->width() * scaleFactor, zl->height() * scaleFactor, Qt::KeepAspectRatio, Qt::SmoothTransformation);
    QImage zrScaled = zr->scaled(zr->width() * scaleFactor, zr->height() * scaleFactor, Qt::KeepAspectRatio, Qt::SmoothTransformation);

    QPainter painter;
    painter.begin(this);
    QFlags<QPainter::RenderHint> hints;
    hints.setFlag(QPainter::Antialiasing);
    hints.setFlag(QPainter::TextAntialiasing);
    hints.setFlag(QPainter::SmoothPixmapTransform);
    painter.setRenderHints(hints);
    painter.drawImage((this->width() - scaledImage.width()) / 2.0, (this->height() - scaledImage.height()) / 2.0, scaledImage, 0, 0, -1, -1, Qt::NoOpaqueDetection);
    painter.drawImage((this->width() / 2.0) - (2 * zlScaled.width()), this->height() * 0.75, zlScaled, 0, 0, -1, -1, Qt::NoOpaqueDetection);
    painter.drawImage((this->width() / 2.0) + zrScaled.width(), this->height() * 0.75, zrScaled, 0, 0, -1, -1, Qt::NoOpaqueDetection);
    painter.scale(scaleFactor, scaleFactor);
    painter.setPen(Qt::NoPen);

    quint8 lx;
    quint8 ly;
    quint8 rx;
    quint8 ry;
    Dpad_t dpad;
    Button_t button;
    controller.get()->getState(&lx, &ly, &rx, &ry, &dpad, &button, nullptr);

    renderDpad(painter, dpad);
    renderButtons(painter, button);
    renderLeftStick(painter, lx, ly);
    renderRightStick(painter, rx, ry);

    painter.end();
}

QSize ControllerWindow::minimumSizeHint() const {
    return QSize(444, 310);
}

QSize ControllerWindow::sizeHint() const {
    return QSize(888, 620);
}

void ControllerWindow::closeEvent(QCloseEvent *event) {
    emit controllerWindowClosing();
    event->accept();
}
