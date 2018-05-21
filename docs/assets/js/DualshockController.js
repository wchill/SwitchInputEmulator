import {BaseController, StandardMappings} from "./BaseController";
import {SwitchButtons} from "./Common";

const dualShockControllerBase = {
    mixins: [BaseController],
    data: function() {
        return {
            canonicalName: 'DualShock Controller'
        };
    }
};

export const dualShockControllerStandard = {
    mixins: [dualShockControllerBase, StandardMappings]
};

export const dualShockControllerWinFirefox = {
    mixins: [dualShockControllerBase],
    data: function() {
        return {
            buttonMapping: {
                faceLeft: 0,
                faceDown: 1,
                faceRight: 2,
                faceUp: 3,
                leftTop: 4,
                rightTop: 5,
                leftTrigger: 6,
                rightTrigger: 7,
                select: 8,
                start: 9,
                leftStick: 10,
                rightStick: 11,
                // Remap the guide button to index 12
                // The other buttons don't seem to work, so leave them blank.
                dpadUp: 13,
                dpadDown: 12,
                dpadLeft: null,
                dpadRight: null
            },
            stickMapping: {
                leftStick: {axisX: 0, axisY: 1},
                rightStick: {axisX: 2, axisY: 5}
            },
            notifyMessage: 'The D-Pad does not work properly in Firefox on Windows. The touchpad has been mapped to D-Pad Up. If this doesn\'t work for you, try using Chrome.'
        };
    }
};

export const dualShockControllerMacFirefox = {
    mixins: [dualShockControllerBase],
    data: function() {
        return {
            buttonMapping: {
                faceLeft: 0,
                faceDown: 1,
                faceRight: 2,
                faceUp: 3,
                leftTop: 4,
                rightTop: 5,
                leftTrigger: 6,
                rightTrigger: 7,
                select: 8,
                start: 9,
                leftStick: 10,
                rightStick: 11,
                dpadUp: 14,
                dpadDown: 15,
                dpadLeft: 16,
                dpadRight: 17
            },
            stickMapping: {
                leftStick: {axisX: 0, axisY: 1},
                rightStick: {axisX: 2, axisY: 5}
            }
        };
    }
};