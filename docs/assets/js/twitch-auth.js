import {AuthState, StoreMutations} from "./Common";
import {SocketBus, SocketEvents} from "./ControlWebSocket";

export const TwitchAuth = {
    props: ['mode'],
    data: function() {
        if (typeof window.twitch_auth_config === 'undefined')
            throw new Error("Missing twitch-auth-config");
        const clientId = window.twitch_auth_config.clientId;
        const redirect = window.twitch_auth_config.redirect;

        const me = this;
        const Oidc = window.Oidc;
        
        function getUiMode() { return me.mode || 'popup'; }

        const oidcSettings = {
            // https://github.com/IdentityModel/oidc-client-js/wiki#configuration
            
            authority: 'https://id.twitch.tv/oauth2/', // [discovery url](https://id.twitch.tv/oauth2/.well-known/openid-configuration)
            
            client_id: clientId, 
            response_type: 'code id_token', // 'code' is the secret ingredient for oidc-client to work with twitch ;P [1]
            scope: 'openid', // see (https://dev.twitch.tv/docs/authentication/#scopes)
            
            redirect_uri: redirect, 
            popup_redirect_uri: redirect,
            silent_redirect_uri: redirect,
            post_logout_redirect_uri: redirect, // used by twitch??
            
            popupWindowTarget: 'twitch_auth',
            automaticSilentRenew: false, // twitch recommends only refreshing after a request fails auth
            //accessTokenExpiringNotificationTime: 60, // default: 60(s)
            //silentRequestTimeout: 10000, // default: 10000(ms)

            filterProtocolClaims: false, // default: true
            loadUserInfo: true
        };
        // [1] Twitch 'id_token' request does not return 'state' in URLs hash. adding 'code' does.


        // TLDR; replace all calls to this with `window.console` ... profit.
        // creates object with 'log' and 'debug', 'info', 'warn', 'error' methods
        // which relays output to logWriter if specified or the window.console
        // and prepends each entry with "${logName}: ${level}: "
        function createLogger(logName, logWriter) {
            logWriter = logWriter || window.console;
            let logger = ['log', 'debug','info','warn','error']
                .reduce((log, lvl) => {
                    log[lvl] = function() {
                        let args = [logName + ':']
                            .concat((lvl !== 'log') ? (lvl + ':') : [])
                            .concat(Array.prototype.slice.call(arguments));
                        logWriter[lvl].apply(logWriter, args); // required for calling console's methods
                    };
                    return log;
                }, {});
            return logger;
        }

        const logger = createLogger("twitch-auth");

        if (Oidc && Oidc.Log && Oidc.Log.logger) {
            Oidc.Log.level = Oidc.Log.WARN;
            Oidc.Log.logger = createLogger("OIDC", window.console);
        }


        function loadUser(loadedUser)
        {
            if (loadedUser == null) return unloadUser();
            me.state = 'valid';
            me.user = loadedUser;
            me.picture = null;
            me.lastError = null;
            me.lastErrorObject = null;
            logger.info('event: userLoaded', loadedUser);

            me.$store.commit(StoreMutations.TWITCH_USER, loadedUser);
            me.$store.commit(StoreMutations.AUTH_STATE, AuthState.SIGNED_IN);
            getChannel().then(function() {
                SocketBus.$emit(SocketEvents.QUEUE_MESSAGE, `TWITCH_LOGIN ${loadedUser.id_token} ${me.picture}`);
            });
        }

        function unloadUser()
        {
            me.state = 'new';
            me.user = null;
            me.picture = null;
            me.lastError = null;
            me.lastErrorObject = null;
            logger.info('event: userUnloaded');

            me.$store.commit(StoreMutations.AUTH_STATE, null);
            SocketBus.$emit(SocketEvents.QUEUE_MESSAGE, 'TWITCH_LOGOUT');
        }

        function authError(message, er)
        {
            me.state = 'error';
            me.lastError = message;
            me.lastErrorObject = er;
            logger.warn(message, er);
            if (er.message === 'Popup window closed'
                || er.error === 'access_denied') {
                me.lastError = 'Sign-in request cancelled.';
            }
        }

        function waiting() {
            me.state = 'waiting';
            me.user = null;
            me.picture = null;
            me.lastError = null;
            me.lastErrorObject = null;
        }

        let twitchChannel = null;

        function getChannel() {
            return new Promise(function(resolve, reject) {
                let twitchUserId = me.user && me.user.profile && me.user.profile.sub;
                if (twitchChannel && twitchUserId && twitchChannel.id === twitchUserId) {
                    logger.debug("Twitch user profile already loaded");
                    me.picture = twitchChannel.profile_image_url;
                    resolve(twitchChannel);
                }
                else {
                    logger.debug("Loading Twitch user profile");
                    twitchChannel = null;
                    me.picture = null;
                    return fetch(`https://api.twitch.tv/helix/users?id=${me.user.profile.sub}`, {
                        headers: {
                            'Client-ID': oidcSettings.client_id
                        }
                    }).then(function(response) {
                        return response.json();
                    }).then(function(data) {
                        twitchChannel = data.data && data.data[0];
                        me.picture = twitchChannel.profile_image_url;
                        resolve(twitchChannel);
                    });
                }
            });
        }

        let oidcManager = new Oidc.UserManager(oidcSettings);
        oidcManager.events.addUserLoaded(loadUser);
        oidcManager.events.addUserUnloaded(unloadUser);
        oidcManager.getUser().then(loadUser);

        return {

            state: 'new', /* new, waiting, valid, error */
            lastError: null,
            user: null,
            picture: null,

            open: function() {
                waiting();

                let signin = (getUiMode() === 'popup')
                    ? oidcManager.signinPopup()
                    : oidcManager.signinRedirect();
                signin
                    .catch(function (er) {
                        authError(er.message, er);
                    });
            },
            close: function() {
                // logging out doesn't work with Twitch ???
                //me.state = 'waiting';
                //oidcManager.signoutPopup()
                oidcManager.removeUser()
                    .then(unloadUser)
                    .catch((er) => authError(er.message));
            },
            handleRedirect: function() {
                let urlParams = window.location.hash;
                if (me.isRedirectError()) {
                    urlParams = window.location.search.substr(1).replace(/\+/g, ' ');
                    let tError = me.getUrlParams(urlParams);
                }
                if (getUiMode() === 'popup') return oidcManager.signinPopupCallback(urlParams);
                return oidcManager.signinRedirectCallback(urlParams);
            },
            isRedirect: function() {
                return window.location.hash || me.isRedirectError();
            },
            isRedirectError: function() {
                return window.location.search.indexOf('state=') > -1
            },
            getUrlParams: function(urlParams) {
                return (urlParams || window.location.search).substr(1).split('&')
                    .map(v => v.split('=').map(window.decodeURIComponent))
                    .reduce((a,v) => (( a[v[0]] = (typeof v[1] === 'undefined' ? true : v[1]), a )), {});
            }
        };
    },

    created: function() {
        let self = this;
        SocketBus.$on('TWITCH_VERIFIED', function() {
            self.$store.commit('setAuthState', AuthState.SERVER_SIGNED_IN);
        });
        SocketBus.$on('TWITCH_INVALID', function() {
            self.$store.commit('setAuthState', AuthState.NOT_SIGNED_IN);
            self.signout();
        });
    },

    mounted: function() {
        if (this.isRedirect())
            this.handleRedirect()
            .then(function() {
                let w = window;
                w.history.replaceState({}, w.document.title, w.location.origin + w.location.pathname);
            });
    },

    methods: {
        signin: function () {
            if (!this.canSignin) return;
            this.open();
            this.$emit('signedIn');
        },
        signout: function() {
            if (!this.canSignout) return;
            this.close();
            this.$emit('signedOut');
        },
        toggleAuth: function() {
            if (this.canSignout) this.signout();
            else if (this.canSignin) this.signin();
        }
    },

    computed: {
        canSignin: function() {
            return this.state === 'new' || this.state === 'error';
        },
        canSignout: function() {
            return this.state === 'valid';
        },
        isDisabled: function() {
            return !this.canSignin && !this.canSignout;
        },
        authState: function() {
            if (this.canSignin) return 'Sign-in with Twitch';
            if (this.canSignout) return 'Sign-out from Twitch';
            if (this.state === 'waiting') return 'Please wait...';
            return '';
        },
        username: function() {
            return this.user && this.user.profile && this.user.profile.preferred_username;
        }
    },

    template: ''
    +'<div class="center-text">'
        +'<button type="button" class="center-text min-padding" @click="toggleAuth" v-text="authState" v-bind:disabled="isDisabled"></button>'
        +'<div class="warning" v-if="lastError" v-text="lastError"></div>'
        +'<div v-if="canSignout">Logged in as <img v-bind:src="picture" height="32" style="vertical-align:middle"/><span v-text="username"></span></div>'
        // +'<div class="debug-watch" v-if="canSignout">'
        //     +'<div><label>Username</label><span v-text="username"></span></div>'
        //     +'<div><label>Picture</label><span v-text="picture"></span></div>'
        // +'</div>'
    +'</div>'

};

