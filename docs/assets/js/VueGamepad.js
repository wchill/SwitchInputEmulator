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
                {name: 'a', isStick: false},
                {name: 'b', isStick: false},
                {name: 'x', isStick: false},
                {name: 'y', isStick: false},
                {name: 'leftTop', isStick: false},
                {name: 'rightTop', isStick: false},
                {name: 'leftTrigger', isStick: false},
                {name: 'rightTrigger', isStick: false},
                {name: 'select', isStick: false},
                {name: 'start', isStick: false},
                {name: 'leftStick', isStick: true, axisX: 0, axisY: 1},
                {name: 'rightStick', isStick: true, axisX: 2, axisY: 3},
                {name: 'dpadUp', isStick: false},
                {name: 'dpadDown', isStick: false},
                {name: 'dpadLeft', isStick: false},
                {name: 'dpadRight', isStick: false}
            ],
            spriteSheetReady: false
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
        renderImage: function() {
            if (!this.spriteSheetReady) return;

            let canvas = this.$refs.gamepadCanvas;
            let context = canvas.getContext('2d');
            let spriteSheet = this.$refs.spriteSheet;

            context.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
            context.drawImage(spriteSheet, 0, 0, this.canvasSize.width, this.canvasSize.height, 0, 0, this.canvasSize.width, this.canvasSize.height);

            for (let i = 0; i < this.buttons.length; i++) {
                if (i >= this.mapping.length) return;
                let mapping = this.mapping[i];
                if (!mapping) continue;
                if (mapping.isStick) {
                    this.renderStick(context, spriteSheet, i, mapping);
                } else {
                    this.renderButton(context, spriteSheet, i, mapping);
                }
            }
        },
        renderButton: function(context, spriteSheet, index, mapping) {
            let name = mapping['name'];
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
            }
        },
        renderStick: function(context, spriteSheet, index, mapping) {
            let name = mapping['name'];
            let sprite = this.stickSprites[name];
            let pressed = !!this.buttons[index];
            let x = this.axes[mapping['axisX']];
            let y = this.axes[mapping['axisY']];

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
        }
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
        currentController: null,
        axes: [],
        buttons: []
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
            let newButtons = [];
            let newAxes = [];

            let gamepad = this.getGamepad();
            for (let i = 0; i < gamepad.buttons.length; i++) {
                newButtons.push(gamepad.buttons[i].value);
            }
            for (let i = 0; i < gamepad.axes.length; i++) {
                newAxes.push(gamepad.axes[i]);
            }
            this.axes = newAxes;
            this.buttons = newButtons;

            requestAnimationFrame(this.update);
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