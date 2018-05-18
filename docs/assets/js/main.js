import {baseController, xboxController, noController, unsupportedController} from "./BaseController";
import {stateEnum, statusBus} from "./VueConstants";
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
            pingPanel: pingPanel
        };
    },
    mounted: function() {
        let that = this;
        this.$nextTick(function() {
            this.$refs.statsContainer.appendChild(this.stats.dom);
            statusBus.$on('pong', this.updatePingGraph);
            statusBus.$on('startRender', function() {that.stats.begin();});
            statusBus.$on('finishRender', function() {that.stats.end();});
        });
    },
    methods: {
        requestTurn: function() {
            this.$emit('request');
        },
        updatePingGraph: function(time) {
            this.pingPanel.update(time, 1000);
        }
    },
    computed: {
        turnState: function() {
            if (this.state === stateEnum.CONNECTED_NO_CONTROLLER) {
                return 'No controller connected';
            } else if (this.state === stateEnum.CONNECTED_UNSUPPORTED_CONTROLLER) {
                return 'Unsupported controller';
            } else if (this.state === stateEnum.CONNECTED_ACTIVE) {
                return 'Currently your turn';
            } else if (this.state === stateEnum.CONNECTED_WAITING) {
                return 'Waiting for turn';
            } else if (this.state === stateEnum.CONNECTED_INACTIVE) {
                return 'Request turn';
            } else if (this.state === stateEnum.NOT_CONNECTED) {
                return 'Not connected';
            } else if (this.state === stateEnum.ERROR) {
                return 'Connection error';
            } else if (this.state === stateEnum.CONNECTING) {
                return 'Connecting to server';
            }
        },
        canRequestTurn: function() {
            return this.state === stateEnum.CONNECTED_INACTIVE;
        }
    },
    template: '<div class="center-text"><button type="button" class="center-text min-padding" @click="requestTurn" v-text="turnState" v-bind:disabled="!canRequestTurn"></button><div ref="statsContainer" class="stats"></div></div>'
});

new Vue({
    el: '#app',
    components: {
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
            connectState: stateEnum.NOT_CONNECTED,
            lastPing: 0
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

        this.ws = new WebSocket('wss://api.chilly.codes/switch/ws', null, {
            backoff: 'fibonacci'
        });

        this.connectState = stateEnum.CONNECTING;

        this.ws.addEventListener('open', function (e) {
            if (!that.isControllerConnected) {
                that.connectState = stateEnum.CONNECTED_NO_CONTROLLER;
            } else if (!that.isControllerSupported) {
                that.connectState = stateEnum.CONNECTED_UNSUPPORTED_CONTROLLER;
            } else {
                that.connectState = stateEnum.CONNECTED_INACTIVE;
            }
            that.lastPing = performance.now();
            that.sendMessage('PING');
        });

        this.ws.addEventListener('close', function (e) {
            that.connectState = stateEnum.NOT_CONNECTED;
        });

        this.ws.addEventListener('error', function (e) {
            that.connectState = stateEnum.ERROR;
        });

        this.ws.addEventListener('reconnect', function (e) {
            that.connectState = stateEnum.CONNECTING;
        });

        this.ws.addEventListener('message', function(e) {
            that.onServerMessage(e.data);
        });
    },
    watch: {
        currentController: function() {
            if (this.connectState === stateEnum.CONNECTED_UNSUPPORTED_CONTROLLER || this.connectState === stateEnum.CONNECTED_NO_CONTROLLER || this.connectState === stateEnum.CONNECTED_INACTIVE || this.connectState === stateEnum.CONNECTED_WAITING || this.connectState === stateEnum.CONNECTED_ACTIVE) {
                if (!this.isControllerConnected) {
                    this.connectState = stateEnum.CONNECTED_NO_CONTROLLER;
                } else if (!this.isControllerSupported) {
                    this.connectState = stateEnum.CONNECTED_UNSUPPORTED_CONTROLLER;
                } else if (this.connectState === stateEnum.CONNECTED_NO_CONTROLLER || this.connectState === stateEnum.CONNECTED_UNSUPPORTED_CONTROLLER) {
                    this.connectState = stateEnum.CONNECTED_INACTIVE;
                }
            }
            this.update();
        },
        currentControllerComponent: function() {
            console.log(this.currentControllerComponent);
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
            if (this.connectState === stateEnum.CONNECTED_ACTIVE) {
                this.sendMessage(`UPDATE ${newState.button} ${newState.dpad} ${newState.lx} ${newState.ly} ${newState.rx} ${newState.ry}`);
            }
        },
        requestTurn: function() {
            if (this.connectState !== stateEnum.CONNECTED_INACTIVE) {
                this.$notify({
                    type: 'warn',
                    text: 'Can\'t request turn right now.'
                });
            } else {
                this.connectState = stateEnum.CONNECTED_WAITING;
                this.sendMessage('REQUEST_TURN');
            }
        },
        sendMessage: function(message) {
            if (this.ws.readyState === this.ws.OPEN) {
                this.ws.send(message);
                return true;
            }
            console.warn('Failed to send message: ' + message);
            return false;
        },
        onServerMessage: function(message) {
            const wsParseRegex = /(\w+)(?: (.*))?/;
            let match = wsParseRegex.exec(message);
            if (!match) {
                console.warn(`Got invalid message: ${message}`);
                return;
            }

            let command = match[1];
            let args = match[2];

            if (command === 'PONG') {
                let that = this;

                let time = performance.now();
                let duration = (time - this.lastPing) / 2;
                statusBus.$emit('pong', duration);
                setTimeout(function() {
                    that.lastPing = performance.now();
                    that.sendMessage('PING');
                }, Math.max(duration, 1000));
            } else if (command === 'CLIENT_ACTIVE') {
                if (this.connectState === stateEnum.CONNECTED_INACTIVE || this.connectState === stateEnum.CONNECTED_WAITING) {
                    this.connectState = stateEnum.CONNECTED_ACTIVE;
                } else {
                    // TODO: cancel turn
                }
            } else if (command === 'CLIENT_INACTIVE') {
                if (this.connectState === stateEnum.CONNECTED_ACTIVE || this.connectState === stateEnum.CONNECTED_WAITING) {
                    this.connectState = stateEnum.CONNECTED_INACTIVE;
                }
            }
        }
    },
    computed: {
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
