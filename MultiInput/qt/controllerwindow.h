#ifndef CONTROLLERWINDOW_H
#define CONTROLLERWINDOW_H

#include <QDialog>
#include <QCloseEvent>
#include "controllerinput.h"
#include "controllerconstants.h"

class ControllerWindow : public QDialog
{
    Q_OBJECT

public:
    explicit ControllerWindow(std::shared_ptr<ControllerInput> controller, QWidget *parent = nullptr);

signals:
    void controllerWindowClosing();
    void error(const QString &error);
    void warning(const QString &warning);
    void message(const QString &message);

protected:
    void closeEvent(QCloseEvent *event);
};

#endif // CONTROLLERWINDOW_H
