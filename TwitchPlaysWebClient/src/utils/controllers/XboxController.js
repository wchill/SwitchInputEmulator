import Controller from './Controller';

const ControllerName = 'Xbox Controller';
const ControllerIcon = 'mdi-xbox-controller';

export default class extends Controller {
  constructor(gamepad, environment, gamepadFunc) {
    super(gamepadFunc);
  }

  static canHandle(gamepad, environment) {
    return gamepad.mapping === 'standard' && !environment.edgeDetectionHackActive;
  }

  static isRecognized(gamepad, environment) {
    return this.canHandle(gamepad, environment);
  }

  static get name() {
    return ControllerName;
  }

  static get icon() {
    return ControllerIcon;
  }
}
