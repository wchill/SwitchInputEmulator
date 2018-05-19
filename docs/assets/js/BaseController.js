import {switchButtons, statusBus} from './Common.js';

export let noController = {
    template: '<p class="center-text">No controller connected.</p>'
};

export let unsupportedController = {
    template: '<div><p class="center-text">This isn\'t a supported controller. Select another controller or check the help documentation for details.</p></div>'
};

export let baseController = {
    props: ['gamepadindexes', 'gamepadname', 'axes', 'buttons'],
    data: function() {
        return {
            spriteSheetUrl: 'assets/images/xboxGamepadSprites.png',
            buttonSprites: {faceDown:{x:745,y:242,w:79,h:79,inactive:{x:1217,y:643},active:{x:1062,y:643}},faceRight:{x:820,y:175,w:79,h:79,inactive:{x:1140,y:800},active:{x:1141,y:725}},faceLeft:{x:678,y:176,w:79,h:79,inactive:{x:1220,y:725},active:{x:1065,y:801}},faceUp:{x:745,y:105,w:79,h:79,inactive:{x:1140,y:645},active:{x:1062,y:721}},leftTop:{x:144,y:0,w:245,h:90,inactive:{x:613,y:818},active:{x:1062,y:94}},rightTop:{x:645,y:0,w:245,h:90,inactive:{x:1056,y:0},active:{x:1056,y:188}},select:{x:414,y:183,w:54,h:54,inactive:{x:1241,y:552},active:{x:1244,y:460}},start:{x:569,y:183,w:54,h:54,inactive:{x:1245,y:370},active:{x:1247,y:278}},dpadUp:{x:352,y:290,w:70,h:87,inactive:{x:1074,y:557},active:{x:1166,y:557},opacity:!0},dpadDown:{x:351,y:369,w:70,h:87,inactive:{x:1074,y:366},active:{x:1165,y:366},opacity:!0},dpadLeft:{x:298,y:342,w:87,h:70,inactive:{x:1066,y:475},active:{x:1158,y:475},opacity:!0},dpadRight:{x:383,y:342,w:87,h:70,inactive:{x:1062,y:292},active:{x:1156,y:292},opacity:!0}},
            stickSprites: {leftStick:{x:185,y:134,w:150,h:150,travel:40,inactive:{x:464,y:816},active:{x:310,y:813}},rightStick:{x:581,y:290,w:150,h:150,travel:40,inactive:{x:464,y:816},active:{x:310,y:813}}},
            canvasSize: {
                x: 0,
                y: 0,
                width: 1040,
                height: 700,
                scale: 0.75
            },
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
            dpadButtons: [
                {name: 'dpadUp dpadRight', val: switchButtons.DPAD_UPRIGHT},
                {name: 'dpadDown dpadRight', val: switchButtons.DPAD_DOWNRIGHT},
                {name: 'dpadDown dpadLeft', val: switchButtons.DPAD_DOWNLEFT},
                {name: 'dpadUp dpadLeft', val: switchButtons.DPAD_UPLEFT},
                {name: 'dpadUp', val: switchButtons.DPAD_UP},
                {name: 'dpadRight', val: switchButtons.DPAD_RIGHT},
                {name: 'dpadDown', val: switchButtons.DPAD_DOWN},
                {name: 'dpadLeft', val: switchButtons.DPAD_LEFT}
            ],
            spriteSheetReady: false,
            gamepadState: {
                button: 0,
                dpad: 8,
                lx: 0.0,
                ly: 0.0,
                rx: 0.0,
                ry: 0.0
            },
            prevState: {
                button: 0,
                dpad: 8,
                lx: 0.0,
                ly: 0.0,
                rx: 0.0,
                ry: 0.0
            },
            deadzone: 0.15,
            experimental: false
        };
    },
    watch: {
        axes: function() {
            this.renderImage();
        },
        buttons: function() {
            this.renderImage();
        }
    },
    methods: {
        compareState: function() {
            if (this.gamepadState.button !== this.prevState.button) return true;
            if (this.gamepadState.dpad !== this.prevState.dpad) return true;
            if (this.gamepadState.lx !== this.prevState.lx) return true;
            if (this.gamepadState.ly !== this.prevState.ly) return true;
            if (this.gamepadState.rx !== this.prevState.rx) return true;
            if (this.gamepadState.ry !== this.prevState.ry) return true;

            return false;
        },
        calculateState: function() {
            this.prevState.button = this.gamepadState.button;
            this.prevState.dpad = this.gamepadState.dpad;
            this.prevState.lx = this.gamepadState.lx;
            this.prevState.ly = this.gamepadState.ly;
            this.prevState.rx = this.gamepadState.rx;
            this.prevState.ry = this.gamepadState.ry;

            this.gamepadState.button = this.calculateButton();
            this.gamepadState.dpad = this.calculateDpad();
            let ls = this.calculateStick('leftStick');
            let rs = this.calculateStick('rightStick');
            this.gamepadState.lx = ls[0];
            this.gamepadState.ly = ls[1];
            this.gamepadState.rx = rs[0];
            this.gamepadState.ry = rs[1];

            if (this.compareState()) {
                this.$emit('update', this.gamepadState);
            }
        },
        isDpadPressed: function(name, mapping) {
            // Need to be able to override this function for certain situations, like axis instead of buttons.
            return mapping.hasOwnProperty('index') && !!this.buttons[mapping.index];
        },
        isButtonPressed: function(name, mapping) {
            return mapping.hasOwnProperty('index') && !!this.buttons[mapping.index];
        },
        calculateButton: function() {
            let that = this;
            return Object.keys(this.buttonMapping).reduce(function (accumulator, button) {
                let mapping = that.buttonMapping[button];
                if (mapping.hasOwnProperty('index') && !!that.buttons[mapping.index]) {
                    return accumulator + mapping.val;
                }
                return accumulator;
            }, 0);
        },
        calculateDpad: function() {
            // Need to be able to override this function for certain situations, like axis instead of buttons.
            let that = this;

            let pressedDpad = Object.keys(this.dpadMapping).reduce(function (accumulator, dpad) {
                if (that.isDpadPressed(dpad, that.dpadMapping[dpad])) {
                    accumulator.push(dpad);
                }
                return accumulator;
            }, []).join(' ');

            for (let i = 0; i < this.dpadButtons.length; i++) {
                if (pressedDpad === this.dpadButtons[i].name) {
                    return this.dpadButtons[i].val;
                }
            }

            return 8;
        },
        calculateStick: function(stickName) {
            // Applies dead zone calculations and then maps the range [-1.0, 1.0] to [0, 255]
            // Reference: http://www.third-helix.com/2013/04/12/doing-thumbstick-dead-zones-right.html

            let mapping = this.stickMapping[stickName];
            let x = this.axes[mapping.axisX];
            let y = this.axes[mapping.axisY];

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
        renderImage: function() {
            if (!this.spriteSheetReady) return;

            statusBus.$emit('startRender');
            this.calculateState();

            let that = this;

            let canvas = this.$refs.gamepadCanvas;
            let context = canvas.getContext('2d');
            let spriteSheet = this.$refs.spriteSheet;

            context.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
            context.drawImage(spriteSheet, this.canvasSize.x, this.canvasSize.y, this.canvasSize.width, this.canvasSize.height, 0, 0, this.canvasSize.width, this.canvasSize.height);

            Object.keys(this.buttonMapping).map(function (button) {
                let mapping = that.buttonMapping[button];
                if (mapping.invisible) return;
                that.renderButton(context, spriteSheet, button, mapping);
            });

            Object.keys(this.dpadMapping).map(function (dpad) {
                let mapping = that.dpadMapping[dpad];
                if (mapping.invisible) return;
                that.renderDpad(context, spriteSheet, dpad, mapping);
            });

            Object.keys(this.stickMapping).map(function (stick) {
                let mapping = that.stickMapping[stick];
                if (mapping.invisible) return;
                that.renderStick(context, spriteSheet, stick, mapping);
            });
            statusBus.$emit('finishRender');
        },
        renderButton: function(context, spriteSheet, name, mapping) {
            let sprite = this.buttonSprites[name];
            let pressed = this.isButtonPressed(name, mapping);

            if (!pressed || sprite.opacity) {
                let coord = sprite.inactive;
                context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, sprite.x, sprite.y, sprite.w, sprite.h);
            }
            if (pressed) {
                let coord = sprite.active;
                context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, sprite.x, sprite.y, sprite.w, sprite.h);
            }
        },
        renderDpad: function(context, spriteSheet, name, mapping) {
            let sprite = this.buttonSprites[name];
            let pressed = this.isDpadPressed(name, mapping);

            if (!pressed || sprite.opacity) {
                let coord = sprite.inactive;
                context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, sprite.x, sprite.y, sprite.w, sprite.h);
            }
            if (pressed) {
                let coord = sprite.active;
                context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, sprite.x, sprite.y, sprite.w, sprite.h);
            }
        },
        renderStick: function(context, spriteSheet, name, mapping) {
            let sprite = this.stickSprites[name];
            let pressed = this.isButtonPressed(name, mapping);
            let x = this.axes[mapping.axisX];
            let y = this.axes[mapping.axisY];

            let coord = pressed ? sprite.active : sprite.inactive;
            context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, sprite.x + x * sprite.travel, sprite.y + y * sprite.travel, sprite.w, sprite.h);
        },
        imageLoaded: function() {
            let canvas = this.$refs.gamepadCanvas;
            canvas.width = this.canvasSize.width * this.canvasSize.scale;
            canvas.height = this.canvasSize.height * this.canvasSize.scale;

            let context = canvas.getContext('2d');
            context.scale(this.canvasSize.scale, this.canvasSize.scale);

            this.spriteSheetReady = true;
            this.renderImage();
        },
        requestTurn: function() {
            this.$emit('request');
        }
    },
    mounted: function() {
        if (this.experimental) {
            this.$notify({
                title: 'Experimental controller support',
                text: `Please note that support for this controller (${this.canonicalName}) is experimental and may have issues or limitations. Please check the help documentation for details.`,
                duration: 10000
            });
        }
        if (this.notifyMessage) {
            this.$notify({
                type: 'warn',
                title: 'Warning',
                text: this.notifyMessage,
                duration: 10000
            });
        }
    },
    beforeDestroy: function() {
        this.spriteSheetReady = false;
    },
    template: '<div><canvas class="gamepadCanvas" ref="gamepadCanvas"></canvas><img ref="spriteSheet" v-bind:src="spriteSheetUrl" style="display:none;" @load="imageLoaded"/><span class="center-text">Controller (( gamepadindex )): (( gamepadname ))</span><span class="center-text">Detected as: (( canonicalName ))</span></div>'
};

export let xboxController = {
    mixins: [baseController],
    data: function() {
        return {
            canonicalName: 'Xbox/XInput controller'
        };
    }
};