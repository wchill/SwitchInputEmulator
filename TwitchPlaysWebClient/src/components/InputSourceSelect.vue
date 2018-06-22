<template>
  <div>
    <v-select
      :items="inputSources"
      v-model="selected"
      label="Select input method"
      item-text="name"
      item-value="name"
      max-height="auto"
      prepend-icon="mdi-google-controller"
      autocomplete
    >
      <template slot="item" slot-scope="data">
        <template v-if="typeof data.item !== 'object'">
          <v-list-tile-content v-text="data.item"></v-list-tile-content>
        </template>
        <template v-else>
          <v-list-tile-avatar>
            <v-avatar>
              <v-icon dark v-html="data.item.icon"></v-icon>
            </v-avatar>
          </v-list-tile-avatar>
          <v-list-tile-content>
            <v-list-tile-title v-html="data.item.name"></v-list-tile-title>
            <v-list-tile-sub-title v-html="data.item.description"></v-list-tile-sub-title>
          </v-list-tile-content>
        </template>
      </template>
    </v-select>
  </div>
</template>

<script>
  /*
  import ControllerInputSource from './ControllerInputSource';
  import JoyconInputSource from './JoyconInputSource';
  import KeyboardInputSource from './KeyboardInputSource';
  */

  export default {
    name: 'InputSourceSelect',
    data() {
      return {
        inputSourceData: {
          keyboard: {
            enabled: true,
            name: 'Keyboard',
            icon: 'mdi-keyboard',
          },
          controller: {
            enabled: true,
            name: 'Controllers',
            icon: 'mdi-google-controller',
          },
          joycon: {
            enabled: true,
            name: 'Joycons',
            icon: 'mdi-nintendo-switch',
          },
          touch: {
            enabled: false,
            name: 'Touch screen',
            icon: '',
          },
        },
        selected: {

        },
      };
    },
    computed: {
      inputSources() {
        const sources = [];
        const sourceNames = Object.keys(this.inputSourceData);
        for (let i = 0; i < sourceNames.length; i++) {
          const source = this.inputSourceData[sourceNames[i]];
          if (source.enabled) {
            sources.push({ header: source.name });
            for (let j = 0; j < 3; j++) {
              sources.push({ name: `${source.name} ${j + 1}`, description: 'Test', icon: source.icon });
            }
          }
        }
        return sources;
      },
    },
  };
</script>

<style scoped>

</style>
