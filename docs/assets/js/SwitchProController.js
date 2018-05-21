import {BaseController, StandardMappings} from "./BaseController.js";

const SwitchProControllerBase = {
    mixins: [BaseController],
    data: function() {
        return {
            canonicalName: 'Switch Pro Controller'
        };
    }
};

export const SwitchProControllerStandard = {
    mixins: [SwitchProControllerBase, StandardMappings]
};

export const SwitchProControllerEdge = {
    mixins: [SwitchProControllerBase],
    data: function() {
        return {
            buttonMapping: {
                faceDown: 1,
                faceRight: 0,
                faceLeft: 3,
                faceUp: 2,
                leftTop: 4,
                rightTop: 5,
                leftTrigger: 6,
                rightTrigger: 7,
                // Share/Home, no way to read Minus/Plus directly
                select: 8,
                start: 9,
                leftStick: 10,
                rightStick: 11,
                dpadUp: 12,
                dpadDown: 13,
                dpadLeft: 14,
                dpadRight: 15
            },
            stickMapping: {
                leftStick: {axisX: 0, axisY: 1},
                rightStick: {axisX: 2, axisY: 3}
            }
        };
    }
};

export const SwitchProControllerMacFirefox = {
    mixins: [SwitchProControllerBase, StandardMappings]
};

export const SwitchProControllerWinFirefox = {
    mixins: [SwitchProControllerBase, StandardMappings],
    data: function() {
        return {
            notifyMessage: 'The D-Pad does not work properly in Firefox on Windows. Share has been mapped to D-Pad Down and Home has been mapped to D-Pad Up. If this doesn\'t work for you, read the help documentation.'
        }
    }
};