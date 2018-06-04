<template>
  <v-flex xs6 class="no-height" justify-center>
    <v-tooltip top>
      <v-slider ref="volumeSlider" dark color="blue" :hide-details="true" :toggle-keys="[]" v-model="volume" min="0" max="1" step="0.001" prepend-icon="volume_down" append-icon="volume_up" slot="activator"></v-slider>
      <span v-text="'Volume: ' + ((volume * 100) | 0)"></span>
    </v-tooltip>
  </v-flex>
</template>

<script>
  import WebSocketClient from '../assets/js/WebSocketClient';

  export default {
    props: ['endpoint'],
    name: 'OpusWebSocketPlayer',
    data: () => ({
      settings: {
        sampleRate: 24000,
        channels: 1,
        app: 2051,
        frameDuration: 20,
        bufferSize: 4096,
      },
      audioContext: null,
      scriptNode: null,
      gainNode: null,
      audioQueue: null,
      volume: 0,
      muted: true,
      decoder: null,
      sampler: null,
      silence: null,
    }),
    mounted() {
      const self = this;
      this.$refs.volumeSlider.$on('input', (e) => {
        if (!self.scriptNode) {
          self.setVolume(e);
          self.unmute();
          self.start();
        }
      });
    },
    methods: {
      // This has to be called by some user interaction or it will not work!
      start() {
        const self = this;

        this.decoder = new window.OpusDecoder(this.settings.sampleRate, this.settings.channels);
        this.sampler = new window.Resampler(this.settings.sampleRate, 44100, 1, this.settings.bufferSize);
        this.silence = new Float32Array(this.settings.bufferSize);

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        this.audioQueue = {
          buffer: new Float32Array(0),

          write(newAudio) {
            const currentQLength = this.buffer.length;
            const resampledAudio = self.sampler.resampler(newAudio);
            const newBuffer = new Float32Array(currentQLength + resampledAudio.length);
            newBuffer.set(this.buffer, 0);
            newBuffer.set(resampledAudio, currentQLength);
            this.buffer = newBuffer;
          },

          read(nSamples) {
            const samplesToPlay = this.buffer.subarray(0, nSamples);
            this.buffer = this.buffer.subarray(nSamples, this.buffer.length);
            return samplesToPlay;
          },

          length() {
            return this.buffer.length;
          },
        };

        /* TODO: ScriptProcessorNode is deprecated (https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode).
           Replace this with an AudioWorkletNode.
        */
        this.scriptNode = this.audioContext.createScriptProcessor(this.settings.bufferSize, 1, 1);
        this.scriptNode.onaudioprocess = (e) => {
          if (self.audioQueue.length()) {
            e.outputBuffer.getChannelData(0).set(self.audioQueue.read(self.settings.bufferSize));
          } else {
            e.outputBuffer.getChannelData(0).set(self.silence);
          }
        };
        this.gainNode = this.audioContext.createGain();
        this.setVolume(this.muted ? 0 : this.volume);
        this.scriptNode.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);

        this.ws = new WebSocketClient(this.endpoint, null, {
          backoff: 'fibonacci',
        });
        this.ws.addEventListener('message', (e) => {
          const fileReader = new FileReader();
          fileReader.addEventListener('load', () => {
            self.audioQueue.write(self.decoder.decode_float(fileReader.result));
          });
          fileReader.readAsArrayBuffer(e.data);
        });
      },
      stop() {
        this.audioQueue = null;
        if (this.scriptNode) {
          this.scriptNode.disconnect();
          this.scriptNode = null;
        }
        if (this.gainNode) {
          this.gainNode.disconnect();
          this.gainNode = null;
        }

        this.ws.close();
      },
      getVolume() {
        return this.volume;
      },
      setVolume(volume) {
        this.volume = volume;
        if (this.gainNode) {
          this.gainNode.gain.value = this.muted ? 0 : this.volume;
        }
      },
      mute() {
        this.muted = true;
        if (this.gainNode) {
          this.gainNode.gain.value = 0;
        }
      },
      unmute() {
        this.muted = false;
        if (this.gainNode) {
          this.gainNode.gain.value = this.volume;
        }
      },
    },
  };
</script>

<style scoped>
  .no-height {
    height: 0%;
  }
</style>
