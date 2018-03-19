#ifndef MULTIINPUT_H
#define MULTIINPUT_H

#include <QWidget>
#include <QtGui>
#include <QKeyEvent>
#include <QSerialPort>
#include <QSerialPortInfo>
#include <unordered_map>
#include "serialportwriter.h"
#include "controllerwindow.h"
#include "ilogger.h"

using std::unordered_map;

namespace Ui {
class MultiInput;
}

class MultiInput : public QWidget, public ILogger
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
    QSerialPortInfo currentPort;

    ControllerWindow *controllerWindow = nullptr;
};

#endif // MULTIINPUT_H
