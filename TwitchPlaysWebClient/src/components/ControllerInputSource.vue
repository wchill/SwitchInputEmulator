<template>

</template>

<script>
  import { StoreMutations, StatusBus, BusEvents, InputState } from '../mixins/Common';
  import { checkVidPid, detectOS, detectBrowser } from '../mixins/Utils';
  import { XboxController } from '../mixins/BaseController';
  import { PowerAWiredControllerStandard, PowerAWiredControllerChromeOS, PowerAWiredControllerChrome, PowerAWiredControllerWinFirefox, PowerAWiredControllerMacFirefox } from './PowerAWiredController';
  import { DualShockControllerStandard, DualShockControllerWinFirefox, DualShockControllerMacFirefox } from './DualshockController';
  import { SwitchProControllerStandard, SwitchProControllerEdge, SwitchProControllerWinFirefox, SwitchProControllerMacFirefox } from './SwitchProController';

  // FIXME: Let each controller handle their own compatibility checks and such

  export default {
    name: 'ControllerInputSource',
    components: {
      'xbox-controller': XboxController,
      'switch-pro-controller-standard': SwitchProControllerStandard,
      'switch-pro-controller-edge': SwitchProControllerEdge,
      'switch-pro-controller-win-firefox': SwitchProControllerWinFirefox,
      'switch-pro-controller-mac-firefox': SwitchProControllerMacFirefox,
      'powera-wired-controller-standard': PowerAWiredControllerStandard,
      'powera-wired-controller-chromeos': PowerAWiredControllerChromeOS,
      'powera-wired-controller-chrome': PowerAWiredControllerChrome,
      'powera-wired-controller-win-firefox': PowerAWiredControllerWinFirefox,
      'powera-wired-controller-mac-firefox': PowerAWiredControllerMacFirefox,
      'dualshock-controller-standard': DualShockControllerStandard,
      'dualshock-controller-win-firefox': DualShockControllerWinFirefox,
      'dualshock-controller-mac-firefox': DualShockControllerMacFirefox,
    },
    data() {
      return {
        currentController: -1,
        axes: [],
        buttons: [],
        edgeDetectionHackTimestamp: {},
        isEdgeDetectionHackActive: {},
        forceRecompute: Date.now(),
        allControllers: [],
      };
    },
    computed: {
      isControllerConnected() {
        return this.currentControllerComponent !== 'no-controller';
      },
      isControllerSupported() {
        return this.currentControllerComponent !== 'unsupported-controller';
      },
      currentControllerComponent() {
      // TODO: make this code less unwieldy.
        if (this.currentController < 0) return 'no-controller';
        const gamepad = this.getGamepad();
        if (!gamepad) {
          return 'no-controller';
        }

      // This looks useless, but we actually need it for pro controller detection on Edge.
        /* eslint-disable no-unused-vars */
        const t = this.forceRecompute;
        /* eslint-enable no-unused-vars */

        const browser = detectBrowser();
        const os = detectOS();
        const index = gamepad.index;
        const id = gamepad.id;
        const mapping = gamepad.mapping;

        return this.getControllerProfile(browser, os, index, id, mapping);
      },
      gamepadName() {
        if (this.currentController < 0) {
          return '';
        }
        const gamepad = this.getGamepad();
        if (!gamepad) return '';
        return gamepad.id;
      },
    },
    watch: {
      currentController() {
        // console.log(this.currentController);
        if (!this.isControllerConnected) {
          this.$store.commit(StoreMutations.INPUT_STATE, InputState.NOT_CONNECTED);
        } else if (!this.isControllerSupported) {
          this.$store.commit(StoreMutations.INPUT_STATE, InputState.UNSUPPORTED);
        } else {
          this.$store.commit(StoreMutations.INPUT_STATE, InputState.READY);
        }

        StatusBus.$emit(BusEvents.UPDATE_INPUT);
      },
      currentControllerComponent() {
        // console.log(`Loading controller component ${this.currentControllerComponent}`);
      },
    },
    methods: {
      getGamepads() {
        let gamepads;
        if (navigator.getGamepads) {
          gamepads = navigator.getGamepads();
        } else if (navigator.webkitGetGamepads) {
          gamepads = navigator.webkitGetGamepads();
        }
        return gamepads;
      },
      getGamepad() {
        const gamepads = this.getGamepads();
        if (this.currentController >= 0) {
          const gamepad = gamepads[this.currentController];
          if (gamepad && gamepad.connected) return gamepad;
        }
        for (let i = 0; i < gamepads.length; i++) {
          if (gamepads[i] && gamepads[i].connected) {
            this.currentController = gamepads[i].index;
            return gamepads[i];
          }
        }
        return null;
      },
      updateGamepad() {
        const gamepad = this.getGamepad();
        if (!gamepad) return;

        const newButtons = [];
        const newAxes = [];

        for (let i = 0; i < gamepad.buttons.length; i++) {
          newButtons.push(gamepad.buttons[i].value);
        }
        for (let i = 0; i < gamepad.axes.length; i++) {
          newAxes.push(gamepad.axes[i]);
        }
        this.axes = newAxes;
        this.buttons = newButtons;
      },
      getControllerProfile(browser, os, index, id, mapping) {
        if (mapping === 'standard') {
        // Check for Pro Controller (2009) or Joycon Grip (200e) connected via cable (won't work)
          if (id.indexOf('Nintendo Co., Ltd.') > -1) {
            return 'unsupported-controller';
          }

        // Pro Controller reported as standard on Chrome OS and Edge
          if (checkVidPid(id, '57e', '2009')) {
            return 'switch-pro-controller-standard';
          }

        // DualShock 4 reported as standard by Chrome on all OSes
          if (checkVidPid(id, '54c', '9cc')) {
            return 'dualshock-controller-standard';
          }

        // Not reported as standard mappings on any tested OS/browser, but here just in case
          if (checkVidPid(id, '20d6', 'a711')) {
            return 'powera-wired-controller-standard';
          }

          if (browser === 'Edge') {
            if (this.isEdgeDetectionHackActive[index]) {
              return 'switch-pro-controller-edge';
            }
          }

        // Xbox controller works on Windows and Chrome on Mac OS only
          return 'xbox-controller';
        }

      // Pro Controller uses standard mappings (but not reported as standard) on Firefox
        if (checkVidPid(id, '57e', '2009')) {
          if (browser === 'Firefox') {
            if (os === 'Windows') {
              return 'switch-pro-controller-win-firefox';
            } else if (os === 'Mac OS') {
              return 'switch-pro-controller-mac-firefox';
            }
          }
        }

      // DualShock 4 D-Pad doesn't work properly on Windows/Firefox. On Mac OS/Firefox it works fine but needs remapping.
        if (checkVidPid(id, '54c', '9cc')) {
          if (os === 'Windows' && browser === 'Firefox') return 'dualshock-controller-win-firefox';
          if (os === 'Mac OS' && browser === 'Firefox') return 'dualshock-controller-mac-firefox';
        }

      // PowerA Wired Controller Plus works fine on every OS (Windows/Firefox needs D-Pad fix), but needs remapping.
        if (checkVidPid(id, '20d6', 'a711')) {
          if (os === 'Chrome OS') {
            return 'powera-wired-controller-chromeos';
          }
          if (browser === 'Chrome') {
            return 'powera-wired-controller-chrome';
          }
          if (browser === 'Firefox') {
            if (os === 'Windows') return 'powera-wired-controller-win-firefox';
            if (os === 'Mac OS') return 'powera-wired-controller-mac-firefox';
          }
        }

      // No supported profile found
        return 'unsupported-controller';
      },
    },
    created() {
      const self = this;
      self.allControllers = self.getGamepads();
      window.addEventListener('gamepadconnected', (e) => {
        // console.log(`Detected gamepad: ${e.gamepad.id}`);
        if (self.currentController < 0 || self.currentControllerComponent === 'unsupported-controller') {
          self.currentController = e.gamepad.index;
        }
        self.allControllers = self.getGamepads();
        if (detectBrowser() === 'Edge') {
          self.edgeDetectionHackTimestamp[e.gamepad.index] = self.getGamepads()[e.gamepad.index].timestamp;
          requestAnimationFrame(() => {
            const newTs = self.getGamepads()[e.gamepad.index].timestamp;
            if (self.edgeDetectionHackTimestamp[e.gamepad.index] !== newTs) {
              self.isEdgeDetectionHackActive[e.gamepad.index] = true;
              self.forceRecompute = Date.now();
            }
          });
        }
      });

      window.addEventListener('gamepaddisconnected', (e) => {
        // console.log(`Gamepad disconnected: ${e.gamepad.id}`);
        if (self.currentController.index === e.gamepad.index) {
          self.currentController = self.getGamepad().index;
        }
        self.isEdgeDetectionHackActive[e.gamepad.index] = false;
        self.allControllers = self.getGamepads();
      });
    },
    mounted() {
      StatusBus.$on(BusEvents.BEFORE_UPDATE_INPUT, this.updateGamepad);
    },
  };
</script>

<style scoped>

</style>
