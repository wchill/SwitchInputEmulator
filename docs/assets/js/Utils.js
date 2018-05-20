export let detectBrowser = function() {
    if(navigator.userAgent.indexOf("Chrome") !== -1 ) {
        return 'Chrome';
    } else if(navigator.userAgent.indexOf("Firefox") !== -1 ) {
        return 'Firefox';
    } else {
        return 'unknown';
    }
};
export let detectOS = function() {
    let userAgent = window.navigator.userAgent,
        platform = window.navigator.platform,
        macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
        windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
        iosPlatforms = ['iPhone', 'iPad', 'iPod'];

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
export let checkVidPid = function(id, vid, pid) {
    return id.indexOf(vid) > -1 && id.indexOf(pid) > -1;
};
export let getControllerProfile = function(browser, os, id, mapping) {
    if (mapping === 'standard') {
        // Check for Pro Controller (2009) or Joycon Grip (200e) connected via cable (won't work)
        if (id.indexOf('Nintendo Co., Ltd.') > -1) {
            return 'unsupported-controller';
        }

        // Pro Controller reported as standard on Chrome OS only
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

        // Xbox controller works on Windows and Chrome on Mac OS only
        return 'xbox-controller';
    }

    // Pro Controller uses standard mappings (but not reported as standard) on Mac OS/Firefox
    if (checkVidPid(id, '57e', '2009')) {
        if (os === 'Mac OS' && browser === 'Firefox') {
            return 'switch-pro-controller-mac-firefox';
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
};