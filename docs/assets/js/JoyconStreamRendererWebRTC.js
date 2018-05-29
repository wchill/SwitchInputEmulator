import {JoyconSprites} from "./JoyconStreamRenderer";
import {WebSocketClient} from "./lib/WebSocketClient";

export const JoyconStreamRendererWebRTC = {
    mixins: [JoyconSprites],
    props: ['endpoint'],
    data: function () {
        return {
            spriteSheetReady: false,
            ws: null,
            webRtcPeer: null
        };
    },
    computed: {
        rightControllerX: function () {
            return this.canvasWidth - this.controllers.w;
        },
        leftControllerX: function () {
            return 0;
        },
        canvasWidth: function () {
            return this.controllers.w * 2 + this.console.body.w;
        },
        canvasHeight: function () {
            return this.controllers.h;
        },
        consoleYOffset: function () {
            return this.controllers.h - this.console.body.h;
        },
        playerX: function () {
            return this.controllers.w + this.console.screen.x - this.console.body.x;
        },
        playerY: function () {
            return this.consoleYOffset + (this.console.screen.y - this.console.body.y);
        },
        playerScale: function () {
            return this.console.screen.h / this.$refs.webRTCVideo.height;
        },
        playerWidth: function () {
            return this.$refs.webRTCVideo.width * this.playerScale;
        },
        playerHeight: function () {
            return this.$refs.webRTCVideo.height * this.playerScale;
        },
        ...Vuex.mapGetters([
            'gamepadState',
            'playerState'
        ])
    },
    methods: {
        getAbsoluteX: function (controller, relX) {
            if (controller === 'left') return this.leftControllerX + relX;
            else return this.rightControllerX + relX;
        },
        getAbsoluteY: function (controller, relY) {
            return relY;
        },
        drawText: function (context, text, x, y, w, h) {
            context.save();

            let measure = context.measureText(text);
            let textW = measure.width;
            let textH = measure.height;

            context.fillStyle = '#000';
            context.fillRect(x + (w - textW) / 2, y + (h - textH) / 2, textW, textH);

            context.textAlign = 'center';
            context.font = '48px Arial';
            context.fillStyle = '#fff';

            context.fillText(text, x + w / 2, y + h / 2);
            context.restore();
        },
        renderImage: function () {
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

            context.drawImage(this.$refs.webRTCVideo, this.playerX, this.playerY, this.playerWidth, this.playerHeight);

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
        renderButton: function (context, spriteSheet, name, pressed) {
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
        renderStick: function (context, spriteSheet, name, pressed, x, y) {
            let sprite = this.stickSprites[name];
            if (!sprite) return;

            let relX = sprite.x + x * sprite.travel;
            let relY = sprite.y + y * sprite.travel;

            let dstX = this.getAbsoluteX(sprite.controller, relX);
            let dstY = this.getAbsoluteY(sprite.controller, relY);

            let coord = pressed ? sprite.active : sprite.inactive;
            context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, dstX, dstY, sprite.w, sprite.h);
        },
        imageLoaded: function () {
            this.spriteSheetReady = true;
            this.renderImage();
        },
        onError: function (error) {
            console.log(error);
            return error;
        },
        viewerResponse: function (message) {
            if (message.response !== 'accepted') {
                let errorMsg = message.message ? message.message : 'Unknown error';
                console.warn('Call not accepted for the following reason: ' + errorMsg);
                this.dispose();
            } else {
                this.webRtcPeer.processAnswer(message.sdpAnswer);
            }
        },
        viewer: function () {
            if (!this.webRtcPeer) {
                let options = {
                    remoteVideo: this.$refs.webRTCVideo,
                    onicecandidate: this.onIceCandidate
                };

                let self = this;
                this.webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function (error) {
                    if (error) return self.onError(error);

                    this.generateOffer(self.onOfferViewer);
                });
            }
        },
        onOfferViewer: function (error, offerSdp) {
            if (error) return this.onError(error);
            let message = {
                id: 'viewer',
                sdpOffer: offerSdp
            };
            this.sendMessage(message);
        },
        onIceCandidate: function (candidate) {
            console.log('Local candidate' + JSON.stringify(candidate));
            let message = {
                id: 'onIceCandidate',
                candidate: candidate
            };
            this.sendMessage(message);
        },
        stop: function () {
            if (webRtcPeer) {
                let message = {
                    id: 'stop'
                };
                this.sendMessage(message);
                this.dispose();
            }
        },
        dispose: function () {
            if (this.webRtcPeer) {
                this.webRtcPeer.dispose();
                this.webRtcPeer = null;
            }
        },
        sendMessage: function (message) {
            let jsonMessage = JSON.stringify(message);
            console.log('Sending message: ' + jsonMessage);
            this.ws.send(jsonMessage);
        }
    },
    mounted: function () {
        let canvas = this.$refs.controlCanvas;
        let rect = canvas.parentNode.getBoundingClientRect();
        let scale = rect.width * 0.75 / this.canvasWidth;
        canvas.width = this.canvasWidth * scale;
        canvas.height = this.canvasHeight * scale;
        let context = canvas.getContext('2d');
        context.scale(scale, scale);

        this.ws = new WebSocketClient(this.endpoint, null, {
            backoff: 'fibonacci'
        });

        let self = this;
        this.ws.addEventListener('open', function () {
            window.setInterval(function () {
                self.sendMessage({
                    id: 'ping'
                });
            }, 3000);
            self.viewer();
        });

        this.ws.addEventListener('message', function (message) {
            let parsedMessage = JSON.parse(message.data);
            if (parsedMessage.id !== 'pong') {
                console.info('Received message: ' + message.data);
            }

            switch (parsedMessage.id) {
                case 'viewerResponse':
                    self.viewerResponse(parsedMessage);
                    break;
                case 'stopCommunication':
                    self.dispose();
                    break;
                case 'iceCandidate':
                    self.webRtcPeer.addIceCandidate(parsedMessage.candidate);
                    break;
                case 'pong':
                    break;
                default:
                    console.error('Unrecognized message', parsedMessage);
            }
        });

        this.renderImage();
    },
    beforeDestroy: function () {
        this.spriteSheetReady = false;
    },
    template: '<div><video hidden ref="webRTCVideo" autoplay width="640px" height="360px" style="object-fit:fill;" controls="false"></video><canvas class="controlCanvas" ref="controlCanvas"></canvas><img ref="spriteSheet" v-bind:src="spriteSheetUrl" style="display:none;" @load="imageLoaded"/></div>'
};