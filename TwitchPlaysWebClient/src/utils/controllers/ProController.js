import Controller, { StandardMappings } from './Controller';

const ControllerName = 'Pro Controller';

export default class extends Controller {
  constructor(updateFunc) {
    super(StandardMappings.buttonMapping, StandardMappings.stickMapping, false, updateFunc);
  }

  static canHandle(gamepad, options) {
    return gamepad.mapping === 'standard' && options.edgeDetectionHackActive;
  }

  static isRecognized(gamepad, options) {
    return gamepad.mapping === 'standard' && options.edgeDetectionHackActive;
  }

  static get name() {
    return ControllerName;
  }
}
