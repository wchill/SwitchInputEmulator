import { InputSource } from './InputSource';

export const StandardMappings = {
  data() {
    return {
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
  },
};

const BaseController = {
  mixins: [InputSource],
  props: ['gamepadindex', 'gamepadname', 'axes', 'buttons'],
  data() {
    return {
      experimental: false,
    };
  },
  methods: {
    isButtonPressed(name) {
      // May need to override for certain controllers due to dpad
      const index = this.buttonMapping[name];
      if (index === null || index === undefined || index < 0) return false;
      return !!this.buttons[index];
    },
    getStickX(name) {
      return this.axes[this.stickMapping[name].axisX] || 0.0;
    },
    getStickY(name) {
      return this.axes[this.stickMapping[name].axisY] || 0.0;
    },
  },
  mounted() {
    if (this.experimental) {
      this.$notify({
        title: 'Experimental controller support',
        text: `Please note that support for this controller (${this.canonicalName}) is experimental and may have issues or limitations. Please check the help documentation for details.`,
        duration: 10000,
      });
    }
    if (this.notifyMessage) {
      this.$notify({
        type: 'warn',
        title: 'Warning',
        text: this.notifyMessage,
        duration: 10000,
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key.startsWith('Gamepad')) {
        e.preventDefault();
      }
    });
  },
  template: '<p class="center-text">Controller (( gamepadindex )): (( gamepadname ))<br>Detected as: (( canonicalName ))</p>',
};

export const XboxController = {
  mixins: [BaseController, StandardMappings],
  data() {
    return {
      canonicalName: 'Xbox/XInput controller',
    };
  },
};

export default BaseController;
