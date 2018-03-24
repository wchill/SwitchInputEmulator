#ifndef CONTROLLERWINDOW_H
#define CONTROLLERWINDOW_H

#include <QDialog>
#include <QImage>
#include <QRect>
#include <QtGamepad/QGamepad>
#include "controllerconstants.h"
#include "controller.h"
#include "ilogger.h"

using std::vector;

namespace Ui {
class ControllerWindow;
}

class ControllerWindow : public QDialog
{
    Q_OBJECT

public:
    explicit ControllerWindow(const QString &portName, QWidget *parent = nullptr, ILogger *parentLogger = nullptr);
    ~ControllerWindow();
    virtual QSize minimumSizeHint() const;
    virtual QSize sizeHint() const;

signals:
    void controllerWindowClosing();

protected:
    virtual void paintEvent(QPaintEvent *event);
    virtual void closeEvent(QCloseEvent *event);

private slots:
    void invalidateUi();

    void onLeftStickX(double value);
    void onLeftStickY(double value);
    void onRightStickX(double value);
    void onRightStickY(double value);
    void onButtonZLChange(double value);
    void onButtonZRChange(double value);
    void onButtonAChange(bool pressed);
    void onButtonBChange(bool pressed);
    void onButtonXChange(bool pressed);
    void onButtonYChange(bool pressed);
    void onHatChange(bool pressed);
    void onButtonLChange(bool pressed);
    void onButtonRChange(bool pressed);
    void onButtonL3Change(bool pressed);
    void onButtonR3Change(bool pressed);
    void onButtonMinusChange(bool pressed);
    void onButtonPlusChange(bool pressed);
    void onButtonHomeChange(bool pressed);
    void onButtonCaptureChange(bool pressed);

private:
    void drawFilledRect(QPainter &painter, const QRectF &rect);
    void drawFilledEllipse(QPainter &painter, const QPointF &center, const qreal rx, const qreal ry);
    void drawFilledPath(QPainter &painter, const std::vector<QPointF> &points);

    void renderDpad(QPainter &painter, const Dpad_t dpad);
    void renderButtons(QPainter &painter, const Button_t buttons);
    void renderLeftStick(QPainter &painter, const quint8 lx, const quint8 ly);
    void renderRightStick(QPainter &painter, const quint8 rx, const quint8 ry);

    quint8 quantizeDouble(double val);

    Ui::ControllerWindow *ui;
    std::unique_ptr<QImage> image;
    std::unique_ptr<QImage> zl;
    std::unique_ptr<QImage> zr;
    std::unique_ptr<Controller> controller;
    ILogger *logger;

    std::unique_ptr<QGamepad> gamepad;
};

#endif // CONTROLLERWINDOW_H
