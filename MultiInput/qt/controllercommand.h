#ifndef CONTROLLERCOMMAND_H
#define CONTROLLERCOMMAND_H

#include "abstractcontrollercommand.h"

class ControllerCommand : public AbstractControllerCommand
{
public:
    ControllerCommand(QString name, ControllerState state);
    ControllerCommand(QString name, QList<ControllerState> states);
    virtual ControllerState getNextState();
    virtual int getRemainingPackets();
    virtual bool hasPackets();
    virtual std::unique_ptr<AbstractControllerCommand> clone();
private:
    QList<ControllerState> states;
    int remaining;
    int index;
};

#endif // CONTROLLERCOMMAND_H
