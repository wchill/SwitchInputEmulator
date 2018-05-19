import {ConnectionState, ControlState, ControlMode, StatusBus, store, BusEvents} from "./Common";
import {SocketBus, ControlWs, SocketEvents} from "./ControlWebSocket";
import {ControllerRenderer} from "./ControllerRenderer";
import {xboxController, noController, unsupportedController} from "./BaseController";
import {SwitchProControllerStandard, SwitchProControllerMacFirefox} from "./SwitchProController";
import {PowerAWiredControllerStandard, PowerAWiredControllerChrome, PowerAWiredControllerChromeOS, PowerAWiredControllerWinFirefox, PowerAWiredControllerMacFirefox} from "./PowerAWiredController"
import {dualShockControllerStandard, dualShockControllerWinFirefox, dualShockControllerMacFirefox} from "./DualshockController";
import * as Utils from "./Utils";

Vue.component('control-mode-select', {
    data: function() {
        return {
            selectedMode: ControlMode.SINGLE_CONTROLLER,
            enabledModes: [
                ControlMode.SINGLE_CONTROLLER,
                ControlMode.MULTIPLE_CONTROLLERS
            ]
        }
    },
    watch: {
        selectedMode: function() {
            this.$store.commit('setControlMode', parseInt(this.selectedMode));
        }
    },
    methods: {
        getModeText: function(mode){
            if (mode === ControlMode.SINGLE_CONTROLLER) {
                return 'Controller';
            } else if (mode === ControlMode.MULTIPLE_CONTROLLERS) {
                return 'Joycons';
            } else if (mode === ControlMode.TOUCH) {
                return 'Touch controls';
            }

            return 'Keyboard';
        }
    },
    template: '<select v-model="selectedMode">'+
    '<option v-for="mode in enabledModes" v-bind:value="mode">Use (( getModeText(mode) ))</option>' +
    '</select>'
});

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
            StatusBus.$on(BusEvents.RENDER_TIME_START, function() {that.stats.begin();});
            StatusBus.$on(BusEvents.RENDER_TIME_END, function() {that.stats.end();});
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
        'no-controller': noController,
        'unsupported-controller': unsupportedController,
        'xbox-controller': xboxController,
        'switch-pro-controller-standard': SwitchProControllerStandard,
        'switch-pro-controller-mac-firefox': SwitchProControllerMacFirefox,
        'powera-wired-controller-standard': PowerAWiredControllerStandard,
        'powera-wired-controller-chromeos': PowerAWiredControllerChromeOS,
        'powera-wired-controller-chrome': PowerAWiredControllerChrome,
        'powera-wired-controller-win-firefox': PowerAWiredControllerWinFirefox,
        'powera-wired-controller-mac-firefox': PowerAWiredControllerMacFirefox,
        'dualshock-controller-standard': dualShockControllerStandard,
        'dualshock-controller-win-firefox': dualShockControllerWinFirefox,
        'dualshock-controller-mac-firefox': dualShockControllerMacFirefox,
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

        SocketBus.$on('CLIENT_ACTIVE', function() {
            that.$store.commit('setControlState', ControlState.ACTIVE);
        });

        SocketBus.$on('CLIENT_INACTIVE', function() {
            that.$store.commit('setControlState', ControlState.INACTIVE);
        });
    },
    watch: {
        currentController: function() {
            let controlState = this.$store.state.controlState;

            if (!this.isControllerConnected) {
                this.$store.commit('setControlState', ControlState.NO_CONTROLLER);
            } else if (!this.isControllerSupported) {
                this.$store.commit('setControlState', ControlState.UNSUPPORTED_CONTROLLER);
            } else if (controlState === ControlState.NO_CONTROLLER || ControlState.UNSUPPORTED_CONTROLLER) {
                this.$store.commit('setControlState', ControlState.INACTIVE);
            }

            requestAnimationFrame(this.update);
        },
        currentControllerComponent: function() {
            console.log(`Loading controller component ${this.currentControllerComponent}`);
        }
    },
    mounted: function() {
        let browser = Utils.detectBrowser();
        let os = Utils.detectOS();

        console.log(`Browser: ${browser} OS: ${os}`);

        StatusBus.$on(BusEvents.INPUT_CHANGED, this.onControllerUpdate);

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

            StatusBus.$emit(BusEvents.UPDATE_INPUT);

            requestAnimationFrame(this.update);
        },
        onControllerUpdate: function(newState) {
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
                if (id.indexOf('Nintendo Co., Ltd.') > -1) {
                    return 'unsupported-controller';
                }

                // Pro Controller reported as standard on Chrome OS only
                if (Utils.checkVidPid(id, '57e', '2009')) {
                    return 'switch-pro-controller-standard';
                }

                // DualShock 4 reported as standard by Chrome on all OSes
                if (Utils.checkVidPid(id, '54c', '9cc')) {
                    return 'dualshock-controller-standard';
                }

                // Not reported as standard mappings on any tested OS/browser, but here just in case
                if (Utils.checkVidPid(id, '20d6', 'a711')) {
                    return 'powera-wired-controller-standard';
                }

                // Xbox controller works on Windows and Chrome on Mac OS only
                return 'xbox-controller';
            }

            // Pro Controller uses standard mappings (but not reported as standard) on Mac OS/Firefox
            if (Utils.checkVidPid(id, '57e', '2009')) {
                if (os === 'Mac OS' && browser === 'Firefox') {
                    return 'switch-pro-controller-mac-firefox';
                }
            }

            // DualShock 4 D-Pad doesn't work properly on Windows/Firefox. On Mac OS/Firefox it works fine but needs remapping.
            if (Utils.checkVidPid(id, '54c', '9cc')) {
                if (os === 'Windows' && browser === 'Firefox') return 'dualshock-controller-win-firefox';
                if (os === 'Mac OS' && browser === 'Firefox') return 'dualshock-controller-mac-firefox';
            }

            // PowerA Wired Controller Plus works fine on every OS (Windows/Firefox needs D-Pad fix), but needs remapping.
            if (Utils.checkVidPid(id, '20d6', 'a711')) {
                if (os === 'Chrome OS') {
                    return 'powera-wired-controller-chromeos';
                }
                if (browser === 'Chrome') {
                    return 'powera-wired-controller-chrome';
                }
                if (browser === 'Firefox') {
                    if (os === 'Windows') return 'powera-wired-controller-win-firefox';
                    if (os === 'Mac OS') return 'powera-wired-controller-mac-firefox';
                }
            }

            // No supported profile found
            return 'unsupported-controller';
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
