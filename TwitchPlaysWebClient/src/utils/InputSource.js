export const SwitchButtons = Object.freeze({
  Y: 1,
  B: 2,
  A: 4,
  X: 8,
  L: 16,
  R: 32,
  ZL: 64,
  ZR: 128,
  MINUS: 256,
  PLUS: 512,
  L3: 1024,
  R3: 2048,
  HOME: 4096,
  SHARE: 8192,
  DPAD_UP: 0,
  DPAD_UPRIGHT: 1,
  DPAD_RIGHT: 2,
  DPAD_DOWNRIGHT: 3,
  DPAD_DOWN: 4,
  DPAD_DOWNLEFT: 5,
  DPAD_LEFT: 6,
  DPAD_UPLEFT: 7,
  DPAD_NONE: 8,
});

export const ButtonValues = {
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
};

export const ButtonNames = Object.keys(ButtonValues);

export const DpadValues = [
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
];

function compareState(oldState, newState) {
  for (let i = 0; i < ButtonNames.length; i++) {
    const button = ButtonNames[i];
    if (newState.buttons[button] !== oldState.buttons[button]) {
      return true;
    }
  }

  const sticks = Object.keys(oldState.sticks);
  for (let i = 0; i < sticks.length; i++) {
    const stick = sticks[i];
    if (newState.sticks[stick].x !== oldState.sticks[stick].x) {
      return true;
    }
    if (newState.sticks[stick].y !== oldState.sticks[stick].y) {
      return true;
    }
    if (newState.sticks[stick].pressed !== oldState.sticks[stick].pressed) {
      return true;
    }
  }

  return false;
}

function generateStateStr(prevState, currState) {
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
}

function generateStateObj() {
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
}

class InputSource {
  constructor() {
    // TODO: Load this at runtime from user preferences
    this.deadzone = 0.15;

    /*
    this.prevState = {
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
    };
    */
  }

  update() {
    // Should be overridden if necessary
  }

  /* eslint-disable class-methods-use-this */
  isButtonPressed() {
    // Should be overridden
    throw new Error('Tried calling default isButtonPressed');
  }

  getStickX() {
    // Should be overridden
    throw new Error('Tried calling default getStickX!');
  }

  getStickY() {
    // Should be overridden
    throw new Error('Tried calling default getStickY!');
  }

  calculateStick(stick) {
    // Applies dead zone calculations and then maps the range [-1.0, 1.0] to [0, 255]
    // Reference: http://www.third-helix.com/2013/04/12/doing-thumbstick-dead-zones-right.html

    /* eslint-disable no-bitwise */
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
  }

  calculateDpad() {
    let x = 1;
    let y = 1;
    if (this.isButtonPressed('dpadUp')) x -= 1;
    if (this.isButtonPressed('dpadDown')) x += 1;
    if (this.isButtonPressed('dpadLeft')) y -= 1;
    if (this.isButtonPressed('dpadRight')) y += 1;

    return DpadValues[x][y];
  }

  calculateButton() {
    const that = this;
    return ButtonNames.reduce((accumulator, button) => {
      let newAccumulator = accumulator;
      if (that.isButtonPressed(button)) {
        newAccumulator += ButtonValues[button];
      }
      return newAccumulator;
    }, 0);
  }

  static get name() {
    return 'InputSource';
  }

  static get icon() {
    return 'mdi-alert';
  }
}
/*

        updateState: function() {
            let buttons = Object.keys(this.prevState.buttons);
            let sticks = Object.keys(this.prevState.sticks);

            this.prevState = this.gamepadState;
            let gamepadState = {
                buttons: {},
                sticks: {},
                stateObj: this.generateStateObj()
            };

            for (let i = 0; i < buttons.length; i++) {
                let button = buttons[i];
                gamepadState.buttons[button] = this.isButtonPressed(button);
            }

            for (let i = 0; i < sticks.length; i++) {
                let stick = sticks[i];
                gamepadState.sticks[stick] = {
                    x: this.getStickX(stick),
                    y: this.getStickY(stick),
                    pressed: this.isButtonPressed(stick)
                };
            }

            if (this.compareState(gamepadState)) {
                let stateStr = this.generateStateStr(this.prevState.stateObj, gamepadState.stateObj);
                if (stateStr.length > 0) {
                    this.$store.commit(StoreMutations.GAMEPAD_STATE, gamepadState);

                    if (this.canControl) {
                        SocketBus.$emit(SocketEvents.SEND_MESSAGE, `UPDATE ${stateStr}`);
                    }
                }
            }
        },
 */

export default InputSource;
