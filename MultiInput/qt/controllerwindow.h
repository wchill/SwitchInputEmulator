#ifndef CONTROLLERWINDOW_H
#define CONTROLLERWINDOW_H

#include <QDialog>
#include <QImage>
#include <QPixmap>
#include <QBitmap>
#include <QRect>
#include <QtGamepad/QGamepad>
#include <QTimer>
#include "controllerinput.h"
#include "controllerconstants.h"

using std::vector;

namespace Ui {
class ControllerWindow;
}

class ControllerWindow : public QDialog
{
    Q_OBJECT

public:
    explicit ControllerWindow(std::shared_ptr<ControllerInput> controller, QWidget *parent = nullptr);
    ~ControllerWindow();
    virtual QSize minimumSizeHint() const;
    virtual QSize maximumSizeHint() const;
    virtual QSize sizeHint() const;

signals:
    void controllerWindowClosing();
    void error(const QString &error);
    void warning(const QString &warning);
    void message(const QString &message);

protected:
    virtual void paintEvent(QPaintEvent *event);
    virtual void closeEvent(QCloseEvent *event);

private slots:
    void invalidateUi();

private:
    void drawFilledRect(QPainter &painter, const QRectF &rect);
    void drawFilledEllipse(QPainter &painter, const QPointF &center, const qreal rx, const qreal ry);
    void drawFilledPath(QPainter &painter, const std::vector<QPointF> &points);

    void renderDpad(QPainter &painter, const Dpad_t dpad);
    void renderButtons(QPainter &painter, const Button_t buttons);
    void renderLeftStick(QPainter &painter, const quint8 lx, const quint8 ly);
    void renderRightStick(QPainter &painter, const quint8 rx, const quint8 ry);

    Ui::ControllerWindow *ui;
    std::unique_ptr<QImage> image;
    std::unique_ptr<QImage> zl;
    std::unique_ptr<QImage> zr;

    QPixmap image_scaled;
    QPixmap zl_scaled;
    QPixmap zr_scaled;
    QBitmap zl_mask;
    QBitmap zr_mask;
    double scaleFactor;

    std::shared_ptr<ControllerInput> controller;
    QByteArray lastState;

    QTimer redrawTimer;
};

#endif // CONTROLLERWINDOW_H
