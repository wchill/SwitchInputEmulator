import {ConnectionState} from "./Common"
import {WebSocketClient} from "./lib/WebSocketClient";

export const SocketBus = new Vue();
export const SocketEvents = Object.freeze({
    SEND_MESSAGE: 'send',
    PONG: 'pong'
});

// This really shouldn't be a Vue component, but I don't know how I want to structure this. This works for now though
export const ControlWs = {
    props: ['endpoint'],
    data: function() {
        return {
            ws: null,
            pendingPings: {}
        };
    },
    created: function() {
        let self = this;

        this.ws = new WebSocketClient(this.endpoint, null, {
            backoff: 'fibonacci'
        });

        this.$store.commit('setConnectionState', ConnectionState.CONNECTING);

        this.ws.addEventListener('open', function(e) {
            self.$store.commit('setConnectionState', ConnectionState.CONNECTED);
        });

        this.ws.addEventListener('close', function(e) {
            self.$store.commit('setConnectionState', ConnectionState.NOT_CONNECTED);
        });

        this.ws.addEventListener('error', function(e) {
            self.$store.commit('setConnectionState', ConnectionState.ERROR);
        });

        this.ws.addEventListener('reconnect', function(e) {
            self.$store.commit('setConnectionState', ConnectionState.CONNECTING);
        });

        this.ws.addEventListener('message', function(e) {
            const wsParseRegex = /(\w+)(?: (.*))?/;
            let match = wsParseRegex.exec(e.data);
            if (!match) {
                console.warn(`Got invalid message: ${e.data}`);
                return;
            }

            let command = match[1];
            let args = match[2];

            if (command === 'PONG') {
                if (self.pendingPings.hasOwnProperty(args)) {
                    let time = performance.now();
                    let duration = (time - self.pendingPings[args]) / 2;
                    delete self.pendingPings[args];
                    SocketBus.$emit('pong', duration);
                }
            } else {
                SocketBus.$emit(command, args);
            }
        });

        SocketBus.$on(SocketEvents.SEND_MESSAGE, this.sendMessage);
        setInterval(this.ping, 1000);
    },
    methods: {
        sendMessage: function(message) {
            if (this.ws && this.ws.readyState === this.ws.OPEN) {
                this.ws.send(message);
                return true;
            }
            console.warn('Failed to send message: ' + message);
            return false;
        },
        ping: function() {
            if (this.ws && this.ws.readyState === this.ws.OPEN) {
                let id = Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER));
                this.pendingPings[id] = performance.now();
                this.sendMessage(`PING ${id}`);
            }
        }
    },
    template: '<div></div>'
};