<template>

</template>

<script>
  import BaseController, { StandardMappings } from '../mixins/BaseController';

  const DualShockControllerBase = {
    mixins: [BaseController],
    data() {
      return {
        canonicalName: 'DualShock 4',
      };
    },
    name: 'DualshockController',
  };

  export const DualShockControllerStandard = {
    mixins: [DualShockControllerBase, StandardMappings],
  };

  export const DualShockControllerWinFirefox = {
    mixins: [DualShockControllerBase],
    data() {
      return {
        buttonMapping: {
          faceLeft: 0,
          faceDown: 1,
          faceRight: 2,
          faceUp: 3,
          leftTop: 4,
          rightTop: 5,
          leftTrigger: 6,
          rightTrigger: 7,
          select: 8,
          start: 9,
          leftStick: 10,
          rightStick: 11,
        // Remap the guide button to index 12
        // The other buttons don't seem to work, so leave them blank.
          dpadUp: 13,
          dpadDown: 12,
          dpadLeft: null,
          dpadRight: null,
        },
        stickMapping: {
          leftStick: { axisX: 0, axisY: 1 },
          rightStick: { axisX: 2, axisY: 5 },
        },
        notifyMessage: 'The D-Pad does not work properly in Firefox on Windows. The touchpad has been mapped to D-Pad Up. If this doesn\'t work for you, try using Chrome.',
      };
    },
  };

  export const DualShockControllerMacFirefox = {
    mixins: [DualShockControllerBase],
    data() {
      return {
        buttonMapping: {
          faceLeft: 0,
          faceDown: 1,
          faceRight: 2,
          faceUp: 3,
          leftTop: 4,
          rightTop: 5,
          leftTrigger: 6,
          rightTrigger: 7,
          select: 8,
          start: 9,
          leftStick: 10,
          rightStick: 11,
          dpadUp: 14,
          dpadDown: 15,
          dpadLeft: 16,
          dpadRight: 17,
        },
        stickMapping: {
          leftStick: { axisX: 0, axisY: 1 },
          rightStick: { axisX: 2, axisY: 5 },
        },
      };
    },
  };
</script>

<style scoped>

</style>
