import {KeyboardInputSource} from "./KeyboardInputSource";
import {ControllerInputSource} from "./ControllerInputSource";
import {JoyConInputSource} from "./JoyConInputSource";
import * as Utils from "./Utils";

export const ControlMode = Object.freeze({
    SINGLE_CONTROLLER: 'controller-input',
    MULTIPLE_CONTROLLERS: 'multiple-controller-input',
    KEYBOARD: 'keyboard-input',
    TOUCH: 'touch-input'
});

export const ControlModeSelect = {
    components: {
        'keyboard-input': KeyboardInputSource,
        'controller-input': ControllerInputSource,
        'multiple-controller-input': JoyConInputSource
    },
    data: function() {
        return {
            selectedMode: ControlMode.KEYBOARD,
            modeEnabled: {
                [ControlMode.KEYBOARD]: [true, ''],
                [ControlMode.SINGLE_CONTROLLER]: [false, ''],
                [ControlMode.MULTIPLE_CONTROLLERS]: [false, ''],
                [ControlMode.TOUCH]: [false, '']
            }
        }
    },
    computed: {
        currentControlModeComponent: function() {
            if (this.selectedMode === ControlMode.SINGLE_CONTROLLER) {
                return 'controller-input';
            } else if (this.selectedMode === ControlMode.MULTIPLE_CONTROLLERS) {
                return 'multiple-controller-input';
            } else if (this.selectedMode === ControlMode.TOUCH) {
                return 'touch-input';
            }

            return 'keyboard-input';
        }
    },
    watch: {
        selectedMode: function() {
            this.$refs.select.blur();
            if (!this.modeEnabled[this.selectedMode][0]) {
                this.selectedMode = ControlMode.KEYBOARD;
            }
        }
    },
    methods: {
        updateModeState: function() {
            let newState = {};

            let modes = Object.keys(this.modeEnabled);
            for (let i = 0; i < modes.length; i++) {
                let reason = this.getDisabledReason(modes[i]);
                if (reason && reason.length > 0) {
                    newState[modes[i]] = [false, reason];
                } else {
                    newState[modes[i]] = [true, ''];
                }
            }

            this.modeEnabled = newState;
        },
        getModeText: function(mode){
            let text;
            if (mode === ControlMode.SINGLE_CONTROLLER) {
                text = 'Controller';
            } else if (mode === ControlMode.MULTIPLE_CONTROLLERS) {
                text = 'Joycons';
            } else if (mode === ControlMode.TOUCH) {
                text = 'Touch controls';
            } else {
                text = 'Keyboard';
            }
            if (!this.modeEnabled[mode][0]) {
                text += ` (${this.modeEnabled[mode][1]})`;
            }
            return text;
        },
        getDisabledReason: function(mode) {
            if (mode === ControlMode.SINGLE_CONTROLLER) {
                let gp = navigator.getGamepads();
                for(let i = 0; i < gp.length; i++) {
                    if (gp[i]) return '';
                }
                return 'No controllers detected';
            } else if (mode === ControlMode.MULTIPLE_CONTROLLERS) {
                let browser = Utils.detectBrowser();
                if (browser === 'Firefox') {
                    return 'Not supported in Firefox';
                } else if (browser === 'Edge') {
                    return 'Not supported in Edge';
                }
                let left = false, right = false;
                let gp = navigator.getGamepads();
                for(let i = 0; i < gp.length; i++) {
                    if (gp[i] && Utils.checkVidPid(gp[i].id, '57e', '2006')) left = true;
                    else if (gp[i] && Utils.checkVidPid(gp[i].id, '57e', '2007')) right = true;
                }
                if (left && right) return '';
                else if (left) return 'Right JoyCon not connected';
                else if (right) return 'Left JoyCon not connected';
                else return 'No JoyCons connected';
            } else if (mode === ControlMode.TOUCH) {
                return 'Not implemented yet';
            } else {
                return '';
            }
        }
    },
    mounted: function() {
        let self = this;
        window.addEventListener('gamepadconnected', function(e) {
            console.log('Detected gamepad: ' + e.gamepad.id);
            self.updateModeState();
        });

        window.addEventListener('gamepaddisconnected', function(e) {
            console.log('Gamepad disconnected: ' + e.gamepad.id);
            self.updateModeState();
        });
    },
    template: '<div><select ref="select" v-model="selectedMode"><option v-for="mode in Object.keys(modeEnabled)" v-bind:value="mode" v-text="getModeText(mode)" :disabled="!modeEnabled[mode][0]"></option></select>' +
    '<component v-bind:is="currentControlModeComponent"></component></div>'
};