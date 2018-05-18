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