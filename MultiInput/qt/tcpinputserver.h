#ifndef TCPINPUTSERVER_H
#define TCPINPUTSERVER_H

#include <QtNetwork>
#include <QMap>
#include <QFileSystemWatcher>
#include <QQueue>
#include <QSet>
#include "textcommandparser.h"
#include "controllerconstants.h"
#include "controllerinput.h"
#include "controllerstate.h"

class TcpInputServer : public ControllerInput
{
    Q_OBJECT
public:
    TcpInputServer::TcpInputServer(std::shared_ptr<SerialPortWriter> writer, QObject *parent = nullptr);
    TcpInputServer::~TcpInputServer();
    virtual void begin();
    virtual void getState(quint8 *outLx, quint8 *outLy, quint8 *outRx, quint8 *outRy, Dpad_t *outDpad, Button_t *outButtons, uint8_t *outVendorspec);
public slots:
    virtual void onPacketSent();
protected slots:
    virtual void onSerialReady();
private slots:
    void sessionOpened();
    void createConnection();
    void onMappingFileChange(QString path);
private:
    void cleanupConnection(QTcpSocket *client);
    void onIncomingData(QTcpSocket *client);

    ControllerState currentState;
    ControllerState currentCommand;
    QQueue<ControllerState> commandQueue;
    bool isSerialReady = false;

    QTcpServer *tcpServer = nullptr;
    QNetworkSession *networkSession = nullptr;
    QSet<QTcpSocket*> clients;

    QFileSystemWatcher commandMapWatcher;
    TextCommandParser commandParser;
};

#endif // TCPINPUTSERVER_H
