import {BusEvents, ControlMode, StatusBus, SwitchButtons} from "./Common";

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
            gamepadState: {
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
                }
            },
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
                    share: false
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
                }
            }
        };
    },
    mounted: function() {
        StatusBus.$on(BusEvents.UPDATE_INPUT, this.updateState);
    },
    methods: {
        compareState: function() {
            // Returns true on change
            let buttons = Object.keys(this.gamepadState.buttons);
            for (let i = 0; i < buttons.length; i++) {
                let button = buttons[i];
                if (this.gamepadState.buttons[button] !== this.prevState.buttons[button]) return true;
            }

            let sticks = Object.keys(this.gamepadState.sticks);
            for (let i = 0; i < sticks.length; i++) {
                let stick = sticks[i];
                if (this.gamepadState.sticks[stick].x !== this.prevState.sticks[stick].x) return true;
                if (this.gamepadState.sticks[stick].y !== this.prevState.sticks[stick].y) return true;
                if (this.gamepadState.sticks[stick].pressed !== this.prevState.sticks[stick].pressed) return true;
            }

            return false;
        },
        updateState: function() {
            let buttons = Object.keys(this.gamepadState.buttons);
            let sticks = Object.keys(this.gamepadState.sticks);

            this.prevState = this.gamepadState;
            this.gamepadState = {
                buttons: {},
                sticks: {}
            };

            for (let i = 0; i < buttons.length; i++) {
                let button = buttons[i];
                this.gamepadState.buttons[button] = this.isButtonPressed(button);
            }

            for (let i = 0; i < sticks.length; i++) {
                let stick = sticks[i];
                this.gamepadState.sticks[stick] = {
                    x: this.getStickX(stick),
                    y: this.getStickY(stick),
                    pressed: this.isButtonPressed(stick)
                };
            }

            if (this.compareState()) {
                StatusBus.$emit(BusEvents.INPUT_CHANGED, {
                    state: this.gamepadState,
                    stateStr: this.generateStateStr()
                });
                this.$store.commit('setGamepadState', this.gamepadState);
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
        generateStateStr: function() {
            let button = this.calculateButton();
            let dpad = this.calculateDpad();
            let ls = this.calculateStick('leftStick');
            let rs = this.calculateStick('rightStick');
            return `${button} ${dpad} ${ls[0]} ${ls[1]} ${rs[0]} ${rs[1]}`;
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