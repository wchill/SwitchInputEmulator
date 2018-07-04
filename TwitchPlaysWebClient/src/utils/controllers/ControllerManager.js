import { checkVidPid, detectOS, detectBrowser } from '../Utils';

// TODO: Expand this list
export const KnownControllers = Object.freeze({
  XBOX: {
    name: 'Xbox Controller',
  },
  DUALSHOCK4: {
    name: 'DualShock 4',
    known_ids: [
      ['54c', '9cc'],
    ],
  },
  PRO_CONTROLLER: {
    name: 'Pro Controller',
    known_ids: [
      ['57e', '2009'],
    ],
  },
  JOYCON_CHARGING_GRIP: {
    name: 'JoyCon Charging Grip',
  },
  POWERA_WIRED_CONTROLLER_PLUS: {
    name: 'PowerA Wired Controller Plus',
    known_ids: [
      ['20d6', 'a711'],
    ],
  },
});

// TODO: Replace these strings with actual objects/functions defining how to read controllers
export const ControllerProfiles = Object.freeze({
  NONE: 'no-controller',
  UNSUPPORTED: 'unsupported-controller',

  // Switch Pro Controller profiles
  PRO_CONTROLLER_STANDARD: 'switch-pro-controller-standard',
  PRO_CONTROLLER_EDGE: 'switch-pro-controller-edge',
  PRO_CONTROLLER_FIREFOX_WIN: 'switch-pro-controller-firefox-win',
  PRO_CONTROLLER_FIREFOX_MAC: 'switch-pro-controller-firefox-mac',

  // DualShock 4 profiles
  DUALSHOCK4_STANDARD: 'dualshock4-standard',
  DUALSHOCK4_FIREFOX_WIN: 'dualshock4-firefox-win',
  DUALSHOCK4_FIREFOX_MAC: 'dualshock4-firefox-mac',

  // PowerA Wired Controller Plus profiles
  POWERA_WIRED_CONTROLLER_PLUS_STANDARD: 'powera-wired-controller-standard',
  POWERA_WIRED_CONTROLLER_PLUS_CHROMEOS: 'powera-wired-controller-chromeos',
  POWERA_WIRED_CONTROLLER_PLUS_CHROME: 'powera-wired-controller-chrome',
  POWERA_WIRED_CONTROLLER_PLUS_FIREFOX_WIN: 'powera-wired-controller-firefox-win',
  POWERA_WIRED_CONTROLLER_PLUS_FIREFOX_MAC: 'powera-wired-controller-firefox-mac',

  // Xbox Controller profiles
  XBOX_CONTROLLER_STANDARD: 'xbox-controller',
});

class ControllerManager {
  /* eslint-disable no-underscore-dangle */
  constructor() {
    this.getGamepads = null;
    if (navigator.getGamepads) {
      this.getGamepads = navigator.getGamepads;
    } else if (navigator.webkitGetGamepads) {
      this.getGamepads = navigator.webkitGetGamepads;
    } else {
      throw new Error('This browser does not have HTML5 Gamepad API support.');
    }

    this._edgeDetectionHackTimestamp = [];
    this._isEdgeDetectionHackActive = {};

    // Set up relevant callbacks
    const self = this;
    window.addEventListener('gamepadconnected', (e) => {
      const index = e.gamepad.index;
      // console.log(`Detected gamepad: ${e.gamepad.id}`);
      if (detectBrowser() === 'Edge') {
        // Perform hack to get controller detection to work in Edge.
        // Pro Controllers always show up as Xbox controllers in Edge, but the input mapping is incorrect. This
        // provides a way for us to differentiate between the two.
        // Xbox controllers only update timestamp on input change, but Pro Controllers will always update timestamp.
        // So we can assume that if the timestamp changes when we reread the controller state immediately afterwards,
        // then it is a Pro Controller. Obviously this won't work to detect other types of controllers, but it
        // should be good enough for now.
        self._edgeDetectionHackTimestamp[index] = self.getGamepad(index).timestamp;
        setTimeout(() => {
          const newTs = self.getGamepad(index).timestamp;
          self._isEdgeDetectionHackActive[index] = self._edgeDetectionHackTimestamp[index] !== newTs;
        }, 0);
      }
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      // console.log(`Gamepad disconnected: ${e.gamepad.id}`);
      self._isEdgeDetectionHackActive[e.gamepad.index] = false;
    });

    document.addEventListener('keydown', (e) => {
      // Block gamepad UI navigation on Edge
      if (e.key.startsWith('Gamepad')) {
        e.preventDefault();
      }
    });
  }

  getGamepad(index) {
    const gamepads = this.getGamepads();
    if (gamepads[index]) return gamepads[index];
    return null;
  }

