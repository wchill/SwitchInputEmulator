<template>
  <div>
    <v-btn block round color="twitch-purple" class="elevation-3" @click="login"><v-icon left>mdi-twitch</v-icon><span v-text="buttonText"></span></v-btn>
    <v-snackbar v-model="cancelledAlert" color="error" :timeout="5000">Login cancelled.<v-btn flat color="white" @click.native="cancelledAlert = false">Close</v-btn></v-snackbar>
    <v-snackbar v-model="successAlert" color="success" :timeout="5000">Login successful.<v-btn flat color="white" @click.native="successAlert = false">Close</v-btn></v-snackbar>
  </div>
</template>

<script>
  // credit to psam/@sbenedict for the original version of this code
  import { UserManager, WebStorageStateStore } from 'oidc-client';

  import { StoreMutations, AuthState } from '../mixins/Common';
  import { SocketBus, SocketEvents } from './ControlWebSocket';

  const localhostClientId = 'sa5pewo51b3fi5d70le38sj5916iz5';
  const productionClientId = '6ilamg1dh1d2fwi30x5ryiarfq6y86';
  const clientId = (window.location.origin.indexOf('localhost') > -1 ? localhostClientId : productionClientId);
  const redirect = `${window.location.origin}/static/callback.html`;

  export default {
    data() {
      return {
        oidcSettings: {
          userStore: new WebStorageStateStore(),
          authority: 'https://id.twitch.tv/oauth2/',
          client_id: clientId,
          response_type: 'code id_token',
          scope: 'openid',
          redirect_uri: redirect,
          popupWindowTarget: 'twitch_auth',
          automaticSilentRenew: false,
          filterProtocolClaims: false,
          loadUserInfo: true,
        },
        userInfo: {
          avatar: null,
          id_token: null,
          user: null,
        },
        oidcManager: null,
        cancelledAlert: false,
        successAlert: false,
      };
    },
    computed: {
      buttonText() {
        if (this.userInfo.user) {
          return `Logged in as ${this.userInfo.user.profile.preferred_username}`;
        }
        return 'Login with Twitch';
      },
    },
    created() {
      this.oidcManager = new UserManager(this.oidcSettings);
      const self = this;
      SocketBus.$on('TWITCH_VERIFIED', () => self.$store.commit('setAuthState', AuthState.SERVER_SIGNED_IN));
      SocketBus.$on('TWITCH_INVALID', self.logout);
    },
    mounted() {
      if (this.isRedirect()) {
        this.handleRedirect()
        .then(() => {
          const w = window;
          w.history.replaceState({}, w.document.title, w.location.origin + w.location.pathname);
        });
      }
    },
    methods: {
      clearUserInfo() {
      },
      getAvatarAsync(id) {
        return fetch(`https://api.twitch.tv/helix/users?id=${id}`, {
          headers: {
            'Client-ID': this.oidcSettings.client_id,
          },
        }).then(response => response.json())
          .then(data => data.data[0].profile_image_url);
      },
      login() {
        const self = this;
        this.clearUserInfo();
        this.oidcManager.signinPopup()
          .then(user => self.getAvatarAsync(user.profile.sub)
            .then((avatar) => {
              self.userInfo = {
                avatar,
                id_token: user.id_token,
                user,
              };
              self.successAlert = true;
              // TODO: fix this
              this.$store.commit(StoreMutations.TWITCH_USER, user);
              this.$store.commit(StoreMutations.AUTH_STATE, AuthState.SIGNED_IN);
              SocketBus.$emit(SocketEvents.QUEUE_MESSAGE, `TWITCH_LOGIN ${user.id_token} ${avatar}`);
            }))
          .catch(() => {
            self.logout();
            self.cancelledAlert = true;
          });
      },
      logout() {
        const self = this;
        self.$store.commit('setAuthState', AuthState.NOT_SIGNED_IN);
        this.oidcManager.removeUser().then(() => {
          self.userInfo = {
            avatar: null,
            id_token: null,
            user: null,
          };
        });
      },
      handleRedirect() {
        let urlParams = window.location.hash;
        if (this.isRedirectError()) {
          urlParams = window.location.search.substr(1);
          // console.error(this.getUrlParams(urlParams));
        }
        return this.oidcManager.signinPopupCallback(urlParams);
        // Used for iframe implementation
        // return this.oidcManager.signinRedirectCallback(urlParams);
      },
      isRedirect() {
        return window.location.hash || this.isRedirectError();
      },
      isRedirectError() {
        return window.location.search.indexOf('state=') > -1;
      },
      getUrlParams(paramString) {
        const params = {};
        const search = decodeURIComponent(paramString);
        const definitions = search.split('&');

        definitions.forEach((val) => {
          const parts = val.split('=', 2);
          params[parts[0]] = parts[1];
        });

        return params;
      },
    },
    name: 'TwitchAuth',
  };
</script>

<style scoped>

</style>
