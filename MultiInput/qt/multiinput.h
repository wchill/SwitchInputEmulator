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
#include "serialportwriter.h"
#include "controllerwindow.h"
#include "controller.h"

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

    void onSerialPortError(const QString &message);
    void onSerialPortSync();

private:
    void enumerateSerialPorts();

    void setupUi();
    void createInputGroupBox();
    void createSerialPortGroupBox();

    QLabel *inputDescription;
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
    std::shared_ptr<QGamepad> gamepad;
    int gamepadId;
    QString gamepadName;
    std::shared_ptr<SerialPortWriter> writer;
    QThread controllerThread;
};

#endif // MULTIINPUT_H
