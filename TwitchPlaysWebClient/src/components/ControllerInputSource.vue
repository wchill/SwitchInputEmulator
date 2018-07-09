<template>
  <div></div>
</template>

<script>
  import { StoreMutations, StatusBus, BusEvents, InputState } from '../mixins/Common';

  import ControllerManager from '../utils/controllers/ControllerManager';

  export default {
    name: 'ControllerInputSource',
    data() {
      return {
        currentController: 0,
      };
    },
    computed: {
    },
    watch: {
      /*
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
      */
    },
    methods: {
      getController() {
        const connectedControllers = ControllerManager.connectedControllers;
        return connectedControllers[this.currentController];
      },
      update() {
        const controller = this.getController();
        if (controller) {
          controller.update();
        }
      },
    },
    mounted() {
      StatusBus.$on(BusEvents.BEFORE_UPDATE_INPUT, this.update);
    },
  };
</script>

<style scoped>

</style>
