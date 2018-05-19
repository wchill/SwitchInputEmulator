import {xboxController, noController, unsupportedController} from "./BaseController";
import {connectionStateEnum, controlStateEnum, stateEnum, statusBus, store} from "./Common";
import {socketBus, controlWs} from "./ControlWebSocket";
import {powerAWiredControllerStandard, powerAWiredControllerChromeOS, powerAWiredControllerWinChrome, powerAWiredControllerWinFirefox, switchProController, switchProControllerStandard} from "./SwitchProController";
import {dualShockControllerStandard, dualShockControllerWinFirefox} from "./DualshockController";
import * as Utils from "./Utils";

Vue.component('controller-select', {
    props: ['gamepads', 'gamepadindex'],
    model: {
        prop: 'gamepadindex',
        event: 'change'
    },
    computed: {
        selectedindex: {
            get() {
                return this.gamepadindex;
            },
            set(val) {
                this.$emit('change', val);
            }
        }
    },
    template: '<select v-model="selectedindex"><option disabled value="">Please select a controller</option>' +
    '<option v-for="gamepad in gamepads" v-bind:value="gamepad.index" v-if="gamepad !== null">#(( gamepad.index )): (( gamepad.id ))</option>' +
    '</select>'
});

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
            statusBus.$on('startRender', function() {that.stats.begin();});
            statusBus.$on('finishRender', function() {that.stats.end();});
        });
        socketBus.$on('pong', function(time) {
            that.pingPanel.update(time, 1000);
        });
        // todo: handle countdown for until it's user's turn
    },
    methods: {
        requestTurn: function() {
            if (this.canRequestTurn) {
                socketBus.$emit('send', 'REQUEST_TURN');
                this.$store.commit('setControlState', controlStateEnum.WAITING);
            }
        }
    },
    computed: {
        turnState: function() {
            let connectionState = this.$store.state.connectionState;
            let controlState = this.$store.state.controlState;

            if (connectionState === connectionStateEnum.CONNECTED) {
                if (controlState === controlStateEnum.NO_CONTROLLER) {
                    return 'No controller connected';
                } else if (controlState === controlStateEnum.UNSUPPORTED_CONTROLLER) {
                    return 'Unsupported controller';
                } else if (controlState === controlStateEnum.INACTIVE) {
                    return 'Request turn';
                } else if (controlState === controlStateEnum.ACTIVE) {
                    return 'Currently your turn';
                } else if (controlState === controlStateEnum.WAITING) {
                    return 'Waiting for turn';
                }
            } else if (connectionState === connectionStateEnum.NOT_CONNECTED) {
                return 'Not connected';
            } else if (connectionStateEnum === connectionStateEnum.CONNECTING) {
                return 'Connecting to server';
            } else if (connectionStateEnum === connectionStateEnum.ERROR) {
                return 'Connection error';
            }

            return 'Unknown state';
        },
        canRequestTurn: function() {
            let connectionState = this.$store.state.connectionState;
            let controlState = this.$store.state.controlState;

            return connectionState === connectionStateEnum.CONNECTED && controlState === controlStateEnum.INACTIVE;
        }
    },
    template: '<div class="center-text"><button type="button" class="center-text min-padding" @click="requestTurn" v-text="turnState" v-bind:disabled="!canRequestTurn"></button><div ref="statsContainer" class="stats"></div></div>'
});

