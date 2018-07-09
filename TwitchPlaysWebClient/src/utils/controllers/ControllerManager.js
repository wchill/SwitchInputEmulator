import { detectOS, detectBrowser } from '../Utils';
import ProController from './ProController';
import XboxController from './XboxController';

const SupportedControllers = [
  ProController,
  XboxController,
];

class ControllerManager {
  /* eslint-disable no-underscore-dangle */
  constructor() {
    this.getGamepads = null;
    if (navigator.getGamepads) {
      this.getGamepads = () => navigator.getGamepads.call(navigator);
    } else if (navigator.webkitGetGamepads) {
      this.getGamepads = () => navigator.webkitGetGamepads.call(navigator);
    } else {
      throw new Error('This browser does not have HTML5 Gamepad API support.');
    }

    this.controllers = {};

    this._edgeDetectionHackTimestamp = [];
    this._isEdgeDetectionHackActive = {};

    this.eventListeners = [];

    // Set up relevant callbacks
    const self = this;
    window.addEventListener('gamepadconnected', (e) => {
      self.onGamepadConnected(e.gamepad);
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      // console.log(`Gamepad disconnected: ${e.gamepad.id}`);

      const index = e.gamepad.index;
      delete self._isEdgeDetectionHackActive[index];
      delete this.controllers[index];
      this.notifyListeners();
    });

    document.addEventListener('keydown', (e) => {
      // Block gamepad UI navigation on Edge
      if (e.key.startsWith('Gamepad')) {
        e.preventDefault();
      }
    });

    const gamepads = this.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) {
        this.onGamepadConnected(gamepads[i]);
      }
    }
  }

  onGamepadConnected(gamepad) {
    const index = gamepad.index;
    this.initializeController(index);
    this.notifyListeners();
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
        this.initializeController(index);
        this.notifyListeners();
      }, 0);
    }
  }

  getGamepad(index) {
    const gamepads = this.getGamepads();
    if (gamepads[index]) return gamepads[index];
    return null;
  }

  initializeController(index) {
    const gamepad = this.getGamepad(index);
    const environment = {
      browser: detectBrowser(),
      os: detectOS(),
      edgeDetectionHackActive: this._isEdgeDetectionHackActive[index] || false,
    };

    // Attempt to find a matching profile
    let controllerType = null;
    let isSupported = false;
    for (let i = 0; i < SupportedControllers.length; i++) {
      if (SupportedControllers[i].isRecognized(gamepad, environment)) {
        if (!isSupported && SupportedControllers[i].canHandle(gamepad, environment)) {
          controllerType = SupportedControllers[i];
          isSupported = true;
        } else if (controllerType === null) {
          controllerType = SupportedControllers[i];
        }
      }
    }
    const obj = {
      index,
      type: controllerType,
      supported: isSupported,
      controller: null,
      id: gamepad.id,
      name: 'Unknown',
      icon: 'mdi-cancel',
    };
    if (obj.type) {
      obj.name = controllerType.name;
      obj.icon = controllerType.icon;
      if (obj.supported) {
        const Constructor = obj.type;
        obj.controller = new Constructor(gamepad, environment, () => this.getGamepad(index));
      }
    }
    this.controllers[index] = obj;
  }

  get connectedControllers() {
    const result = [];
    const keys = Object.keys(this.controllers);
    for (let i = 0; i < keys.length; i++) {
      result.push(Object.assign({}, this.controllers[i]));
    }
    return result;
  }

  addControllerEventListener(f) {
    this.eventListeners.push(f);
    f(this.connectedControllers);
  }

  notifyListeners() {
    const controllers = this.connectedControllers;
    for (let i = 0; i < this.eventListeners.length; i++) {
      this.eventListeners[i](controllers);
    }
  }
}

const manager = Object.freeze(new ControllerManager());
export default manager;
