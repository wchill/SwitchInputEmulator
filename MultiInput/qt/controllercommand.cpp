#include "controllercommand.h"

ControllerCommand::ControllerCommand(QString name, ControllerState state) : AbstractControllerCommand(name)
{
    states.append(state);
    remaining = -1;
}

ControllerCommand::ControllerCommand(QString name, QList<ControllerState> states) : AbstractControllerCommand(name), states(states)
{
    remaining = -1;
}

ControllerState ControllerCommand::getNextState() {
    while (states.first().waitPackets == 0) states.removeFirst();
    ControllerState state = states.first();
    states.removeFirst();
    remaining -= state.waitPackets;
    return state;
}

int ControllerCommand::getRemainingPackets() {
    if (remaining >= 0) return remaining;
    remaining = 0;
    for (auto it = states.begin(); it != states.end(); ++it) {
        remaining += it->waitPackets;
    }
    return remaining;
}

bool ControllerCommand::hasPackets() {
    if (remaining >= 0) return remaining;
    for (auto it = states.begin(); it != states.end(); ++it) {
        if (it->waitPackets > 0) return true;
    }
    return false;
}

std::unique_ptr<AbstractControllerCommand> ControllerCommand::clone() {
    return std::unique_ptr<AbstractControllerCommand>(new ControllerCommand(getName(), states));
}
