<template>
  <v-container pa-0>
    <v-layout row justify-center>
      <v-flex xs6>
        <div class="meter animate meter-purple">
          <div class="text-overlay">
            <img v-bind:src="currentPlayerInfo.picture" v-show="currentPlayerInfo.picture !== null">
            <span v-text="progressBarText"></span>
          </div>
          <span v-bind:style="progressBarStyle">
            <span></span>
          </span>
        </div>
      </v-flex>
    </v-layout>
    <v-layout row justify-center ma-2>
      <v-flex xs12 sm6 md4 lg4 xl2 mr-4>
        <twitch-auth></twitch-auth>
      </v-flex>
      <v-flex xs12 sm6 md4 lg4 xl2 ml-4>
        <v-tooltip bottom>
          <v-btn block round color="twitch-purple" class="elevation-3" @click="requestTurn" v-bind:disabled="!canRequestTurn" slot="activator">
            <v-icon left>mdi-nintendo-switch</v-icon>
            <span v-text="turnState">Request a turn</span>
          </v-btn>
          <span>You need to connect a controller!</span>
        </v-tooltip>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
  import { mapGetters } from 'vuex';
  import { StoreMutations, StatusBus, BusEvents, ConnectionState, InputState, AuthState } from '../mixins/Common';
  import { SocketBus, SocketEvents } from './ControlWebSocket';
  import TwitchAuth from './TwitchAuth';

  export default {
    name: 'ServerStatus',
    components: {
      'twitch-auth': TwitchAuth,
    },
    data() {
      return {
        pendingPings: {},
        waiting: false,
        progressBarWidth: 0,
        timeRemaining: -1,
        animateFrameCount: -1,
        totalAnimateFrames: 30,
      };
    },
    created() {
      const self = this;

      SocketBus.$on('CLIENT_ACTIVE', (args) => {
        const id = args[0];
        const name = args[1];
        const picture = args[2];
        const expire = parseInt(args[3], 10);
        const turnLength = parseInt(args[4], 10);
        if (name !== self.currentPlayerInfo.name) {
          self.animateFrameCount = self.totalAnimateFrames;
        }
        self.$store.commit(StoreMutations.CURRENT_PLAYER_INFO, {
          id,
          name,
          picture,
          expire,
          turnLength,
        });
      });

      SocketBus.$on('NO_CLIENTS', () => {
        self.$store.commit(StoreMutations.CURRENT_PLAYER_INFO, {
          id: null,
          name: null,
          picture: null,
          expire: -1,
          turnLength: -1,
        });
      });
    },
    watch: {
      canControl() {
        this.waiting = false;
      },
    },
    mounted() {
      const self = this;
      StatusBus.$on(BusEvents.BEFORE_UPDATE_INPUT, () => {
        // FIXME: Clean up this code
        if (self.currentPlayerInfo.id === null) {
          self.progressBarWidth = 0;
          self.timeRemaining = -1;
        } else if (self.currentPlayerInfo.turnLength < 0) {
          if (self.animateFrameCount >= 0) {
            self.progressBarWidth = (100 / self.totalAnimateFrames) * (self.totalAnimateFrames - self.animateFrameCount);
            self.animateFrameCount -= 1;
            if (self.animateFrameCount <= 0) {
              self.progressBarWidth = 100;
            }
          }
          self.timeRemaining = -1;
        } else {
          self.timeRemaining = (self.currentPlayerInfo.expire + self.serverClockSkew) - (performance.timeOrigin + performance.now());
          let scaleFactor = (self.totalAnimateFrames - self.animateFrameCount) / self.totalAnimateFrames;
          self.animateFrameCount -= 1;
          if (self.animateFrameCount <= 0) {
            scaleFactor = 1;
          }
          self.progressBarWidth = ((self.timeRemaining / self.currentPlayerInfo.turnLength) * 100) * (scaleFactor);
        }
      });
    },
    methods: {
      requestTurn() {
        if (this.canRequestTurn) {
          SocketBus.$emit(SocketEvents.SEND_MESSAGE, 'REQUEST_TURN');
          this.waiting = true;
        }
      },
    },
    computed: {
      progressBarStyle() {
        const width = `${this.progressBarWidth}%`;
        return {
          width,
        };
      },
      progressBarText() {
        if (this.currentPlayerInfo.id) {
          if (this.timeRemaining >= 0) {
            return `${this.currentPlayerInfo.name} is controlling (${Math.round(this.timeRemaining / 1000)} seconds remaining)`;
          }
          return `${this.currentPlayerInfo.name} is controlling`;
        }
        return 'No one is controlling right now';
      },
      turnState() {
        if (this.connectionState === ConnectionState.CONNECTED) {
          if (this.inputState === InputState.NOT_CONNECTED) {
            return 'No controller connected';
          } else if (this.inputState === InputState.UNSUPPORTED) {
            return 'Unsupported controller';
          }
          if (this.authState === AuthState.NOT_SIGNED_IN) {
            return 'Not signed in with Twitch';
          } else if (this.authState === AuthState.SIGNED_IN) {
            return 'Authenticating';
          } else if (this.canControl) {
            return 'It\'s your turn';
          } else if (this.waiting) {
            return 'Waiting for turn';
          }
          return 'Request a turn';
        } else if (this.connectionState === ConnectionState.NOT_CONNECTED) {
          return 'Not connected';
        } else if (this.connectionState === ConnectionState.CONNECTING) {
          return 'Connecting to server';
        } else if (this.connectionState === ConnectionState.ERROR) {
          return 'Connection error';
        }
        return 'Not connected';
      },
      canRequestTurn() {
        return this.connectionState === ConnectionState.CONNECTED && this.inputState === InputState.READY && this.authState === AuthState.SERVER_SIGNED_IN && !this.canControl && !this.waiting;
      },
      ...mapGetters([
        'canControl',
        'connectionState',
        'inputState',
        'authState',
        'currentPlayerInfo',
        'serverClockSkew',
      ]),
    },
  };
