<template>
  <v-select
    :items="inputSourceListItems"
    v-model="selected"
    label="Select input method"
    item-text="name"
    item-value="obj"
    item-disabled="disabled"
    max-height="auto"
    v-bind:prepend-icon="selected.icon"
    autocomplete
    persistent-hint
  >
    <template slot="item" slot-scope="data">
      <v-list-tile-avatar>
        <v-avatar>
          <v-icon dark v-html="data.item.icon"></v-icon>
        </v-avatar>
      </v-list-tile-avatar>
      <v-list-tile-content>
        <v-list-tile-title v-text="data.item.name"></v-list-tile-title>
        <v-list-tile-sub-title
          v-text="data.item.description + (data.item.disabled ? ' (Not supported on this platform)' : '')"></v-list-tile-sub-title>
      </v-list-tile-content>
    </template>
  </v-select>
</template>

<script>
  import {
    setDriftlessInterval,
    // clearDriftless,
  } from 'driftless';
  import ControllerManager from '../utils/controllers/ControllerManager';
  import { ButtonValues, DpadValues, ButtonNames } from '../utils/InputSource';
  import { StoreMutations, InputState } from '../mixins/Common';
  import { SocketBus, SocketEvents } from './ControlWebSocket';
  import { KeyboardInputSourceObj } from '../utils/KeyboardInputSource';

  const dpadNames = [
    'dpadUp',
    'dpadDown',
    'dpadLeft',
    'dpadRight',
  ];

  const stickNames = [
    'leftStick',
    'rightStick',
  ];

  export default {
    name: 'InputSourceSelect',
    data() {
      return {
        controllers: [],
        selected: {
          icon: 'mdi-google-controller',
        },
        setIntervalId: 0,
      };
    },
    computed: {
      inputSourceListItems() {
        const sources = [];
        if (this.controllers.length === 0) {
          sources.push({ header: 'No controllers connected' });
        } else {
          sources.push({ header: 'Controllers' });
          for (let i = 0; i < this.controllers.length; i++) {
            const controllerObj = this.controllers[i];
            sources.push({
              name: controllerObj.id,
              description: controllerObj.name,
              icon: controllerObj.icon,
              disabled: !controllerObj.supported,
              obj: controllerObj,
            });
          }
        }
        sources.push({ divider: true });
        sources.push({ header: 'Keyboard' });
        sources.push({
          name: 'Keyboard',
          description: 'Use system keyboard',
          icon: 'mdi-keyboard',
          disabled: false,
          obj: {
            supported: true,
            controller: KeyboardInputSourceObj,
            name: 'Keyboard',
            icon: 'mdi-keyboard',
          },
        });
        return sources;
      },
    },
    watch: {
      selected() {
        console.log(this.selected);
        // TODO: fix this
        this.$store.commit(StoreMutations.INPUT_STATE, InputState.READY);
      },
    },
    methods: {
      update() {
        const inputSource = this.selected.controller;
        if (!inputSource) return;
        inputSource.update();
        // TODO: Add tracking to see if input actually changed
        const gamepadState = {
          buttons: {},
          sticks: {},
        };

        for (let i = 0; i < ButtonNames.length; i++) {
          const button = ButtonNames[i];
          gamepadState.buttons[button] = inputSource.isButtonPressed(button);
        }

        for (let i = 0; i < dpadNames.length; i++) {
          const button = dpadNames[i];
          gamepadState.buttons[button] = inputSource.isButtonPressed(button);
        }

        for (let i = 0; i < stickNames.length; i++) {
          const stick = stickNames[i];
          gamepadState.sticks[stick] = {
            x: inputSource.getStickX(stick),
            y: inputSource.getStickY(stick),
            pressed: inputSource.isButtonPressed(stick),
          };
        }

        const stateDiffStr = this.stateObjToDiffStr(this.$store.state.gamepadState, gamepadState);
        if (stateDiffStr.length > 0) {
          this.$store.commit(StoreMutations.GAMEPAD_STATE, gamepadState);

          if (this.$store.getters.canControl) {
            SocketBus.$emit(SocketEvents.SEND_MESSAGE, `UPDATE ${stateDiffStr}`);
          }
        }
      },
      // TODO: Cleanup the below code
      calculateStick(state, stick) {
        // Applies dead zone calculations and then maps the range [-1.0, 1.0] to [0, 255]
        // Reference: http://www.third-helix.com/2013/04/12/doing-thumbstick-dead-zones-right.html

        /* eslint-disable no-bitwise */
        const x = state.sticks[stick].x;
        const y = state.sticks[stick].y;

        const res = [128, 128];
        let mag = Math.sqrt((x * x) + (y * y));
        if (mag >= this.deadzone) {
          if (mag === 0) mag = 1;
          const normX = Math.abs(x / mag);
          const normY = Math.abs(y / mag);
          const outX = normX * ((x - this.deadzone) / (1 - this.deadzone));
          const outY = normY * ((y - this.deadzone) / (1 - this.deadzone));

          res[0] += outX * 128;
          if (res[0] < 0) res[0] = 0;
          else if (res[0] > 255) res[0] = 255;
          res[0] |= 0;

          res[1] += outY * 128;
          if (res[1] < 0) res[1] = 0;
          else if (res[1] > 255) res[1] = 255;
          res[1] |= 0;
        }

        return res;
      },
      calculateDpad(state) {
        let x = 1;
        let y = 1;
        if (state.buttons.dpadUp) x -= 1;
        if (state.buttons.dpadDown) x += 1;
        if (state.buttons.dpadLeft) y -= 1;
        if (state.buttons.dpadRight) y += 1;

        return DpadValues[x][y];
      },
      calculateButton(state) {
        return ButtonNames.reduce((accumulator, button) => {
          let newAccumulator = accumulator;
          if (state.buttons[button]) {
            newAccumulator += ButtonValues[button];
          }
          return newAccumulator;
        }, 0);
      },
      calculateStateDiff(state) {
        const button = this.calculateButton(state);
        const dpad = this.calculateDpad(state);
        const ls = this.calculateStick(state, 'leftStick');
        const rs = this.calculateStick(state, 'rightStick');
        return {
          buttons: button,
          dpad,
          lx: ls[0],
          ly: ls[1],
          rx: rs[0],
          ry: rs[1],
        };
      },
      stateObjToDiffStr(prevStateObj, currStateObj) {
        const prevState = this.calculateStateDiff(prevStateObj);
        const currState = this.calculateStateDiff(currStateObj);
        /* eslint-disable no-bitwise */
        const pressed = currState.buttons & ~(prevState.buttons);
        const released = prevState.buttons & ~(currState.buttons);
        const dpadChanged = currState.dpad !== prevState.dpad;
        const lxChanged = currState.lx !== prevState.lx;
        const lyChanged = currState.ly !== prevState.ly;
        const rxChanged = currState.rx !== prevState.rx;
        const ryChanged = currState.ry !== prevState.ry;

        const stateStrs = [];
        if (pressed > 0) {
          stateStrs.push(`P=${pressed}`);
        }
        if (released > 0) {
          stateStrs.push(`R=${released}`);
        }
        if (dpadChanged) {
          stateStrs.push(`D=${currState.dpad}`);
        }
        if (lxChanged) {
          stateStrs.push(`LX=${currState.lx}`);
        }
        if (lyChanged) {
          stateStrs.push(`LY=${currState.ly}`);
        }
        if (rxChanged) {
          stateStrs.push(`RX=${currState.rx}`);
        }
        if (ryChanged) {
          stateStrs.push(`RY=${currState.ry}`);
        }
        return stateStrs.join(' ');
      },
    },
    created() {
      const self = this;
      ControllerManager.addControllerEventListener((controllers) => {
        self.controllers = controllers;
      });
      this.setIntervalId = setDriftlessInterval(() => {
        self.update();
      }, 8);
    },
  };
</script>

<style scoped>

</style>
