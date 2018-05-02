Vue.mixin({
    delimiters: ['((', '))']
});

Vue.component('no-controller', {
    template: '<p class="center-text">No controller connected.</p>'
});

Vue.component('unsupported-controller', {
    template: '<div><p class="center-text">This isn\'t a supported controller. Select another controller or check the help documentation for details.</p></div>'
});

let baseController = {
    props: ['gamepadindex', 'gamepadname', 'axes', 'buttons'],
    data: function() {
        return {
            spriteSheetUrl: 'assets/images/xboxGamepadSprites.png',
            buttonSprites: {a:{x:745,y:242,w:79,h:79,inactive:{x:1217,y:643},active:{x:1062,y:643}},b:{x:820,y:175,w:79,h:79,inactive:{x:1140,y:800},active:{x:1141,y:725}},x:{x:678,y:176,w:79,h:79,inactive:{x:1220,y:725},active:{x:1065,y:801}},y:{x:745,y:105,w:79,h:79,inactive:{x:1140,y:645},active:{x:1062,y:721}},leftTop:{x:144,y:0,w:245,h:90,inactive:{x:613,y:818},active:{x:1062,y:94}},rightTop:{x:645,y:0,w:245,h:90,inactive:{x:1056,y:0},active:{x:1056,y:188}},select:{x:414,y:183,w:54,h:54,inactive:{x:1241,y:552},active:{x:1244,y:460}},start:{x:569,y:183,w:54,h:54,inactive:{x:1245,y:370},active:{x:1247,y:278}},dpadUp:{x:352,y:290,w:70,h:87,inactive:{x:1074,y:557},active:{x:1166,y:557},opacity:!0},dpadDown:{x:351,y:369,w:70,h:87,inactive:{x:1074,y:366},active:{x:1165,y:366},opacity:!0},dpadLeft:{x:298,y:342,w:87,h:70,inactive:{x:1066,y:475},active:{x:1158,y:475},opacity:!0},dpadRight:{x:383,y:342,w:87,h:70,inactive:{x:1062,y:292},active:{x:1156,y:292},opacity:!0}},
            stickSprites: {leftStick:{x:185,y:134,w:150,h:150,travel:40,inactive:{x:464,y:816},active:{x:310,y:813}},rightStick:{x:581,y:290,w:150,h:150,travel:40,inactive:{x:464,y:816},active:{x:310,y:813}}},
            canvasSize: {
                x: 0,
                y: 0,
                width: 1040,
                height: 700,
                scale: 0.75
            },
            buttonMapping: {
                a: {val: 2, index: 0},
                b: {val: 4, index: 1},
                x: {val: 1, index: 2},
                y: {val: 8, index: 3},
                leftTop: {val: 16, index: 4},
                rightTop: {val: 32, index: 5},
                leftTrigger: {val: 64, index: 6, invisible: true},
                rightTrigger: {val: 128, index: 7, invisible: true},
                select: {val: 256, index: 8},
                start: {val: 512, index: 9},
                leftStick: {val: 1024, index: 10, invisible: true},
                rightStick: {val: 2048, index: 11, invisible: true}
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
                {name: 'dpadUp dpadRight', val: 1},
                {name: 'dpadDown dpadRight', val: 3},
                {name: 'dpadDown dpadLeft', val: 5},
                {name: 'dpadUp dpadLeft', val: 7},
                {name: 'dpadUp', val: 0},
                {name: 'dpadRight', val: 2},
                {name: 'dpadDown', val: 4},
                {name: 'dpadLeft', val: 6}
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
            deadzone: 0.15
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

            let that = this;

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
    },
    created: function() {
        // bit of a hack - I could use optionMergeStrategies but this works
        if (this.overrides) {
            let that = this;
            Object.keys(this.overrides).map(function(key) {
                that[key] = that.overrides[key];
            });
        }
    },
    beforeDestroy: function() {
        this.spriteSheetReady = false;
    },
    template: '<div><canvas class="gamepadCanvas" ref="gamepadCanvas"></canvas><img ref="spriteSheet" v-bind:src="spriteSheetUrl" style="display:none;" @load="imageLoaded"/><span class="center-text">Controller (( gamepadindex )): (( gamepadname ))</span><span class="center-text">Detected as: (( canonicalName ))</span></div>'
};

Vue.component('xbox-controller', {
    mixins: [baseController],
    data: function() {
        return {
            overrides: {
                canonicalName: 'Xbox/XInput controller'
            }
        };
    }
});
Vue.component('dualshock-controller', {
    mixins: [baseController],
    data: function() {
        return {
            overrides: {
                // TODO: Provide a spritesheet for this.
                buttonMapping: {
                    a: {val: 2, index: 1},
                    b: {val: 4, index: 2},
                    x: {val: 1, index: 0},
                    y: {val: 8, index: 3},
                    leftTop: {val: 16, index: 4},
                    rightTop: {val: 32, index: 5},
                    leftTrigger: {val: 64, index: 6, invisible: true},
                    rightTrigger: {val: 128, index: 7, invisible: true},
                    select: {val: 256, index: 8},
                    start: {val: 512, index: 9},
                    leftStick: {val: 1024, index: 10, invisible: true},
                    rightStick: {val: 2048, index: 11, invisible: true}
                },
                dpadMapping: {
                    // Remap the guide button to index 13
                    // The other buttons don't seem to work, so leave them blank.
                    dpadUp: {index: 13},
                    dpadDown: {},
                    dpadLeft: {},
                    dpadRight: {}
                },
                stickMapping: {
                    leftStick: {axisX: 0, axisY: 1, index: 10},
                    rightStick: {axisX: 2, axisY: 5, index: 11}
                },
                canonicalName: 'DualShock 3/4'
            }
        };
    }
});
Vue.component('switch-pro-controller', {
    mixins: [baseController],
    data: function() {
        return {
            overrides: {
                spriteSheetUrl: 'assets/images/proControllerSpriteSheet.png',
                buttonSprites: {a:{x:838,y:178,w:78,h:79,inactive:{x:5,y:5},active:{x:93,y:5}},b:{x:757,y:249,w:78,h:79,inactive:{x:181,y:5},active:{x:269,y:5}},x:{x:757,y:107,w:78,h:79,inactive:{x:873,y:5},active:{x:961,y:5}},y:{x:675,y:178,w:78,h:79,inactive:{x:873,y:94},active:{x:961,y:94}},l:{x:114,y:0,w:248,h:85,inactive:{x:357,y:5},active:{x:615,y:5}},r:{x:679,y:0,w:248,h:85,inactive:{x:5,y:100},active:{x:263,y:100}},zl:{x:300,y:533,w:150,h:150,inactive:{x:521,y:183},active:{x:681,y:183}},zr:{x:590,y:533,w:150,h:150,inactive:{x:841,y:183},active:{x:5,y:343}},minus:{x:370,y:117,w:44,h:44,inactive:{x:225,y:269},active:{x:279,y:269}},plus:{x:627,y:117,w:44,h:44,inactive:{x:333,y:269},active:{x:387,y:269}},share:{x:427,y:198,w:39,h:39,inactive:{x:113,y:269},active:{x:440,y:269}},home:{x:572,y:196,w:44,h:44,inactive:{x:5,y:269},active:{x:59,y:269}},dpadUp:{x:335,y:285,w:50,h:76,inactive:{x:1001,y:269},active:{x:165,y:355},opacity:!0},dpadDown:{x:335,y:361,w:50,h:76,inactive:{x:1001,y:183},active:{x:165,y:269},opacity:!0},dpadLeft:{x:284,y:336,w:75,h:50,inactive:{x:225,y:343},active:{x:310,y:343},opacity:!0},dpadRight:{x:360,y:336,w:76,h:51,inactive:{x:395,y:343},active:{x:481,y:343},opacity:!0}},
                stickSprites: {leftStick:{x:174,y:155,w:120,h:120,travel:40,inactive:{x:5,y:738},active:{x:135,y:738}},rightStick:{x:598,y:299,w:120,h:120,travel:40,inactive:{x:5,y:738},active:{x:135,y:738}}},
                canvasSize: {
                    x: 1061,
                    y: 5,
                    width: 1040,
                    height: 723,
                    scale: 0.75
                },
                buttonMapping: {
                    b: {val: 2, index: 0},
                    a: {val: 4, index: 1},
                    y: {val: 1, index: 2},
                    x: {val: 8, index: 3},
                    l: {val: 16, index: 4},
                    r: {val: 32, index: 5},
                    zl: {val: 64, index: 6},
                    zr: {val: 128, index: 7},
                    minus: {val: 256, index: 8},
                    plus: {val: 512, index: 9},
                    leftStick: {val: 1024, index: 10, invisible: true},
                    rightStick: {val: 2048, index: 11, invisible: true},
                    home: {val: 0, index: 12},
                    share: {val: 0, index: 13}
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
                },
                canonicalName: 'Switch Pro Controller'
            }
        };
    }
});

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
        this.$nextTick(function() {
            this.$refs.statsContainer.appendChild(this.stats.dom);
        });
    },
    template: '<div ref="statsContainer" class="stats"></div>'
});

