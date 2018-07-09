<template>
  <v-select
    :items="inputSourceItems"
    v-model="selected"
    label="Select input method"
    item-text="name"
    item-value="id"
    item-disabled="disabled"
    max-height="auto"
    prepend-icon="mdi-google-controller"
    autocomplete
    persistent-hint
  >
    <template slot="item" slot-scope="data">
      <v-list-tile-avatar>
        <v-avatar>
          <v-icon dark v-html="data.item.icon"></v-icon>
        </v-avatar>
      </v-list-tile-avatar>
      <v-list-tile-content>
        <v-list-tile-title v-text="data.item.name"></v-list-tile-title>
        <v-list-tile-sub-title v-text="data.item.description + (data.item.disabled ? ' (Not supported on this platform)' : '')"></v-list-tile-sub-title>
      </v-list-tile-content>
    </template>
  </v-select>
</template>

<script>
  import ControllerManager from '../utils/controllers/ControllerManager';

  export default {
    name: 'InputSourceSelect',
    data() {
      return {
        controllers: [],
        selected: {

        },
      };
    },
    computed: {
      inputSourceItems() {
        const sources = [];
        sources.push({ header: 'Controllers' });
        for (let i = 0; i < this.controllers.length; i++) {
          const controllerObj = this.controllers[i];
          sources.push({ id: 0, name: controllerObj.id, description: controllerObj.name, icon: controllerObj.icon, disabled: !controllerObj.supported });
        }
        sources.push({ divider: true });
        sources.push({ header: 'Keyboard' });
        sources.push({ id: 1, name: 'Keyboard', description: 'Use system keyboard', icon: 'mdi-keyboard', disabled: false });
        return sources;
      },
    },
    methods: {
      onControllerConnectOrDisconnect(controllers) {
        this.controllers = controllers;
      },
    },
    created() {
      ControllerManager.addControllerEventListener(this.onControllerConnectOrDisconnect);
    },
  };
</script>

<style scoped>

</style>
