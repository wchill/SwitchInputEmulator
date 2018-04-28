#ifndef CONTROLLEROPENGLWIDGET_H
#define CONTROLLEROPENGLWIDGET_H

#include <QBitmap>
#include <QOpenGLWidget>
#include <QPainter>
#include <memory>
#include "controllerconstants.h"
#include "controllerinput.h"

class ControllerOpenGLWidget : public QOpenGLWidget
{
    Q_OBJECT
public:
    ControllerOpenGLWidget(std::shared_ptr<ControllerInput> controller, QWidget *parent);

protected:
    void paintEvent(QPaintEvent *e) override;

private slots:
    void invalidateUi();

private:
    void drawFilledRect(QPainter &painter, const QRectF &rect);
    void drawFilledEllipse(QPainter &painter, const QPointF &center, const qreal rx, const qreal ry);
    void drawFilledPath(QPainter &painter, const std::vector<QPointF> &points);

    void renderDpad(QPainter &painter, const Dpad_t dpad);
    void renderButtons(QPainter &painter, const Button_t buttons);
    void renderLeftStick(QPainter &painter, const quint8 lx, const quint8 ly, const Button_t buttons);
    void renderRightStick(QPainter &painter, const quint8 rx, const quint8 ry, const Button_t buttons);

    std::unique_ptr<QImage> image;
    std::unique_ptr<QImage> zl;
    std::unique_ptr<QImage> zr;
    std::unique_ptr<QImage> stick;

    QPixmap image_scaled;
    QPixmap zl_scaled;
    QPixmap zr_scaled;
    QPixmap stick_pixmap;
    QBitmap zl_mask;
    QBitmap zr_mask;
    double scaleFactor;

    std::shared_ptr<ControllerInput> controller;
    QByteArray lastState;
};

#endif // CONTROLLEROPENGLWIDGET_H
