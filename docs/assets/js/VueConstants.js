export const stateEnum = Object.freeze({
    NOT_CONNECTED: 1,
    CONNECTED_NO_CONTROLLER: 2,
    CONNECTED_UNSUPPORTED_CONTROLLER: 3,
    CONNECTED_INACTIVE: 4,
    CONNECTED_WAITING: 5,
    CONNECTED_ACTIVE: 6,
    ERROR: 7,
    CONNECTING: 8
});

export const switchButtons = Object.freeze({
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

export const statusBus = new Vue();

Vue.mixin({
    delimiters: ['((', '))']
});