// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import {
  Vuetify,
  VApp,
  VAvatar,
  VDivider,
  VNavigationDrawer,
  VFooter,
  VList,
  VBtn,
  VIcon,
  VGrid,
  VSelect,
  VSlider,
  VSnackbar,
  VToolbar,
  VTooltip,
  transitions,
} from 'vuetify';
import App from './App';
import Store from './store/index';
import '../node_modules/vuetify/src/stylus/app.styl';

Vue.use(Vuetify, {
  components: {
    VApp,
    VAvatar,
    VDivider,
    VNavigationDrawer,
    VFooter,
    VList,
    VBtn,
    VIcon,
    VGrid,
    VSelect,
    VSlider,
    VSnackbar,
    VToolbar,
    VTooltip,
    transitions,
  },
});

Vue.config.productionTip = true;

Vue.prototype.$store = Store;

/* eslint-disable no-new */
new Vue({
  el: '#app',
  components: { App },
  template: '<App/>',
});
