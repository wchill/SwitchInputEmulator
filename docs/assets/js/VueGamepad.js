Vue.component('no-controller', {
    template: '<p class="center-text">No controller connected</p>'
});

Vue.component('unsupported-controller', {
    delimiters: ['((', '))'],
    props: ['axes', 'buttons', 'gamepadname'],
    template: '<div><p class="center-text">This isn\'t a supported controller. Contact the dev with the following information to add support:</p><ul><li>(( gamepadname ))</li><li>(( axes.length )) axes</li><li>(( buttons.length )) buttons</li></ul></div>'
});

Vue.component('xbox-controller', {
    delimiters: ['((', '))'],
    props: ['gamepadindex', 'gamepadname', 'axes', 'buttons'],
    data: function() {
        return {
            buttonSprites: {a:{x:745,y:242,w:79,h:79,inactive:{x:1217,y:643},active:{x:1062,y:643}},b:{x:820,y:175,w:79,h:79,inactive:{x:1140,y:800},active:{x:1141,y:725}},x:{x:678,y:176,w:79,h:79,inactive:{x:1220,y:725},active:{x:1065,y:801}},y:{x:745,y:105,w:79,h:79,inactive:{x:1140,y:645},active:{x:1062,y:721}},leftTop:{x:144,y:0,w:245,h:90,inactive:{x:613,y:818},active:{x:1062,y:94}},rightTop:{x:645,y:0,w:245,h:90,inactive:{x:1056,y:0},active:{x:1056,y:188}},select:{x:414,y:183,w:54,h:54,inactive:{x:1241,y:552},active:{x:1244,y:460}},start:{x:569,y:183,w:54,h:54,inactive:{x:1245,y:370},active:{x:1247,y:278}},dpadUp:{x:352,y:290,w:70,h:87,inactive:{x:1074,y:557},active:{x:1166,y:557},opacity:!0},dpadDown:{x:351,y:369,w:70,h:87,inactive:{x:1074,y:366},active:{x:1165,y:366},opacity:!0},dpadLeft:{x:298,y:342,w:87,h:70,inactive:{x:1066,y:475},active:{x:1158,y:475},opacity:!0},dpadRight:{x:383,y:342,w:87,h:70,inactive:{x:1062,y:292},active:{x:1156,y:292},opacity:!0}},
            stickSprites: {leftStick:{x:185,y:134,w:150,h:150,travel:40,inactive:{x:464,y:816},active:{x:310,y:813}},rightStick:{x:581,y:290,w:150,h:150,travel:40,inactive:{x:464,y:816},active:{x:310,y:813}}},
            canvasSize: {
                width: 1040,
                height: 815,
                scale: 0.75
            },
            mapping: [
                {name: 'a', val: 2},
                {name: 'b', val: 4},
                {name: 'x', val: 1},
                {name: 'y', val: 8},
                {name: 'leftTop', val: 16},
                {name: 'rightTop', val: 32},
                {name: 'leftTrigger', val: 64},
                {name: 'rightTrigger', val: 128},
                {name: 'select', val: 256},
                {name: 'start', val: 512},
                {name: 'leftStick', isStick: true, axisX: 0, axisY: 1, val: 1024},
                {name: 'rightStick', isStick: true, axisX: 2, axisY: 3, val: 2048},
                {name: 'dpadUp', isDpad: true},
                {name: 'dpadDown', isDpad: true},
                {name: 'dpadLeft', isDpad: true},
                {name: 'dpadRight', isDpad: true}
            ],
            dpadButtons: [
                {name: 'dpadUp dpadRight', val: 1},
                {name: 'dpadDown dpadRight', val: 3},
                {name: 'dpadDown dpadLeft', val: 5},
                {name: 'dpadUp dpadLeft', val: 7},
                {name: 'dpadUp', val: 0},
                {name: 'dpadRight', val: 2},
                {name: 'dpadDown', val: 4},
                {name: 'dpadLeft', val: 6},
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
            pressedDpad: [],
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
        renderImage: function() {
            if (!this.spriteSheetReady) return;

            let canvas = this.$refs.gamepadCanvas;
            let context = canvas.getContext('2d');
            let spriteSheet = this.$refs.spriteSheet;

            context.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
            context.drawImage(spriteSheet, 0, 0, this.canvasSize.width, this.canvasSize.height, 0, 0, this.canvasSize.width, this.canvasSize.height);

            this.prevState.button = this.gamepadState.button;
            this.prevState.dpad = this.gamepadState.dpad;
            this.prevState.lx = this.gamepadState.lx;
            this.prevState.ly = this.gamepadState.ly;
            this.prevState.rx = this.gamepadState.rx;
            this.prevState.ry = this.gamepadState.ry;

            this.gamepadState.button = 0;
            this.gamepadState.dpad = 8;
            this.gamepadState.lx = 128;
            this.gamepadState.ly = 128;
            this.gamepadState.rx = 128;
            this.gamepadState.ry = 128;
            this.pressedDpad = [];

            for (let i = 0; i < this.buttons.length; i++) {
                if (i >= this.mapping.length) break;
                let mapping = this.mapping[i];
                if (!mapping) continue;
                if (mapping.isStick) {
                    this.renderStick(context, spriteSheet, i, mapping);
                } else {
                    this.renderButton(context, spriteSheet, i, mapping);
                }
            }

            let pressedDpadStr = this.pressedDpad.join(' ');

            for (let i = 0; i < this.dpadButtons.length; i++) {
                if (this.dpadButtons[i].name === pressedDpadStr) {
                    this.gamepadState.dpad = this.dpadButtons[i].val;
                    break;
                }
            }

            if (this.compareState()) {
                this.$emit('update', this.gamepadState);
            }
        },
        renderButton: function(context, spriteSheet, index, mapping) {
            let name = mapping.name;
            let sprite = this.buttonSprites[name];
            let pressed = !!this.buttons[index];

            if (!sprite) return;

            if (!pressed || sprite.opacity) {
                let coord = sprite.inactive;
                context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, sprite.x, sprite.y, sprite.w, sprite.h);
            }
            if (pressed) {
                let coord = sprite.active;
                context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, sprite.x, sprite.y, sprite.w, sprite.h);

                if (mapping.val) {
                    this.gamepadState.button += mapping.val;
                } else if (mapping.isDpad) {
                    this.pressedDpad.push(name);
                }
            }
        },
        renderStick: function(context, spriteSheet, index, mapping) {
            let name = mapping.name;
            let sprite = this.stickSprites[name];
            let pressed = !!this.buttons[index];
            let x = this.axes[mapping.axisX];
            let y = this.axes[mapping.axisY];

            let coord = pressed ? sprite.active : sprite.inactive;
            context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, sprite.x + x * sprite.travel, sprite.y + y * sprite.travel, sprite.w, sprite.h);

            if (name === 'leftStick') {
                this.gamepadState.lx = x;
                this.gamepadState.ly = y;
            } else {
                this.gamepadState.rx = x;
                this.gamepadState.ry = y;
            }
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
    beforeDestroy: function() {
        this.spriteSheetReady = false;
    },
    template: '<div><canvas class="gamepadCanvas" ref="gamepadCanvas"></canvas><img ref="spriteSheet" src="assets/images/xboxGamepadSprite.png" style="display:none;" @load="imageLoaded"/><span class="center-text">Controller: (( gamepadname ))</span></div>'
});
Vue.component('ps4-controller', {
    delimiters: ['((', '))'],
    props: ['gamepadindex', 'gamepadname', 'axes', 'buttons'],
    data: function() {
        return {
            buttonSprites: {a:{x:745,y:242,w:79,h:79,inactive:{x:1217,y:643},active:{x:1062,y:643}},b:{x:820,y:175,w:79,h:79,inactive:{x:1140,y:800},active:{x:1141,y:725}},x:{x:678,y:176,w:79,h:79,inactive:{x:1220,y:725},active:{x:1065,y:801}},y:{x:745,y:105,w:79,h:79,inactive:{x:1140,y:645},active:{x:1062,y:721}},leftTop:{x:144,y:0,w:245,h:90,inactive:{x:613,y:818},active:{x:1062,y:94}},rightTop:{x:645,y:0,w:245,h:90,inactive:{x:1056,y:0},active:{x:1056,y:188}},select:{x:414,y:183,w:54,h:54,inactive:{x:1241,y:552},active:{x:1244,y:460}},start:{x:569,y:183,w:54,h:54,inactive:{x:1245,y:370},active:{x:1247,y:278}},dpadUp:{x:352,y:290,w:70,h:87,inactive:{x:1074,y:557},active:{x:1166,y:557},opacity:!0},dpadDown:{x:351,y:369,w:70,h:87,inactive:{x:1074,y:366},active:{x:1165,y:366},opacity:!0},dpadLeft:{x:298,y:342,w:87,h:70,inactive:{x:1066,y:475},active:{x:1158,y:475},opacity:!0},dpadRight:{x:383,y:342,w:87,h:70,inactive:{x:1062,y:292},active:{x:1156,y:292},opacity:!0}},
            stickSprites: {leftStick:{x:185,y:134,w:150,h:150,travel:40,inactive:{x:464,y:816},active:{x:310,y:813}},rightStick:{x:581,y:290,w:150,h:150,travel:40,inactive:{x:464,y:816},active:{x:310,y:813}}},
            canvasSize: {
                width: 1040,
                height: 815,
                scale: 0.75
            },
            mapping: [
                {name: 'x', val: 1},
                {name: 'a', val: 2},
                {name: 'b', val: 4},
                {name: 'y', val: 8},
                {name: 'leftTop', val: 16},
                {name: 'rightTop', val: 32},
                {name: 'leftTrigger', val: 64},
                {name: 'rightTrigger', val: 128},
                {name: 'select', val: 256},
                {name: 'start', val: 512},
                {name: 'leftStick', isStick: true, axisX: 0, axisY: 1, val: 1024},
                {name: 'rightStick', isStick: true, axisX: 2, axisY: 5, val: 2048},
                null,
                {name: 'dpadUp', isDpad: true}
            ],
            dpadButtons: [
                {name: 'dpadUp dpadRight', val: 1},
                {name: 'dpadDown dpadRight', val: 3},
                {name: 'dpadDown dpadLeft', val: 5},
                {name: 'dpadUp dpadLeft', val: 7},
                {name: 'dpadUp', val: 0},
                {name: 'dpadRight', val: 2},
                {name: 'dpadDown', val: 4},
                {name: 'dpadLeft', val: 6},
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
            pressedDpad: [],
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
        renderImage: function() {
            if (!this.spriteSheetReady) return;

            let canvas = this.$refs.gamepadCanvas;
            let context = canvas.getContext('2d');
            let spriteSheet = this.$refs.spriteSheet;

            context.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
            context.drawImage(spriteSheet, 0, 0, this.canvasSize.width, this.canvasSize.height, 0, 0, this.canvasSize.width, this.canvasSize.height);

            this.prevState.button = this.gamepadState.button;
            this.prevState.dpad = this.gamepadState.dpad;
            this.prevState.lx = this.gamepadState.lx;
            this.prevState.ly = this.gamepadState.ly;
            this.prevState.rx = this.gamepadState.rx;
            this.prevState.ry = this.gamepadState.ry;

            this.gamepadState.button = 0;
            this.gamepadState.dpad = 8;
            this.gamepadState.lx = 128;
            this.gamepadState.ly = 128;
            this.gamepadState.rx = 128;
            this.gamepadState.ry = 128;
            this.pressedDpad = [];

            for (let i = 0; i < this.buttons.length; i++) {
                if (i >= this.mapping.length) break;
                let mapping = this.mapping[i];
                if (!mapping) continue;
                if (mapping.isStick) {
                    this.renderStick(context, spriteSheet, i, mapping);
                } else {
                    this.renderButton(context, spriteSheet, i, mapping);
                }
            }

            let pressedDpadStr = this.pressedDpad.join(' ');

            for (let i = 0; i < this.dpadButtons.length; i++) {
                if (this.dpadButtons[i].name === pressedDpadStr) {
                    this.gamepadState.dpad = this.dpadButtons[i].val;
                    break;
                }
            }

            if (this.compareState()) {
                this.$emit('update', this.gamepadState);
            }
        },
        renderButton: function(context, spriteSheet, index, mapping) {
            let name = mapping.name;
            let sprite = this.buttonSprites[name];
            let pressed = !!this.buttons[index];

            if (!sprite) return;

            if (!pressed || sprite.opacity) {
                let coord = sprite.inactive;
                context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, sprite.x, sprite.y, sprite.w, sprite.h);
            }
            if (pressed) {
                let coord = sprite.active;
                context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, sprite.x, sprite.y, sprite.w, sprite.h);

                if (mapping.val) {
                    this.gamepadState.button += mapping.val;
                } else if (mapping.isDpad) {
                    this.pressedDpad.push(name);
                }
            }
        },
        renderStick: function(context, spriteSheet, index, mapping) {
            let name = mapping.name;
            let sprite = this.stickSprites[name];
            let pressed = !!this.buttons[index];
            let x = this.axes[mapping.axisX];
            let y = this.axes[mapping.axisY];

            let coord = pressed ? sprite.active : sprite.inactive;
            context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, sprite.x + x * sprite.travel, sprite.y + y * sprite.travel, sprite.w, sprite.h);

            if (name === 'leftStick') {
                this.gamepadState.lx = x;
                this.gamepadState.ly = y;
            } else {
                this.gamepadState.rx = x;
                this.gamepadState.ry = y;
            }
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
    beforeDestroy: function() {
        this.spriteSheetReady = false;
    },
    template: '<div><canvas class="gamepadCanvas" ref="gamepadCanvas"></canvas><img ref="spriteSheet" src="assets/images/xboxGamepadSprite.png" style="display:none;" @load="imageLoaded"/><span class="center-text">Controller: (( gamepadname ))</span></div>'
});
Vue.component('switch-pro-controller', {
    delimiters: ['((', '))'],
    props: ['gamepadindex', 'gamepadname', 'axes', 'buttons'],
    data: function() {
        return {
            buttonSprites: {a:{x:745,y:242,w:79,h:79,inactive:{x:1217,y:643},active:{x:1062,y:643}},b:{x:820,y:175,w:79,h:79,inactive:{x:1140,y:800},active:{x:1141,y:725}},x:{x:678,y:176,w:79,h:79,inactive:{x:1220,y:725},active:{x:1065,y:801}},y:{x:745,y:105,w:79,h:79,inactive:{x:1140,y:645},active:{x:1062,y:721}},leftTop:{x:144,y:0,w:245,h:90,inactive:{x:613,y:818},active:{x:1062,y:94}},rightTop:{x:645,y:0,w:245,h:90,inactive:{x:1056,y:0},active:{x:1056,y:188}},select:{x:414,y:183,w:54,h:54,inactive:{x:1241,y:552},active:{x:1244,y:460}},start:{x:569,y:183,w:54,h:54,inactive:{x:1245,y:370},active:{x:1247,y:278}},dpadUp:{x:352,y:290,w:70,h:87,inactive:{x:1074,y:557},active:{x:1166,y:557},opacity:!0},dpadDown:{x:351,y:369,w:70,h:87,inactive:{x:1074,y:366},active:{x:1165,y:366},opacity:!0},dpadLeft:{x:298,y:342,w:87,h:70,inactive:{x:1066,y:475},active:{x:1158,y:475},opacity:!0},dpadRight:{x:383,y:342,w:87,h:70,inactive:{x:1062,y:292},active:{x:1156,y:292},opacity:!0}},
            stickSprites: {leftStick:{x:185,y:134,w:150,h:150,travel:40,inactive:{x:464,y:816},active:{x:310,y:813}},rightStick:{x:581,y:290,w:150,h:150,travel:40,inactive:{x:464,y:816},active:{x:310,y:813}}},
            canvasSize: {
                width: 1040,
                height: 815,
                scale: 0.75
            },
            mapping: [
                {name: 'a', val: 2},
                {name: 'b', val: 4},
                {name: 'x', val: 1},
                {name: 'y', val: 8},
                {name: 'leftTop', val: 16},
                {name: 'rightTop', val: 32},
                {name: 'leftTrigger', val: 64},
                {name: 'rightTrigger', val: 128},
                {name: 'select', val: 256},
                {name: 'start', val: 512},
                {name: 'leftStick', isStick: true, axisX: 0, axisY: 1, val: 1024},
                {name: 'rightStick', isStick: true, axisX: 3, axisY: 4, val: 2048}
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
            }
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
        renderImage: function() {
            if (!this.spriteSheetReady) return;

            let canvas = this.$refs.gamepadCanvas;
            let context = canvas.getContext('2d');
            let spriteSheet = this.$refs.spriteSheet;

            context.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
            context.drawImage(spriteSheet, 0, 0, this.canvasSize.width, this.canvasSize.height, 0, 0, this.canvasSize.width, this.canvasSize.height);

            this.prevState.button = this.gamepadState.button;
            this.prevState.dpad = this.gamepadState.dpad;
            this.prevState.lx = this.gamepadState.lx;
            this.prevState.ly = this.gamepadState.ly;
            this.prevState.rx = this.gamepadState.rx;
            this.prevState.ry = this.gamepadState.ry;

            this.gamepadState.button = 0;
            this.gamepadState.dpad = 8;
            this.gamepadState.lx = 128;
            this.gamepadState.ly = 128;
            this.gamepadState.rx = 128;
            this.gamepadState.ry = 128;

            for (let i = 0; i < this.buttons.length; i++) {
                if (i >= this.mapping.length) break;
                let mapping = this.mapping[i];
                if (!mapping) continue;
                if (mapping.isStick) {
                    this.renderStick(context, spriteSheet, i, mapping);
                } else {
                    this.renderButton(context, spriteSheet, i, mapping);
                }
            }

            this.gamepadState.dpad = ((this.axes[9] + 1.2) * 3.5) | 0;

            if (this.compareState()) {
                this.$emit('update', this.gamepadState);
            }
        },
        renderButton: function(context, spriteSheet, index, mapping) {
            let name = mapping.name;
            let sprite = this.buttonSprites[name];
            let pressed = !!this.buttons[index];

            if (!sprite) return;

            if (!pressed || sprite.opacity) {
                let coord = sprite.inactive;
                context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, sprite.x, sprite.y, sprite.w, sprite.h);
            }
            if (pressed) {
                let coord = sprite.active;
                context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, sprite.x, sprite.y, sprite.w, sprite.h);

                if (mapping.val) {
                    this.gamepadState.button += mapping.val;
                } else if (mapping.isDpad) {
                    this.pressedDpad.push(name);
                }
            }
        },
        renderStick: function(context, spriteSheet, index, mapping) {
            let name = mapping.name;
            let sprite = this.stickSprites[name];
            let pressed = !!this.buttons[index];
            let x = this.axes[mapping.axisX];
            let y = this.axes[mapping.axisY];

            let coord = pressed ? sprite.active : sprite.inactive;
            context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, sprite.x + x * sprite.travel, sprite.y + y * sprite.travel, sprite.w, sprite.h);

            if (name === 'leftStick') {
                this.gamepadState.lx = x;
                this.gamepadState.ly = y;
            } else {
                this.gamepadState.rx = x;
                this.gamepadState.ry = y;
            }
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
    beforeDestroy: function() {
        this.spriteSheetReady = false;
    },
    template: '<div><canvas class="gamepadCanvas" ref="gamepadCanvas"></canvas><img ref="spriteSheet" src="assets/images/xboxGamepadSprite.png" style="display:none;" @load="imageLoaded"/><span class="center-text">Controller: (( gamepadname ))</span></div>'
});

new Vue({
    delimiters: ['((', '))'],
    el: '#app',
    data: {
        connectionState: 'Not connected',
        turnState: 'Not your turn',
        commitHash: '',
        currentController: -1,
        axes: [],
        buttons: [],
        deadzone: 0.15
    },
    created: function() {
        let that = this;

        window.addEventListener('gamepadconnected', function(e) {
            console.log('Detected gamepad: ' + e.gamepad.id);
            if (that.currentController < 0 || that.currentControllerComponent === 'unsupported-controller') {
                that.currentController = e.gamepad.index;
            }
        });

        window.addEventListener('gamepaddisconnected', function(e) {
            console.log('Gamepad disconnected: ' + e.gamepad.id);
            if (that.currentController.index === e.gamepad.index) {
                that.currentController = -1;
                that.currentController = that.getGamepad().index;
            }
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
        calculateStickDeadzone: function(x, y) {
            let res = [128, 128];
            let mag = Math.sqrt((x * x) + (y * y));
            if (mag >= this.deadzone) {
                if (mag === 0) mag = 1;
                let normX = Math.abs(x / mag);
                let normY = Math.abs(y / mag);
                let outX = normX * ((x - this.deadzone) / (1 - this.deadzone));
                let outY = normY * ((y - this.deadzone) / (1 - this.deadzone));

                res[0] = outX * 128;
                if (res[0] < 0) res[0] = 0;
                else if (res[0] > 255) res[0] = 255;
                res[0] |= 0;

                res[1] = outY * 128;
                if (res[1] < 0) res[1] = 0;
                else if (res[1] > 255) res[1] = 255;
                res[1] |= 0;
            }

            return res;
        },
        onChildUpdate: function(newState) {
            let ls = this.calculateStickDeadzone(newState.lx, newState.ly);
            let rs = this.calculateStickDeadzone(newState.rx, newState.ry);
            console.log(`UPDATE ${newState.button} ${newState.dpad} ${ls[0]} ${ls[1]} ${rs[0]} ${rs[1]}`);
        }
    },
    computed: {
        currentControllerComponent: function() {
            if (this.currentController < 0) return 'no-controller';
            let gamepad = this.getGamepad();
            if (!gamepad) {
                return 'no-controller';
            } else if (gamepad.mapping === 'standard') {
                return 'xbox-controller';
            } else if (gamepad.id.indexOf('Pro Controller') > -1 && gamepad.id.indexOf('057e') > -1 && gamepad.id.indexOf('2009') > -1) {
                return 'switch-pro-controller';
            } else if (gamepad.mapping === '' && gamepad.id.indexOf('054c-09cc') > -1) {
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