import {KeyboardInputSource} from "./KeyboardInputSource";
import {ControllerInputSource} from "./ControllerInputSource";

export const ControlMode = Object.freeze({
    SINGLE_CONTROLLER: 1,
    MULTIPLE_CONTROLLERS: 2,
    KEYBOARD: 3,
    TOUCH: 4
});

export const ControlModeSelect = {
    components: {
        'keyboard-input': KeyboardInputSource,
        'controller-input': ControllerInputSource
    },
    data: function() {
        return {
            selectedMode: ControlMode.SINGLE_CONTROLLER,
            enabledModes: [
                ControlMode.SINGLE_CONTROLLER,
                //ControlMode.MULTIPLE_CONTROLLERS,
                ControlMode.KEYBOARD
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
    template: '<div><select ref="select" v-model="selectedMode"><option v-for="mode in this.enabledModes" v-bind:value="mode" v-text="getModeText(mode)"></option></select>' +
    '<component v-bind:is="currentControlModeComponent"></component></div>'
};