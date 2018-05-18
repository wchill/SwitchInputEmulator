import {switchButtons} from "./VueConstants.js"
import {baseController} from "./BaseController.js";

export let switchProControllerStandard = {
    mixins: [baseController],
    data: function() {
        return {
            spriteSheetUrl: 'assets/images/proControllerSpritesheet.png',
            buttonSprites: {faceRight:{x:838,y:178,w:78,h:79,inactive:{x:5,y:5},active:{x:93,y:5}},faceDown:{x:757,y:249,w:78,h:79,inactive:{x:181,y:5},active:{x:269,y:5}},faceUp:{x:757,y:107,w:78,h:79,inactive:{x:873,y:5},active:{x:961,y:5}},faceLeft:{x:675,y:178,w:78,h:79,inactive:{x:873,y:94},active:{x:961,y:94}},leftTop:{x:114,y:0,w:248,h:85,inactive:{x:357,y:5},active:{x:615,y:5}},rightTop:{x:679,y:0,w:248,h:85,inactive:{x:5,y:100},active:{x:263,y:100}},leftTrigger:{x:300,y:533,w:150,h:150,inactive:{x:521,y:183},active:{x:681,y:183}},rightTrigger:{x:590,y:533,w:150,h:150,inactive:{x:841,y:183},active:{x:5,y:343}},select:{x:370,y:117,w:44,h:44,inactive:{x:225,y:269},active:{x:279,y:269}},start:{x:627,y:117,w:44,h:44,inactive:{x:333,y:269},active:{x:387,y:269}},share:{x:427,y:198,w:39,h:39,inactive:{x:113,y:269},active:{x:440,y:269}},home:{x:572,y:196,w:44,h:44,inactive:{x:5,y:269},active:{x:59,y:269}},dpadUp:{x:335,y:285,w:50,h:76,inactive:{x:1001,y:269},active:{x:165,y:355},opacity:!0},dpadDown:{x:335,y:361,w:50,h:76,inactive:{x:1001,y:183},active:{x:165,y:269},opacity:!0},dpadLeft:{x:284,y:336,w:75,h:50,inactive:{x:225,y:343},active:{x:310,y:343},opacity:!0},dpadRight:{x:360,y:336,w:76,h:51,inactive:{x:395,y:343},active:{x:481,y:343},opacity:!0}},
            stickSprites: {leftStick:{x:174,y:155,w:120,h:120,travel:40,inactive:{x:5,y:738},active:{x:135,y:738}},rightStick:{x:598,y:299,w:120,h:120,travel:40,inactive:{x:5,y:738},active:{x:135,y:738}}},
            canvasSize: {
                x: 1061,
                y: 5,
                width: 1040,
                height: 723,
                scale: 0.75
            },
            buttonMapping: {
                faceDown: {val: switchButtons.B, index: 0},
                faceRight: {val: switchButtons.A, index: 1},
                faceLeft: {val: switchButtons.Y, index: 2},
                faceUp: {val: switchButtons.X, index: 3},
                leftTop: {val: switchButtons.L, index: 4},
                rightTop: {val: switchButtons.R, index: 5},
                leftTrigger: {val: switchButtons.ZL, index: 6},
                rightTrigger: {val: switchButtons.ZR, index: 7},
                select: {val: switchButtons.MINUS, index: 8},
                start: {val: switchButtons.PLUS, index: 9},
                leftStick: {val: switchButtons.L3, index: 10, invisible: true},
                rightStick: {val: switchButtons.R3, index: 11, invisible: true},
                home: {val: switchButtons.HOME, index: 16},
                share: {val: switchButtons.SHARE, index: 17}
            },
            dpadMapping: {
                dpadUp: {index: 12},
                dpadDown: {index: 13},
                dpadLeft: {index: 14},
                dpadRight: {index: 15}
            },
            stickMapping: {
                leftStick: {axisX: 0, axisY: 1, index: 10},
                rightStick: {axisX: 2, axisY: 3, index: 11}
            },
            canonicalName: 'Switch Pro Controller',
            experimental: true
        };
    }
};

export let powerAWiredControllerStandard = {
    mixins: [switchProControllerStandard],
    data: function() {
        return {
            canonicalName: 'PowerA Wired Controller',
            experimental: true
        };
    }
};

let powerAWiredControllerBase = {
    mixins: [powerAWiredControllerStandard],
    data: function() {
        return {
            buttonMapping: {
                faceLeft: {val: switchButtons.Y, index: 0},
                faceDown: {val: switchButtons.B, index: 1},
                faceRight: {val: switchButtons.A, index: 2},
                faecUp: {val: switchButtons.X, index: 3},
                leftTop: {val: switchButtons.L, index: 4},
                rightTop: {val: switchButtons.R, index: 5},
                leftTrigger: {val: switchButtons.ZL, index: 6},
                rightTrigger: {val: switchButtons.ZR, index: 7},
                select: {val: switchButtons.MINUS, index: 8},
                start: {val: switchButtons.PLUS, index: 9},
                leftStick: {val: switchButtons.L3, index: 10, invisible: true},
                rightStick: {val: switchButtons.R3, index: 11, invisible: true},
                home: {val: switchButtons.HOME, index: 12},
                share: {val: switchButtons.SHARE, index: 13}
            }
        };
    }
};

