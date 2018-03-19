#ifndef CONTROLLERWINDOW_H
#define CONTROLLERWINDOW_H

#include <QDialog>
#include <QImage>
#include <QRect>
#include <vector>
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
    virtual void keyPressEvent(QKeyEvent *event);
    virtual void keyReleaseEvent(QKeyEvent *event);

private:
    void drawFilledRect(QPainter &painter, const QRectF &rect);
    void drawFilledEllipse(QPainter &painter, const QPointF &center, const qreal rx, const qreal ry);
    void drawFilledPath(QPainter &painter, const std::vector<QPointF> &points);

    void renderDpad(QPainter &painter, const Dpad_t dpad);
    void renderButtons(QPainter &painter, const Button_t buttons);
    void renderLeftStick(QPainter &painter, const QVector2D &ls);
    void renderRightStick(QPainter &painter, const QVector2D &rs);

    Ui::ControllerWindow *ui;
    std::unique_ptr<QImage> image;
    std::unique_ptr<QImage> zl;
    std::unique_ptr<QImage> zr;
    std::unique_ptr<Controller> controller;
    ILogger *logger;

private slots:
    void invalidateUi();
};

#endif // CONTROLLERWINDOW_H
