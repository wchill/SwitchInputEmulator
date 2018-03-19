#include <QtGui>
#include <QPixmap>
#include <QLabel>
#include <QImage>
#include <QBrush>
#include <QColor>
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
    // connect(timer, SIGNAL(timeout()), this, SLOT(update()));
    image = std::unique_ptr<QImage>(new QImage(":/images/switch.png"));
    zl = std::unique_ptr<QImage>(new QImage(":/images/btn_ZL.png"));
    zr = std::unique_ptr<QImage>(new QImage(":/images/btn_ZR.png"));

    logger = new ILogger(parentLogger);

    controller = std::unique_ptr<Controller>(new Controller(portName, this, logger));
    connect(controller.get(), SIGNAL(stateChanged()), this, SLOT(invalidateUi()));
}

ControllerWindow::~ControllerWindow() {
    delete logger;
    delete ui;
}

void ControllerWindow::invalidateUi() {
    logger->logMessage("State changed");
    repaint();
}

/*
void ControllerWindow::updatePressedKeys(QKeyEvent *event)
{
    QString str = "";
    for(auto it = keys.begin(); it != keys.end(); it++) {
        if((*it).second)
            str += QKeySequence((*it).first).toString() + " ";
            //str += "0x" + QString::number((*it).first, 16) + " ";
    }
    //ui->keysPressed->setText(str);
}
*/

void ControllerWindow::keyPressEvent(QKeyEvent *event)
{
    if(!event->isAutoRepeat()) {
        logger->logMessage("Key pressed");
        controller.get()->changeState(STICK_RESET, STICK_RESET, DPAD_LEFT, BUTTON_NONE);
    }
}

void ControllerWindow::keyReleaseEvent(QKeyEvent *event)
{
    logger->logMessage("Key released");
    controller.get()->changeState(STICK_RESET, STICK_RESET, DPAD_RIGHT, BUTTON_NONE);
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

    QVector2D ls;
    QVector2D rs;
    Dpad_t dpad;
    Button_t button;
    controller.get()->getState(&ls, &rs, &dpad, &button, nullptr);

    renderDpad(painter, dpad);
    renderButtons(painter, button);

    // lstick
    drawFilledEllipse(painter, QPointF(395, 373), 20, 20);

    // rstick
    drawFilledEllipse(painter, QPointF(1123, 620), 20, 20);
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
