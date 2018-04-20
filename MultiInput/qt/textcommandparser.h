#ifndef TEXTCOMMANDPARSER_H
#define TEXTCOMMANDPARSER_H

#include <QMap>
#include <QList>
#include <QString>
#include "optional.h"
#include "controllerstate.h"
#include "controllerconstants.h"

class TextCommandParser
{
public:
    TextCommandParser() {}
    TextCommandParser(QString mapping);
    void readCommandMapping(QString mapping);
    QList<ControllerState> parseLine(QString line);
    ControllerState parseUpdateFrame(QString line);
private:
    QList<ControllerState> parseSimultaneousCommands(QString line);
    QList<ControllerState> parseIndividualCommand(QString line);

    QMap<QString, QList<ControllerState>> commandMapping;
};

#endif // TEXTCOMMANDPARSER_H
