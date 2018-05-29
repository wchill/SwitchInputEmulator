import {BusEvents, ControlState, InputState, StatusBus, StoreMutations} from "./Common";
import {XboxController} from "./BaseController";
import {PowerAWiredControllerChrome, PowerAWiredControllerChromeOS, PowerAWiredControllerMacFirefox, PowerAWiredControllerStandard, PowerAWiredControllerWinFirefox} from "./PowerAWiredController";
import {dualShockControllerMacFirefox, dualShockControllerStandard, dualShockControllerWinFirefox} from "./DualshockController";
import {SwitchProControllerMacFirefox, SwitchProControllerWinFirefox, SwitchProControllerStandard, SwitchProControllerEdge} from "./SwitchProController";
import * as Utils from "./Utils";

let NoController = {
    template: '<p class="center-text">No controller connected.<br>Please connect a controller.</p>'
};

let UnsupportedController = {
    template: '<p class="center-text">This isn\'t a supported controller.<br>Select another controller or check the help documentation for details.</p>'
};

const ControllerSelect = {
    props: ['gamepads', 'value'],
    data: function() {
        return {
            currentController: this.value
        };
    },
    watch: {
        currentController (val) {
            this.$emit('input', val)
        }
    },
    template: '<select v-model="currentController"><option disabled value="">Please select a controller</option><option v-for="gamepad in gamepads" v-bind:value="gamepad.index" v-if="gamepad !== null">#(( gamepad.index )): (( gamepad.id ))</option></select>'
};

export const ControllerInputSource = {
    components: {
        'controller-select': ControllerSelect,
        'no-controller': NoController,
        'unsupported-controller': UnsupportedController,
        'xbox-controller': XboxController,
        'switch-pro-controller-standard': SwitchProControllerStandard,
        'switch-pro-controller-edge': SwitchProControllerEdge,
        'switch-pro-controller-win-firefox': SwitchProControllerWinFirefox,
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
            edgeDetectionHackTimestamp: {},
            isEdgeDetectionHackActive: {},
            forceRecompute: Date.now(),
            allControllers: []
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

            // This looks useless, but we actually need it for pro controller detection on Edge.
            const t = this.forceRecompute;

            let browser = Utils.detectBrowser();
            let os = Utils.detectOS();
            let index = gamepad.index;
            let id = gamepad.id;
            let mapping = gamepad.mapping;

            return this.getControllerProfile(browser, os, index, id, mapping);
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
            console.log(this.currentController);
            if (!this.isControllerConnected) {
                this.$store.commit(StoreMutations.INPUT_STATE, InputState.NOT_CONNECTED);
            } else if (!this.isControllerSupported) {
                this.$store.commit(StoreMutations.INPUT_STATE, InputState.UNSUPPORTED);
            } else {
                this.$store.commit(StoreMutations.INPUT_STATE, InputState.READY);
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
            if (navigator.getGamepads) {
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
        },
        getControllerProfile: function(browser, os, index, id, mapping) {
            if (mapping === 'standard') {
                // Check for Pro Controller (2009) or Joycon Grip (200e) connected via cable (won't work)
                if (id.indexOf('Nintendo Co., Ltd.') > -1) {
                    return 'unsupported-controller';
                }

                // Pro Controller reported as standard on Chrome OS and Edge
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

                if (browser === 'Edge') {
                    if (this.isEdgeDetectionHackActive[index]) {
                        return 'switch-pro-controller-edge';
                    }
                }

                // Xbox controller works on Windows and Chrome on Mac OS only
                return 'xbox-controller';
            }

            // Pro Controller uses standard mappings (but not reported as standard) on Firefox
            if (Utils.checkVidPid(id, '57e', '2009')) {
                if (browser === 'Firefox') {
                    if (os === 'Windows') {
                        return 'switch-pro-controller-win-firefox';
                    } else if (os === 'Mac OS') {
                        return 'switch-pro-controller-mac-firefox';
                    }
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
        }
    },
    created: function() {
        let self = this;
        self.allControllers = self.getGamepads();
        window.addEventListener('gamepadconnected', function(e) {
            console.log('Detected gamepad: ' + e.gamepad.id);
            if (self.currentController < 0 || self.currentControllerComponent === 'unsupported-controller') {
                self.currentController = e.gamepad.index;
            }
            self.allControllers = self.getGamepads();
            if (Utils.detectBrowser() === 'Edge') {
                // better not steal this too bro
                self.edgeDetectionHackTimestamp[e.gamepad.index] = self.getGamepads()[e.gamepad.index].timestamp;
                requestAnimationFrame(function() {
                    let newTs = self.getGamepads()[e.gamepad.index].timestamp;
                    if (self.edgeDetectionHackTimestamp[e.gamepad.index] !== newTs) {
                        self.isEdgeDetectionHackActive[e.gamepad.index] = true;
                        self.forceRecompute = Date.now();
                    }
                });
            }
        });

        window.addEventListener('gamepaddisconnected', function(e) {
            console.log('Gamepad disconnected: ' + e.gamepad.id);
            if (self.currentController.index === e.gamepad.index) {
                self.currentController = self.getGamepad().index;
            }
            self.isEdgeDetectionHackActive[e.gamepad.index] = false;
            self.allControllers = self.getGamepads();
        });
    },
    mounted: function() {
        StatusBus.$on(BusEvents.BEFORE_UPDATE_INPUT, this.updateGamepad);
    },
    template: '<div class="center-text"><controller-select v-bind:gamepads="allControllers" v-model="currentController"></controller-select><component v-bind:is="currentControllerComponent" v-bind:gamepadindex="currentController" v-bind:gamepadname="gamepadName" v-bind:axes="axes" v-bind:buttons="buttons"></component></div>'
};