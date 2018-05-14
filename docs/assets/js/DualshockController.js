import {baseController} from "./BaseController";
import {switchButtons} from "./VueConstants";

let dualShockControllerBase = {
    mixins: [baseController],
    data: function() {
        return {
            overrides: {
                // TODO: Provide a spritesheet for this.
                buttonMapping: {
                    faceDown: {val: switchButtons.B, index: 0},
                    faceRight: {val: switchButtons.A, index: 1},
                    faceLeft: {val: switchButtons.Y, index: 2},
                    faceUp: {val: switchButtons.X, index: 3},
                    leftTop: {val: switchButtons.L, index: 4},
                    rightTop: {val: switchButtons.R, index: 5},
                    leftTrigger: {val: switchButtons.ZL, index: 6, invisible: true},
                    rightTrigger: {val: switchButtons.ZR, index: 7, invisible: true},
                    select: {val: switchButtons.MINUS, index: 8},
                    start: {val: switchButtons.PLUS, index: 9},
                    leftStick: {val: switchButtons.L3, index: 10, invisible: true},
                    rightStick: {val: switchButtons.R3, index: 11, invisible: true}
                },
                dpadMapping: {
                    dpadUp: {index: 12},
                    dpadDown: {index: 13},
                    dpadLeft: {index: 14},
                    dpadRight: {index: 15}
                },
                stickMapping: {
                    leftStick: {axisX: 0, axisY: 1, index: 10},
                    rightStick: {axisX: 2, axisY: 3, index: 11}
                },
                canonicalName: 'DualShock Controller',
                experimental: true
            }
        };
    }
};

export let dualShockControllerStandard = {
    mixins: [dualShockControllerBase]
};

export let dualShockControllerWinFirefox = {
    mixins: [dualShockControllerBase],
    data: function() {
        return {
            overrides: {
                buttonMapping: {
                    faceLeft: {index: 0},
                    faceDown: {index: 1},
                    faceRight: {index: 2},
                    faceUp: {index: 3}
                },
                dpadMapping: {
                    // Remap the guide button to index 12
                    // The other buttons don't seem to work, so leave them blank.
                    dpadUp: {index: 13},
                    dpadDown: {index: 12},
                    dpadLeft: {},
                    dpadRight: {}
                },
                stickMapping: {
                    leftStick: {axisX: 0, axisY: 1, index: 10},
                    rightStick: {axisX: 2, axisY: 5, index: 11}
                },
                notifyMessage: 'The D-Pad does not work properly in Firefox on Windows. The touchpad has been mapped to D-Pad Up. If this doesn\'t work for you, try using Chrome.'
            }
        };
    }
};