new Vue({
    el: '#app',
    data: {
        connectionState: 'Not connected',
        turnState: 'Not your turn',
        commitHash: '',
        currentController: -1,
        axes: [],
        buttons: [],
        deadzone: 0.15,
        allControllers: [],
        myTurn: false
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
                that.currentController = -1;
                that.currentController = that.getGamepad().index;
            }
            that.allControllers = that.getGamepads();
        });

        fetch('https://api.github.com/repos/wchill/SwitchInputEmulator/commits')
            .then(function(response) {
                return response.json();
            }).then(function(response) {
            that.$data.commitHash = 'Build ' + response[0]['sha'].slice(0, 7);
        });

        this.ws = new WebSocket('wss://api.chilly.codes/switch/ws', null, {
            backoff: 'fibonacci'
        });

        this.ws.addEventListener('open', function (e) {
            that.$data.connectionState = 'Connected';
        });

        this.ws.addEventListener('close', function (e) {
            that.$data.connectionState = 'Disconnected';
        });

        this.ws.addEventListener('error', function (e) {
            that.$data.connectionState = 'Connection failed';
        });

        this.ws.addEventListener('reconnect', function (e) {
            that.$data.connectionState = 'Reconnecting';
        });
    },
    watch: {
        currentController: function() {
            this.update();
        }
    },
    mounted: function() {
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
        onChildUpdate: function(newState) {
            if (this.ws.readyState === this.ws.OPEN && this.myTurn) {
                this.ws.send(`UPDATE ${newState.button} ${newState.dpad} ${newState.lx} ${newState.ly} ${newState.rx} ${newState.ry}`);
            }
            console.log(`UPDATE ${newState.button} ${newState.dpad} ${newState.lx} ${newState.ly} ${newState.rx} ${newState.ry}`);
        }
    },
    computed: {
        currentControllerComponent: function() {
            // TODO: make this code less unwieldy.
            if (this.currentController < 0) return 'no-controller';
            let gamepad = this.getGamepad();
            if (!gamepad) {
                return 'no-controller';
            } else if (gamepad.mapping === 'standard') {
                // TODO: Provide device-specific spritesheets in certain situations where device name is available but mapping is standard.
                return 'xbox-controller';
            } else if (gamepad.id.indexOf('Pro Controller') > -1 && gamepad.id.indexOf('57e') > -1 && gamepad.id.indexOf('2009') > -1 && gamepad.axes.length < 9) {
                // Pro Controllers in Firefox report 4 axes. In Chrome, for some reason they report 9.
                return 'switch-pro-controller';
            } else if (gamepad.mapping === '' && gamepad.id.indexOf('54c') > -1 && gamepad.id.indexOf('9cc') > -1) {
                return 'ps4-controller';
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