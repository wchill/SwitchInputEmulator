(function () {
    'use strict';

    const stateEnum = Object.freeze({
        NOT_CONNECTED: 1,
        CONNECTED_NO_CONTROLLER: 2,
        CONNECTED_UNSUPPORTED_CONTROLLER: 3,
        CONNECTED_INACTIVE: 4,
        CONNECTED_WAITING: 5,
        CONNECTED_ACTIVE: 6,
        ERROR: 7,
        CONNECTING: 8
    });

    const connectionStateEnum = Object.freeze({
        NOT_CONNECTED: 1,
        CONNECTED: 2,
        ERROR: 3,
        CONNECTING: 4
    });

    const controlStateEnum = Object.freeze({
        NO_CONTROLLER: 1,
        UNSUPPORTED_CONTROLLER: 2,
        INACTIVE: 3,
        WAITING: 4,
        ACTIVE: 5
    });

    const controlModeEnum = Object.freeze({
        SINGLE_CONTROLLER: 1,
        MULTIPLE_CONTROLLERS: 2,
        KEYBOARD: 3,
        TOUCH: 4
    });

    const switchButtons = Object.freeze({
        Y: 1,
        B: 2,
        A: 4,
        X: 8,
        L: 16,
        R: 32,
        ZL: 64,
        ZR: 128,
        MINUS: 256,
        PLUS: 512,
        L3: 1024,
        R3: 2048,
        HOME: 4096,
        SHARE: 8192,
        DPAD_UP: 0,
        DPAD_UPRIGHT: 1,
        DPAD_RIGHT: 2,
        DPAD_DOWNRIGHT: 3,
        DPAD_DOWN: 4,
        DPAD_DOWNLEFT: 5,
        DPAD_LEFT: 6,
        DPAD_UPLEFT: 7,
        DPAD_NONE: 8
    });

    const statusBus = new Vue();

    const appState = new Vuex.Store({
        state: {
            connectionState: connectionStateEnum.NOT_CONNECTED,
            controlState: controlStateEnum.NO_CONTROLLER,
            controlMode: controlModeEnum.SINGLE_CONTROLLER
        },
        mutations: {
            increment (state) {
                state.count++;
            }
        }
    });

    Vue.mixin({
        delimiters: ['((', '))']
    });

    let noController = {
        template: '<p class="center-text">No controller connected.</p>'
    };

    let unsupportedController = {
        template: '<div><p class="center-text">This isn\'t a supported controller. Select another controller or check the help documentation for details.</p></div>'
    };

    let baseController = {
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

    let xboxController = {
        mixins: [baseController],
        data: function() {
            return {
                canonicalName: 'Xbox/XInput controller'
            };
        }
    };

    let switchProControllerStandard = {
        mixins: [baseController],
        data: function() {
            return {
                spriteSheetUrl: 'assets/images/proControllerSpritesheet.png',
                buttonSprites: {faceRight:{x:838,y:178,w:78,h:79,inactive:{x:5,y:5},active:{x:93,y:5}},faceDown:{x:757,y:249,w:78,h:79,inactive:{x:181,y:5},active:{x:269,y:5}},faceUp:{x:757,y:107,w:78,h:79,inactive:{x:873,y:5},active:{x:961,y:5}},faceLeft:{x:675,y:178,w:78,h:79,inactive:{x:873,y:94},active:{x:961,y:94}},leftTop:{x:114,y:0,w:248,h:85,inactive:{x:357,y:5},active:{x:615,y:5}},rightTop:{x:679,y:0,w:248,h:85,inactive:{x:5,y:100},active:{x:263,y:100}},leftTrigger:{x:300,y:533,w:150,h:150,inactive:{x:521,y:183},active:{x:681,y:183}},rightTrigger:{x:590,y:533,w:150,h:150,inactive:{x:841,y:183},active:{x:5,y:343}},select:{x:370,y:117,w:44,h:44,inactive:{x:225,y:269},active:{x:279,y:269}},start:{x:627,y:117,w:44,h:44,inactive:{x:333,y:269},active:{x:387,y:269}},share:{x:427,y:198,w:39,h:39,inactive:{x:113,y:269},active:{x:440,y:269}},home:{x:572,y:196,w:44,h:44,inactive:{x:5,y:269},active:{x:59,y:269}},dpadUp:{x:335,y:285,w:50,h:76,inactive:{x:1001,y:269},active:{x:165,y:355},opacity:!0},dpadDown:{x:335,y:361,w:50,h:76,inactive:{x:1001,y:183},active:{x:165,y:269},opacity:!0},dpadLeft:{x:284,y:336,w:75,h:50,inactive:{x:225,y:343},active:{x:310,y:343},opacity:!0},dpadRight:{x:360,y:336,w:76,h:51,inactive:{x:395,y:343},active:{x:481,y:343},opacity:!0}},
                stickSprites: {leftStick:{x:174,y:155,w:120,h:120,travel:40,inactive:{x:5,y:738},active:{x:135,y:738}},rightStick:{x:598,y:299,w:120,h:120,travel:40,inactive:{x:5,y:738},active:{x:135,y:738}}},
                canvasSize: {
                    x: 1061,
                    y: 5,
                    width: 1040,
                    height: 723,
                    scale: 0.75
                },
                buttonMapping: {
                    faceDown: {val: switchButtons.B, index: 0},
                    faceRight: {val: switchButtons.A, index: 1},
                    faceLeft: {val: switchButtons.Y, index: 2},
                    faceUp: {val: switchButtons.X, index: 3},
                    leftTop: {val: switchButtons.L, index: 4},
                    rightTop: {val: switchButtons.R, index: 5},
                    leftTrigger: {val: switchButtons.ZL, index: 6},
                    rightTrigger: {val: switchButtons.ZR, index: 7},
                    select: {val: switchButtons.MINUS, index: 8},
                    start: {val: switchButtons.PLUS, index: 9},
                    leftStick: {val: switchButtons.L3, index: 10, invisible: true},
                    rightStick: {val: switchButtons.R3, index: 11, invisible: true},
                    home: {val: switchButtons.HOME, index: 16},
                    share: {val: switchButtons.SHARE, index: 17}
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
                canonicalName: 'Switch Pro Controller',
                experimental: true
            };
        }
    };

    let powerAWiredControllerStandard = {
        mixins: [switchProControllerStandard],
        data: function() {
            return {
                canonicalName: 'PowerA Wired Controller',
                experimental: true
            };
        }
    };

    let powerAWiredControllerBase = {
        mixins: [powerAWiredControllerStandard],
        data: function() {
            return {
                buttonMapping: {
                    faceLeft: {val: switchButtons.Y, index: 0},
                    faceDown: {val: switchButtons.B, index: 1},
                    faceRight: {val: switchButtons.A, index: 2},
                    faecUp: {val: switchButtons.X, index: 3},
                    leftTop: {val: switchButtons.L, index: 4},
                    rightTop: {val: switchButtons.R, index: 5},
                    leftTrigger: {val: switchButtons.ZL, index: 6},
                    rightTrigger: {val: switchButtons.ZR, index: 7},
                    select: {val: switchButtons.MINUS, index: 8},
                    start: {val: switchButtons.PLUS, index: 9},
                    leftStick: {val: switchButtons.L3, index: 10, invisible: true},
                    rightStick: {val: switchButtons.R3, index: 11, invisible: true},
                    home: {val: switchButtons.HOME, index: 12},
                    share: {val: switchButtons.SHARE, index: 13}
                }
            };
        }
    };

    let powerAWiredControllerChromeOS = {
        mixins: [powerAWiredControllerBase],
        data: function() {
            return {
                buttonMapping: {
                    faceLeft: {val: switchButtons.Y, index: 0},
                    faceDown: {val: switchButtons.B, index: 1},
                    faceRight: {val: switchButtons.A, index: 2},
                    faceUp: {val: switchButtons.X, index: 3},
                    leftTop: {val: switchButtons.L, index: 4},
                    rightTop: {val: switchButtons.R, index: 5},
                    leftTrigger: {val: switchButtons.ZL, index: 6},
                    rightTrigger: {val: switchButtons.ZR, index: 7},
                    select: {val: switchButtons.MINUS, index: 8},
                    start: {val: switchButtons.PLUS, index: 9},
                    leftStick: {val: switchButtons.L3, index: 10, invisible: true},
                    rightStick: {val: switchButtons.R3, index: 11, invisible: true},
                    home: {val: switchButtons.HOME, index: 12},
                    share: {val: switchButtons.SHARE, index: 13}
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
            isDpadPressed: function(name, mapping) {
                return mapping.hasOwnProperty('axis') && mapping.hasOwnProperty('sign') && this.axes[mapping.axis] * mapping.sign > this.deadzone;
            }
        }
    };

    let powerAWiredControllerWinChrome = {
        mixins: [powerAWiredControllerBase],
        data: function() {
            return {
                dpadMapping: {
                    dpadUp: {axis: 9, axisVals: [-7, -5, 7]},
                    dpadDown: {axis: 9, axisVals: [-1, 1, 3]},
                    dpadLeft: {axis: 9, axisVals: [3, 5, 7]},
                    dpadRight: {axis: 9, axisVals: [-5, -3, -1]},
                },
                stickMapping: {
                    leftStick: {axisX: 0, axisY: 1, index: 10},
                    rightStick: {axisX: 2, axisY: 5, index: 11}
                }
            }
        },
        methods: {
            isDpadPressed: function(name, mapping) {
                if (!(mapping.hasOwnProperty('axis') && mapping.hasOwnProperty('axisVals'))) return false;
                let axisValNormalized = this.axes[mapping.axis] * 7;
                for (let i = 0; i < mapping.axisVals.length; i++) {
                    if (Math.abs(mapping.axisVals[i] - axisValNormalized) < 0.1) return true;
                }
                return false;
            }
        }
    };

    let powerAWiredControllerWinFirefox = {
        mixins: [powerAWiredControllerBase],
        data: function() {
            return {
                dpadMapping: {
                    // Remap dpadUp to Home
                    dpadUp: {index: 12},
                    dpadDown: {index: 13},
                    dpadLeft: {},
                    dpadRight: {},
                },
                notifyMessage: 'The D-Pad does not work properly in Firefox on Windows. The Home button has been mapped to D-Pad Up. If this doesn\'t work for you, try using Chrome.'
            }
        },
        methods: {
            isDpadPressed: function(name, mapping) {
                if (!mapping.hasOwnProperty('index')) return false;
                return this.buttons[mapping.index];
            }
        }
    };

    let switchProController = {
        mixins: [switchProControllerStandard],
        data: function() {
            return {
                buttonMapping: {
                    faceLeft: {val: switchButtons.Y, index: 0},
                    faceDown: {val: switchButtons.B, index: 1},
                    faceRight: {val: switchButtons.A, index: 2},
                    faceUp: {val: switchButtons.X, index: 3},
                    leftTop: {val: switchButtons.L, index: 4},
                    rightTop: {val: switchButtons.R, index: 5},
                    leftTrigger: {val: switchButtons.ZL, index: 6},
                    rightTrigger: {val: switchButtons.ZR, index: 7},
                    select: {val: switchButtons.MINUS, index: 8},
                    start: {val: switchButtons.PLUS, index: 9},
                    leftStick: {val: switchButtons.L3, index: 10, invisible: true},
                    rightStick: {val: switchButtons.R3, index: 11, invisible: true},
                    home: {val: switchButtons.HOME, index: 16},
                    share: {val: switchButtons.SHARE, index: 17}
                },
                dpadMapping: {
                    dpadUp: {index: 16},
                    dpadDown: {index: 17},
                    dpadLeft: {index: 18},
                    dpadRight: {index: 19}
                },
                stickMapping: {
                    leftStick: {axisX: 0, axisY: 1, index: 10},
                    rightStick: {axisX: 2, axisY: 3, index: 11}
                }
            };
        }
    };

    let dualShockControllerBase = {
        mixins: [baseController],
        data: function() {
            return {
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
            };
        }
    };

    let dualShockControllerStandard = {
        mixins: [dualShockControllerBase]
    };

    let dualShockControllerWinFirefox = {
        mixins: [dualShockControllerBase],
        data: function() {
            return {
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
            };
        }
    };

    let detectBrowser = function() {
        if(navigator.userAgent.indexOf("Chrome") !== -1 ) {
            return 'Chrome';
        } else if(navigator.userAgent.indexOf("Firefox") !== -1 ) {
            return 'Firefox';
        } else {
            return 'unknown';
        }
    };
    let detectOS = function() {
        let userAgent = window.navigator.userAgent,
            platform = window.navigator.platform,
            macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
            windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
            iosPlatforms = ['iPhone', 'iPad', 'iPod'];

        if (macosPlatforms.indexOf(platform) !== -1) {
            return 'Mac OS';
        } else if (iosPlatforms.indexOf(platform) !== -1) {
            return 'iOS';
        } else if (windowsPlatforms.indexOf(platform) !== -1) {
            return 'Windows';
        } else if (/Android/.test(userAgent)) {
            return 'Android';
        } else if (/CrOS/.test(userAgent)) {
            return 'Chrome OS';
        } else if (/Linux/.test(platform)) {
            return 'Linux';
        }

        return 'unknown';
    };
    let checkVidPid = function(id, vid, pid) {
        return id.indexOf(vid) > -1 && id.indexOf(pid) > -1;
    };

    Vue.component('controller-select', {
        props: ['gamepads', 'gamepadindex'],
        model: {
            prop: 'gamepadindex',
            event: 'change'
        },
        computed: {
            selectedindex: {
                get() {
                    return this.gamepadindex;
                },
                set(val) {
                    this.$emit('change', val);
                }
            }
        },
        template: '<select v-model="selectedindex"><option disabled value="">Please select a controller</option>' +
        '<option v-for="gamepad in gamepads" v-bind:value="gamepad.index" v-if="gamepad !== null">#(( gamepad.index )): (( gamepad.id ))</option>' +
        '</select>'
    });

    Vue.component('server-status', {
        props: ['state'],
        data: function() {
            // TODO: Have this handle all server status things.
            let stats = new Stats();
            let pingPanel = stats.addPanel(new Stats.Panel('ms ping', '#f08', '#201'));
            pingPanel.update(0, 1000);
            stats.showPanel(0);
            stats.showPanel(1);
            stats.showPanel(2);

            return {
                stats: stats,
                pingPanel: pingPanel
            };
        },
        mounted: function() {
            let that = this;
            this.$nextTick(function() {
                this.$refs.statsContainer.appendChild(this.stats.dom);
                statusBus.$on('pong', this.updatePingGraph);
                statusBus.$on('startRender', function() {that.stats.begin();});
                statusBus.$on('finishRender', function() {that.stats.end();});
            });
        },
        methods: {
            requestTurn: function() {
                this.$emit('request');
            },
            updatePingGraph: function(time) {
                this.pingPanel.update(time, 1000);
            }
        },
        computed: {
            turnState: function() {
                if (this.state === stateEnum.CONNECTED_NO_CONTROLLER) {
                    return 'No controller connected';
                } else if (this.state === stateEnum.CONNECTED_UNSUPPORTED_CONTROLLER) {
                    return 'Unsupported controller';
                } else if (this.state === stateEnum.CONNECTED_ACTIVE) {
                    return 'Currently your turn';
                } else if (this.state === stateEnum.CONNECTED_WAITING) {
                    return 'Waiting for turn';
                } else if (this.state === stateEnum.CONNECTED_INACTIVE) {
                    return 'Request turn';
                } else if (this.state === stateEnum.NOT_CONNECTED) {
                    return 'Not connected';
                } else if (this.state === stateEnum.ERROR) {
                    return 'Connection error';
                } else if (this.state === stateEnum.CONNECTING) {
                    return 'Connecting to server';
                }
            },
            canRequestTurn: function() {
                return this.state === stateEnum.CONNECTED_INACTIVE;
            }
        },
        template: '<div class="center-text"><button type="button" class="center-text min-padding" @click="requestTurn" v-text="turnState" v-bind:disabled="!canRequestTurn"></button><div ref="statsContainer" class="stats"></div></div>'
    });

    new Vue({
        el: '#app',
        components: {
            'no-controller': noController,
            'unsupported-controller': unsupportedController,
            'xbox-controller': xboxController,
            'switch-pro-controller': switchProController,
            'switch-pro-controller-standard': switchProControllerStandard,
            'powera-wired-controller-standard': powerAWiredControllerStandard,
            'powera-wired-controller-chromeos': powerAWiredControllerChromeOS,
            'powera-wired-controller-win-chrome': powerAWiredControllerWinChrome,
            'powera-wired-controller-win-firefox': powerAWiredControllerWinFirefox,
            'dualshock-controller-standard': dualShockControllerStandard,
            'dualshock-controller-win-firefox': dualShockControllerWinFirefox
        },
        data: function() {
            return {
                currentController: -1,
                axes: [],
                buttons: [],
                deadzone: 0.15,
                allControllers: [],
                connectState: stateEnum.NOT_CONNECTED,
                lastPing: 0
            };
        },
        created: function() {
            let that = this;

            window.addEventListener('gamepadconnected', function(e) {
                console.log('Detected gamepad: ' + e.gamepad.id);
                if (that.currentController < 0 || that.currentControllerComponent === 'unsupported-controller') {
                    that.currentController = e.gamepad.index;
                }
                that.allControllers = that.getGamepads();
            });

            window.addEventListener('gamepaddisconnected', function(e) {
                console.log('Gamepad disconnected: ' + e.gamepad.id);
                if (that.currentController.index === e.gamepad.index) {
                    that.currentController = that.getGamepad().index;
                }
                that.allControllers = that.getGamepads();
            });

            this.ws = new WebSocket('wss://api.chilly.codes/switch/ws', null, {
                backoff: 'fibonacci'
            });

            this.connectState = stateEnum.CONNECTING;

            this.ws.addEventListener('open', function (e) {
                if (!that.isControllerConnected) {
                    that.connectState = stateEnum.CONNECTED_NO_CONTROLLER;
                } else if (!that.isControllerSupported) {
                    that.connectState = stateEnum.CONNECTED_UNSUPPORTED_CONTROLLER;
                } else {
                    that.connectState = stateEnum.CONNECTED_INACTIVE;
                }
                that.lastPing = performance.now();
                that.sendMessage('PING');
            });

            this.ws.addEventListener('close', function (e) {
                that.connectState = stateEnum.NOT_CONNECTED;
            });

            this.ws.addEventListener('error', function (e) {
                that.connectState = stateEnum.ERROR;
            });

            this.ws.addEventListener('reconnect', function (e) {
                that.connectState = stateEnum.CONNECTING;
            });

            this.ws.addEventListener('message', function(e) {
                that.onServerMessage(e.data);
            });
        },
        watch: {
            currentController: function() {
                if (this.connectState === stateEnum.CONNECTED_UNSUPPORTED_CONTROLLER || this.connectState === stateEnum.CONNECTED_NO_CONTROLLER || this.connectState === stateEnum.CONNECTED_INACTIVE || this.connectState === stateEnum.CONNECTED_WAITING || this.connectState === stateEnum.CONNECTED_ACTIVE) {
                    if (!this.isControllerConnected) {
                        this.connectState = stateEnum.CONNECTED_NO_CONTROLLER;
                    } else if (!this.isControllerSupported) {
                        this.connectState = stateEnum.CONNECTED_UNSUPPORTED_CONTROLLER;
                    } else if (this.connectState === stateEnum.CONNECTED_NO_CONTROLLER || this.connectState === stateEnum.CONNECTED_UNSUPPORTED_CONTROLLER) {
                        this.connectState = stateEnum.CONNECTED_INACTIVE;
                    }
                }
                this.update();
            },
            currentControllerComponent: function() {
                console.log(this.currentControllerComponent);
            }
        },
        mounted: function() {
            let browser = detectBrowser();
            let os = detectOS();

            console.log(`Browser: ${browser} OS: ${os}`);

            this.$nextTick(function() {
                requestAnimationFrame(this.update);
            });
        },
        methods: {
            getGamepads: function() {
                let gamepads;
                if (navigator.getGamepads()) {
                    gamepads = navigator.getGamepads();
                } else if (navigator.webkitGetGamepads) {
                    gamepads = navigator.webkitGetGamepads();
                }
                return gamepads;
            },
            getGamepad: function() {
                // TODO: Support Joycons.
                let gamepads = this.getGamepads();
                if (this.currentController >= 0) {
                    let gamepad = gamepads[this.currentController];
                    if (gamepad && gamepad.connected) return gamepad;
                }
                for (let i = 0; i < gamepads.length; i++) {
                    if (gamepads[i] && gamepads[i].connected) {
                        this.currentController = gamepads[i].index;
                        return gamepads[i];
                    }
                }
                return null;
            },
            update: function() {
                let gamepad = this.getGamepad();
                if (!gamepad) return;

                let newButtons = [];
                let newAxes = [];

                for (let i = 0; i < gamepad.buttons.length; i++) {
                    newButtons.push(gamepad.buttons[i].value);
                }
                for (let i = 0; i < gamepad.axes.length; i++) {
                    newAxes.push(gamepad.axes[i]);
                }
                this.axes = newAxes;
                this.buttons = newButtons;

                requestAnimationFrame(this.update);
            },
            onControllerUpdate: function(newState) {
                if (this.connectState === stateEnum.CONNECTED_ACTIVE) {
                    this.sendMessage(`UPDATE ${newState.button} ${newState.dpad} ${newState.lx} ${newState.ly} ${newState.rx} ${newState.ry}`);
                }
            },
            requestTurn: function() {
                if (this.connectState !== stateEnum.CONNECTED_INACTIVE) {
                    this.$notify({
                        type: 'warn',
                        text: 'Can\'t request turn right now.'
                    });
                } else {
                    this.connectState = stateEnum.CONNECTED_WAITING;
                    this.sendMessage('REQUEST_TURN');
                }
            },
            sendMessage: function(message) {
                if (this.ws.readyState === this.ws.OPEN) {
                    this.ws.send(message);
                    return true;
                }
                console.warn('Failed to send message: ' + message);
                return false;
            },
            onServerMessage: function(message) {
                const wsParseRegex = /(\w+)(?: (.*))?/;
                let match = wsParseRegex.exec(message);
                if (!match) {
                    console.warn(`Got invalid message: ${message}`);
                    return;
                }

                let command = match[1];
                let args = match[2];

                if (command === 'PONG') {
                    let that = this;

                    let time = performance.now();
                    let duration = (time - this.lastPing) / 2;
                    statusBus.$emit('pong', duration);
                    setTimeout(function() {
                        that.lastPing = performance.now();
                        that.sendMessage('PING');
                    }, Math.max(duration, 1000));
                } else if (command === 'CLIENT_ACTIVE') {
                    if (this.connectState === stateEnum.CONNECTED_INACTIVE || this.connectState === stateEnum.CONNECTED_WAITING) {
                        this.connectState = stateEnum.CONNECTED_ACTIVE;
                    }
                } else if (command === 'CLIENT_INACTIVE') {
                    if (this.connectState === stateEnum.CONNECTED_ACTIVE || this.connectState === stateEnum.CONNECTED_WAITING) {
                        this.connectState = stateEnum.CONNECTED_INACTIVE;
                    }
                }
            }
        },
        computed: {
            isControllerConnected: function() {
                return this.currentControllerComponent !== 'no-controller';
            },
            isControllerSupported: function() {
                return this.currentControllerComponent !== 'unsupported-controller';
            },
            currentControllerComponent: function() {
                // TODO: make this code less unwieldy.
                if (this.currentController < 0) return 'no-controller';
                let gamepad = this.getGamepad();
                if (!gamepad) {
                    return 'no-controller';
                }

                let browser = detectBrowser();
                let os = detectOS();
                let id = gamepad.id;
                let mapping = gamepad.mapping;

                if (mapping === 'standard') {
                    // Check for Pro Controller (2009) or Joycon Grip (200e) connected via cable (won't work)
                    if (checkVidPid(id, '57e', '2009') || checkVidPid(id, '57e', '200e')) {
                        if (id.indexOf('Nintendo Co., Ltd.') > -1) {
                            return 'unsupported-controller';
                        } else {
                            return 'switch-pro-controller-standard';
                        }
                    }

                    if (checkVidPid(id, '54c', '9cc')) {
                        return 'dualshock-controller-standard';
                    }
                    return 'xbox-controller';
                }

                if (checkVidPid(id, '57e', '2009')) {
                    // Pro Controllers in Firefox report 4 axes. In Chrome, for some reason they report 9.
                    return 'switch-pro-controller';
                }

                if (checkVidPid(id, '54c', '9cc')) {
                    if (os === 'Windows' && browser === 'Firefox') return 'dualshock-controller-win-firefox';
                    return 'dualshock-controller';
                }

                if (checkVidPid(id, '20d6', 'a711')) {
                    if (os === 'Windows') {
                        if (browser === 'Chrome') return 'powera-wired-controller-win-chrome';
                        if (browser === 'Firefox') return 'powera-wired-controller-win-firefox';
                    } else if (os === 'Chrome OS') {
                        return 'powera-wired-controller-chromeos';
                    }
                    return 'powera-wired-controller';
                } else {
                    return 'unsupported-controller';
                }
            },
            gamepadName: function() {
                if (this.currentController < 0) {
                    return '';
                }
                let gamepad = this.getGamepad();
                if (!gamepad) return '';
                return gamepad.id;
            }
        }
    });

}());
