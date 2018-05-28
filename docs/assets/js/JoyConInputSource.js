import {BaseController} from "./BaseController";

const StandardJoyConMappings = {
    data: function() {
        return {
            buttonMapping: {
                faceDown: 0,
                faceRight: 1,
                faceLeft: 2,
                faceUp: 3,
                leftTop: 4,
                rightTop: 5,
                leftTrigger: 6,
                rightTrigger: 7,
                select: 8,
                start: 9,
                leftStick: 10,
                rightStick: 11,
                dpadUp: 12,
                dpadDown: 13,
                dpadLeft: 14,
                dpadRight: 15
            },
            stickMapping: {
                leftStick: {axisX: 0, axisY: 1},
                rightStick: {axisX: 2, axisY: 3}
            }
        };
    }
};

export let JoyConInputSource = {
    mixins: [BaseController],
    props: ['gamepadindex', 'gamepadname', 'axes', 'buttons'],
    data: function() {
        return {}
    }
};