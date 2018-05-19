export const ConnectionState = Object.freeze({
    NOT_CONNECTED: 1,
    CONNECTED: 2,
    ERROR: 3,
    CONNECTING: 4
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

// TODO: use Vuex for centralized state management
export const store = new Vuex.Store({
    state: {
        connectionState: ConnectionState.NOT_CONNECTED,
        controlState: ControlState.NO_CONTROLLER,
        controlMode: ControlMode.SINGLE_CONTROLLER
    },
    mutations: {
        setConnectionState: function(state, newState) {
            console.log(`Changing connection state to ${newState}`);
            state.connectionState = newState;
        },
        setControlState: function(state, newState) {
            console.log(`Changing control state to ${newState}`);
            state.controlState = newState;
        },
        setControlMode: function(state, newMode) {
            console.log(`Changing control mode to ${newMode}`);
            state.controlMode = newMode;
        }
    }
});

Vue.mixin({
    delimiters: ['((', '))']
});