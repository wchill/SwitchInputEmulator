#ifndef IRCRESPONSE_H
#define IRCRESPONSE_H

#include <QString>
#include <QStringList>
#include <QMetaType>
#include <map>
#include <iostream>

using std::ostream;

using std::map;

class IrcResponse
{
public:
    IrcResponse() {}
    IrcResponse(const QString &line);
    std::map<QString, QString> tags() {
        return m_tags;
    }
    QString command() const {
        return m_command;
    }
    QString sender() const {
        return m_sender;
    }
    QString senderNick() const {
        return m_senderNick;
    }
    QStringList params() const {
        return m_params;
    }
    QString host() const {
        return m_host;
    }
    friend ostream& operator<<(ostream& os, const IrcResponse& resp);

private:
    std::map<QString, QString> m_tags;
    QString m_prefix;
    QString m_command;
    QString m_sender;
    QString m_senderNick;
    QString m_host;
    QStringList m_params;
    QString m_line;
};

Q_DECLARE_METATYPE(IrcResponse)

#endif // IRCRESPONSE_H
