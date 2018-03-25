#include "ircresponse.h"

#include <QStringList>
#include <QRegularExpression>

IrcResponse::IrcResponse(const QString &line) : m_line(line)
{
    // http://danieloaks.net/irc-regex/
    QRegularExpression ircRegex("^(?:@([^\r\n ]*) +|())(?::([^\r\n ]+) +|())([^\r\n ]+)(?: +([^:\r\n ]+[^\r\n ]*(?: +[^:\r\n ]+[^\r\n ]*)*)|())?(?: +:([^\r\n]*)| +())?[\r\n]*$");
    QRegularExpressionMatch match = ircRegex.match(line);

    if (!match.captured(1).isNull()) {
        QStringList tagList = match.captured(1).split(";");
        for (auto it = tagList.begin(); it != tagList.end(); it++) {
            if (it->contains("=")) {
                QStringList tagSplit = it->split("=");
                QString temp = tagSplit.at(1);
                m_tags[tagSplit.at(0)] = temp.replace("\\s", " ").replace("\\:", ";");
            } else {
                m_tags[*it] = QString("");
            }
        }
    }
    m_sender = match.captured(3);
    m_senderNick = m_sender.split("!")[0];
    m_command = match.captured(5);
    if (!match.captured(6).isNull()) {
        QStringList paramList = match.captured(6).split(" ");
        for (auto it = paramList.begin(); it != paramList.end(); it++) {
            m_params.push_back(*it);
        }
    }
    if (!match.captured(8).isNull()) {
        m_params.push_back(match.captured(8));
    }
}

std::ostream& operator<<(std::ostream& os, const IrcResponse& resp) {
    os << resp.command().toStdString() << " " << resp.m_line.toStdString();
    return os;
}
