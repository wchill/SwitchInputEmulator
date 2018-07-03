export const detectBrowser = () => {
  if (navigator.userAgent.indexOf('Edge') !== -1) {
    return 'Edge';
  } else if (navigator.userAgent.indexOf('Chrome') !== -1) {
    return 'Chrome';
  } else if (navigator.userAgent.indexOf('Firefox') !== -1) {
    return 'Firefox';
  } else if (navigator.userAgent.indexOf('Safari') !== -1) {
    return 'Safari';
  }
  return 'unknown';
};

export const detectOS = () => {
  const userAgent = window.navigator.userAgent;
  const platform = window.navigator.platform;
  const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
  const iosPlatforms = ['iPhone', 'iPad', 'iPod'];

  if (macosPlatforms.indexOf(platform) !== -1) {
    return 'Mac OS';
  } else if (iosPlatforms.indexOf(platform) !== -1) {
    return 'iOS';
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    return 'Windows';
  } else if (/Android/.test(userAgent)) {
    return 'Android';
  } else if (/CrOS/.test(userAgent)) {
    return 'Chrome OS';
  } else if (/Linux/.test(platform)) {
    return 'Linux';
  }

  return 'unknown';
};

export const checkVidPid = (id, vid, pid) => (id.indexOf(vid) > -1) && (id.indexOf(pid) > -1);

export const enumToName = (sourceEnum, val) => {
  const keys = Object.keys(sourceEnum);
  for (let i = 0; i < keys.length; i++) {
    if (sourceEnum[keys[i]] === val) return keys[i];
  }
  return val;
};


export const isWebGLSupported = () => {
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
};
