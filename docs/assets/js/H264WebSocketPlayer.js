import {PlayerState} from "./Common";
import {WebSocketClient} from "./lib/WebSocketClient";

export const PlayerBus = new Vue();
export const PlayerEvents = Object.freeze({
    PLAY: 'play',
    PAUSE: 'pause',
    READY: 'ready'
});

export const H264Player = {
    props: ['endpoint', 'canvas'],
    data: function() {
        return {
            player: null,
            ws: null
        };
    },
    computed: {
        internalCanvas: function() {
            if (this.canvas) return this.canvas;
            return this.$refs.playercanvas;
        },
        displayPlayer: function() {
            return !this.canvas;
        }
    },
    mounted: function() {
        let self = this;

        document.addEventListener('visibilitychange', function(e) {
            if (self.player) {
                if (document.visibilityState ==='visible') {
                    console.log('Resuming stream because page received focus');
                    self.player.playStream();
                    self.$store.commit('setPlayerState', PlayerState.PLAYING);
                } else {
                    console.log('Pausing stream because page lost focus');
                    self.player.stopStream();
                    self.$store.commit('setPlayerState', PlayerState.PAUSED);
                }
            }
        }, false);

        this.ws = new WebSocketClient(this.endpoint, null, {
            backoff: 'fibonacci'
        });

        this.$store.commit('setPlayerState', PlayerState.CONNECTING);

        this.ws.addEventListener('open', function(e) {
            self.$store.commit('setPlayerState', PlayerState.PLAYING);
        });

        this.ws.addEventListener('close', function(e) {
            self.$store.commit('setPlayerState', PlayerState.NOT_CONNECTED);
        });

        this.ws.addEventListener('error', function(e) {
            self.$store.commit('setPlayerState', PlayerState.ERROR);
        });

        this.ws.addEventListener('reconnect', function(e) {
            self.$store.commit('setPlayerState', PlayerState.CONNECTING);
        });

        this.player = new WSAvcPlayer(this.internalCanvas, "webgl", 1, 35);
        this.player.on('canvasReady', function(w, h){
            console.log('Player canvas is ready');
            PlayerBus.$emit(PlayerEvents.READY, {
                width: w,
                height: h
            });
        });
        this.player.connect(this.ws);
    },
    template: "<canvas ref='playercanvas' v-show='displayPlayer'></canvas>"
};