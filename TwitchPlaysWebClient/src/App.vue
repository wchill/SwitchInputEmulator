<template>
  <v-app id="twitchplays" dark>
    <v-navigation-drawer
      v-bind:value="true"
      clipped
      fixed
      app
      dark
      v-bind:mini-variant="drawer"
    >
      <!-- TODO: Use Twitch logged in user -->
      <v-toolbar flat class="transparent">
        <v-list class="pa-0">
          <v-list-tile avatar>
            <v-list-tile-avatar>
              <!--<img src="https://static-cdn.jtvnw.net/jtv_user_pictures/wchill-profile_image-9355f3d7dfe0720b-300x300.jpeg" >-->
              <v-icon>mdi-account</v-icon>
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title>wchill</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
          <v-divider light></v-divider>
        </v-list>
      </v-toolbar>

      <v-list dense>
        <!-- TODO: Create keyboard remap modal -->
        <v-list-tile @click.stop="keyboardRemapModal = true">
          <v-list-tile-action>
            <v-icon>keyboard</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Remap Keyboard</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

        <!-- TODO: Create settings modal -->
        <v-list-tile @click.stop="settingsModal = true">
          <v-list-tile-action>
            <v-icon>settings</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Settings</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-list-tile @click="openLink(helpLink)">
          <v-list-tile-action>
            <v-icon>mdi-help-circle</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Help</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-list-tile @click="openLink(discordLink)">
          <v-list-tile-action>
            <v-icon>mdi-discord</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Discord</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-list-tile @click="openLink(githubLink)">
          <v-list-tile-action>
            <v-icon>mdi-github-face</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>View on GitHub</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-divider light></v-divider>

        <v-list-tile @click="openLink(githubLink)">
          <v-list-tile-action>
            <v-icon>mdi-pound</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title v-text="'Build ' + appVersion"></v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
    <v-toolbar app fixed clipped-left>
      <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
      <v-toolbar-title v-text="name"></v-toolbar-title>
    </v-toolbar>
    <v-content>
      <v-container fluid fill-height>
        <v-layout row justify-center align-content-center wrap>
          <v-flex xs2 sm3 md4></v-flex>
          <v-flex xs8 sm6 md4>
            <input-source-select></input-source-select>
          </v-flex>
          <v-flex xs2 sm3 md4></v-flex>
          <v-flex xs12 sm12 md12 lg12>
            <control-ws v-bind:endpoint="controlEndpoint"></control-ws>

            <joycon-stream-renderer v-bind:video="videoEndpoint" v-bind:audio="audioEndpoint"></joycon-stream-renderer>
            <server-status></server-status>
          </v-flex>
        </v-layout>
      </v-container>
    </v-content>
    <v-dialog v-model="keyboardRemapModal" persistent max-width="50%">
      <v-card>
        <v-card-title>
          Remap Keyboard
        </v-card-title>
        <v-card-text>
          <v-btn color="primary" dark @click.stop="dialog3 = !dialog3">Open Dialog 3</v-btn>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click.stop="keyboardRemapModal=false">Save</v-btn>
          <v-btn color="white" flat @click.stop="keyboardRemapModal=false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="settingsModal" persistent max-width="900px">
      <v-card>
        <v-card-title>
          Settings
        </v-card-title>
        <v-card-text>
          <v-btn color="primary" dark @click.stop="dialog3 = !dialog3">Open Dialog 3</v-btn>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click.stop="settingsModal=false">Save</v-btn>
          <v-btn color="white" flat @click.stop="settingsModal=false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-footer app fixed>
      <span>&copy; {{ new Date().getUTCFullYear() }} wchill</span>
    </v-footer>
  </v-app>
</template>

<script>
  // import { detectBrowser, detectOS } from './mixins/Utils';
  import { StatusBus, BusEvents } from './mixins/Common';
  import ControlWebSocket from './components/ControlWebSocket';
  import JoyconStreamRenderer from './components/JoyconStreamRenderer';
  import InputSourceSelect from './components/InputSourceSelect';
  import ServerStatus from './components/ServerStatus';

  export default {
    props: {
      source: String,
    },
    components: {
      'server-status': ServerStatus,
      'control-ws': ControlWebSocket,
      'joycon-stream-renderer': JoyconStreamRenderer,
      'input-source-select': InputSourceSelect,
    },
    data: () => ({
      /* eslint-disable no-undef */
      appVersion: __VERSION__,
      /* eslint-enable no-undef */
      drawer: false,
      name: 'Twitch Plays',
      controlEndpoint: 'wss://api.twitchplays.gg/switch/ws',
      videoEndpoint: 'wss://api.twitchplays.gg/switch/stream/video',
      audioEndpoint: 'wss://api.twitchplays.gg/switch/stream/audio',
      helpLink: '',
      discordLink: 'https://discord.gg/sWXEaXT',
      githubLink: 'https://github.com/wchill/SwitchInputEmulator',
      keyboardRemapModal: false,
      settingsModal: false,
    }),
    mounted() {
      /*
      const browser = detectBrowser();
      const os = detectOS();

      console.log(`Running on ${os}/${browser}`);
      */

      this.$nextTick(() => {
        requestAnimationFrame(this.update);
      });
    },
    methods: {
      openLink(link) {
        window.open(link, '_blank');
      },
      update() {
        StatusBus.$emit(BusEvents.RENDER_TIME_START);
        // Give input sources a chance to perform operations before actually updating
        StatusBus.$emit(BusEvents.BEFORE_UPDATE_INPUT);
        StatusBus.$emit(BusEvents.UPDATE_INPUT);
        StatusBus.$emit(BusEvents.AFTER_UPDATE_INPUT);

        requestAnimationFrame(this.update);
        StatusBus.$emit(BusEvents.RENDER_TIME_END);
      },
    },
    name: 'App',
  };
</script>

<style>
  .twitch-purple {
    background-color: #6441A4 !important;
  }
  .light-twitch-purple {
    background-color: #815fc0 !important;
  }
</style>
