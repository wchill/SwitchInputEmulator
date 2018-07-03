<template>
  <canvas ref='playercanvas' v-show='displayPlayer'></canvas>
</template>

<script>
  import Vue from 'vue';
  import { PlayerState, StoreMutations } from '../mixins/Common';
  import { isWebGLSupported } from '../mixins/Utils';
  import WebSocketClient from '../assets/js/WebSocketClient';
  import WebGLCanvas from '../../static/js/lib/YUVCanvas';

  export const PlayerBus = new Vue();
  export const PlayerEvents = Object.freeze({
    PLAY: 'play',
    PAUSE: 'pause',
    READY: 'ready',
  });

  const webGLContextOptions = {
    /*
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
    // TODO: Add proper fallback so I can enable this option
    failIfMajorPerformanceCaveat: false,
    */
  };

  const workerFilePath = '/static/js/lib/Decoder.js';

  class CanvasWrapper {
    /* eslint no-underscore-dangle: ['error', { 'allowAfterThis': true }] */
    constructor(width, height, canvas, useWebGL) {
      if (canvas) {
        this.canvas = canvas;
      } else {
        this.canvas = document.createElement('canvas');
      }
      this.canvas.width = width;
      this.canvas.height = height;
      this.webGLCanvas = null;

      if (useWebGL) {
        this.initializeWebGLCanvas(width, height);
        this.renderFunc = this._renderFrameWebGL;
      } else {
        this.renderFunc = this._renderFrameRGB;
      }
    }

    initializeWebGLCanvas(width, height) {
      this.webGLCanvas = new WebGLCanvas({
        canvas: this.canvas,
        contextOptions: webGLContextOptions,
        width,
        height,
      });
    }

    renderFrame(width, height, data) {
      this.renderFunc(width, height, data);
    }

    _renderFrameWebGL(width, height, data) {
      if (!this.webGLCanvas || this.canvas.width !== width || this.canvas.height !== height) {
        this.initializeWebGLCanvas(width, height);
      }

      const yLen = width * height;
      const uvLen = (width / 2) * (height / 2);

      this.webGLCanvas.drawNextOutputPicture({
        yData: data.subarray(0, yLen),
        uData: data.subarray(yLen, yLen + uvLen),
        vData: data.subarray(yLen + uvLen, yLen + uvLen + uvLen),
      });
    }

    _renderFrameRGB(width, height, data) {
      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
      }

      const ctx = this.canvas.getContext('2d');
      const imageData = ctx.createImageData(width, height);
      imageData.data.set(data);
      ctx.putImageData(imageData, 0, 0);
    }
  }

  export default {
    props: ['endpoint', 'canvas'],
    name: 'H264WebSocketPlayer',
    data: () => ({
      ws: null,
      decodeWorker: null,
      queuedFrames: [],
      canvasWrapper: null,
      useWebGL: isWebGLSupported(),
    }),
    computed: {
      internalCanvas() {
        if (this.canvas) return this.canvas;
        return this.$refs.playercanvas;
      },
      displayPlayer() {
        return !this.canvas;
      },
    },
    methods: {
      playStream() {
        this.ws.send('REQUESTSTREAM');
      },
      stopStream() {
        this.ws.send('STOPSTREAM');
      },
      parseCommand(command) {
        const self = this;
        if (command.action === 'init') {
          this.$store.commit(StoreMutations.PLAYER_STATE, PlayerState.PLAYING);

          this.canvasWrapper = new CanvasWrapper(command.width, command.height, this.internalCanvas, this.useWebGL);

          PlayerBus.$emit(PlayerEvents.READY, {
            width: command.width,
            height: command.height,
            canvas: self.canvasWrapper.canvas,
          });
        } else {
          // Unknown action
        }
      },
      // Callback function from the decoder code when a new frame is decoded.
      onPictureDecoded(buffer, width, height) {
        if (!buffer) {
          return;
        }

        this.canvasWrapper.renderFrame(width, height, buffer);

        // Used to transfer ownership of memory back to the worker
        this.decodeWorker.postMessage({ reuse: buffer.buffer }, [buffer.buffer]);
      },
      decode(data, info) {
        // Transfers ownership of memory directly to worker
        this.decodeWorker.postMessage({
          buf: data.buffer,
          offset: data.byteOffset,
          length: data.length,
          info,
        }, [data.buffer]);

        // Safe implementation, copies memory and then transfers that to worker
        /*
        const copyU8 = new Uint8Array(data.length);
        copyU8.set(data);
        this.decodeWorker.postMessage({
          buf: copyU8.buffer,
          offset: data.byteOffset,
          length: data.length,
          info,
        }, [copyU8.buffer]);
        */
      },
    },
    mounted() {
      const self = this;

      this.decodeWorker = new Worker(workerFilePath);
      this.decodeWorker.addEventListener('message', (e) => {
        const data = e.data;

        self.onPictureDecoded(new Uint8Array(data.buf, 0, data.length), data.width, data.height);
      });

      this.decodeWorker.postMessage({
        type: 'Broadway.js - Worker init',
        options: {
          rgb: !this.useWebGL,
          memsize: this.memsize,
          reuseMemory: true,
        },
      });

      document.addEventListener('visibilitychange', () => {
        if (self.ws && self.ws.readyState === self.ws.OPEN) {
          if (document.visibilityState === 'visible') {
            // console.log('Resuming stream because page received focus');
            self.playStream();
            self.$store.commit(StoreMutations.PLAYER_STATE, PlayerState.PLAYING);
          } else {
            // console.log('Pausing stream because page lost focus');
            self.stopStream();
            self.$store.commit(StoreMutations.PLAYER_STATE, PlayerState.PAUSED);
          }
        }
      }, false);

      this.$store.commit(StoreMutations.PLAYER_STATE, PlayerState.CONNECTING);

      this.ws = new WebSocketClient(this.endpoint, null, {
        backoff: 'fibonacci',
      });
      this.ws.binaryType = 'arraybuffer';

      this.ws.addEventListener('close', () => {
        self.$store.commit(StoreMutations.PLAYER_STATE, PlayerState.NOT_CONNECTED);
      });

      this.ws.addEventListener('error', () => {
        self.$store.commit(StoreMutations.PLAYER_STATE, PlayerState.ERROR);
      });

      this.ws.addEventListener('reconnect', () => {
        self.$store.commit(StoreMutations.PLAYER_STATE, PlayerState.CONNECTING);
      });

      this.ws.addEventListener('message', (e) => {
        if (typeof e.data === 'string') {
          self.parseCommand(JSON.parse(e.data));
        } else {
          self.decode(new Uint8Array(e.data));
        }
      });
    },
  };
</script>

<style scoped>

</style>
