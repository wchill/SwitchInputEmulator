#ifndef MULTIINPUT_H
#define MULTIINPUT_H

#include <QWidget>
#include <QtGui>
#include <QSerialPort>
#include <QSerialPortInfo>
#include <QThread>
#include "serialportwriter.h"
#include "controllerwindow.h"
#include "controller.h"

namespace Ui {
class MultiInput;
}

class MultiInput : public QWidget
{
    Q_OBJECT
public:
    explicit MultiInput(QWidget *parent = nullptr);
    ~MultiInput();

public slots:
    void logMessage(const QString &message);
    void logWarning(const QString &message);
    void logError(const QString &message);

private slots:
    void serialPortIndexChanged(int index);
    void onStartButtonClicked();
    void onControllerWindowClosed();

private:
    void enumerateSerialPorts();

    Ui::MultiInput *ui;

    QList<QSerialPortInfo> availableSerialPorts;
    QString currentPort;

    ControllerWindow *controllerWindow = nullptr;
    std::shared_ptr<Controller> controller;
    QThread controllerThread;
};

#endif // MULTIINPUT_H
