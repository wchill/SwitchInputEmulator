#include <iterator>
#include "textcommandparser.h"

TextCommandParser::TextCommandParser(QString mapping)
{
    readCommandMapping(mapping);
}

void TextCommandParser::readCommandMapping(QString text) {
    commandMapping = QMap<QString, QList<ControllerState>>();

    QStringList lines = text.split("\n", QString::SkipEmptyParts);
    for(auto it = lines.begin(); it != lines.end(); ++it) {
        if (it->startsWith("#define ")) {
            QString input = it->section(' ', 1, 1);
            QString replacement = it->section(' ', 2);
            text = text.replace(input, replacement);
        }
    }

    QStringList mapping = text.split("\n", QString::SkipEmptyParts);

    bool readingSubcommands = false;
    int numRemaining = 0;
    QVector<QString> commandKeys;
    for(auto it = mapping.begin(); it != mapping.end(); ++it) {
        if (it->length() == 0) continue;
        if (it->startsWith("#")) continue;
        if (it->startsWith("//")) continue;

        QString line = it->simplified();

        QVector<QStringRef> parts = line.splitRef(":");

        if (!readingSubcommands) {
            readingSubcommands = true;
            commandKeys.clear();
            for(int i = 0; i < parts.length() - 1; i++) {
                QString commandKey = parts.at(i).toString().trimmed().toLower();
                commandKeys.push_back(commandKey);
                commandMapping.insert(commandKey, QList<ControllerState>());
            }
            numRemaining = parts.at(parts.length() - 1).toInt();
        } else {
            if (--numRemaining == 0) {
                readingSubcommands = false;
            }

            QStringList commandParts;
            for(int i = 0; i < 8; i++) {
                commandParts.append(parts[i].trimmed().toString());
            }

            ControllerState state;
            if (!commandParts.at(0).isEmpty()) state.lx = static_cast<quint8>(commandParts.at(0).toUInt());
            if (!commandParts.at(1).isEmpty()) state.ly = static_cast<quint8>(commandParts.at(1).toUInt());
            if (!commandParts.at(2).isEmpty()) state.rx = static_cast<quint8>(commandParts.at(2).toUInt());
            if (!commandParts.at(3).isEmpty()) state.ry = static_cast<quint8>(commandParts.at(3).toUInt());
            if (!commandParts.at(4).isEmpty()) state.buttonsPressed = static_cast<Button_t>(commandParts.at(4).toUInt());
            if (!commandParts.at(5).isEmpty()) state.buttonsReleased = static_cast<Button_t>(commandParts.at(5).toUInt());
            if (!commandParts.at(6).isEmpty()) state.dpad = static_cast<Dpad_t>(commandParts.at(6).toUInt());
            state.waitPackets = commandParts.at(7).toUInt();

            for(auto it = commandKeys.begin(); it != commandKeys.end(); ++it) {
                commandMapping[*it].append(state);
            }
        }
    }
}

ControllerState TextCommandParser::parseUpdateFrame(QString line) {
    ControllerState state;
    QStringList inputs = line.split(" ", QString::SkipEmptyParts);
    if (inputs.length() < 7) return ControllerState();
    unsigned int buttons = inputs[1].toUInt();
    unsigned int dpad = inputs[2].toUInt();
    unsigned int lx = inputs[3].toUInt();
    unsigned int ly = inputs[4].toUInt();
    unsigned int rx = inputs[5].toUInt();
    unsigned int ry = inputs[6].toUInt();

    if (buttons > BUTTON_ALL) return ControllerState();
    if (dpad > DPAD_NONE) return ControllerState();
    if (lx > STICK_MAX) return ControllerState();
    if (ly > STICK_MAX) return ControllerState();
    if (rx > STICK_MAX) return ControllerState();
    if (ry > STICK_MAX) return ControllerState();

    buttons &= ~(BUTTON_HOME | BUTTON_CAPTURE);

    state.buttonsPressed = static_cast<Button_t>(buttons);
    state.buttonsReleased = static_cast<Button_t>(~buttons);
    state.dpad = static_cast<Dpad_t>(dpad);
    state.lx = static_cast<quint8>(lx);
    state.ly = static_cast<quint8>(ly);
    state.rx = static_cast<quint8>(rx);
    state.ry = static_cast<quint8>(ry);
    state.waitPackets = 2;

    return state;
}

QList<ControllerState> TextCommandParser::parseSimultaneousCommands(QString line) {
    QVector<QStringRef> subcommands = line.splitRef("&", QString::SkipEmptyParts);
    QList<QList<ControllerState>> allPackets;

    for (auto it = subcommands.begin(); it != subcommands.end(); ++it) {
        QList<ControllerState> packets = parseIndividualCommand(it->toString());
        if (packets.length() > 0) allPackets << packets;
    }

    if (allPackets.length() == 0) return QList<ControllerState>();

    QList<ControllerState> firstPackets = allPackets.at(0);

    for (auto it = std::next(allPackets.begin()); it != allPackets.end(); ++it) {
        for (int i = 0; i < it->length(); i++) {
            ControllerState p = it->at(i);
            if (firstPackets.length() < i+1) {
                firstPackets.append(p);
            } else {
                //firstPackets[i].mergeWith(it->at(i));
                if (firstPackets[i].waitPackets == p.waitPackets) {
                    firstPackets[i].mergeWith(p);
                } else if (firstPackets[i].waitPackets > p.waitPackets) {
                    QList<ControllerState> splitPackets = firstPackets[i].split(p.waitPackets);
                    splitPackets[0].mergeWith(p);
                    firstPackets[i] = splitPackets[0];
                    firstPackets.insert(i+1, splitPackets[1]);
                } else {
                    QList<ControllerState> splitPackets = p.split(firstPackets[i].waitPackets);
                    splitPackets[0].mergeWith(firstPackets[i]);
                    firstPackets[i] = splitPackets[0];
                    it->insert(i+1, splitPackets[1]);
                }
            }
        }
    }

    return firstPackets;
}

QList<ControllerState> TextCommandParser::parseIndividualCommand(QString line) {
    line = line.simplified();
    if (commandMapping.contains(line)) {
        return commandMapping[line];
    }
    return QList<ControllerState>();
}

QList<ControllerState> TextCommandParser::parseLine(QString line) {
    QList<ControllerState> queuedStates;
    line = line.toLower().simplified().remove("command ");
    QVector<QStringRef> commands = line.splitRef(",", QString::SkipEmptyParts);

    if (commands.length() == 0)
        return QList<ControllerState>();

    queuedStates << parseSimultaneousCommands(commands.at(0).toString());

    if (queuedStates.length() == 0)
        return QList<ControllerState>();

    for (auto it = std::next(commands.begin()); it != commands.end(); ++it) {
        queuedStates << parseSimultaneousCommands(it->toString());
    }
    return queuedStates;
}
