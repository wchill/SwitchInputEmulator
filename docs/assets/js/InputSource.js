import {BusEvents, StatusBus, StoreMutations, SwitchButtons} from "./Common";
import {SocketBus, SocketEvents} from "./ControlWebSocket";

export const InputSource = {
    data: function() {
        return {
            buttonValues: {
                faceDown: SwitchButtons.B,
                faceRight: SwitchButtons.A,
                faceLeft: SwitchButtons.Y,
                faceUp: SwitchButtons.X,
                leftTop: SwitchButtons.L,
                rightTop: SwitchButtons.R,
                leftTrigger: SwitchButtons.ZL,
                rightTrigger: SwitchButtons.ZR,
                select: SwitchButtons.MINUS,
                start: SwitchButtons.PLUS,
                leftStick: SwitchButtons.L3,
                rightStick: SwitchButtons.R3,
                home: 0,
                share: 0
            },
            dpadValues: [
                // x === 0
                [
                    SwitchButtons.DPAD_UPLEFT, SwitchButtons.DPAD_UP, SwitchButtons.DPAD_UPRIGHT
                ],
                // x === 1
                [
                    SwitchButtons.DPAD_LEFT, SwitchButtons.DPAD_NONE, SwitchButtons.DPAD_RIGHT
                ],
                // x === 2
                [
                    SwitchButtons.DPAD_DOWNLEFT, SwitchButtons.DPAD_DOWN, SwitchButtons.DPAD_DOWNRIGHT
                ]
            ],
            deadzone: 0.15,
            prevState: {
                buttons: {
                    faceDown: false,
                    faceRight: false,
                    faceLeft: false,
                    faceUp: false,
                    leftTop: false,
                    rightTop: false,
                    leftTrigger: false,
                    rightTrigger: false,
                    select: false,
                    start: false,
                    leftStick: false,
                    rightStick: false,
                    home: false,
                    share: false,
                    dpadUp: false,
                    dpadDown: false,
                    dpadLeft: false,
                    dpadRight: false
                },
                sticks: {
                    leftStick: {
                        x: 0.0,
                        y: 0.0,
                        pressed: false
                    },
                    rightStick: {
                        x: 0.0,
                        y: 0.0,
                        pressed: false
                    }
                },
                stateObj: {
                    buttons: 0,
                    dpad: 8,
                    lx: 0,
                    ly: 0,
                    rx: 0,
                    ry: 0
                }
            }
        };
    },
    mounted: function() {
        StatusBus.$on(BusEvents.UPDATE_INPUT, this.updateState);
    },
    computed: {
        ...Vuex.mapGetters([
            'canControl',
            'gamepadState'
        ])
    },
    methods: {
        compareState: function(newState) {
            let buttons = Object.keys(this.prevState.buttons);
            for (let i = 0; i < buttons.length; i++) {
                let button = buttons[i];
                if (newState.buttons[button] !== this.prevState.buttons[button]) {
                    return true;
                }
            }

            let sticks = Object.keys(this.prevState.sticks);
            for (let i = 0; i < sticks.length; i++) {
                let stick = sticks[i];
                if (newState.sticks[stick].x !== this.prevState.sticks[stick].x) {
                    return true;
                }
                if (newState.sticks[stick].y !== this.prevState.sticks[stick].y) {
                    return true;
                }
                if (newState.sticks[stick].pressed !== this.prevState.sticks[stick].pressed) {
                    return true;
                }
            }

            return false;
        },
        updateState: function() {
            let buttons = Object.keys(this.prevState.buttons);
            let sticks = Object.keys(this.prevState.sticks);

            this.prevState = this.gamepadState;
            let gamepadState = {
                buttons: {},
                sticks: {},
                stateObj: this.generateStateObj()
            };

            for (let i = 0; i < buttons.length; i++) {
                let button = buttons[i];
                gamepadState.buttons[button] = this.isButtonPressed(button);
            }

            for (let i = 0; i < sticks.length; i++) {
                let stick = sticks[i];
                gamepadState.sticks[stick] = {
                    x: this.getStickX(stick),
                    y: this.getStickY(stick),
                    pressed: this.isButtonPressed(stick)
                };
            }

            if (this.compareState(gamepadState)) {
                let stateStr = this.generateStateStr(this.prevState.stateObj, gamepadState.stateObj);
                if (stateStr.length > 0) {
                    this.$store.commit(StoreMutations.GAMEPAD_STATE, gamepadState);

                    if (this.canControl) {
                        SocketBus.$emit(SocketEvents.SEND_MESSAGE, `UPDATE ${stateStr}`);
                    }
                }
            }
        },
        isButtonPressed: function(name) {
            // Should be overridden
            console.warn(`Tried calling default isButtonPressed!`);
            return false;
        },
        getStickX: function(stick) {
            // Should be overridden
            console.warn(`Tried calling default getStickX!`);
            return 0.0;
        },
        getStickY: function(stick) {
            // Should be overridden
            console.warn(`Tried calling default getStickY!`);
            return 0.0;
        },
        generateStateStr: function(prevState, currState) {
            let pressed = currState.buttons & ~(prevState.buttons);
            let released = prevState.buttons & ~(currState.buttons);
            let dpadChanged = currState.dpad !== prevState.dpad;
            let lxChanged = currState.lx !== prevState.lx;
            let lyChanged = currState.ly !== prevState.ly;
            let rxChanged = currState.rx !== prevState.rx;
            let ryChanged = currState.ry !== prevState.ry;

            let stateStrs = [];
            if (pressed > 0) {
                stateStrs.push(`P=${pressed}`);
            }
            if (released > 0) {
                stateStrs.push(`R=${released}`);
            }
            if (dpadChanged) {
                stateStrs.push(`D=${currState.dpad}`);
            }
            if (lxChanged) {
                stateStrs.push(`LX=${currState.lx}`);
            }
            if (lyChanged) {
                stateStrs.push(`LY=${currState.ly}`);
            }
            if (rxChanged) {
                stateStrs.push(`RX=${currState.rx}`);
            }
            if (ryChanged) {
                stateStrs.push(`RY=${currState.ry}`);
            }
            return stateStrs.join(' ');
        },
        generateStateObj: function() {
            let button = this.calculateButton();
            let dpad = this.calculateDpad();
            let ls = this.calculateStick('leftStick');
            let rs = this.calculateStick('rightStick');
            return {
                buttons: button,
                dpad: dpad,
                lx: ls[0],
                ly: ls[1],
                rx: rs[0],
                ry: rs[1]
            };
        },
        calculateStick: function(stick) {
            // Applies dead zone calculations and then maps the range [-1.0, 1.0] to [0, 255]
            // Reference: http://www.third-helix.com/2013/04/12/doing-thumbstick-dead-zones-right.html

            let x = this.getStickX(stick);
            let y = this.getStickY(stick);

            let res = [128, 128];
            let mag = Math.sqrt((x * x) + (y * y));
            if (mag >= this.deadzone) {
                if (mag === 0) mag = 1;
                let normX = Math.abs(x / mag);
                let normY = Math.abs(y / mag);
                let outX = normX * ((x - this.deadzone) / (1 - this.deadzone));
                let outY = normY * ((y - this.deadzone) / (1 - this.deadzone));

                res[0] += outX * 128;
                if (res[0] < 0) res[0] = 0;
                else if (res[0] > 255) res[0] = 255;
                res[0] |= 0;

                res[1] += outY * 128;
                if (res[1] < 0) res[1] = 0;
                else if (res[1] > 255) res[1] = 255;
                res[1] |= 0;
            }

            return res;
        },
        calculateDpad: function() {
            let pressed = {
                up: this.isButtonPressed('dpadUp'),
                down: this.isButtonPressed('dpadDown'),
                left: this.isButtonPressed('dpadLeft'),
                right: this.isButtonPressed('dpadRight')
            };

            let x = 1;
            let y = 1;
            if (pressed.up) x -= 1;
            if (pressed.down) x += 1;
            if (pressed.left) y -= 1;
            if (pressed.right) y += 1;

            return this.dpadValues[x][y];
        },
        calculateButton: function() {
            let that = this;
            return Object.keys(this.buttonValues).reduce(function (accumulator, button) {
                if (that.isButtonPressed(button)) {
                    accumulator += that.buttonValues[button];
                }
                return accumulator;
            }, 0);
        },
    }
};