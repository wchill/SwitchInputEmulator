#include "compositecontrollercommand.h"

CompositeControllerCommand::CompositeControllerCommand(QString name) : AbstractControllerCommand(name) {
}

ControllerState CompositeControllerCommand::getNextState() {
    while (!subcommands.front().get()->hasPackets()) subcommands.pop_front();
    return subcommands.front().get()->getNextState();
}

int CompositeControllerCommand::getRemainingPackets() {
    int total = 0;
    for (auto it = subcommands.begin(); it != subcommands.end(); ++it) {
        total += it->get()->getRemainingPackets();
    }
    return total;
}

bool CompositeControllerCommand::hasPackets() {
    for (auto it = subcommands.begin(); it != subcommands.end(); ++it) {
        if (it->get()->getRemainingPackets() > 0) return true;
    }
    return false;
}

void CompositeControllerCommand::addCommand(std::unique_ptr<AbstractControllerCommand> command) {
    subcommands.push_back(std::move(command));
}

std::unique_ptr<AbstractControllerCommand> CompositeControllerCommand::clone() {
    CompositeControllerCommand *result = new CompositeControllerCommand(getName());

    for (auto it = subcommands.begin(); it != subcommands.end(); ++it) {
        result->addCommand(it->get()->clone());
    }

    return std::unique_ptr<AbstractControllerCommand>(result);
}
