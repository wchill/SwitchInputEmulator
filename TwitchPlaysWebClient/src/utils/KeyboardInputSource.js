/* globals key */

import InputSource from './InputSource';

// TODO: Allow custom key mappings
const KeyMapping = {
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
};

const StickMapping = {
  leftStick: {
    up: 'w',
    down: 's',
    left: 'a',
    right: 'd',
  },
  rightStick: {
    up: 'i',
    down: 'k',
    left: 'j',
    right: 'l',
  },
};

class KeyboardInputSource extends InputSource {
  // TODO: handle key events when this is active
  isButtonPressed(name) {
    if (!KeyMapping[name]) return false;
    if (key.ctrl || key.alt) return false;
    if (typeof KeyMapping[name] === 'function') {
      return KeyMapping[name]();
    }
    return key.isPressed(KeyMapping[name]);
  }

  getStickX(stick) {
    if (!StickMapping[stick]) return 0;
    if (key.ctrl || key.alt) return 0;
    let val = 0;
    if (key.isPressed(StickMapping[stick].left)) val -= 1;
    if (key.isPressed(StickMapping[stick].right)) val += 1;
    // if (key.isPressed(this.stickMapping[stick].slow)) val *= 0.5;
    return val;
  }

  getStickY(stick) {
    if (!StickMapping[stick]) return 0;
    if (key.ctrl || key.alt) return 0;
    let val = 0;
    if (key.isPressed(StickMapping[stick].up)) val -= 1;
    if (key.isPressed(StickMapping[stick].down)) val += 1;
    // if (key.isPressed(this.stickMapping[stick].slow)) val *= 0.5;
    return val;
  }
}
