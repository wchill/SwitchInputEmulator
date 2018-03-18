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

using std::unordered_map;

namespace Ui {
class MultiInput;
}

class MultiInput : public QWidget
{
    Q_OBJECT

public:
    explicit MultiInput(QWidget *parent = 0);
    ~MultiInput();

protected:
    void keyPressEvent(QKeyEvent *event);
    void keyReleaseEvent(QKeyEvent *event);

private slots:
    void serialPortIndexChanged(int index);

    void on_startButton_clicked();

private:
    void updatePressedKeys(QKeyEvent *event);
    void enumerateSerialPorts();

    Ui::MultiInput *ui;
    unordered_map<int, bool> keys;
    unordered_map<qint64, int> keyRemap;

    QList<QSerialPortInfo> availableSerialPorts;
    SerialPortWriter serialPort;

    ControllerWindow *controllerWindow;
};

#endif // MULTIINPUT_H
