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

ControllerWindow::ControllerWindow(std::shared_ptr<ControllerInput> controller, QWidget *parent) :
    QDialog(parent),
    ui(new Ui::ControllerWindow),
    controller(controller)
{
    ui->setupUi(this);

    this->setSizeGripEnabled(false);

    image = std::unique_ptr<QImage>(new QImage(":/images/switch_nostick.png"));
    zl = std::unique_ptr<QImage>(new QImage(":/images/btn_ZL.png"));
    zr = std::unique_ptr<QImage>(new QImage(":/images/btn_ZR.png"));
    stick = std::unique_ptr<QImage>(new QImage(":/images/stick.png"));

    QImage scaledImage = image->scaled(this->width(), this->height(), Qt::KeepAspectRatio, Qt::SmoothTransformation);
    scaleFactor = scaledImage.width() / (double) image->width();
    QImage zlScaled = zl->scaled(zl->width() * scaleFactor, zl->height() * scaleFactor, Qt::KeepAspectRatio, Qt::SmoothTransformation);
    QImage zrScaled = zr->scaled(zr->width() * scaleFactor, zr->height() * scaleFactor, Qt::KeepAspectRatio, Qt::SmoothTransformation);
    image_scaled.convertFromImage(scaledImage);
    zl_scaled.convertFromImage(zlScaled);
    zr_scaled.convertFromImage(zrScaled);
    stick_pixmap.convertFromImage(*stick.get());
    zl_mask = zl_scaled.createMaskFromColor(QColor(85, 85, 85), Qt::MaskOutColor);
    zr_mask = zr_scaled.createMaskFromColor(QColor(85, 85, 85), Qt::MaskOutColor);

    connect(&redrawTimer, SIGNAL(timeout()), this, SLOT(invalidateUi()));
    redrawTimer.start(16);
}

ControllerWindow::~ControllerWindow() {
    delete ui;
}

void ControllerWindow::invalidateUi() {
    this->update();
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
    QRectF left(477, 570, 90, 90);
    QRectF right(660, 570, 90, 90);
    QRectF up(568, 482, 90, 90);
    QRectF down(568, 661, 90, 90);

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
        drawFilledEllipse(painter, QPointF(1217, 370), 60, 60);
    if (buttons & BUTTON_A)
        drawFilledEllipse(painter, QPointF(1496, 370), 60, 60);
    if (buttons & BUTTON_X)
        drawFilledEllipse(painter, QPointF(1356, 249), 60, 60);
    if (buttons & BUTTON_B)
        drawFilledEllipse(painter, QPointF(1356, 492), 60, 60);

    if (buttons & BUTTON_HOME)
        drawFilledEllipse(painter, QPointF(1013, 370), 40, 40);
    if (buttons & BUTTON_CAPTURE)
        drawFilledRect(painter, QRectF(729, 338, 64, 64));

    if (buttons & BUTTON_PLUS)
        drawFilledEllipse(painter, QPointF(1107, 237), 36, 36);
    if (buttons & BUTTON_MINUS)
        drawFilledEllipse(painter, QPointF(667, 237), 36, 36);

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
}

void ControllerWindow::renderLeftStick(QPainter &painter, const quint8 lx, const quint8 ly, const Button_t buttons) {
    QPen oldPen = painter.pen();
    int cx = 397;
    int cy = 371;

    int offx = (lx - 128) / 2;
    int offy = (ly - 128) / 2;

    int sx = cx + offx - stick_pixmap.width() / 2;
    int sy = cy + offy - stick_pixmap.height() / 2;
    painter.drawPixmap(sx, sy, stick_pixmap);

    if (buttons & BUTTON_LCLICK)
        drawFilledEllipse(painter, QPointF(cx + offx, cy + offy + 2), stick_pixmap.width() / 3, stick_pixmap.height() / 3);

    painter.setPen(oldPen);
}

void ControllerWindow::renderRightStick(QPainter &painter, const quint8 rx, const quint8 ry, const Button_t buttons) {
    QPen oldPen = painter.pen();
    int cx = 1121;
    int cy = 619;

    int offx = (rx - 128) / 2;
    int offy = (ry - 128) / 2;

    int sx = cx + offx - stick_pixmap.width() / 2;
    int sy = cy + offy - stick_pixmap.height() / 2;
    painter.drawPixmap(sx, sy, stick_pixmap);

    if (buttons & BUTTON_RCLICK)
        drawFilledEllipse(painter, QPointF(cx + offx, cy + offy + 2), stick_pixmap.width() / 3, stick_pixmap.height() / 3);

    painter.setPen(oldPen);
}

void ControllerWindow::paintEvent(QPaintEvent *) { 
    quint8 lx;
    quint8 ly;
    quint8 rx;
    quint8 ry;
    Dpad_t dpad;
    Button_t button;
    quint8 vendorSpec;
    controller.get()->getState(&lx, &ly, &rx, &ry, &dpad, &button, &vendorSpec);

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

    renderDpad(painter, dpad);
    renderButtons(painter, button);
    renderLeftStick(painter, lx, ly, button);
    renderRightStick(painter, rx, ry, button);

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
