import Vue from 'vue';

export const ConnectionState = Object.freeze({
  NOT_CONNECTED: 1,
  CONNECTED: 2,
  ERROR: 3,
  CONNECTING: 4,
});

export const PlayerState = Object.freeze({
  NOT_CONNECTED: 1,
  ERROR: 2,
  CONNECTING: 3,
  PLAYING: 4,
  PAUSED: 5,
});

export const InputState = Object.freeze({
  NOT_CONNECTED: 1,
  UNSUPPORTED: 2,
  READY: 3,
});

export const AuthState = Object.freeze({
  NOT_SIGNED_IN: 1,
  SIGNED_IN: 2,
  SERVER_SIGNED_IN: 3,
});

export const BusEvents = Object.freeze({
  RENDER_TIME_START: 'start-render',
  RENDER_TIME_END: 'finish-render',
  BEFORE_UPDATE_INPUT: 'before-update-input',
  UPDATE_INPUT: 'update-input',
  AFTER_UPDATE_INPUT: 'after-update-input',
  SEND_MESSAGE: 'send',
  TWITCH_LOGGED_IN: 'twitch-login',
  TWITCH_LOGGED_OUT: 'twitch-logout',
  TWITCH_LOGIN_OK: 'twitch-authenticated',
});

export const StatusBus = new Vue();

export const StoreMutations = Object.freeze({
  CONNECTION_STATE: 'setConnectionState',
  PLAYER_STATE: 'setPlayerState',
  AUTH_STATE: 'setAuthState',
  TWITCH_USER: 'setTwitchUser',
  GAMEPAD_STATE: 'setGamepadState',
  SERVER_CLOCK_SKEW: 'updateServerClockSkew',
  CURRENT_PLAYER_INFO: 'setCurrentPlayerInfo',
  INPUT_STATE: 'setInputState',
});
