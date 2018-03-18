#ifndef CONTROLLERUI_H
#define CONTROLLERUI_H

#include <QWidget>
#include <QImage>
#include <QRect>

namespace Ui {
class ControllerUI;
}

class ControllerUI : public QWidget
{
    Q_OBJECT

public:
    explicit ControllerUI(QWidget *parent = 0);
    ~ControllerUI();
    virtual QSize minimumSizeHint() const;
    virtual QSize sizeHint() const;

protected:
    void paintEvent(QPaintEvent *event);

private:
    QRect dpadLeft;
    //QRect dpadRight;
    /*
    QRect dpadUp;
    QRect dpadDown;
    */
    QImage *image;
};

#endif // CONTROLLERUI_H
