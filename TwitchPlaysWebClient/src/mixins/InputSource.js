import mapGetters from 'vuex';
import { BusEvents, StatusBus, StoreMutations, SwitchButtons } from './Common';
import { SocketBus, SocketEvents } from '../components/ControlWebSocket';

/* eslint-disable no-bitwise */
export default {
  data() {
    return {
      buttonValues: {
        faceDown: SwitchButtons.B,
        faceRight: SwitchButtons.A,
        faceLeft: SwitchButtons.Y,
        faceUp: SwitchButtons.X,
        leftTop: SwitchButtons.L,
        rightTop: SwitchButtons.R,
        leftTrigger: SwitchButtons.ZL,
        rightTrigger: SwitchButtons.ZR,
        select: SwitchButtons.MINUS,
        start: SwitchButtons.PLUS,
        leftStick: SwitchButtons.L3,
        rightStick: SwitchButtons.R3,
        home: 0,
        share: 0,
      },
      dpadValues: [
        // x === 0
        [
          SwitchButtons.DPAD_UPLEFT, SwitchButtons.DPAD_UP, SwitchButtons.DPAD_UPRIGHT,
        ],
        // x === 1
        [
          SwitchButtons.DPAD_LEFT, SwitchButtons.DPAD_NONE, SwitchButtons.DPAD_RIGHT,
        ],
        // x === 2
        [
          SwitchButtons.DPAD_DOWNLEFT, SwitchButtons.DPAD_DOWN, SwitchButtons.DPAD_DOWNRIGHT,
        ],
      ],
      deadzone: 0.15,
      prevState: {
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
        stateObj: {
          buttons: 0,
          dpad: 8,
          lx: 0,
          ly: 0,
          rx: 0,
          ry: 0,
        },
      },
    };
  },
  mounted() {
    StatusBus.$on(BusEvents.UPDATE_INPUT, this.updateState);
  },
  computed: {
    ...mapGetters([
      'canControl',
      'gamepadState',
    ]),
  },
  methods: {
    compareState(newState) {
      const buttons = Object.keys(this.prevState.buttons);
      for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];
        if (newState.buttons[button] !== this.prevState.buttons[button]) {
          return true;
        }
      }

      const sticks = Object.keys(this.prevState.sticks);
      for (let i = 0; i < sticks.length; i++) {
        const stick = sticks[i];
        if (newState.sticks[stick].x !== this.prevState.sticks[stick].x) {
          return true;
        }
        if (newState.sticks[stick].y !== this.prevState.sticks[stick].y) {
          return true;
        }
        if (newState.sticks[stick].pressed !== this.prevState.sticks[stick].pressed) {
          return true;
        }
      }

      return false;
    },
    updateState() {
      const buttons = Object.keys(this.prevState.buttons);
      const sticks = Object.keys(this.prevState.sticks);

      this.prevState = this.gamepadState;
      const gamepadState = {
        buttons: {},
        sticks: {},
        stateObj: this.generateStateObj(),
      };

      for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];
        gamepadState.buttons[button] = this.isButtonPressed(button);
      }

      for (let i = 0; i < sticks.length; i++) {
        const stick = sticks[i];
        gamepadState.sticks[stick] = {
          x: this.getStickX(stick),
          y: this.getStickY(stick),
          pressed: this.isButtonPressed(stick),
        };
      }

      if (this.compareState(gamepadState)) {
        const stateStr = this.generateStateStr(this.prevState.stateObj, gamepadState.stateObj);
        if (stateStr.length > 0) {
          this.$store.commit(StoreMutations.GAMEPAD_STATE, gamepadState);

          if (this.canControl) {
            SocketBus.$emit(SocketEvents.SEND_MESSAGE, `UPDATE ${stateStr}`);
          }
        }
      }
    },
    isButtonPressed() {
      // Should be overridden
      // console.warn('Tried calling default isButtonPressed!');
      return false;
    },
    getStickX() {
      // Should be overridden
      // console.warn('Tried calling default getStickX!');
      return 0.0;
    },
    getStickY() {
      // Should be overridden
      // console.warn('Tried calling default getStickY!');
      return 0.0;
    },
    generateStateStr(prevState, currState) {
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
    generateStateObj() {
      const button = this.calculateButton();
      const dpad = this.calculateDpad();
      const ls = this.calculateStick('leftStick');
      const rs = this.calculateStick('rightStick');
      return {
        buttons: button,
        dpad,
        lx: ls[0],
        ly: ls[1],
        rx: rs[0],
        ry: rs[1],
      };
    },
    calculateStick(stick) {
      // Applies dead zone calculations and then maps the range [-1.0, 1.0] to [0, 255]
      // Reference: http://www.third-helix.com/2013/04/12/doing-thumbstick-dead-zones-right.html

      const x = this.getStickX(stick);
      const y = this.getStickY(stick);

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
    calculateDpad() {
      const pressed = {
        up: this.isButtonPressed('dpadUp'),
        down: this.isButtonPressed('dpadDown'),
        left: this.isButtonPressed('dpadLeft'),
        right: this.isButtonPressed('dpadRight'),
      };

      let x = 1;
      let y = 1;
      if (pressed.up) x -= 1;
      if (pressed.down) x += 1;
      if (pressed.left) y -= 1;
      if (pressed.right) y += 1;

      return this.dpadValues[x][y];
    },
    calculateButton() {
      const that = this;
      return Object.keys(this.buttonValues).reduce((accumulator, button) => {
        let newAccumulator = accumulator;
        if (that.isButtonPressed(button)) {
          newAccumulator += that.buttonValues[button];
        }
        return newAccumulator;
      }, 0);
    },
  },
};
