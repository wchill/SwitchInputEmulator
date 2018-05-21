import {BusEvents, ControlState, StatusBus} from "./Common";
import {XboxController} from "./BaseController";
import {PowerAWiredControllerChrome, PowerAWiredControllerChromeOS, PowerAWiredControllerMacFirefox, PowerAWiredControllerStandard, PowerAWiredControllerWinFirefox} from "./PowerAWiredController";
import {dualShockControllerMacFirefox, dualShockControllerStandard, dualShockControllerWinFirefox} from "./DualshockController";
import {SwitchProControllerMacFirefox, SwitchProControllerStandard} from "./SwitchProController";
import * as Utils from "./Utils";

let NoController = {
    template: '<p class="center-text">No controller connected.<br>Please connect a controller.</p>'
};

let UnsupportedController = {
    template: '<p class="center-text">This isn\'t a supported controller.<br>Select another controller or check the help documentation for details.</p>'
};

export const ControllerInputSource = {
    components: {
        'no-controller': NoController,
        'unsupported-controller': UnsupportedController,
        'xbox-controller': XboxController,
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
            buttons: []
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

            return Utils.getControllerProfile(browser, os, id, mapping);
        },
        gamepadName: function() {
            if (this.currentController < 0) {
                return '';
            }
            let gamepad = this.getGamepad();
            if (!gamepad) return '';
            return gamepad.id;
        }
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

            StatusBus.$emit(BusEvents.UPDATE_INPUT);
        },
        currentControllerComponent: function() {
            console.log(`Loading controller component ${this.currentControllerComponent}`);
        }
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
        updateGamepad: function() {
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
        }
    },
    created: function() {
        let self = this;
        window.addEventListener('gamepadconnected', function(e) {
            console.log('Detected gamepad: ' + e.gamepad.id);
            if (self.currentController < 0 || self.currentControllerComponent === 'unsupported-controller') {
                self.currentController = e.gamepad.index;
            }
            self.allControllers = self.getGamepads();
        });

        window.addEventListener('gamepaddisconnected', function(e) {
            console.log('Gamepad disconnected: ' + e.gamepad.id);
            if (self.currentController.index === e.gamepad.index) {
                self.currentController = self.getGamepad().index;
            }
            self.allControllers = self.getGamepads();
        });
    },
    mounted: function() {
        StatusBus.$on(BusEvents.BEFORE_UPDATE_INPUT, this.updateGamepad);
    },
    template: '<div class="center-text"><select v-model="currentController"><option disabled value="">Please select a controller</option><option v-for="gamepad in this.getGamepads()" v-bind:value="gamepad.index" v-if="gamepad !== null">#(( gamepad.index )): (( gamepad.id ))</option></select><component v-bind:is="currentControllerComponent" v-bind:gamepadindex="currentController" v-bind:gamepadname="gamepadName" v-bind:axes="axes" v-bind:buttons="buttons"></component></div>'
};