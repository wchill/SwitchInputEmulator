import {StatusBus, BusEvents} from "./Common";

export const ProControllerSprites = {
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
            }
        };
    }
};

export const XboxControllerSprites = {
    data: function() {
        return {
            spriteSheetUrl: 'assets/images/xboxGamepadSpritesheet.png',
            buttonSprites: {faceDown:{x:745,y:242,w:79,h:79,inactive:{x:1217,y:643},active:{x:1062,y:643}},faceRight:{x:820,y:175,w:79,h:79,inactive:{x:1140,y:800},active:{x:1141,y:725}},faceLeft:{x:678,y:176,w:79,h:79,inactive:{x:1220,y:725},active:{x:1065,y:801}},faceUp:{x:745,y:105,w:79,h:79,inactive:{x:1140,y:645},active:{x:1062,y:721}},leftTop:{x:144,y:0,w:245,h:90,inactive:{x:613,y:818},active:{x:1062,y:94}},rightTop:{x:645,y:0,w:245,h:90,inactive:{x:1056,y:0},active:{x:1056,y:188}},select:{x:414,y:183,w:54,h:54,inactive:{x:1241,y:552},active:{x:1244,y:460}},start:{x:569,y:183,w:54,h:54,inactive:{x:1245,y:370},active:{x:1247,y:278}},dpadUp:{x:352,y:290,w:70,h:87,inactive:{x:1074,y:557},active:{x:1166,y:557},opacity:!0},dpadDown:{x:351,y:369,w:70,h:87,inactive:{x:1074,y:366},active:{x:1165,y:366},opacity:!0},dpadLeft:{x:298,y:342,w:87,h:70,inactive:{x:1066,y:475},active:{x:1158,y:475},opacity:!0},dpadRight:{x:383,y:342,w:87,h:70,inactive:{x:1062,y:292},active:{x:1156,y:292},opacity:!0}},
            stickSprites: {leftStick:{x:185,y:134,w:150,h:150,travel:40,inactive:{x:464,y:816},active:{x:310,y:813}},rightStick:{x:581,y:290,w:150,h:150,travel:40,inactive:{x:464,y:816},active:{x:310,y:813}}},
            canvasSize: {
                x: 0,
                y: 0,
                width: 1040,
                height: 700,
                scale: 0.75
            }
        };
    }
};

export const ControllerRenderer = {
    mixins: [ProControllerSprites],
    data: function() {
        return {
            spriteSheetReady: false
        };
    },
    methods: {
        setStylesheet: function(stylesheet) {
            this.spriteSheetReady = false;
            this.buttonSprites = stylesheet.buttonSprites;
            this.stickSprites = stylesheet.stickSprites;
            this.canvasSize = stylesheet.canvasSize;
            this.spriteSheetUrl = stylesheet.spriteSheetUrl;
        },
        renderImage: function(newState) {
            if (!this.spriteSheetReady) return;

            let that = this;
            let canvas = this.$refs.controlCanvas;
            let context = canvas.getContext('2d');
            let spriteSheet = this.$refs.spriteSheet;

            StatusBus.$emit(BusEvents.RENDER_TIME_START);

            context.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
            context.drawImage(spriteSheet, this.canvasSize.x, this.canvasSize.y, this.canvasSize.width, this.canvasSize.height, 0, 0, this.canvasSize.width, this.canvasSize.height);

            if (!newState) {
                // draw controller with default state
                Object.keys(this.buttonSprites).map(function (button) {
                    that.renderButton(context, spriteSheet, button, false);
                });

                Object.keys(this.stickSprites).map(function (stick) {
                    that.renderStick(context, spriteSheet, stick, false, 0, 0);
                });
            } else {
                let buttons = newState.state.buttons;
                let sticks = newState.state.sticks;

                Object.keys(this.buttonSprites).map(function (button) {
                    let pressed = buttons[button];
                    that.renderButton(context, spriteSheet, button, pressed);
                });

                Object.keys(this.stickSprites).map(function (stick) {
                    let pressed = sticks[stick].pressed;
                    let x = sticks[stick].x;
                    let y = sticks[stick].y;
                    that.renderStick(context, spriteSheet, stick, pressed, x, y);
                });
            }
            StatusBus.$emit(BusEvents.RENDER_TIME_END);
        },
        renderButton: function(context, spriteSheet, name, pressed) {
            let sprite = this.buttonSprites[name];

            if (!pressed || sprite.opacity) {
                let coord = sprite.inactive;
                context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, sprite.x, sprite.y, sprite.w, sprite.h);
            }
            if (pressed) {
                let coord = sprite.active;
                context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, sprite.x, sprite.y, sprite.w, sprite.h);
            }
        },
        renderStick: function(context, spriteSheet, name, pressed, x, y) {
            let sprite = this.stickSprites[name];
            if (!sprite) return;

            let coord = pressed ? sprite.active : sprite.inactive;
            context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, sprite.x + x * sprite.travel, sprite.y + y * sprite.travel, sprite.w, sprite.h);
        },
        imageLoaded: function() {
            let canvas = this.$refs.controlCanvas;
            canvas.width = this.canvasSize.width * this.canvasSize.scale;
            canvas.height = this.canvasSize.height * this.canvasSize.scale;

            let context = canvas.getContext('2d');
            context.scale(this.canvasSize.scale, this.canvasSize.scale);

            this.spriteSheetReady = true;
            this.renderImage();
        }
    },
    mounted: function() {
        StatusBus.$on(BusEvents.INPUT_CHANGED, this.renderImage);
    },
    beforeDestroy: function() {
        this.spriteSheetReady = false;
    },
    template: '<div><canvas class="controlCanvas" ref="controlCanvas"></canvas><img ref="spriteSheet" v-bind:src="spriteSheetUrl" style="display:none;" @load="imageLoaded"/></div>'
};