  getControllerProfile(index) {
    // TODO: Is there any way to make this any cleaner?
    const browser = detectBrowser();
    const os = detectOS();
    const gamepad = this.getGamepad(index);
    const id = gamepad.id;
    const mapping = gamepad.mapping;

    function makeProfile(name, componentname) {
      return {
        name,
        componentname,
        index,
        id,
        supported: componentname !== ControllerProfiles.UNSUPPORTED,
      };
    }
    if (mapping === 'standard') {
      // Check for Pro Controller (2009) or Joycon Grip (200e) connected via cable (won't work)
      if (id.indexOf('Nintendo Co., Ltd.') > -1) {
        if (checkVidPid(id, '57e', '2009')) {
          return makeProfile(KnownControllers.PRO_CONTROLLER.name, ControllerProfiles.UNSUPPORTED);
        }
        return makeProfile(KnownControllers.JOYCON_CHARGING_GRIP.name, ControllerProfiles.UNSUPPORTED);
      }

      // Pro Controller reported as standard on Chrome OS and Edge
      if (checkVidPid(id, '57e', '2009')) {
        return makeProfile(KnownControllers.PRO_CONTROLLER.name, ControllerProfiles.PRO_CONTROLLER_STANDARD);
      }

      // DualShock 4 reported as standard by Chrome on all OSes
      if (checkVidPid(id, '54c', '9cc')) {
        return makeProfile(KnownControllers.DUALSHOCK4.name, ControllerProfiles.DUALSHOCK4_STANDARD);
      }

      // Not reported as standard mappings on any tested OS/browser, but here just in case
      if (checkVidPid(id, '20d6', 'a711')) {
        return makeProfile(KnownControllers.POWERA_WIRED_CONTROLLER_PLUS.name, ControllerProfiles.POWERA_WIRED_CONTROLLER_PLUS_STANDARD);
      }

      if (browser === 'Edge') {
        if (this._isEdgeDetectionHackActive[index]) {
          return makeProfile(KnownControllers.PRO_CONTROLLER.name, ControllerProfiles.PRO_CONTROLLER_EDGE);
        }
      }

      // Xbox controller works on Windows and Chrome on Mac OS only
      return makeProfile('Xbox Controller', ControllerProfiles.XBOX_CONTROLLER_STANDARD);
    }

    // Pro Controller uses standard mappings (but not reported as standard) on Firefox
    if (checkVidPid(id, '57e', '2009')) {
      if (browser === 'Firefox') {
        if (os === 'Windows') {
          return makeProfile(KnownControllers.PRO_CONTROLLER.name, ControllerProfiles.PRO_CONTROLLER_FIREFOX_WIN);
        } else if (os === 'Mac OS') {
          return makeProfile(KnownControllers.PRO_CONTROLLER.name, ControllerProfiles.PRO_CONTROLLER_FIREFOX_MAC);
        }
        return makeProfile(KnownControllers.PRO_CONTROLLER.name, ControllerProfiles.UNSUPPORTED);
      }
    }

    // DualShock 4 D-Pad doesn't work properly on Windows/Firefox. On Mac OS/Firefox it works fine but needs remapping.
    if (checkVidPid(id, '54c', '9cc')) {
      if (browser === 'Firefox') {
        if (os === 'Windows') {
          return makeProfile(KnownControllers.DUALSHOCK4.name, ControllerProfiles.DUALSHOCK4_FIREFOX_WIN);
        } else if (os === 'Mac OS') {
          return makeProfile(KnownControllers.DUALSHOCK4.name, ControllerProfiles.DUALSHOCK4_FIREFOX_MAC);
        }
        return makeProfile(KnownControllers.DUALSHOCK4.name, ControllerProfiles.UNSUPPORTED);
      }
    }

    // PowerA Wired Controller Plus works fine on every OS (Windows/Firefox needs D-Pad fix), but needs remapping.
    if (checkVidPid(id, '20d6', 'a711')) {
      if (os === 'Chrome OS') {
        return makeProfile(KnownControllers.POWERA_WIRED_CONTROLLER_PLUS.name, ControllerProfiles.POWERA_WIRED_CONTROLLER_PLUS_CHROMEOS);
      }
      if (browser === 'Chrome') {
        return makeProfile(KnownControllers.POWERA_WIRED_CONTROLLER_PLUS.name, ControllerProfiles.POWERA_WIRED_CONTROLLER_PLUS_CHROME);
      }
      if (browser === 'Firefox') {
        if (os === 'Windows') return makeProfile(KnownControllers.POWERA_WIRED_CONTROLLER_PLUS.name, ControllerProfiles.POWERA_WIRED_CONTROLLER_PLUS_FIREFOX_WIN);
        if (os === 'Mac OS') return makeProfile(KnownControllers.POWERA_WIRED_CONTROLLER_PLUS.name, ControllerProfiles.POWERA_WIRED_CONTROLLER_PLUS_FIREFOX_MAC);
      }
      return makeProfile(KnownControllers.POWERA_WIRED_CONTROLLER_PLUS.name, ControllerProfiles.UNSUPPORTED);
    }

    // No supported profile found
    return makeProfile(id, ControllerProfiles.UNSUPPORTED);
  }
}
