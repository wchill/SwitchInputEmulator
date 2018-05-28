import {InputSource} from "./InputSource";
import {InputState, StoreMutations} from "./Common";

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
                    slow: 'z'
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
        this.$store.commit(StoreMutations.INPUT_STATE, InputState.READY);
    },
    methods: {
        isButtonPressed: function(name) {
            if (!this.keyMapping[name]) return false;
            if (key.ctrl || key.alt) return false;
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