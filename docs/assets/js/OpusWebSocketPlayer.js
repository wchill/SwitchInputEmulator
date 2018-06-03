import {WebSocketClient} from "./lib/WebSocketClient";

export const OpusWebSocketPlayer = {
    props: ['endpoint'],
    data: function() {
        return {
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
            volume: 0.5,
            muted: true,
            decoder: null,
            sampler: null,
            silence: null
        };
    },
    mounted: function() {
        let self = this;
        $('.slider').slider({
            min: 0,
            max: 100,
            value: 0,
            range: 'min',
            slide: function(event, ui) {
                self.setVolume(ui.value / 100);
                self.unmute();
                if (!self.scriptNode) {
                    self.start();
                }
            }
        });
        /*
        this.$refs.volumeControl.addEventListener('change', function(e) {
            let val = self.$refs.volumeControl.value;
            self.setVolume(val);
            self.unmute();
            if (!self.scriptNode) {
                self.start();
            }
        });
        */
    },
    methods: {
        // This has to be called by some user interaction or it will not work!
        start: function() {
            let self = this;

            this.decoder = new OpusDecoder(this.settings.sampleRate, this.settings.channels);
            this.sampler = new Resampler(this.settings.sampleRate, 44100, 1, this.settings.bufferSize);
            this.silence = new Float32Array(this.settings.bufferSize);

            this.audioContext = new(window.AudioContext || window.webkitAudioContext)();

            this.audioQueue = {
                buffer: new Float32Array(0),

                write: function(newAudio) {
                    const currentQLength = this.buffer.length;
                    newAudio = self.sampler.resampler(newAudio);
                    let newBuffer = new Float32Array(currentQLength + newAudio.length);
                    newBuffer.set(this.buffer, 0);
                    newBuffer.set(newAudio, currentQLength);
                    this.buffer = newBuffer;
                },

                read: function(nSamples) {
                    const samplesToPlay = this.buffer.subarray(0, nSamples);
                    this.buffer = this.buffer.subarray(nSamples, this.buffer.length);
                    return samplesToPlay;
                },

                length: function() {
                    return this.buffer.length;
                }
            };

            /* TODO: ScriptProcessorNode is deprecated (https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode).
               Replace this with an AudioWorkletNode.
            */
            this.scriptNode = this.audioContext.createScriptProcessor(this.settings.bufferSize, 1, 1);
            this.scriptNode.onaudioprocess = function(e) {
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
                backoff: 'fibonacci'
            });
            this.ws.addEventListener('message', function(e) {
                const fileReader = new FileReader();
                fileReader.addEventListener('load', function() {
                    self.audioQueue.write(self.decoder.decode_float(fileReader.result));
                });
                fileReader.readAsArrayBuffer(e.data);
            });
        },
        stop: function() {
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
        getVolume: function() {
            return this.volume;
        },
        setVolume: function(volume) {
            this.volume = volume;
            if (this.gainNode) {
                this.gainNode.gain.value = this.muted ? 0 : this.volume;
            }
        },
        mute: function() {
            this.muted = true;
            if (this.gainNode) {
                this.gainNode.gain.value = 0;
            }
        },
        unmute: function() {
            this.muted = false;
            if (this.gainNode) {
                this.gainNode.gain.value = this.volume;
            }
        }
    },
    //template: "<div><input ref='volumeControl' type='range' min='0' max='1' step='0.01'></div>"
    template: "<div class='volume-slider'><i class='fa fa-volume-down'></i><div class='slider'></div><i class='fa fa-volume-up'></i></div>"
};