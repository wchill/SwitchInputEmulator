// CONFIG: twitch oauth settings
if (window.location.origin.indexOf('localhost') > -1) {
    window.twitch_auth_config = {
        clientId: 'sa5pewo51b3fi5d70le38sj5916iz5',
        redirect: window.location.origin
    };
} else {
    window.twitch_auth_config = {
        clientId: '6ilamg1dh1d2fwi30x5ryiarfq6y86', // from [Twitch Client ID](https://glass.twitch.tv/console/apps)
        redirect: window.location.origin, // from [Twitch OAuth Redirect URL](https://glass.twitch.tv/console/apps)
    };
}
