<template>
  <v-app id="twitchplays" dark>
    <v-navigation-drawer
      v-model="drawer"
      clipped
      fixed
      app
    >
      <v-list dense>

        <v-list-tile @click="">
          <v-list-tile-action>
            <v-icon>keyboard</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Remap Keyboard</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-list-tile @click="">
          <v-list-tile-action>
            <v-icon>settings</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Settings</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-list-tile @click="">
          <v-list-tile-action>
            <v-icon>mdi-help-circle</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Help</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-list-tile @click="">
          <v-list-tile-action>
            <v-icon>mdi-discord</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Discord</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-list-tile @click="">
          <v-list-tile-action>
            <v-icon>mdi-github-face</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>View on GitHub</v-list-tile-title>
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
        <v-layout justify-center align-center>
          <v-flex grow>

            <v-select
              :items="people"
              v-model="e11"
              label="Select input method"
              item-text="name"
              item-value="name"
              max-height="auto"
              prepend-icon="mdi-google-controller"
              autocomplete
            >
              <template slot="item" slot-scope="data">
                <template v-if="typeof data.item !== 'object'">
                  <v-list-tile-content v-text="data.item"></v-list-tile-content>
                </template>
                <template v-else>
                  <v-list-tile-avatar>
                    <v-avatar>
                      <v-icon dark>mdi-google-controller</v-icon>
                    </v-avatar>
                  </v-list-tile-avatar>
                  <v-list-tile-content>
                    <v-list-tile-title v-html="data.item.name"></v-list-tile-title>
                    <v-list-tile-sub-title v-html="data.item.description"></v-list-tile-sub-title>
                  </v-list-tile-content>
                </template>
              </template>
            </v-select>

            <joycon-stream-renderer v-bind:video="videoEndpoint" v-bind:audio="audioEndpoint"></joycon-stream-renderer>
            <v-btn color="twitch-purple"><v-icon>mdi-twitch</v-icon>&nbsp;<span>Login with Twitch</span></v-btn>
          </v-flex>
        </v-layout>
      </v-container>
    </v-content>
    <v-footer app fixed>
      <span>&copy; {{ new Date().getUTCFullYear() }} wchill</span>
    </v-footer>
  </v-app>
</template>

<script>
  // import { detectBrowser, detectOS } from './mixins/Utils';
  import { StatusBus, BusEvents } from './mixins/Common';
  import JoyconStreamRenderer from './components/JoyconStreamRenderer';

  export default {
    props: {
      source: String,
    },
    components: {
      'joycon-stream-renderer': JoyconStreamRenderer,
    },
    data: () => ({
      drawer: true,
      name: 'Twitch Plays',
      controlEndpoint: 'wss://api.twitchplays.gg/switch/ws',
      videoEndpoint: 'wss://api.twitchplays.gg/switch/stream/video',
      audioEndpoint: 'wss://api.twitchplays.gg/switch/stream/audio',
      e11: [],
      people: [
        { header: 'Controllers' },
        { name: 'Xbox Controller', description: 'xinput (#0)' },
        { name: 'DualShock 4', description: 'Wireless Controller (#1)' },
        { name: 'Pro Controller', description: 'Wireless Gamepad (#2)' },
        { header: 'Joycons' },
        { name: 'Joycons', description: 'JoyCon (L) (#3), JoyCon (R) (#4)' },
        { header: 'Other' },
        { name: 'Keyboard', description: 'Use keyboard' },
      ],
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

  /*
  export default {
    data() {
      return {
        clipped: false,
        drawer: true,
        fixed: false,
        items: [{
          icon: 'bubble_chart',
          title: 'Inspire',
        }],
        miniVariant: false,
        right: true,
        rightDrawer: false,
        title: 'Vuetify.js',
      };
    },
    name: 'App',
    components: {
      HelloWorld,
    },
  };
  */
</script>

<style>
  .twitch-purple {
    background-color: #6441A4 !important;
  }
</style>
