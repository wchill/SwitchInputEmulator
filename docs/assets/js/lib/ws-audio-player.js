//    WebSockets Audio API
//
//    Opus Quality Settings
//    =====================
//    App: 2048=voip, 2049=audio, 2051=low-delay
//    Sample Rate: 8000, 12000, 16000, 24000, or 48000
//    Frame Duration: 2.5, 5, 10, 20, 40, 60
//    Buffer Size = sample rate/6000 * 1024

(function(global) {
    const defaultConfig = {
        codec: {
            sampleRate: 24000,
            channels: 1,
            app: 2051,
            frameDuration: 20,
            bufferSize: 4096
        },
        server: {
            host: window.location.hostname,
            port: 5000
        }
    };

    const WSAudioAPI = global.WSAudioAPI = {
        Player: function(config, socket) {
            config = config || {};
            this.config = {};
            this.config.codec = config.codec || defaultConfig.codec;
            this.config.server = config.server || defaultConfig.server;
            this.sampler = new Resampler(this.config.codec.sampleRate, 44100, 1, this.config.codec.bufferSize);
            this.parentSocket = socket;
            this.decoder = new OpusDecoder(this.config.codec.sampleRate, this.config.codec.channels);
            this.silence = new Float32Array(this.config.codec.bufferSize);
        }
    };

    WSAudioAPI.Player.prototype.start = function() {
        const self = this;

        this.audioQueue = {
            buffer: new Float32Array(0),

            write: function(newAudio) {
                var currentQLength = this.buffer.length;
                newAudio = self.sampler.resampler(newAudio);
                var newBuffer = new Float32Array(currentQLength + newAudio.length);
                newBuffer.set(this.buffer, 0);
                newBuffer.set(newAudio, currentQLength);
                this.buffer = newBuffer;
            },

            read: function(nSamples) {
                var samplesToPlay = this.buffer.subarray(0, nSamples);
                this.buffer = this.buffer.subarray(nSamples, this.buffer.length);
                return samplesToPlay;
            },

            length: function() {
                return this.buffer.length;
            }
        };
        var audioContext = new(window.AudioContext || window.webkitAudioContext)();

        this.scriptNode = audioContext.createScriptProcessor(this.config.codec.bufferSize, 1, 1);
        this.scriptNode.onaudioprocess = function(e) {
            if (self.audioQueue.length()) {
                e.outputBuffer.getChannelData(0).set(self.audioQueue.read(self.config.codec.bufferSize));
            } else {
                e.outputBuffer.getChannelData(0).set(self.silence);
            }
        };
        this.gainNode = audioContext.createGain();
        this.scriptNode.connect(this.gainNode);
        this.gainNode.connect(audioContext.destination);

        if (!this.parentSocket) {
            this.socket = new WebSocket('wss://' + this.config.server.host + ':' + this.config.server.port);
        } else {
            this.socket = this.parentSocket;
        }
        //this.socket.onopen = function () {
        //    console.log('Connected to server ' + self.config.server.host + ' as listener');
        //};
        var _onmessage = this.parentOnmessage = this.socket.onmessage;
        this.socket.onmessage = function(message) {
            if (_onmessage) {
                _onmessage(message);
            }
            if (message.data instanceof Blob) {
                var reader = new FileReader();
                reader.onload = function() {
                    self.audioQueue.write(self.decoder.decode_float(reader.result));
                };
                reader.readAsArrayBuffer(message.data);
            }
        };
    };

    WSAudioAPI.Player.prototype.getVolume = function() {
        return this.gainNode ? this.gainNode.gain.value : 'Stream not started yet';
    };

    WSAudioAPI.Player.prototype.setVolume = function(value) {
        if (this.gainNode) this.gainNode.gain.value = value;
    };

    WSAudioAPI.Player.prototype.stop = function() {
        this.audioQueue = null;
        this.scriptNode.disconnect();
        this.scriptNode = null;
        this.gainNode.disconnect();
        this.gainNode = null;

        if (!this.parentSocket) {
            this.socket.close();
        } else {
            this.socket.onmessage = this.parentOnmessage;
        }
    };
})(window);