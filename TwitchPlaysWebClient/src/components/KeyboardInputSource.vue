<template>

</template>

<script>
  import InputSource from '../mixins/InputSource';
  import { InputState, StoreMutations } from '../mixins/Common';

  // TODO: Replace keymaster.js with a better key handling implementation
  /* eslint-disable no-undef */
  export default {
    name: 'KeyboardInputSource',
    mixins: [InputSource],
    data() {
      return {
        keyMapping: {
          faceDown: 'down',
          faceRight: 'right',
          faceLeft: 'left',
          faceUp: 'up',
          leftTop: 'q',
          rightTop: 'o',
          leftTrigger: 'e',
          rightTrigger: 'u',
          select: '-',
          start: '=',
          leftStick: 'r',
          rightStick: 'y',
          dpadUp: 't',
          dpadDown: 'g',
          dpadLeft: 'f',
          dpadRight: 'h',
        },
        stickMapping: {
          leftStick: {
            up: 'w',
            down: 's',
            left: 'a',
            right: 'd',
            slow() {
              return key.shift;
            },
          },
          rightStick: {
            up: 'i',
            down: 'k',
            left: 'j',
            right: 'l',
            slow: '/',
          },
        },
      };
    },
    mounted() {
      this.$store.commit(StoreMutations.INPUT_STATE, InputState.READY);
    },
    methods: {
      isButtonPressed(name) {
        if (!this.keyMapping[name]) return false;
        if (key.ctrl || key.alt) return false;
        if (typeof this.keyMapping[name] === 'function') {
          return this.keyMapping[name]();
        }
        return key.isPressed(this.keyMapping[name]);
      },
      getStickX(stick) {
        if (!this.stickMapping[stick]) return false;
        if (key.ctrl || key.alt) return false;
        let val = 0;
        if (key.isPressed(this.stickMapping[stick].left)) val -= 1;
        if (key.isPressed(this.stickMapping[stick].right)) val += 1;
        if (key.isPressed(this.stickMapping[stick].slow)) val *= 0.5;
        return val;
      },
      getStickY(stick) {
        if (!this.stickMapping[stick]) return false;
        if (key.ctrl || key.alt) return false;
        let val = 0;
        if (key.isPressed(this.stickMapping[stick].up)) val -= 1;
        if (key.isPressed(this.stickMapping[stick].down)) val += 1;
        if (key.isPressed(this.stickMapping[stick].slow)) val *= 0.5;
        return val;
      },
    },
  };
</script>

<style scoped>

</style>
