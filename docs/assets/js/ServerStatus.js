import {ConnectionState, AuthState, StatusBus, BusEvents, StoreMutations, InputState} from "./Common";
import {SocketBus, SocketEvents} from "./ControlWebSocket";

export const ServerStatus = {
    data: function() {
        // TODO: Have this handle all server status things.
        let stats = new Stats();
        let pingPanel = stats.addPanel(new Stats.Panel('ms ping', '#f08', '#201'));
        pingPanel.update(0, 1000);
        stats.showPanel(0);
        stats.showPanel(1);
        stats.showPanel(2);

        return {
            stats: stats,
            pingPanel: pingPanel,
            pendingPings: {},
            waiting: false,
            progressBarWidth: 0,
            timeRemaining: -1,
            animateFrameCount: -1,
            totalAnimateFrames: 30
        };
    },
    created: function() {
        let self = this;

        SocketBus.$on('CLIENT_ACTIVE', function(args) {
            let id = args[0];
            let name = args[1];
            let picture = args[2];
            let expire = parseInt(args[3]);
            let turnLength = parseInt(args[4]);
            if (name !== self.currentPlayerInfo.name) {
                self.animateFrameCount = self.totalAnimateFrames;
            }
            self.$store.commit(StoreMutations.CURRENT_PLAYER_INFO, {
                id: id,
                name: name,
                picture: picture,
                expire: expire,
                turnLength: turnLength
            });
        });

        SocketBus.$on('NO_CLIENTS', function() {
            self.$store.commit(StoreMutations.CURRENT_PLAYER_INFO, {
                id: null,
                name: null,
                picture: null,
                expire: -1,
                turnLength: -1
            });
        });
    },
    watch: {
        canControl: function() {
            this.waiting = false;
        }
    },
    mounted: function() {
        let self = this;
        this.$nextTick(function() {
            this.$refs.statsContainer.appendChild(this.stats.dom);
            StatusBus.$on(BusEvents.RENDER_TIME_START, this.stats.begin);
            StatusBus.$on(BusEvents.RENDER_TIME_END, this.stats.end);
        });
        SocketBus.$on(SocketEvents.PONG, function(time) {
            self.pingPanel.update(time, 1000);
        });
        StatusBus.$on(BusEvents.BEFORE_UPDATE_INPUT, function() {
            if (self.currentPlayerInfo.id === null) {
                self.progressBarWidth = 0;
                self.timeRemaining = -1;
            } else if (self.currentPlayerInfo.turnLength < 0) {
                if (self.animateFrameCount >= 0) {
                    self.progressBarWidth = (100/self.totalAnimateFrames) * (self.totalAnimateFrames - self.animateFrameCount--);
                    if (self.animateFrameCount <= 0) {
                        self.progressBarWidth = 100;
                    }
                }
                self.timeRemaining = -1;
            } else {
                self.timeRemaining = self.currentPlayerInfo.expire + self.serverClockSkew - (performance.timing.navigationStart + performance.now());
                let scaleFactor = (self.totalAnimateFrames - self.animateFrameCount--) / self.totalAnimateFrames;
                if (self.animateFrameCount <= 0) {
                    scaleFactor = 1;
                }
                self.progressBarWidth = (self.timeRemaining / self.currentPlayerInfo.turnLength * 100) * (scaleFactor);
            }
        });
    },
    methods: {
        requestTurn: function() {
            if (this.canRequestTurn) {
                SocketBus.$emit(SocketEvents.SEND_MESSAGE, 'REQUEST_TURN');
                this.waiting = true;
            }
        }
    },
    computed: {
        progressBarStyle: function() {
            let width = `${this.progressBarWidth}%`;
            return {
                width: width
            }
        },
        progressBarText: function() {
            if (this.currentPlayerInfo.id) {
                if (this.timeRemaining >= 0) {
                    return `${this.currentPlayerInfo.name} is controlling (${Math.round(this.timeRemaining / 1000)} seconds remaining)`;
                } else {
                    return `${this.currentPlayerInfo.name} is controlling`;
                }
            } else {
                return 'No one is controlling right now';
            }
        },
        turnState: function() {
            if (this.connectionState === ConnectionState.CONNECTED) {
                if (this.inputState === InputState.NOT_CONNECTED) {
                    return 'No controller connected';
                } else if (this.inputState === InputState.UNSUPPORTED) {
                    return 'Unsupported controller';
                } else {
                    if (this.authState === AuthState.NOT_SIGNED_IN) {
                        return 'Not signed in with Twitch';
                    } else if (this.authState === AuthState.SIGNED_IN) {
                        return 'Authenticating';
                    } else if (this.canControl) {
                        return 'It\'s your turn';
                    } else if (this.waiting) {
                        return 'Waiting for turn';
                    } else {
                        return 'Request a turn';
                    }
                }
            } else if (this.connectionState === ConnectionState.NOT_CONNECTED) {
                return 'Not connected';
            } else if (this.connectionState === ConnectionState.CONNECTING) {
                return 'Connecting to server';
            } else if (this.connectionState === ConnectionState.ERROR) {
                return 'Connection error';
            }
            return 'Not connected';
        },
        canRequestTurn: function() {
            return this.connectionState === ConnectionState.CONNECTED && this.inputState === InputState.READY && this.authState === AuthState.SERVER_SIGNED_IN && !this.canControl && !this.waiting;
        },
        ...Vuex.mapGetters([
            'canControl',
            'connectionState',
            'inputState',
            'authState',
            'currentPlayerInfo',
            'serverClockSkew'
        ])
    },
    template: '<div class="center-text"><div class="meter animate purple"><div class="text-overlay"><img v-bind:src="currentPlayerInfo.picture" v-show="currentPlayerInfo.picture !== null"><span v-text="progressBarText"></span></div><span v-bind:style="progressBarStyle"><span></span></span></div><button type="button" class="center-text min-padding" @click="requestTurn" v-text="turnState" v-bind:disabled="!canRequestTurn"></button><div ref="statsContainer" class="stats"></div></div>'
};