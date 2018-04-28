#ifndef TEXTCOMMANDPARSER_H
#define TEXTCOMMANDPARSER_H

#include <QMap>
#include <QList>
#include <QString>
#include <memory>
#include "optional.h"
#include "controllerstate.h"
#include "controllerconstants.h"
#include "abstractcontrollercommand.h"
#include "compositecontrollercommand.h"
#include "controllercommand.h"

class TextCommandParser
{
public:
    TextCommandParser() {}
    TextCommandParser(QString mapping);
    void readCommandMapping(QString mapping);
    std::unique_ptr<AbstractControllerCommand> parseLine(QString line);
    ControllerState parseUpdateFrame(QString line);
private:
    std::unique_ptr<AbstractControllerCommand> parseSimultaneousCommands(QString line);
    QList<ControllerState> parseIndividualCommand(QString line);

    QMap<QString, QList<ControllerState>> commandMapping;
};

#endif // TEXTCOMMANDPARSER_H
