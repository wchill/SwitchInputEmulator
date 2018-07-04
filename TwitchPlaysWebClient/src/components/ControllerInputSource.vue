<template>

</template>

<script>
  import { StoreMutations, StatusBus, BusEvents, InputState } from '../mixins/Common';

  // FIXME: Let each controller handle their own compatibility checks and such

  export default {
    name: 'ControllerInputSource',
    props: ['controllerprofile'],
    components: {
    },
    data() {
      return {
        axes: [],
        buttons: [],
        allControllers: [],
      };
    },
    computed: {
      isControllerConnected() {
        return this.controllerprofile !== 'no-controller';
      },
      isControllerSupported() {
        return this.controllerprofile !== 'unsupported-controller';
      },
      currentController() {
        return this.controllerprofile.index;
      },
      currentControllerComponent() {
      // TODO: make this code less unwieldy.
        if (this.currentController < 0) return 'no-controller';
        const gamepad = this.getGamepad();
        if (!gamepad) {
          return 'no-controller';
        }
      },
    },
    watch: {
      currentController() {
        if (!this.isControllerConnected) {
          this.$store.commit(StoreMutations.INPUT_STATE, InputState.NOT_CONNECTED);
        } else if (!this.isControllerSupported) {
          this.$store.commit(StoreMutations.INPUT_STATE, InputState.UNSUPPORTED);
        } else {
          this.$store.commit(StoreMutations.INPUT_STATE, InputState.READY);
        }

        StatusBus.$emit(BusEvents.UPDATE_INPUT);
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
    },
    mounted() {
      StatusBus.$on(BusEvents.BEFORE_UPDATE_INPUT, this.updateGamepad);
    },
  };
</script>

<style scoped>

</style>
