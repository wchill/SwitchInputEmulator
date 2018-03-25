#include "twitchircbotwindow.h"
#include "ui_twitchircbotwindow.h"

#include <QTime>

TwitchIrcBotWindow::TwitchIrcBotWindow(std::shared_ptr<Controller> controller, QWidget *parent) :
    QDialog(parent),
    ui(new Ui::TwitchIrcBotWindow),
    controller(controller),
    chatFont("Courier New", 10, QFont::Bold),
    statusFont("Courier New", 10, QFont::Bold)
{
    ui->setupUi(this);

    QPalette p = ui->chatLog->palette();
    p.setColor(QPalette::Base, Qt::black);
    p.setColor(QPalette::Text, Qt::white);
    ui->chatLog->setPalette(p);

    bot = new TwitchIrcBot("twitchplaysswitchgames", "oauth:fwqinndr4ix4gvl8l42uzcxocvlq00", controller);
    bot->moveToThread(&thread);
    connect(bot, SIGNAL(logStatus(QString)), this, SLOT(onStatus(QString)));
    connect(bot, SIGNAL(logMessage(QString)), this, SLOT(onMessage(QString)));
    connect(bot, SIGNAL(connecting()), this, SLOT(onConnecting()));
    connect(bot, SIGNAL(loggedIn(QString)), this, SLOT(onLogin(QString)));
    //connect(bot, SIGNAL(newPrivmsg(IrcResponse)), this, SLOT(onPrivmsg(IrcResponse)));
    //connect(bot, SIGNAL(newWhisper(IrcResponse)), this, SLOT(onWhisper(IrcResponse)));
    connect(bot, SIGNAL(playerCommandIssued(QString)), this, SLOT(onMessage(QString)));
    connect(this, SIGNAL(connectToServer()), bot, SLOT(connectToServer()));
    connect(this, SIGNAL(joinChannels(QStringList)), bot, SLOT(joinChannels(QStringList)));
    thread.start();
    emit connectToServer();
}

TwitchIrcBotWindow::~TwitchIrcBotWindow()
{
    thread.quit();
    thread.wait();
    delete bot;
    delete ui;
}

void TwitchIrcBotWindow::onStatus(const QString &str) {
    ui->chatLog->setTextBackgroundColor(Qt::green);
    ui->chatLog->setTextColor(Qt::black);
    ui->chatLog->setCurrentFont(statusFont);
    ui->chatLog->append(str);
}

void TwitchIrcBotWindow::onMessage(const QString &str) {
    ui->chatLog->setTextBackgroundColor(Qt::black);
    ui->chatLog->setTextColor(Qt::white);
    ui->chatLog->setCurrentFont(chatFont);
    ui->chatLog->append(str);
}

void TwitchIrcBotWindow::onLogin(const QString &username) {
    onStatus(QString("Logged in as %1").arg(username));
    QStringList channels;
    channels.push_back(QString("#wchill"));
    channels.push_back(QString("#twitchplaysswitchgames"));
    emit joinChannels(channels);
}

void TwitchIrcBotWindow::onConnecting() {
    onStatus(QString("Connecting to Twitch IRC"));
}

void TwitchIrcBotWindow::onPrivmsg(const IrcResponse &response) {
    onMessage(QString("[%1] [%2] %3: %4")
                    .arg(QTime::currentTime().toString())
                    .arg(response.params().first())
                    .arg(response.senderNick())
                    .arg(response.params().last()));
}

void TwitchIrcBotWindow::onWhisper(const IrcResponse &response) {
    onMessage(QString("[%1] (whisper) %2: %3")
                    .arg(QTime::currentTime().toString())
                    .arg(response.senderNick())
                    .arg(response.params().last()));
}
