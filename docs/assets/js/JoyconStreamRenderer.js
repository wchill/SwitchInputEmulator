import {PlayerState} from "./Common";
import {H264Player, PlayerBus, PlayerEvents} from "./H264WebSocketPlayer";

export const JoyconSprites = {
    data: function() {
        return {
            spriteSheetUrl: 'assets/images/joyconSpritesheet2.png',
            buttonSprites: {faceRight:{controller:'right',x:154,y:179,w:58,h:58,inactive:{x:5,y:5},active:{x:73,y:5}},faceDown:{controller:'right',x:92,y:238,w:58,h:58,inactive:{x:141,y:5},active:{x:209,y:5}},faceUp:{controller:'right',x:92,y:120,w:58,h:58,inactive:{x:709,y:5},active:{x:777,y:5}},faceLeft:{controller:'right',x:31,y:179,w:58,h:58,inactive:{x:709,y:73},active:{x:777,y:73}},leftTop:{controller:'left',x:7,y:1,w:206,h:110,inactive:{x:277,y:5},active:{x:493,y:5}},rightTop:{controller:'right',x:47,y:1,w:207,h:110,inactive:{x:5,y:125},active:{x:222,y:125}},leftTrigger:{controller:'left',x:79,y:10,w:150,h:150,scale:0.75,inactive:{x:439,y:141},active:{x:599,y:141}},rightTrigger:{controller:'right',x:61,y:10,w:150,h:150,scale:0.75,inactive:{x:5,y:301},active:{x:165,y:301}},select:{controller:'left',x:196,y:80,w:42,h:14,inactive:{x:845,y:5},active:{x:845,y:29}},start:{controller:'right',x:21,y:65,w:44,h:44,inactive:{x:845,y:53},active:{x:827,y:282}},share:{controller:'left',x:157,y:550,w:49,h:49,inactive:{x:529,y:336},active:{x:588,y:336}},home:{controller:'right',x:47,y:543,w:63,h:63,inactive:{x:759,y:209},active:{x:832,y:209}},dpadUp:{controller:'left',x:110,y:339,w:58,h:58,inactive:{x:647,y:336},active:{x:827,y:336}},dpadDown:{controller:'left',x:110,y:456,w:58,h:58,inactive:{x:759,y:141},active:{x:827,y:141}},dpadLeft:{controller:'left',x:48,y:398,w:58,h:58,inactive:{x:325,y:282},active:{x:759,y:282}},dpadRight:{controller:'left',x:171,y:398,w:58,h:58,inactive:{x:393,y:336},active:{x:461,y:336}}},
            stickSprites: {leftStick:{controller:'left',x:79,y:148,w:120,h:120,travel:30,inactive:{x:5,y:813},active:{x:135,y:813}},rightStick:{controller:'right',x:61,y:367,w:120,h:120,travel:30,inactive:{x:535,y:813},active:{x:665,y:813}}},
            controllers: {
                left: {
                    x: 905,
                    y: 5
                },
                right: {
                    x: 265,
                    y: 813
                },
                w: 260,
                h: 798
            },
            console: {
                body: {
                    x: 792,
                    y: 816,
                    w: 1349,
                    h: 792
                },
                screen: {
                    x: 922,
                    y: 908,
                    w: 1088,
                    h: 612
                }
            }
        };
    }
};

