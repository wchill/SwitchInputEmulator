import {BaseController, StandardMappings} from "./BaseController";

let powerAWiredControllerBase = {
    mixins: [BaseController],
    data: function() {
        return {
            canonicalName: 'PowerA Wired Controller'
        };
    }
};

export let PowerAWiredControllerStandard = {
    mixins: [powerAWiredControllerBase, StandardMappings]
};

export let PowerAWiredControllerMacFirefox = {
    mixins: [powerAWiredControllerBase],
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
            }
        };
    }
};

export let PowerAWiredControllerChromeOS = {
    mixins: [powerAWiredControllerBase],
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
                rightStick: 11
            },
            dpadMapping: {
                dpadUp: {axis: 5, sign: -1},
                dpadDown: {axis: 5, sign: 1},
                dpadLeft: {axis: 4, sign: -1},
                dpadRight: {axis: 4, sign: 1}
            }
        };
    },
    methods: {
        isButtonPressed: function(name) {
            if (this.dpadMapping.hasOwnProperty(name)) {
                let mapping = this.dpadMapping[name];
                return mapping && mapping.hasOwnProperty('axis') && mapping.hasOwnProperty('sign') && this.axes[mapping.axis] * mapping.sign > this.deadzone;
            } else {
                let index = this.buttonMapping[name];
                if (index === null || index === undefined || index < 0) return false;
                return this.buttons[index];
            }
        }
    }
};

export let PowerAWiredControllerChrome = {
    mixins: [powerAWiredControllerBase],
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
                rightStick: 11
            },
            dpadMapping: {
                dpadUp: {axis: 9, axisVals: [-7, -5, 7]},
                dpadDown: {axis: 9, axisVals: [-1, 1, 3]},
                dpadLeft: {axis: 9, axisVals: [3, 5, 7]},
                dpadRight: {axis: 9, axisVals: [-5, -3, -1]},
            },
            stickMapping: {
                leftStick: {axisX: 0, axisY: 1},
                rightStick: {axisX: 2, axisY: 5}
            }
        }
    },
    methods: {
        isButtonPressed: function(name) {
            if (this.dpadMapping.hasOwnProperty(name)) {
                let mapping = this.dpadMapping[name];
                if (!(mapping && mapping.hasOwnProperty('axis') && mapping.hasOwnProperty('axisVals'))) return false;
                let axisValNormalized = this.axes[mapping.axis] * 7;
                for (let i = 0; i < mapping.axisVals.length; i++) {
                    if (Math.abs(mapping.axisVals[i] - axisValNormalized) < 0.1) return true;
                }
                return false;
            } else {
                let index = this.buttonMapping[name];
                if (index === null || index === undefined || index < 0) return false;
                return this.buttons[index];
            }
        }
    }
};

export let PowerAWiredControllerWinFirefox = {
    mixins: [powerAWiredControllerBase],
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
                // DPad Up is mapped to share, DPad down is mapped to home
                dpadUp: 13,
                dpadDown: 12,
                dpadLeft: null,
                dpadRight: null
            },
            notifyMessage: 'The D-Pad does not work properly in Firefox on Windows. The Share button has been mapped to D-Pad Up. If this doesn\'t work for you, try using Chrome.'
        }
    }
};