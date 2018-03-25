#ifndef TWITCHIRCBOTWINDOW_H
#define TWITCHIRCBOTWINDOW_H

#include <QDialog>
#include <QFont>
#include <QThread>
#include "ircresponse.h"
#include "twitchircbot.h"
#include "controller.h"

namespace Ui {
class TwitchIrcBotWindow;
}

class TwitchIrcBotWindow : public QDialog
{
    Q_OBJECT

public:
    explicit TwitchIrcBotWindow(QWidget *parent = 0);
    ~TwitchIrcBotWindow();

signals:
    void connectToServer();
    void joinChannels(const QStringList &channels);

public slots:
    void onStatus(const QString &str);
    void onMessage(const QString &str);
    void onLogin(const QString &username);
    void onConnecting();
    void onPrivmsg(const IrcResponse &response);
    void onWhisper(const IrcResponse &response);

private:
    Ui::TwitchIrcBotWindow *ui;

    QFont chatFont;
    QFont statusFont;

    TwitchIrcBot *bot;
    QThread thread;
    std::shared_ptr<Controller> controller;
};

#endif // TWITCHIRCBOTWINDOW_H
