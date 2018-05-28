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

export const InputState = Object.freeze({
    NOT_CONNECTED: 1,
    UNSUPPORTED: 2,
    READY: 3
});

export const AuthState = Object.freeze({
    NOT_SIGNED_IN: 1,
    SIGNED_IN: 2,
    SERVER_SIGNED_IN: 3
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
    BEFORE_UPDATE_INPUT: 'before-update-input',
    UPDATE_INPUT: 'update-input',
    SEND_MESSAGE: 'send',
    TWITCH_LOGGED_IN: 'twitch-login',
    TWITCH_LOGGED_OUT: 'twitch-logout',
    TWITCH_LOGIN_OK: 'twitch-authenticated',
});

export const StatusBus = new Vue();

function enumToName(sourceEnum, val) {
    let keys = Object.keys(sourceEnum);
    for (let i = 0; i < keys.length; i++) {
        if (sourceEnum[keys[i]] === val) return keys[i];
    }
    return val;
}

export const StoreMutations = Object.freeze({
    CONNECTION_STATE: 'setConnectionState',
    PLAYER_STATE: 'setPlayerState',
    AUTH_STATE: 'setAuthState',
    TWITCH_USER: 'setTwitchUser',
    GAMEPAD_STATE: 'setGamepadState',
    SERVER_CLOCK_SKEW: 'updateServerClockSkew',
    CURRENT_PLAYER_INFO: 'setCurrentPlayerInfo',
    INPUT_STATE: 'setInputState'
});

export const store = new Vuex.Store({
    strict: true,
    state: {
        connectionState: ConnectionState.NOT_CONNECTED,
        inputState: InputState.NOT_CONNECTED,
        playerState: PlayerState.NOT_CONNECTED,
        authState: AuthState.NOT_SIGNED_IN,
        twitchUser: null,
        currentPlayerInfo: {
            id: null,
            name: null,
            picture: null,
            expire: -1,
            turnLength: -1
        },
        serverClockSkew: null,
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
            },
            stateObj: {
                buttons: 0,
                dpad: 8,
                lx: 0,
                ly: 0,
                rx: 0,
                ry: 0
            }
        },
    },
    getters: {
        canControl: function(state) {
            if (state.connectionState !== ConnectionState.CONNECTED) return false;
            if (state.authState !== AuthState.SERVER_SIGNED_IN) return false;
            if (!state.twitchUser) return false;
            if (state.twitchUser.profile.sub !== state.currentPlayerInfo.id) return false;

            return true;
        },
        connectionState: function(state) {
            return state.connectionState;
        },
        inputState: function(state) {
            return state.inputState;
        },
        playerState: function(state) {
            return state.playerState;
        },
        authState: function(state) {
            return state.authState;
        },
        twitchUser: function(state) {
            return state.twitchUser;
        },
        currentPlayerInfo: function(state) {
            return state.currentPlayerInfo;
        },
        gamepadState: function(state) {
            return state.gamepadState;
        },
        serverClockSkew: function(state) {
            return state.serverClockSkew || 0;
        }
    },
    mutations: {
        [StoreMutations.CONNECTION_STATE] (state, newState) {
            console.log(`Changing connection state from ${enumToName(ConnectionState, state.connectionState)} to ${enumToName(ConnectionState, newState)}`);
            state.connectionState = newState;
            if (newState === ConnectionState.NOT_CONNECTED) {
                console.log(`Changing auth state from ${enumToName(AuthState, state.authState)} to ${enumToName(AuthState, AuthState.SIGNED_IN)}`);
                state.authState = AuthState.SIGNED_IN;
            }
        },
        [StoreMutations.INPUT_STATE] (state, newState) {
            console.log(`Changing input state from ${enumToName(InputState, state.inputState)} to ${enumToName(InputState, newState)}`);
            state.inputState = newState;
        },
        [StoreMutations.PLAYER_STATE] (state, newState) {
            console.log(`Changing player state from ${enumToName(PlayerState, state.playerState)} to ${enumToName(PlayerState, newState)}`);
            state.playerState = newState;
        },
        [StoreMutations.AUTH_STATE] (state, newState) {
            console.log(`Changing auth state from ${enumToName(AuthState, state.authState)} to ${enumToName(AuthState, newState)}`);
            state.authState = newState;
        },
        [StoreMutations.TWITCH_USER] (state, newUser) {
            state.twitchUser = newUser;
            if (!newUser) {
                console.log(`Changing auth state from ${enumToName(AuthState, state.authState)} to ${enumToName(AuthState, AuthState.NOT_SIGNED_IN)}`);
                state.authState = AuthState.NOT_SIGNED_IN;
            }
        },
        [StoreMutations.CURRENT_PLAYER_INFO] (state, newInfo) {
            state.currentPlayerInfo = newInfo;
        },
        [StoreMutations.GAMEPAD_STATE] (state, newState) {
            if (newState) {
                state.gamepadState = newState;
            }
        },
        [StoreMutations.SERVER_CLOCK_SKEW] (state, newSkew) {
            if (state.serverClockSkew === null) {
                state.serverClockSkew = Math.round(newSkew);
            } else {
                state.serverClockSkew = Math.round((40 * state.serverClockSkew + 60 * newSkew) / 100);
            }
        }
    }
});

Vue.mixin({
    delimiters: ['((', '))']
});