#ifndef TWITCHIRCBOT_H
#define TWITCHIRCBOT_H

#include <QObject>
#include <QStringList>
#include <QTcpSocket>
#include "ircresponse.h"

class TwitchIrcBot : public QObject
{
    Q_OBJECT
public:
    explicit TwitchIrcBot(const QString &username, const QString &password, QObject *parent = nullptr);

signals:
    void logStatus(const QString &str);
    void logMessage(const QString &str);
    void newPrivmsg(const IrcResponse &resp);
    void newWhisper(const IrcResponse &resp);
    void connecting();
    void loggedIn(const QString &username);

public slots:
    void connectToServer();
    void joinChannels(const QStringList &channels);

private slots:
    void readData();

private:
    void send(const QString &str);
    QTcpSocket *connection;
    QString username;
    QString password;
};

#endif // TWITCHIRCBOT_H