</script>

<style scoped>
  .meter {
    height: 44px;
    position: relative;
    background: #555;
    -moz-border-radius: 25px;
    -webkit-border-radius: 25px;
    border-radius: 25px;
    padding: 6px;
    -webkit-box-shadow: inset 0 -1px 1px rgba(255,255,255,0.3);
    -moz-box-shadow   : inset 0 -1px 1px rgba(255,255,255,0.3);
    box-shadow        : inset 0 -1px 1px rgba(255,255,255,0.3);
  }
  .meter > .text-overlay {
    position: absolute;
    width: 100%;
    color: white;
    text-shadow: 0 0 8px #000000;
    z-index: 10000;
    display: flex;
    justify-content: center;
  }
  .meter > .text-overlay > img {
    height: 24px;
    width: 24px;
    margin-top: 4px;
    margin-right: 10px;
    float: left;
    vertical-align: center;
  }
  .meter > .text-overlay > span {
    float: right;
    line-height: 32px;
  }
  .meter > span {
    display: block;
    height: 100%;
    -webkit-border-radius: 20px 20px 20px 20px;
    -moz-border-radius: 20px 20px 20px 20px;
    border-radius: 20px 20px 20px 20px;
    background-color: rgb(43,194,83);
    background-image: -webkit-gradient(
      linear,
      left bottom,
      left top,
      color-stop(0, rgb(43,194,83)),
      color-stop(1, rgb(84,240,84))
    );
    -webkit-box-shadow:
      inset 0 2px 9px  rgba(255,255,255,0.3),
      inset 0 -2px 6px rgba(0,0,0,0.4);
    -moz-box-shadow:
      inset 0 2px 9px  rgba(255,255,255,0.3),
      inset 0 -2px 6px rgba(0,0,0,0.4);
    box-shadow:
      inset 0 2px 9px  rgba(255,255,255,0.3),
      inset 0 -2px 6px rgba(0,0,0,0.4);
    position: relative;
    overflow: hidden;
  }
  .meter > span:after, .animate > span > span {
    content: "";
    position: absolute;
    top: 0; left: 0; bottom: 0; right: 0;
    background-image:
      linear-gradient(
        -45deg,
        rgba(255, 255, 255, .2) 25%,
        transparent 25%,
        transparent 50%,
        rgba(255, 255, 255, .2) 50%,
        rgba(255, 255, 255, .2) 75%,
        transparent 75%,
        transparent
      );
    z-index: 9999;
    -webkit-background-size: 50px 50px;
    -moz-background-size: 50px 50px;
    animation: move 2s linear infinite;
    -webkit-border-radius: 20px 20px 20px 20px;
    -moz-border-radius: 20px 20px 20px 20px;
    border-radius: 20px 20px 20px 20px;
    overflow: hidden;
    background-repeat: repeat;
  }

  .animate > span:after {
    display: none;
  }

  @keyframes move {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 50px 50px;
    }
  }

  .meter-orange > span {
    background-color: #f1a165;
    background-image: -moz-linear-gradient(top, #f1a165, #f36d0a);
    background-image: -webkit-gradient(linear,left top,left bottom,color-stop(0, #f1a165),color-stop(1, #f36d0a));
    background-image: -webkit-linear-gradient(#f1a165, #f36d0a);
  }

  .meter-red > span {
    background-color: #f0a3a3;
    background-image: -moz-linear-gradient(top, #f0a3a3, #f42323);
    background-image: -webkit-gradient(linear,left top,left bottom,color-stop(0, #f0a3a3),color-stop(1, #f42323));
    background-image: -webkit-linear-gradient(#f0a3a3, #f42323);
  }

  .meter-purple > span {
    background-color: #815fc0;
    background-image: -moz-linear-gradient(top, #815fc0, #6441a5);
    background-image: -webkit-gradient(linear,left top,left bottom,color-stop(0, #815fc0),color-stop(1, #6441a5));
    background-image: -webkit-linear-gradient(#815fc0, #6441a5);
  }

  .nostripes > span > span, .nostripes > span:after {
    -webkit-animation: none;
    background-image: none;
  }
</style>
