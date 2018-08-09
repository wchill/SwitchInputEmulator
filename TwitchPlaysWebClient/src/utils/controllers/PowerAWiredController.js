import Controller, { StandardMappings } from './Controller';
import { Browsers, checkVidPid, OperatingSystems } from '../Utils';

const ControllerName = 'PowerA Wired Controller Plus';
const ControllerIcon = 'mdi-nintendo-switch';

const Profiles = {
  CHROME: {
    buttonMapping: {
      faceDown: 1,
      faceRight: 0,
      faceLeft: 3,
      faceUp: 2,
      leftTop: 4,
      rightTop: 5,
      leftTrigger: 6,
      rightTrigger: 7,
      // Share/Home, no way to read Minus/Plus directly
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
    experimental: false,
  },
  CHROME_OS: {
    buttonMapping: {
      faceDown: 1,
      faceRight: 0,
      faceLeft: 3,
      faceUp: 2,
      leftTop: 4,
      rightTop: 5,
      leftTrigger: 6,
      rightTrigger: 7,
      // Share/Home, no way to read Minus/Plus directly
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
    experimental: false,
  },
  FIREFOX_WIN: {
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
      // DPad Up is mapped to share, DPad down is mapped to home
      dpadUp: 13,
      dpadDown: 12,
      dpadLeft: null,
      dpadRight: null,
    },
    stickMapping: {
      leftStick: { axisX: 0, axisY: 1 },
      rightStick: { axisX: 2, axisY: 3 },
    },
    experimental: false,
  },
  FIREFOX_MAC: {
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
      rightStick: { axisX: 2, axisY: 3 },
    },
    experimental: false,
  },
  STANDARD: {
    buttonMapping: StandardMappings.buttonMapping,
    stickMapping: StandardMappings.stickMapping,
    experimental: false,
  },
};

const vid = '20d6';
const pid = 'a711';

function getProfile(gamepad, environment) {
  if (environment.browser === Browsers.EDGE) {
    if (gamepad.mapping === 'standard' && environment.edgeDetectionHackActive) {
      return Profiles.EDGE;
    }
  }

  if (!checkVidPid(gamepad.id, vid, pid)) return null;

  if (environment.browser === Browsers.FIREFOX) {
    if (environment.os === OperatingSystems.WINDOWS) {
      return Profiles.FIREFOX_WIN;
    } else if (environment.os === OperatingSystems.MAC_OS) {
      return Profiles.FIREFOX_MAC;
    }
  }

  if (gamepad.mapping === 'standard') return Profiles.STANDARD;

  return null;
}

export default class extends Controller {
  constructor(gamepad, environment, gamepadFunc) {
    const profile = getProfile(gamepad, environment);
    super(gamepadFunc, profile);
  }

  static canHandle(gamepad, environment) {
    const profile = getProfile(gamepad, environment);
    return profile !== null;
  }

  static isRecognized(gamepad, environment) {
    return this.canHandle(gamepad, environment) || checkVidPid(gamepad.id, vid, pid);
  }

  static get name() {
    return ControllerName;
  }

  static get icon() {
    return ControllerIcon;
  }
}
