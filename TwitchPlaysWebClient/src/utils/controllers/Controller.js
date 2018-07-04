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
class Controller {
  constructor(buttonMapping, stickMapping, isExperimental, updateFunc) {
    this._buttonMapping = buttonMapping;
    this._stickMapping = stickMapping;
    this._isExperimental = isExperimental;
    this._updateFunc = updateFunc;
  }

  isButtonPressed(name) {
    // May need to override for certain controllers due to dpad
    const index = this._buttonMapping[name];
    if (index === null || index === undefined || index < 0) return false;
    return !!this.buttons[index];
  }

  getStickX(name) {
    return this.axes[this._stickMapping[name].axisX] || 0.0;
  }

  getStickY(name) {
    return this.axes[this._stickMapping[name].axisY] || 0.0;
  }

  update() {
    const gamepad = this._updateFunc();
    if (!gamepad) {
      this.connected = false;
      return;
    }

    this.connected = true;
    this.prevAxes = this.axes;
    this.prevButtons = this.buttons;

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
  static canHandle(gamepad, options) {
    return false;
  }

  static isRecognized(gamepad, options) {
    return false;
  }

  static get name() {
    return 'Generic controller';
  }
}

export default Controller;
