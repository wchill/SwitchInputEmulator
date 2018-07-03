x<template>
  <v-container fluid>
    <v-layout row justify-center class="text-xs-center">
      <v-flex xs12>
        <h264-ws-player v-bind:endpoint="video" v-bind:canvas="streamCanvas"></h264-ws-player>
        <canvas class="controlCanvas" ref="controlCanvas"></canvas>
        <img ref="spriteSheet" v-bind:src="spriteSheetUrl" style="display:none;" @load="imageLoaded"/>
      </v-flex>
    </v-layout>
    <v-layout row justify-center class="text-xs-center">
      <opus-ws-player v-bind:endpoint="audio"></opus-ws-player>
    </v-layout>
  </v-container>
</template>

<script>
  import { mapGetters } from 'vuex';
  import { PlayerState, StatusBus, BusEvents } from '../mixins/Common';
  import JoyconSprites from '../mixins/JoyconSprites';
  import H264WebSocketPlayer, { PlayerBus, PlayerEvents } from './H264WebSocketPlayer';
  import OpusWebSocketPlayer from './OpusWebSocketPlayer';

  export default {
    mixins: [JoyconSprites],
    props: ['video', 'audio'],
    components: {
      'h264-ws-player': H264WebSocketPlayer,
      'opus-ws-player': OpusWebSocketPlayer,
    },
    data() {
      return {
        spriteSheetReady: false,
        streamCanvas: document.createElement('canvas'),
        streamReady: false,
        globalScaleFactor: 0.9,
      };
    },
    computed: {
      rightControllerX() {
        return this.canvasWidth - this.controllers.w;
      },
      leftControllerX() {
        return 0;
      },
      canvasWidth() {
        return (this.controllers.w * 2) + this.console.body.w;
      },
      canvasHeight() {
        return this.controllers.h;
      },
      consoleYOffset() {
        return this.controllers.h - this.console.body.h;
      },
      playerX() {
        return (this.controllers.w + this.console.screen.x) - this.console.body.x;
      },
      playerY() {
        return this.consoleYOffset + (this.console.screen.y - this.console.body.y);
      },
      playerScale() {
        if (this.streamReady) return this.console.screen.h / this.streamCanvas.height;
        return this.console.screen.h / 540;
      },
      playerWidth() {
        if (this.streamReady) return this.streamCanvas.width * this.playerScale;
        return 960 * this.playerScale;
      },
      playerHeight() {
        if (this.streamReady) return this.streamCanvas.height * this.playerScale;
        return 540 * this.playerScale;
      },
      ...mapGetters([
        'gamepadState',
        'playerState',
      ]),
    },
    methods: {
      getAbsoluteX(controller, relX) {
        if (controller === 'left') return this.leftControllerX + relX;
        return this.rightControllerX + relX;
      },
      getAbsoluteY(controller, relY) {
        return relY;
      },
      drawText(context, text, x, y, w, h) {
        /* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["context"] }] */
        context.save();

        const measure = context.measureText(text);
        const textW = measure.width;
        const textH = measure.height;

        context.fillStyle = '#000';
        context.fillRect(x + ((w - textW) / 2), y + ((h - textH) / 2), textW, textH);

        context.textAlign = 'center';
        context.font = '48px Roboto';
        context.fillStyle = '#fff';

        context.fillText(text, x + (w / 2), y + (h / 2));
        context.restore();
      },
      drawConsole() {
        const canvas = this.$refs.controlCanvas;
        const context = canvas.getContext('2d');
        const spriteSheet = this.$refs.spriteSheet;

        context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        // draw body
        context.drawImage(spriteSheet, this.console.body.x, this.console.body.y, this.console.body.w, this.console.body.h, this.controllers.w, this.consoleYOffset, this.console.body.w, this.console.body.h);
        // draw left controller
        context.drawImage(spriteSheet, this.controllers.left.x, this.controllers.left.y, this.controllers.w, this.controllers.h, this.leftControllerX, 0, this.controllers.w, this.controllers.h);
        // draw right controller
        context.drawImage(spriteSheet, this.controllers.right.x, this.controllers.right.y, this.controllers.w, this.controllers.h, this.rightControllerX, 0, this.controllers.w, this.controllers.h);
      },
      renderImage() {
        if (!this.spriteSheetReady) return;

        this.resizeCanvasIfNecessary();

        const self = this;
        const canvas = this.$refs.controlCanvas;
        const context = canvas.getContext('2d');
        const spriteSheet = this.$refs.spriteSheet;

        // draw the player
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

        const myState = this.gamepadState;
        const buttons = myState.buttons;
        const sticks = myState.sticks;

        Object.keys(this.buttonSprites).forEach((button) => {
          const pressed = buttons[button];
          self.renderButton(context, spriteSheet, button, pressed);
        });

        Object.keys(this.stickSprites).forEach((stick) => {
          const pressed = sticks[stick].pressed;
          const x = sticks[stick].x;
          const y = sticks[stick].y;
          self.renderStick(context, spriteSheet, stick, pressed, x, y);
        });
      },
      renderButton(context, spriteSheet, name, pressed) {
        const sprite = this.buttonSprites[name];

        const dstX = this.getAbsoluteX(sprite.controller, sprite.x);
        const dstY = this.getAbsoluteY(sprite.controller, sprite.y);

        const scale = sprite.scale || 1;

        if (!pressed || sprite.opacity) {
          const coord = sprite.inactive;
          context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, dstX, dstY, sprite.w * scale, sprite.h * scale);
        }
        if (pressed) {
          const coord = sprite.active;
          context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, dstX, dstY, sprite.w * scale, sprite.h * scale);
        }
      },
      renderStick(context, spriteSheet, name, pressed, x, y) {
        const sprite = this.stickSprites[name];
        if (!sprite) return;

        // Clear the stick bounding box
        const bbLeftX = this.getAbsoluteX(sprite.controller, sprite.x - sprite.travel);
        const bbTopY = this.getAbsoluteY(sprite.controller, sprite.y - sprite.travel);

        context.clearRect(bbLeftX, bbTopY, sprite.w + (2 * sprite.travel), sprite.h + (2 * sprite.travel));
        context.drawImage(spriteSheet, this.controllers[sprite.controller].x + (sprite.x - sprite.travel), this.controllers[sprite.controller].y + (sprite.y - sprite.travel), sprite.w + (2 * sprite.travel), sprite.h + (2 * sprite.travel), bbLeftX, bbTopY, sprite.w + (2 * sprite.travel), sprite.h + (2 * sprite.travel));

        // draw stick
        const relX = sprite.x + (x * sprite.travel);
        const relY = sprite.y + (y * sprite.travel);

        const dstX = this.getAbsoluteX(sprite.controller, relX);
        const dstY = this.getAbsoluteY(sprite.controller, relY);

        const coord = pressed ? sprite.active : sprite.inactive;
        context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, dstX, dstY, sprite.w, sprite.h);
      },
      imageLoaded() {
        this.spriteSheetReady = true;
      },
      resizeCanvasIfNecessary() {
        const canvas = this.$refs.controlCanvas;
        const rect = canvas.parentNode.getBoundingClientRect();
        const scale = (rect.width * this.globalScaleFactor) / this.canvasWidth;
        const calculatedWidth = this.canvasWidth * scale;
        const calculatedHeight = this.canvasHeight * scale;

        if (Math.abs(canvas.width - calculatedWidth) > 1 || Math.abs(canvas.height - calculatedHeight) > 1) {
          const context = canvas.getContext('2d');
          context.resetTransform();
          canvas.width = calculatedWidth;
          canvas.height = calculatedHeight;
          context.scale(scale, scale);
          this.drawConsole();
        }
      },
    },
    created() {
      const self = this;

      PlayerBus.$on(PlayerEvents.READY, (e) => {
        self.streamReady = true;
        self.streamCanvas = e.canvas;
      });
    },
    mounted() {
      StatusBus.$on(BusEvents.AFTER_UPDATE_INPUT, this.renderImage);
    },
    beforeDestroy() {
      this.spriteSheetReady = false;
      this.streamReady = false;
    },
    name: 'JoyconStreamRenderer',
  };
</script>

<style scoped>

</style>
