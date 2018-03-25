#ifndef TWITCHIRCBOT_H
#define TWITCHIRCBOT_H

#include <QHash>
#include <QSet>
#include <QObject>
#include <QStringList>
#include <QTcpSocket>
#include "controller.h"
#include "controllerconstants.h"
#include "ircresponse.h"

class TwitchIrcBot : public QObject
{
    Q_OBJECT
public:
    explicit TwitchIrcBot(const QString &username, const QString &password, std::shared_ptr<Controller> controller, QObject *parent = nullptr);

signals:
    void logStatus(const QString &str);
    void logMessage(const QString &str);
    void newPrivmsg(const IrcResponse &response);
    void newWhisper(const IrcResponse &response);
    void connecting();
    void loggedIn(const QString &username);

    void controllerWait(const unsigned long msecs = WAIT_TIME);
    void changeHat(const Dpad_t pressed);
    void holdButtons(const Button_t pressed);
    void releaseButtons(const Button_t released);
    void changeLeftStick(const double lx, const double ly);
    void changeRightStick(const double rx, const double ry);

    void playerCommandIssued(const QString &msg);

public slots:
    void connectToServer();
    void joinChannels(const QStringList &channels);

private slots:
    void readData();

private:
    void send(const QString &str);
    void handleControllerCommand(const IrcResponse &response);
    void handleHatCommand(const IrcResponse &response, const QStringList &params);
    void handleButtonCommand(const IrcResponse &response, const QStringList &params);
    void handleAnalogStickCommand(const IrcResponse &response, const QStringList &params);
    QTcpSocket *connection;
    QString username;
    QString password;

    std::shared_ptr<Controller> controller;
    QHash<QString, Dpad_t> hatCommands;
    QHash<QString, Button_t> buttonCommands;
    QSet<QString> analogStickCommands;
};

#endif // TWITCHIRCBOT_H
