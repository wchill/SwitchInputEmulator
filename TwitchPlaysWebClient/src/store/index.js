import Vue from 'vue';
import Vuex from 'vuex';
import { AuthState, ConnectionState, InputState, PlayerState, StoreMutations } from '../mixins/Common';
// import { enumToName } from '../mixins/Utils';

Vue.use(Vuex);

export default new Vuex.Store({
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
      turnLength: -1,
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
        dpadRight: false,
      },
      sticks: {
        leftStick: {
          x: 0.0,
          y: 0.0,
          pressed: false,
        },
        rightStick: {
          x: 0.0,
          y: 0.0,
          pressed: false,
        },
      },
    },
  },
  getters: {
    canControl(state) {
      if (state.connectionState !== ConnectionState.CONNECTED) return false;
      if (state.authState !== AuthState.SERVER_SIGNED_IN) return false;
      if (!state.twitchUser) return false;
      return state.twitchUser.profile.sub === state.currentPlayerInfo.id;
    },
    connectionState(state) {
      return state.connectionState;
    },
    inputState(state) {
      return state.inputState;
    },
    playerState(state) {
      return state.playerState;
    },
    authState(state) {
      return state.authState;
    },
    twitchUser(state) {
      return state.twitchUser;
    },
    currentPlayerInfo(state) {
      return state.currentPlayerInfo;
    },
    gamepadState(state) {
      return state.gamepadState;
    },
    serverClockSkew(state) {
      return state.serverClockSkew || 0;
    },
  },
  mutations: {
    [StoreMutations.CONNECTION_STATE](state, newState) {
      // console.log(`Changing connection state from ${enumToName(ConnectionState, state.connectionState)} to ${enumToName(ConnectionState, newState)}`);
      state.connectionState = newState;
      if (newState === ConnectionState.NOT_CONNECTED) {
        // console.log(`Changing auth state from ${enumToName(AuthState, state.authState)} to ${enumToName(AuthState, AuthState.SIGNED_IN)}`);
        state.authState = AuthState.SIGNED_IN;
      }
    },
    [StoreMutations.INPUT_STATE](state, newState) {
      // console.log(`Changing input state from ${enumToName(InputState, state.inputState)} to ${enumToName(InputState, newState)}`);
      state.inputState = newState;
    },
    [StoreMutations.PLAYER_STATE](state, newState) {
      // console.log(`Changing player state from ${enumToName(PlayerState, state.playerState)} to ${enumToName(PlayerState, newState)}`);
      state.playerState = newState;
    },
    [StoreMutations.AUTH_STATE](state, newState) {
      // console.log(`Changing auth state from ${enumToName(AuthState, state.authState)} to ${enumToName(AuthState, newState)}`);
      state.authState = newState;
    },
    [StoreMutations.TWITCH_USER](state, newUser) {
      state.twitchUser = newUser;
      if (!newUser) {
        // console.log(`Changing auth state from ${enumToName(AuthState, state.authState)} to ${enumToName(AuthState, AuthState.NOT_SIGNED_IN)}`);
        state.authState = AuthState.NOT_SIGNED_IN;
      }
    },
    [StoreMutations.CURRENT_PLAYER_INFO](state, newInfo) {
      state.currentPlayerInfo = newInfo;
    },
    [StoreMutations.GAMEPAD_STATE](state, newState) {
      if (newState) {
        state.gamepadState = newState;
      }
    },
    [StoreMutations.SERVER_CLOCK_SKEW](state, newSkew) {
      if (state.serverClockSkew === null) {
        state.serverClockSkew = Math.round(newSkew);
      } else {
        state.serverClockSkew = Math.round(((40 * state.serverClockSkew) + (60 * newSkew)) / 100);
      }
    },
  },
});
