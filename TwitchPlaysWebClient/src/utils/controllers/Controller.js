import InputSource from '../InputSource';

export const StandardMappings = {
  buttonMapping: {
    faceDown: 0,
    faceRight: 1,
    faceLeft: 2,
    faceUp: 3,
    leftTop: 4,
    rightTop: 5,
    leftTrigger: 6,
    rightTrigger: 7,
    select: 8,
    start: 9,
    leftStick: 10,
    rightStick: 11,
    dpadUp: 12,
    dpadDown: 13,
    dpadLeft: 14,
    dpadRight: 15,
  },
  stickMapping: {
    leftStick: { axisX: 0, axisY: 1 },
    rightStick: { axisX: 2, axisY: 3 },
  },
};

/* eslint-disable no-underscore-dangle */
class Controller extends InputSource {
  constructor(gamepadFunc, profile) {
    super();
    this._buttonMapping = StandardMappings.buttonMapping;
    this._stickMapping = StandardMappings.stickMapping;
    this._isExperimental = false;
    this.getGamepad = gamepadFunc;

    if (profile) {
      this._buttonMapping = profile.buttonMapping || this._buttonMapping;
      this._stickMapping = profile.stickMapping || this._stickMapping;
      this._isExperimental = profile.experimental || this._isExperimental;
    }
  }

  isButtonPressed(name) {
    // May need to override for certain controllers due to dpad
    return !!this.buttons[this._buttonMapping[name]];
  }

  getStickX(name) {
    return this.axes[this._stickMapping[name].axisX] || 0.0;
  }

  getStickY(name) {
    return this.axes[this._stickMapping[name].axisY] || 0.0;
  }

  update() {
    const gamepad = this.getGamepad();
    if (!gamepad) {
      return;
    }

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
  }

  /* eslint-disable no-unused-vars */
  static canHandle(gamepad, environment) {
    return false;
  }

  static isRecognized(gamepad, environment) {
    return false;
  }

  static get name() {
    return 'Generic controller';
  }

  static get icon() {
    return 'mdi-google-controller';
  }
}

export default Controller;