new Vue({
    el: '#app',
    store,
    components: {
        'control-ws': controlWs,
        'no-controller': noController,
        'unsupported-controller': unsupportedController,
        'xbox-controller': xboxController,
        'switch-pro-controller': switchProController,
        'switch-pro-controller-standard': switchProControllerStandard,
        'powera-wired-controller-standard': powerAWiredControllerStandard,
        'powera-wired-controller-chromeos': powerAWiredControllerChromeOS,
        'powera-wired-controller-win-chrome': powerAWiredControllerWinChrome,
        'powera-wired-controller-win-firefox': powerAWiredControllerWinFirefox,
        'dualshock-controller-standard': dualShockControllerStandard,
        'dualshock-controller-win-firefox': dualShockControllerWinFirefox
    },
    data: function() {
        return {
            currentController: -1,
            axes: [],
            buttons: [],
            deadzone: 0.15,
            allControllers: [],
            controlEndpoint: 'wss://api.chilly.codes/switch/ws'
        };
    },
    created: function() {
        let that = this;

        window.addEventListener('gamepadconnected', function(e) {
            console.log('Detected gamepad: ' + e.gamepad.id);
            if (that.currentController < 0 || that.currentControllerComponent === 'unsupported-controller') {
                that.currentController = e.gamepad.index;
            }
            that.allControllers = that.getGamepads();
        });

        window.addEventListener('gamepaddisconnected', function(e) {
            console.log('Gamepad disconnected: ' + e.gamepad.id);
            if (that.currentController.index === e.gamepad.index) {
                that.currentController = that.getGamepad().index;
            }
            that.allControllers = that.getGamepads();
        });

        socketBus.$on('CLIENT_ACTIVE', function() {
            that.$store.commit('setControlState', controlStateEnum.ACTIVE);
        });

        socketBus.$on('CLIENT_INACTIVE', function() {
            that.$store.commit('setControlState', controlStateEnum.INACTIVE);
        });
    },
    watch: {
        currentController: function() {
            let controlState = this.$store.state.controlState;

            if (this.connected) {
                if (!this.isControllerConnected) {
                    this.$store.commit('setControlState', controlStateEnum.NO_CONTROLLER);
                } else if (!this.isControllerSupported) {
                    this.$store.commit('setControlState', controlStateEnum.UNSUPPORTED_CONTROLLER);
                } else if (controlState === controlStateEnum.NO_CONTROLLER || controlStateEnum.UNSUPPORTED_CONTROLLER) {
                    this.$store.commit('setControlState', controlStateEnum.INACTIVE);
                }
            }
            this.update();
        },
        currentControllerComponent: function() {
            console.log(`Loading controller component ${this.currentControllerComponent}`);
        }
    },
    mounted: function() {
        let browser = Utils.detectBrowser();
        let os = Utils.detectOS();

        console.log(`Browser: ${browser} OS: ${os}`);

        this.$nextTick(function() {
            requestAnimationFrame(this.update);
        });
    },
    methods: {
        getGamepads: function() {
            let gamepads;
            if (navigator.getGamepads()) {
                gamepads = navigator.getGamepads();
            } else if (navigator.webkitGetGamepads) {
                gamepads = navigator.webkitGetGamepads();
            }
            return gamepads;
        },
        getGamepad: function() {
            // TODO: Support Joycons.
            let gamepads = this.getGamepads();
            if (this.currentController >= 0) {
                let gamepad = gamepads[this.currentController];
                if (gamepad && gamepad.connected) return gamepad;
            }
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i] && gamepads[i].connected) {
                    this.currentController = gamepads[i].index;
                    return gamepads[i];
                }
            }
            return null;
        },
        update: function() {
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

            requestAnimationFrame(this.update);
        },
        onControllerUpdate: function(newState) {
            if (this.connected && this.controlActive) {
                socketBus.$emit('send', `UPDATE ${newState.button} ${newState.dpad} ${newState.lx} ${newState.ly} ${newState.rx} ${newState.ry}`);
            }
        }
    },
    computed: {
        connected: function() {
            return this.$store.state.connectionState === connectionStateEnum.CONNECTED;
        },
        controlActive: function() {
            return this.$store.state.controlState === controlStateEnum.ACTIVE;
        },
        isControllerConnected: function() {
            return this.currentControllerComponent !== 'no-controller';
        },
        isControllerSupported: function() {
            return this.currentControllerComponent !== 'unsupported-controller';
        },
        currentControllerComponent: function() {
            // TODO: make this code less unwieldy.
            if (this.currentController < 0) return 'no-controller';
            let gamepad = this.getGamepad();
            if (!gamepad) {
                return 'no-controller';
            }

            let browser = Utils.detectBrowser();
            let os = Utils.detectOS();
            let id = gamepad.id;
            let mapping = gamepad.mapping;

            if (mapping === 'standard') {
                // Check for Pro Controller (2009) or Joycon Grip (200e) connected via cable (won't work)
                if (Utils.checkVidPid(id, '57e', '2009') || Utils.checkVidPid(id, '57e', '200e')) {
                    if (id.indexOf('Nintendo Co., Ltd.') > -1) {
                        return 'unsupported-controller';
                    } else {
                        return 'switch-pro-controller-standard';
                    }
                }

                if (Utils.checkVidPid(id, '54c', '9cc')) {
                    return 'dualshock-controller-standard';
                }
                return 'xbox-controller';
            }

            if (Utils.checkVidPid(id, '57e', '2009')) {
                // Pro Controllers in Firefox report 4 axes. In Chrome, for some reason they report 9.
                return 'switch-pro-controller';
            }

            if (Utils.checkVidPid(id, '54c', '9cc')) {
                if (os === 'Windows' && browser === 'Firefox') return 'dualshock-controller-win-firefox';
                return 'dualshock-controller';
            }

            if (Utils.checkVidPid(id, '20d6', 'a711')) {
                if (os === 'Windows') {
                    if (browser === 'Chrome') return 'powera-wired-controller-win-chrome';
                    if (browser === 'Firefox') return 'powera-wired-controller-win-firefox';
                } else if (os === 'Chrome OS') {
                    return 'powera-wired-controller-chromeos';
                }
                return 'powera-wired-controller';
            } else {
                return 'unsupported-controller';
            }
        },
        gamepadName: function() {
            if (this.currentController < 0) {
                return '';
            }
            let gamepad = this.getGamepad();
            if (!gamepad) return '';
            return gamepad.id;
        }
    }
});
