import {BaseController} from "./BaseController";
import * as Utils from "./Utils";
import {BusEvents, InputState, StatusBus, StoreMutations} from "./Common";
import {SocketBus, SocketEvents} from "./ControlWebSocket";

const Controller = Object.freeze({
    LEFT: 1,
    RIGHT: 2
});

const JoyConMappings = {
    data: function() {
        return {
            canonicalName: 'Switch Joy-Cons',
            buttonMapping: {
                faceDown: {
                    controller: Controller.RIGHT,
                    index: 2
                },
                faceRight: {
                    controller: Controller.RIGHT,
                    index: 0
                },
                faceLeft: {
                    controller: Controller.RIGHT,
                    index: 3
                },
                faceUp: {
                    controller: Controller.RIGHT,
                    index: 1
                },
                leftTop: {
                    controller: Controller.LEFT,
                    index: 14
                },
                rightTop: {
                    controller: Controller.RIGHT,
                    index: 14
                },
                leftTrigger: {
                    controller: Controller.LEFT,
                    index: 15
                },
                rightTrigger: {
                    controller: Controller.RIGHT,
                    index: 15
                },
                select: {
                    controller: Controller.LEFT,
                    index: 8
                },
                start: {
                    controller: Controller.RIGHT,
                    index: 9
                },
                leftStick: {
                    controller: Controller.LEFT,
                    index: 10
                },
                rightStick: {
                    controller: Controller.RIGHT,
                    index: 11
                },
                dpadUp: {
                    controller: Controller.LEFT,
                    index: 2
                },
                dpadDown: {
                    controller: Controller.LEFT,
                    index: 1
                },
                dpadLeft: {
                    controller: Controller.LEFT,
                    index: 0
                },
                dpadRight: {
                    controller: Controller.LEFT,
                    index: 3
                },
            },
            stickMapping: {
                leftStick: {
                    controller: Controller.LEFT,
                    axis: 9
                },
                rightStick: {
                    controller: Controller.RIGHT,
                    axis: 9
                },
            }
        };
    }
};

export const JoyConInputSource = {
    mixins: [BaseController, JoyConMappings],
    data: function() {
        return {
            leftJoycon: {
                buttons: [],
                axes: []
            },
            rightJoycon: {
                buttons: [],
                axes: []
            }
        }
    },
    methods: {
        getController: function(controller) {
            let gamepads = this.getGamepads();
            let pid;
            if (controller === Controller.LEFT) {
                pid = '2006';
            } else {
                pid = '2007';
            }
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i] && Utils.checkVidPid(gamepads[i].id, '57e', pid)) {
                    return gamepads[i];
                }
            }
            return null;
        },
        getGamepads: function() {
            let gamepads;
            if (navigator.getGamepads) {
                gamepads = navigator.getGamepads();
            } else if (navigator.webkitGetGamepads) {
                gamepads = navigator.webkitGetGamepads();
            }
            return gamepads;
        },
        updateGamepad: function() {
            let left = this.getController(Controller.LEFT);
            let right = this.getController(Controller.RIGHT);
            if (!left || !right) {
                throw 'Could not access one of the Joycons';
            }

            let newLeftJoycon = {
                buttons: [],
                axes: []
            };
            let newRightJoycon = {
                buttons: [],
                axes: []
            };

            for (let i = 0; i < left.buttons.length; i++) {
                newLeftJoycon.buttons.push(left.buttons[i].value);
            }
            for (let i = 0; i < right.buttons.length; i++) {
                newRightJoycon.buttons.push(right.buttons[i].value);
            }
            for (let i = 0; i < left.axes.length; i++) {
                newLeftJoycon.axes.push(left.axes[i]);
            }
            for (let i = 0; i < right.axes.length; i++) {
                newRightJoycon.axes.push(right.axes[i]);
            }
            this.leftJoycon = newLeftJoycon;
            this.rightJoycon = newRightJoycon;
        },
        isButtonPressed: function(name) {
            let mapping = this.buttonMapping[name];
            if (!mapping) return false;

            if (mapping.controller === Controller.LEFT) {
                return !!this.leftJoycon.buttons[mapping.index];
            } else {
                return !!this.rightJoycon.buttons[mapping.index];
            }
        },
        getStickX: function(name) {
            if (name === 'leftStick') {
                let hat = this.leftJoycon.axes[this.stickMapping[name].axis] * 7;
                if (hat > 7 || this.approxEqual(hat, 5) || this.approxEqual(hat, -3)) {
                    return 0;
                }
                else if (this.approxEqual(hat, 7) || this.approxEqual(hat, -7) || this.approxEqual(hat, -5)) {
                    return 1;
                } else {
                    return -1;
                }
            } else {
                let hat = this.rightJoycon.axes[this.stickMapping[name].axis] * 7;
                if (hat > 7 || this.approxEqual(hat, 5) || this.approxEqual(hat, -3)) {
                    return 0;
                }
                else if (this.approxEqual(hat, 1) || this.approxEqual(hat, -1) || this.approxEqual(hat, 3)) {
                    return 1;
                } else {
                    return -1;
                }
            }
        },
        getStickY: function(name) {
            if (name === 'leftStick') {
                let hat = this.leftJoycon.axes[this.stickMapping[name].axis] * 7;
                if (hat > 7 || this.approxEqual(hat, 1) || this.approxEqual(hat, -7)) {
                    return 0;
                }
                else if (this.approxEqual(hat, -1) || this.approxEqual(hat, -3) || this.approxEqual(hat, -5)) {
                    return 1;
                } else {
                    return -1;
                }
            } else {
                let hat = this.rightJoycon.axes[this.stickMapping[name].axis] * 7;
                if (hat > 7 || this.approxEqual(hat, 1) || this.approxEqual(hat, -7)) {
                    return 0;
                }
                else if (this.approxEqual(hat, 7) || this.approxEqual(hat, 5) || this.approxEqual(hat, 3)) {
                    return 1;
                } else {
                    return -1;
                }
            }
        },
        approxEqual: function(a, b) {
            return Math.abs(a - b) < 0.01;
        }
    },
    mounted: function() {
        StatusBus.$on(BusEvents.BEFORE_UPDATE_INPUT, this.updateGamepad);
        if (this.getController(Controller.LEFT) && this.getController(Controller.RIGHT)) {
            this.$store.commit(StoreMutations.INPUT_STATE, InputState.READY);
        }
    },
    template: '<div><span class="center-text">Using JoyCons</span></div>'
};