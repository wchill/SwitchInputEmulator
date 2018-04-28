#ifndef CONTROLLERSTATE_H
#define CONTROLLERSTATE_H

#include <QObject>
#include "controllerconstants.h"
#include "optional.h"

class ControllerState
{
public:
    void mergeWith(ControllerState other) {
        if (other.lx) lx = other.lx;
        if (other.ly) ly = other.ly;
        if (other.rx) rx = other.rx;
        if (other.ry) ry = other.ry;

        if (!buttonsPressed) buttonsPressed = other.buttonsPressed;
        else if (buttonsPressed && other.buttonsPressed) buttonsPressed = buttonsPressed.value() | other.buttonsPressed.value();

        if (!buttonsReleased) buttonsReleased = other.buttonsReleased;
        else if (buttonsReleased && other.buttonsReleased) buttonsReleased = buttonsReleased.value() | other.buttonsReleased.value();

        if (other.dpad) dpad = other.dpad;

        if (other.originalCommand != "") originalCommand = QObject::tr("%1 & %2").arg(originalCommand).arg(other.originalCommand);
    }

    QList<ControllerState> split(int numPackets) {
        QList<ControllerState> result;
        if (numPackets >= waitPackets) {
            result.push_back(*this);
            return result;
        }

        ControllerState p1;
        ControllerState p2;
        p1.lx = p2.lx = lx;
        p1.ly = p2.ly = ly;
        p1.rx = p2.rx = rx;
        p1.ry = p2.ry = ry;
        p1.buttonsPressed = p2.buttonsPressed = buttonsPressed;
        p1.buttonsReleased = p2.buttonsReleased = buttonsReleased;
        p1.dpad = p2.dpad = dpad;
        p1.waitPackets = numPackets;
        p2.waitPackets = waitPackets - numPackets;

        result.push_back(p1);
        result.push_back(p2);

        return result;
    }

    ControllerState() {}
    stx::optional<quint8> lx;
    stx::optional<quint8> ly;
    stx::optional<quint8> rx;
    stx::optional<quint8> ry;
    stx::optional<Button_t> buttonsPressed;
    stx::optional<Button_t> buttonsReleased;
    stx::optional<Dpad_t> dpad;
    int waitPackets;
    QString originalCommand;
};

#endif // CONTROLLERSTATE_H
