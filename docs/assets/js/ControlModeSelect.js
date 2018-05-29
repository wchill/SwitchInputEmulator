import {KeyboardInputSource} from "./KeyboardInputSource";
import {ControllerInputSource} from "./ControllerInputSource";
import * as Utils from "./Utils";
import {JoyConInputSource} from "./JoyConInputSource";

export const ControlMode = Object.freeze({
    SINGLE_CONTROLLER: 1,
    MULTIPLE_CONTROLLERS: 2,
    KEYBOARD: 3,
    TOUCH: 4
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
            enabledModes: [
                ControlMode.KEYBOARD,
                ControlMode.SINGLE_CONTROLLER,
                ControlMode.MULTIPLE_CONTROLLERS,
                ControlMode.TOUCH
            ]
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
            if (this.getDisabledReason(parseInt(this.selectedMode)).length > 0) {
                this.mode = ControlMode.KEYBOARD;
            }
        }
    },
    methods: {
        getModeText: function(mode){
            let text;
            if (mode === ControlMode.SINGLE_CONTROLLER) {
                text = 'Controller';
            } else if (mode === ControlMode.MULTIPLE_CONTROLLERS) {
                text =  'Joycons';
            } else if (mode === ControlMode.TOUCH) {
                text =  'Touch controls';
            } else {
                text = 'Keyboard';
            }
            text += this.getDisabledReason(mode);
            return text;
        },
        getDisabledReason: function(mode) {
            if (mode === ControlMode.SINGLE_CONTROLLER) {
                let gp = navigator.getGamepads();
                for(let i = 0; i < gp.length; i++) {
                    if (gp[i]) return '';
                }
                return ' (No controllers detected)';
            } else if (mode === ControlMode.MULTIPLE_CONTROLLERS) {
                let browser = Utils.detectBrowser();
                if (browser === 'Firefox') {
                    return ' (Not supported in Firefox)';
                } else if (browser === 'Edge') {
                    return ' (Not supported in Edge';
                }
                let left = false, right = false;
                let gp = navigator.getGamepads();
                for(let i = 0; i < gp.length; i++) {
                    if (gp[i] && Utils.checkVidPid(gp[i].id, '57e', '2006')) left = true;
                    else if (gp[i] && Utils.checkVidPid(gp[i].id, '57e', '2007')) right = true;
                }
                if (left && right) return '';
                else if (left) return ' (Right JoyCon not connected)';
                else if (right) return ' (Left JoyCon not connected)';
                else return ' (No JoyCons connected)';
            } else if (mode === ControlMode.TOUCH) {
                return ' (Not implemented yet)';
            } else {
                return '';
            }
        }
    },
    mounted: function() {
    },
    template: '<div><select ref="select" v-model="selectedMode"><option v-for="mode in enabledModes" v-bind:value="mode" v-text="getModeText(mode)" :disabled="getDisabledReason(mode).length > 0"></option></select>' +
    '<component v-bind:is="currentControlModeComponent"></component></div>'
};