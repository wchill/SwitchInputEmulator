import {ConnectionState, ControlState, StatusBus, store, BusEvents} from "./Common";
import {ControlModeSelect} from "./ControlModeSelect";
import {SocketBus, ControlWs, SocketEvents} from "./ControlWebSocket";
import {ControllerRenderer, JoyconStreamRenderer} from "./ControllerRenderer";
import * as Utils from "./Utils";

Vue.component('server-status', {
    props: ['state'],
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
            pendingPings: {}
        };
    },
    mounted: function() {
        let that = this;
        this.$nextTick(function() {
            this.$refs.statsContainer.appendChild(this.stats.dom);
            StatusBus.$on(BusEvents.RENDER_TIME_START, this.stats.begin);
            StatusBus.$on(BusEvents.RENDER_TIME_END, this.stats.end);
        });
        SocketBus.$on(SocketEvents.PONG, function(time) {
            that.pingPanel.update(time, 1000);
        });
        // todo: handle countdown for until it's user's turn
    },
    methods: {
        requestTurn: function() {
            if (this.canRequestTurn) {
                SocketBus.$emit(SocketEvents.SEND_MESSAGE, 'REQUEST_TURN');
                this.$store.commit('setControlState', ControlState.WAITING);
            }
        }
    },
    computed: {
        turnState: function() {
            let connectionState = this.$store.state.connectionState;
            let controlState = this.$store.state.controlState;

            if (connectionState === ConnectionState.CONNECTED) {
                if (controlState === ControlState.NO_CONTROLLER) {
                    return 'No controller connected';
                } else if (controlState === ControlState.UNSUPPORTED_CONTROLLER) {
                    return 'Unsupported controller';
                } else if (controlState === ControlState.INACTIVE) {
                    return 'Request turn';
                } else if (controlState === ControlState.ACTIVE) {
                    return 'Currently your turn';
                } else if (controlState === ControlState.WAITING) {
                    return 'Waiting for turn';
                }
            } else if (connectionState === ConnectionState.NOT_CONNECTED) {
                return 'Not connected';
            } else if (ConnectionState === ConnectionState.CONNECTING) {
                return 'Connecting to server';
            } else if (ConnectionState === ConnectionState.ERROR) {
                return 'Connection error';
            }

            return 'Unknown state';
        },
        canRequestTurn: function() {
            let connectionState = this.$store.state.connectionState;
            let controlState = this.$store.state.controlState;

            return connectionState === ConnectionState.CONNECTED && controlState === ControlState.INACTIVE;
        }
    },
    template: '<div class="center-text"><button type="button" class="center-text min-padding" @click="requestTurn" v-text="turnState" v-bind:disabled="!canRequestTurn"></button><div ref="statsContainer" class="stats"></div></div>'
});

new Vue({
    el: '#app',
    store,
    components: {
        'control-ws': ControlWs,
        'controller-renderer': ControllerRenderer,
        'joycon-stream-renderer': JoyconStreamRenderer,
        'control-mode-select': ControlModeSelect
    },
    data: function() {
        return {
            controlEndpoint: 'wss://api.chilly.codes/switch/ws',
            streamEndpoint: 'wss://api.chilly.codes/switch/stream'
        };
    },
    created: function() {
        let that = this;

        SocketBus.$on('CLIENT_ACTIVE', function() {
            that.$store.commit('setControlState', ControlState.ACTIVE);
        });

        SocketBus.$on('CLIENT_INACTIVE', function() {
            that.$store.commit('setControlState', ControlState.INACTIVE);
        });
    },
    mounted: function() {
        let browser = Utils.detectBrowser();
        let os = Utils.detectOS();

        console.log(`Running on ${os}/${browser}`);

        StatusBus.$on(BusEvents.INPUT_CHANGED, this.onInputUpdate);

        this.$nextTick(function() {
            requestAnimationFrame(this.update);
        });
    },
    methods: {
        update: function() {
            /*
            let gamepad = this.getGamepad();
            if (!gamepad) return;

            let newButtons = [];
            let newAxes = [];

            for (let i = 0; i < gamepad.buttons.length; i++) {
                newButtons.push(gamepad.buttons[i].value);
            }
            for (let i = 0; i < gamepad.axes.length; i++) {
                newAxes.push(gamepad.axes[i]);
            }
            this.axes = newAxes;
            this.buttons = newButtons;
            */

            StatusBus.$emit(BusEvents.BEFORE_UPDATE_INPUT);
            StatusBus.$emit(BusEvents.UPDATE_INPUT);

            requestAnimationFrame(this.update);
        },
        onInputUpdate: function(newState) {
            if (this.connected && this.controlActive) {
                SocketBus.$emit(SocketEvents.SEND_MESSAGE, `UPDATE ${newState.stateStr}`);
            }
        }
    },
    computed: {
        connected: function() {
            return this.$store.state.connectionState === ConnectionState.CONNECTED;
        },
        controlActive: function() {
            return this.$store.state.controlState === ControlState.ACTIVE;
        }
    }
});
