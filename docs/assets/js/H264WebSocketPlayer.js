import {PlayerState} from "./Common";
import {WebSocketClient} from "./lib/WebSocketClient";

export const PlayerBus = new Vue();
export const PlayerEvents = Object.freeze({
    PLAY: 'play',
    PAUSE: 'pause'
});

export const H264Player = {
    props: ['endpoint'],
    data: function() {
        return {
            player: null,
            ws: null
        };
    },
    mounted: function() {
        let self = this;

        document.addEventListener('visibilitychange', function(e) {
            if (self.player) {
                if (document.hidden) {
                    console.log('Pausing stream because page lost focus');
                    self.player.stopStream();
                    self.$store.commit('setPlayerState', PlayerState.PAUSED);
                } else {
                    console.log('Resuming stream because page received focus');
                    self.player.playStream();
                    self.$store.commit('setPlayerState', PlayerState.PLAYING);
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

        this.player = new WSAvcPlayer(this.$refs.playercanvas, "webgl", 1, 35);
        this.player.connect(this.ws);
    },
    methods: {
    },
    template: '<canvas ref="playercanvas"></canvas>'
};