export const JoyconStreamRenderer = {
    mixins: [JoyconSprites],
    props: ['endpoint'],
    components: {
        'h264-ws-player': H264Player
    },
    data: function() {
        return {
            spriteSheetReady: false,
            streamCanvas: document.createElement('canvas'),
            streamReady: false
        };
    },
    computed: {
        rightControllerX: function() {
            return this.canvasWidth - this.controllers.w;
        },
        leftControllerX: function() {
            return 0;
        },
        canvasWidth: function() {
            return this.controllers.w * 2 + this.console.body.w;
        },
        canvasHeight: function() {
            return this.controllers.h;
        },
        consoleYOffset: function() {
            return this.controllers.h - this.console.body.h;
        },
        playerX: function() {
            return this.controllers.w + this.console.screen.x - this.console.body.x;
        },
        playerY: function() {
            return this.consoleYOffset + (this.console.screen.y - this.console.body.y);
        },
        playerScale: function() {
            if (this.streamReady) return this.console.screen.h / this.streamCanvas.height;
            return this.console.screen.h / 540;
        },
        playerWidth: function() {
            if (this.streamReady) return this.streamCanvas.width * this.playerScale;
            return 960 * this.playerScale;
        },
        playerHeight: function() {
            if (this.streamReady) return this.streamCanvas.height * this.playerScale;
            return 540 * this.playerScale;
        },
        ...Vuex.mapGetters([
            'gamepadState',
            'playerState'
        ])
    },
    methods: {
        getAbsoluteX: function(controller, relX) {
            if (controller === 'left') return this.leftControllerX + relX;
            else return this.rightControllerX + relX;
        },
        getAbsoluteY: function(controller, relY) {
            return relY;
        },
        drawText: function(context, text, x, y, w, h) {
            context.save();

            let measure = context.measureText(text);
            let textW = measure.width;
            let textH = measure.height;

            context.fillStyle = '#000';
            context.fillRect(x + (w - textW) / 2, y + (h - textH) / 2, textW, textH);

            context.textAlign = 'center';
            context.font = '48px Arial';
            context.fillStyle = '#fff';

            context.fillText(text, x + w/2, y + h/2);
            context.restore();
        },
        renderImage: function() {
            if (!this.spriteSheetReady) return;

            let self = this;
            let canvas = this.$refs.controlCanvas;
            let context = canvas.getContext('2d');
            let spriteSheet = this.$refs.spriteSheet;

            context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            // draw body
            context.drawImage(spriteSheet, this.console.body.x, this.console.body.y, this.console.body.w, this.console.body.h, this.controllers.w, this.consoleYOffset, this.console.body.w, this.console.body.h);
            // draw left controller
            context.drawImage(spriteSheet, this.controllers.left.x, this.controllers.left.y, this.controllers.w, this.controllers.h, this.leftControllerX, 0, this.controllers.w, this.controllers.h);
            // draw right controller
            context.drawImage(spriteSheet, this.controllers.right.x, this.controllers.right.y, this.controllers.w, this.controllers.h, this.rightControllerX, 0, this.controllers.w, this.controllers.h);
            context.drawImage(this.streamCanvas, this.playerX, this.playerY, this.playerWidth, this.playerHeight);
            if (this.playerState !== PlayerState.PLAYING && this.playerState !== PlayerState.PAUSED) {
                let text;
                if (this.playerState === PlayerState.NOT_CONNECTED) {
                    text = 'Not connected';
                } else if (this.playerState === PlayerState.CONNECTING) {
                    text = 'Connecting to stream';
                } else {
                    text = 'Error playing stream';
                }
                this.drawText(context, text, this.playerX, this.playerY, this.playerWidth, this.playerHeight);
            }

            let myState = this.gamepadState;
            let buttons = myState.buttons;
            let sticks = myState.sticks;

            Object.keys(this.buttonSprites).map(function (button) {
                let pressed = buttons[button];
                self.renderButton(context, spriteSheet, button, pressed);
            });

            Object.keys(this.stickSprites).map(function (stick) {
                let pressed = sticks[stick].pressed;
                let x = sticks[stick].x;
                let y = sticks[stick].y;
                self.renderStick(context, spriteSheet, stick, pressed, x, y);
            });

            requestAnimationFrame(this.renderImage);
        },
        renderButton: function(context, spriteSheet, name, pressed) {
            let sprite = this.buttonSprites[name];

            let dstX = this.getAbsoluteX(sprite.controller, sprite.x);
            let dstY = this.getAbsoluteY(sprite.controller, sprite.y);

            let scale = sprite.scale || 1;

            if (!pressed || sprite.opacity) {
                let coord = sprite.inactive;
                context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, dstX, dstY, sprite.w * scale, sprite.h * scale);
            }
            if (pressed) {
                let coord = sprite.active;
                context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, dstX, dstY, sprite.w * scale, sprite.h * scale);
            }
        },
        renderStick: function(context, spriteSheet, name, pressed, x, y) {
            let sprite = this.stickSprites[name];
            if (!sprite) return;

            let relX = sprite.x + x * sprite.travel;
            let relY = sprite.y + y * sprite.travel;

            let dstX = this.getAbsoluteX(sprite.controller, relX);
            let dstY = this.getAbsoluteY(sprite.controller, relY);

            let coord = pressed ? sprite.active : sprite.inactive;
            context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, dstX, dstY, sprite.w, sprite.h);
        },
        imageLoaded: function() {
            this.spriteSheetReady = true;
            this.renderImage();
        }
    },
    created: function() {
        let self = this;

        PlayerBus.$on(PlayerEvents.READY, function(size) {
            self.streamReady = true;
        });
    },
    mounted: function() {
        //StatusBus.$on(BusEvents.INPUT_CHANGED, this.renderImage);
        let canvas = this.$refs.controlCanvas;
        let rect = canvas.parentNode.getBoundingClientRect();
        let scale = rect.width * 0.75 / this.canvasWidth;
        canvas.width = this.canvasWidth * scale;
        canvas.height = this.canvasHeight * scale;
        let context = canvas.getContext('2d');
        context.scale(scale, scale);
        this.renderImage();
    },
    beforeDestroy: function() {
        this.spriteSheetReady = false;
        this.streamReady = false;
    },
    template: '<div><h264-ws-player v-bind:endpoint="endpoint" v-bind:canvas="streamCanvas"></h264-ws-player><canvas class="controlCanvas" ref="controlCanvas"></canvas><img ref="spriteSheet" v-bind:src="spriteSheetUrl" style="display:none;" @load="imageLoaded"/></div>'
};