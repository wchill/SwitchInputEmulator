#ifndef ABSTRACTCONTROLLERCOMMAND_H
#define ABSTRACTCONTROLLERCOMMAND_H

#include <QString>
#include <QList>
#include <memory>
#include "controllerstate.h"

class AbstractControllerCommand
{
public:
    AbstractControllerCommand() {}
    AbstractControllerCommand(QString name) : name(name) {}
    virtual QString getName() {return name;}
    virtual ControllerState getNextState() = 0;
    virtual int getRemainingPackets() = 0;
    virtual bool hasPackets() = 0;
    virtual std::unique_ptr<AbstractControllerCommand> clone() = 0;
private:
    QString name;
};

#endif // ABSTRACTCONTROLLERCOMMAND_H