export let powerAWiredControllerChromeOS = {
    mixins: [powerAWiredControllerBase],
    data: function() {
        return {
            buttonMapping: {
                faceLeft: {val: switchButtons.Y, index: 0},
                faceDown: {val: switchButtons.B, index: 1},
                faceRight: {val: switchButtons.A, index: 2},
                faceUp: {val: switchButtons.X, index: 3},
                leftTop: {val: switchButtons.L, index: 4},
                rightTop: {val: switchButtons.R, index: 5},
                leftTrigger: {val: switchButtons.ZL, index: 6},
                rightTrigger: {val: switchButtons.ZR, index: 7},
                select: {val: switchButtons.MINUS, index: 8},
                start: {val: switchButtons.PLUS, index: 9},
                leftStick: {val: switchButtons.L3, index: 10, invisible: true},
                rightStick: {val: switchButtons.R3, index: 11, invisible: true},
                home: {val: switchButtons.HOME, index: 12},
                share: {val: switchButtons.SHARE, index: 13}
            },
            dpadMapping: {
                dpadUp: {axis: 5, sign: -1},
                dpadDown: {axis: 5, sign: 1},
                dpadLeft: {axis: 4, sign: -1},
                dpadRight: {axis: 4, sign: 1}
            }
        };
    },
    methods: {
        isDpadPressed: function(name, mapping) {
            return mapping.hasOwnProperty('axis') && mapping.hasOwnProperty('sign') && this.axes[mapping.axis] * mapping.sign > this.deadzone;
        }
    }
};

export let powerAWiredControllerWinChrome = {
    mixins: [powerAWiredControllerBase],
    data: function() {
        return {
            dpadMapping: {
                dpadUp: {axis: 9, axisVals: [-7, -5, 7]},
                dpadDown: {axis: 9, axisVals: [-1, 1, 3]},
                dpadLeft: {axis: 9, axisVals: [3, 5, 7]},
                dpadRight: {axis: 9, axisVals: [-5, -3, -1]},
            },
            stickMapping: {
                leftStick: {axisX: 0, axisY: 1, index: 10},
                rightStick: {axisX: 2, axisY: 5, index: 11}
            }
        }
    },
    methods: {
        isDpadPressed: function(name, mapping) {
            if (!(mapping.hasOwnProperty('axis') && mapping.hasOwnProperty('axisVals'))) return false;
            let axisValNormalized = this.axes[mapping.axis] * 7;
            for (let i = 0; i < mapping.axisVals.length; i++) {
                if (Math.abs(mapping.axisVals[i] - axisValNormalized) < 0.1) return true;
            }
            return false;
        }
    }
};

export let powerAWiredControllerWinFirefox = {
    mixins: [powerAWiredControllerBase],
    data: function() {
        return {
            dpadMapping: {
                // Remap dpadUp to Home
                dpadUp: {index: 12},
                dpadDown: {index: 13},
                dpadLeft: {},
                dpadRight: {},
            },
            notifyMessage: 'The D-Pad does not work properly in Firefox on Windows. The Home button has been mapped to D-Pad Up. If this doesn\'t work for you, try using Chrome.'
        }
    },
    methods: {
        isDpadPressed: function(name, mapping) {
            if (!mapping.hasOwnProperty('index')) return false;
            return this.buttons[mapping.index];
        }
    }
};

export let switchProController = {
    mixins: [switchProControllerStandard],
    data: function() {
        return {
            buttonMapping: {
                faceLeft: {val: switchButtons.Y, index: 0},
                faceDown: {val: switchButtons.B, index: 1},
                faceRight: {val: switchButtons.A, index: 2},
                faceUp: {val: switchButtons.X, index: 3},
                leftTop: {val: switchButtons.L, index: 4},
                rightTop: {val: switchButtons.R, index: 5},
                leftTrigger: {val: switchButtons.ZL, index: 6},
                rightTrigger: {val: switchButtons.ZR, index: 7},
                select: {val: switchButtons.MINUS, index: 8},
                start: {val: switchButtons.PLUS, index: 9},
                leftStick: {val: switchButtons.L3, index: 10, invisible: true},
                rightStick: {val: switchButtons.R3, index: 11, invisible: true},
                home: {val: switchButtons.HOME, index: 16},
                share: {val: switchButtons.SHARE, index: 17}
            },
            dpadMapping: {
                dpadUp: {index: 16},
                dpadDown: {index: 17},
                dpadLeft: {index: 18},
                dpadRight: {index: 19}
            },
            stickMapping: {
                leftStick: {axisX: 0, axisY: 1, index: 10},
                rightStick: {axisX: 2, axisY: 3, index: 11}
            }
        };
    }
};