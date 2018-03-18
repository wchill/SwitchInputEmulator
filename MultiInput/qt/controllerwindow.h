#ifndef CONTROLLERWINDOW_H
#define CONTROLLERWINDOW_H

#include <QDialog>
#include "controllerui.h"

namespace Ui {
class ControllerWindow;
}

class ControllerWindow : public QDialog
{
    Q_OBJECT

public:
    explicit ControllerWindow(QWidget *parent = 0);
    ~ControllerWindow();

private:
    Ui::ControllerWindow *ui;
    ControllerUI *controllerUi;
};

#endif // CONTROLLERWINDOW_H
