#ifndef COMPOSITECONTROLLERCOMMAND_H
#define COMPOSITECONTROLLERCOMMAND_H

#include <memory>
#include <list>
#include "abstractcontrollercommand.h"

class CompositeControllerCommand : public AbstractControllerCommand
{
public:
    CompositeControllerCommand(QString name);
    virtual ControllerState getNextState();
    virtual int getRemainingPackets();
    virtual bool hasPackets();
    virtual std::unique_ptr<AbstractControllerCommand> clone();

    void addCommand(std::unique_ptr<AbstractControllerCommand> command);
private:
    std::list<std::unique_ptr<AbstractControllerCommand>> subcommands;
};

#endif // COMPOSITECONTROLLERCOMMAND_H
