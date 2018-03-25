#include "twitchircbot.h"
#include "ircresponse.h"
#include <QTime>

TwitchIrcBot::TwitchIrcBot(QString const &username, QString const &password, QObject *parent) : QObject(parent), username(username), password(password)
{
    connection = new QTcpSocket(this);
    connect(connection, SIGNAL(readyRead()), this, SLOT(readData()));
}

void TwitchIrcBot::connectToServer() {
    emit connecting();
    connection->connectToHost(QString("irc.chat.twitch.tv"), 6667);
    send("PASS " + password);
    send("NICK " + username);
    send("CAP REQ :twitch.tv/membership");
    send("CAP REQ :twitch.tv/tags");
    send("CAP REQ :twitch.tv/commands");
}

void TwitchIrcBot::readData() {
    while (connection->canReadLine()) {
        QString line = connection->readLine().trimmed();
        IrcResponse response(line);
        std::cout << ">" << line.toStdString() << std::endl;

        if (response.command() == "376") {
            emit loggedIn(username);
        } else if (response.command() == "PING") {
            send("PONG :tmi.twitch.tv");
        } else if (response.command() == "PRIVMSG") {
            emit newPrivmsg(response);
        } else if (response.command() == "WHISPER") {
            emit newWhisper(response);
        }
    }
}

void TwitchIrcBot::send(const QString &str) {
    connection->write(str.toUtf8());
    connection->write("\r\n");
    std::cout << "<" << str.toStdString() << std::endl;
}

void TwitchIrcBot::joinChannels(const QStringList &channels) {
    for (auto it = channels.begin(); it != channels.end(); it++) {
        send("JOIN " + *it);
    }
}
