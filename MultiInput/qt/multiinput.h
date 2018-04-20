#ifndef MULTIINPUT_H
#define MULTIINPUT_H

#include <QWidget>
#include <QtGui>
#include <QLabel>
#include <QTextEdit>
#include <QComboBox>
#include <QPushButton>
#include <QGridLayout>
#include <QGroupBox>
#include <QSerialPort>
#include <QSerialPortInfo>
#include <QThread>
#include "controllerinput.h"
#include "serialportwriter.h"
#include "controllerwindow.h"

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
    void onGamepadDisconnected(int deviceId);
    void onGamepadConnected(int deviceId);

    void onControllerError(const QString &message);
    void onControllerReady();

private:
    void enumerateSerialPorts();
    void enumerateInputDevices();

    void setupUi();
    void createInputGroupBox();
    void createSerialPortGroupBox();

    QComboBox *inputSelect;
    QPushButton *refreshInputsButton;
    QGroupBox *inputGroupBox;

    QLabel *serialPortDescription;
    QComboBox *serialPortSelect;
    QPushButton *refreshSerialPortsButton;
    QGroupBox *serialPortGroupBox;

    QTextEdit *eventLog;
    QPushButton *startButton;

    QList<QSerialPortInfo> availableSerialPorts;
    QString currentPort;

    ControllerWindow *controllerWindow = nullptr;
    QThread controllerThread;
};

#endif // MULTIINPUT_H
