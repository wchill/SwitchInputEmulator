import {InputSource} from "./InputSource";
import {ControlState} from "./Common";

export const KeyboardInputSource = {
    mixins: [InputSource],
    data: function() {
        return {
            keyMapping: {
                faceDown: 'down',
                faceRight: 'right',
                faceLeft: 'left',
                faceUp: 'up',
                leftTop: 'q',
                rightTop: 'o',
                leftTrigger: 'e',
                rightTrigger: 'u',
                select: '-',
                start: '=',
                leftStick: 'r',
                rightStick: 'y',
                dpadUp: 't',
                dpadDown: 'g',
                dpadLeft: 'f',
                dpadRight: 'h'
            },
            stickMapping: {
                leftStick: {
                    up: 'w',
                    down: 's',
                    left: 'a',
                    right: 'd',
                    slow: function() {return key.shift;}
                },
                rightStick: {
                    up: 'i',
                    down: 'k',
                    left: 'j',
                    right: 'l',
                    slow: '/'
                }
            }
        };
    },
    mounted: function() {
        let controlState = this.$store.state.controlState;
        if (controlState === ControlState.UNSUPPORTED_CONTROLLER || controlState === ControlState.NO_CONTROLLER) {
            this.$store.commit('setControlState', ControlState.INACTIVE);
        }
    },
    methods: {
        isButtonPressed: function(name) {
            if (!this.keyMapping[name]) return false;
            if (key.ctrl || key.alt) return false;
            if (typeof this.keyMapping[name] === 'function') {
                return this.keyMapping[name]();
            }
            return key.isPressed(this.keyMapping[name]);
        },
        getStickX: function(stick) {
            if (!this.stickMapping[stick]) return false;
            if (key.ctrl || key.alt) return false;
            let val = 0;
            if (key.isPressed(this.stickMapping[stick].left)) val -= 1;
            if (key.isPressed(this.stickMapping[stick].right)) val += 1;
            if (key.isPressed(this.stickMapping[stick].slow)) val *= 0.5;
            return val;
        },
        getStickY: function(stick) {
            if (!this.stickMapping[stick]) return false;
            if (key.ctrl || key.alt) return false;
            let val = 0;
            if (key.isPressed(this.stickMapping[stick].up)) val -= 1;
            if (key.isPressed(this.stickMapping[stick].down)) val += 1;
            if (key.isPressed(this.stickMapping[stick].slow)) val *= 0.5;
            return val;
        }
    },
    template: '<div><span class="center-text">Using keyboard</span></div>'
};