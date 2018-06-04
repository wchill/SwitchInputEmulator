<template>
  <canvas ref="playercanvas" v-show="displayPlayer"></canvas>
</template>

<script>
  import Vue from 'vue';
  import { PlayerState, StoreMutations } from '../mixins/Common';
  import WebSocketClient from '../assets/js/WebSocketClient';

  export const PlayerBus = new Vue();
  export const PlayerEvents = Object.freeze({
    PLAY: 'play',
    PAUSE: 'pause',
    READY: 'ready',
  });

  export default {
    props: ['endpoint', 'canvas'],
    name: 'H264WebSocketPlayer',
    data: () => ({
      player: null,
      ws: null,
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
    mounted() {
      const self = this;

      document.addEventListener('visibilitychange', () => {
        if (self.player) {
          if (document.visibilityState === 'visible') {
            // console.log('Resuming stream because page received focus');
            self.player.playStream();
            self.$store.commit(StoreMutations.PLAYER_STATE, PlayerState.PLAYING);
          } else {
            // console.log('Pausing stream because page lost focus');
            self.player.stopStream();
            self.$store.commit(StoreMutations.PLAYER_STATE, PlayerState.PAUSED);
          }
        }
      }, false);

      this.internalCanvas.width = 960;
      this.internalCanvas.height = 540;

      this.$store.commit(StoreMutations.PLAYER_STATE, PlayerState.CONNECTING);

      this.ws = new WebSocketClient(this.endpoint, null, {
        backoff: 'fibonacci',
      });

      this.ws.addEventListener('close', () => {
        self.$store.commit(StoreMutations.PLAYER_STATE, PlayerState.NOT_CONNECTED);
      });

      this.ws.addEventListener('error', () => {
        self.$store.commit(StoreMutations.PLAYER_STATE, PlayerState.ERROR);
      });

      this.ws.addEventListener('reconnect', () => {
        self.$store.commit(StoreMutations.PLAYER_STATE, PlayerState.CONNECTING);
      });

      this.player = new window.WSAvcPlayer(this.internalCanvas, 'webgl', 1, 35);
      this.player.on('canvasReady', (w, h) => {
        self.$store.commit(StoreMutations.PLAYER_STATE, PlayerState.PLAYING);
        PlayerBus.$emit(PlayerEvents.READY, {
          width: w,
          height: h,
        });
      });
      this.player.connect(this.ws);
    },
  };
</script>

<style scoped>

</style>
