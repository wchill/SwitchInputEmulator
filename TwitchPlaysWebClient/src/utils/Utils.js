export const Browsers = Object.freeze({
  EDGE: 'Edge',
  CHROME: 'Chrome',
  FIREFOX: 'Firefox',
  SAFARI: 'Safari',
  UNKNOWN: 'Unknown',
});

export const OperatingSystems = Object.freeze({
  MAC_OS: 'Mac OS',
  IOS: 'iOS',
  WINDOWS: 'Windows',
  ANDROID: 'Android',
  CHROME_OS: 'Chrome OS',
  LINUX: 'Linux',
  UNKNOWN: 'Unknown',
});

export function detectBrowser() {
  if (navigator.userAgent.indexOf('Edge') !== -1) {
    return Browsers.EDGE;
  } else if (navigator.userAgent.indexOf('Chrome') !== -1) {
    return Browsers.CHROME;
  } else if (navigator.userAgent.indexOf('Firefox') !== -1) {
    return Browsers.FIREFOX;
  } else if (navigator.userAgent.indexOf('Safari') !== -1) {
    return Browsers.SAFARI;
  }
  return Browsers.UNKNOWN;
}

export function detectOS() {
  const userAgent = window.navigator.userAgent;
  const platform = window.navigator.platform;
  const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
  const iosPlatforms = ['iPhone', 'iPad', 'iPod'];

  if (macosPlatforms.indexOf(platform) !== -1) {
    return OperatingSystems.MAC_OS;
  } else if (iosPlatforms.indexOf(platform) !== -1) {
    return OperatingSystems.IOS;
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    return OperatingSystems.WINDOWS;
  } else if (/Android/.test(userAgent)) {
    return OperatingSystems.ANDROID;
  } else if (/CrOS/.test(userAgent)) {
    return OperatingSystems.CHROME_OS;
  } else if (/Linux/.test(platform)) {
    return OperatingSystems.LINUX;
  }

  return OperatingSystems.UNKNOWN;
}

export function checkVidPid(id, vid, pid) {
  return (id.indexOf(vid) > -1) && (id.indexOf(pid) > -1);
}

export function enumToName(sourceEnum, val) {
  const keys = Object.keys(sourceEnum);
  for (let i = 0; i < keys.length; i++) {
    if (sourceEnum[keys[i]] === val) return keys[i];
  }
  return val;
}


export function isWebGLSupported() {
  try {
    if (!window.WebGLRenderingContext) {
      return false;
    }
    const testCanvas = document.createElement('canvas');
    const ctx = testCanvas.getContext('webgl');
    return !!ctx;
  } catch (e) {
    return false;
  }
}

// TODO: Replace these strings with actual objects/functions defining how to read controllers
/*
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

export function getControllerProfile(browser, os, index, id, mapping) {

  if (mapping === 'standard') {
    // Check for Pro Controller (2009) or Joycon Grip (200e) connected via cable (won't work)
    if (id.indexOf('Nintendo Co., Ltd.') > -1) {
      return 'unsupported-controller';
    }

    // Pro Controller reported as standard on Chrome OS and Edge
    if (checkVidPid(id, '57e', '2009')) {
      return 'switch-pro-controller-standard';
    }

    // DualShock 4 reported as standard by Chrome on all OSes
    if (checkVidPid(id, '54c', '9cc')) {
      return 'dualshock-controller-standard';
    }

    // Not reported as standard mappings on any tested OS/browser, but here just in case
    if (checkVidPid(id, '20d6', 'a711')) {
      return 'powera-wired-controller-standard';
    }

    if (browser === 'Edge') {
      if (this.isEdgeDetectionHackActive[index]) {
        return 'switch-pro-controller-edge';
      }
    }

    // Xbox controller works on Windows and Chrome on Mac OS only
    return 'xbox-controller';
  }

  // Pro Controller uses standard mappings (but not reported as standard) on Firefox
  if (checkVidPid(id, '57e', '2009')) {
    if (browser === 'Firefox') {
      if (os === 'Windows') {
        return 'switch-pro-controller-win-firefox';
      } else if (os === 'Mac OS') {
        return 'switch-pro-controller-mac-firefox';
      }
    }
  }

  // DualShock 4 D-Pad doesn't work properly on Windows/Firefox. On Mac OS/Firefox it works fine but needs remapping.
  if (checkVidPid(id, '54c', '9cc')) {
    if (os === 'Windows' && browser === 'Firefox') return 'dualshock-controller-win-firefox';
    if (os === 'Mac OS' && browser === 'Firefox') return 'dualshock-controller-mac-firefox';
  }

  // PowerA Wired Controller Plus works fine on every OS (Windows/Firefox needs D-Pad fix), but needs remapping.
  if (checkVidPid(id, '20d6', 'a711')) {
    if (os === 'Chrome OS') {
      return 'powera-wired-controller-chromeos';
    }
    if (browser === 'Chrome') {
      return 'powera-wired-controller-chrome';
    }
    if (browser === 'Firefox') {
      if (os === 'Windows') return 'powera-wired-controller-win-firefox';
      if (os === 'Mac OS') return 'powera-wired-controller-mac-firefox';
    }
  }

  // No supported profile found
  return 'unsupported-controller';
}
*/
