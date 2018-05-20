export const ConnectionState = Object.freeze({
    NOT_CONNECTED: 1,
    CONNECTED: 2,
    ERROR: 3,
    CONNECTING: 4
});

export const PlayerState = Object.freeze({
    NOT_CONNECTED: 1,
    ERROR: 2,
    CONNECTING: 3,
    PLAYING: 4,
    PAUSED: 5
});

export const ControlState = Object.freeze({
    NO_CONTROLLER: 1,
    UNSUPPORTED_CONTROLLER: 2,
    INACTIVE: 3,
    WAITING: 4,
    ACTIVE: 5
});

export const ControlMode = Object.freeze({
    SINGLE_CONTROLLER: 1,
    MULTIPLE_CONTROLLERS: 2,
    KEYBOARD: 3,
    TOUCH: 4
});

export const SwitchButtons = Object.freeze({
    Y: 1,
    B: 2,
    A: 4,
    X: 8,
    L: 16,
    R: 32,
    ZL: 64,
    ZR: 128,
    MINUS: 256,
    PLUS: 512,
    L3: 1024,
    R3: 2048,
    HOME: 4096,
    SHARE: 8192,
    DPAD_UP: 0,
    DPAD_UPRIGHT: 1,
    DPAD_RIGHT: 2,
    DPAD_DOWNRIGHT: 3,
    DPAD_DOWN: 4,
    DPAD_DOWNLEFT: 5,
    DPAD_LEFT: 6,
    DPAD_UPLEFT: 7,
    DPAD_NONE: 8
});

export const BusEvents = Object.freeze({
    RENDER_TIME_START: 'start-render',
    RENDER_TIME_END: 'finish-render',
    UPDATE_INPUT: 'update-input',
    INPUT_CHANGED: 'input-changed',
    SEND_MESSAGE: 'send'
});

export const StatusBus = new Vue();

function enumToName(sourceEnum, val) {
    let keys = Object.keys(sourceEnum);
    for (let i = 0; i < keys.length; i++) {
        if (sourceEnum[keys[i]] === val) return keys[i];
    }
    return val;
}

export const store = new Vuex.Store({
    state: {
        connectionState: ConnectionState.NOT_CONNECTED,
        controlState: ControlState.NO_CONTROLLER,
        controlMode: ControlMode.SINGLE_CONTROLLER,
        playerState: PlayerState.NOT_CONNECTED,
        gamepadState: {
            buttons: {
                faceDown: false,
                    faceRight: false,
                    faceLeft: false,
                    faceUp: false,
                    leftTop: false,
                    rightTop: false,
                    leftTrigger: false,
                    rightTrigger: false,
                    select: false,
                    start: false,
                    leftStick: false,
                    rightStick: false,
                    home: false,
                    share: false,
                    dpadUp: false,
                    dpadDown: false,
                    dpadLeft: false,
                    dpadRight: false
            },
            sticks: {
                leftStick: {
                    x: 0.0,
                        y: 0.0,
                        pressed: false
                },
                rightStick: {
                    x: 0.0,
                        y: 0.0,
                        pressed: false
                }
            }
        },
    },
    mutations: {
        setConnectionState: function(state, newState) {
            console.log(`Changing connection state from ${enumToName(ConnectionState, state.connectionState)} to ${enumToName(ConnectionState, newState)}`);
            state.connectionState = newState;
        },
        setControlState: function(state, newState) {
            console.log(`Changing control state from ${enumToName(ControlState, state.controlState)} to ${enumToName(ControlState, newState)}`);
            state.controlState = newState;
        },
        setControlMode: function(state, newMode) {
            console.log(`Changing control mode from ${enumToName(ControlMode, state.controlMode)} to ${enumToName(ControlMode, newMode)}`);
            state.controlMode = newMode;
        },
        setPlayerState: function(state, newState) {
            console.log(`Changing player state from ${enumToName(PlayerState, state.playerState)} to ${enumToName(PlayerState, newState)}`);
            state.playerState = newState;
        },
        setGamepadState: function(state, newState) {
            if (newState) {
                state.gamepadState = newState;
            }
        }
    }
});

Vue.mixin({
    delimiters: ['((', '))']
});