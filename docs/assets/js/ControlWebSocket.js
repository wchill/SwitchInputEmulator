import {ConnectionState, StoreMutations} from "./Common"
import {WebSocketClient} from "./lib/WebSocketClient";

export const SocketBus = new Vue();
export const SocketEvents = Object.freeze({
    SEND_MESSAGE: 'send',
    QUEUE_MESSAGE: 'queue',
    PONG: 'pong'
});

// This really shouldn't be a Vue component, but I don't know how I want to structure this. This works for now though
export const ControlWs = {
    props: ['endpoint'],
    data: function() {
        return {
            ws: null,
            pendingPings: {},
            serverClockRequestTime: 0,
            queuedMessages: []
        };
    },
    created: function() {
        let self = this;

        this.ws = new WebSocketClient(this.endpoint, null, {
            backoff: 'fibonacci'
        });

        this.$store.commit(StoreMutations.CONNECTION_STATE, ConnectionState.CONNECTING);

        this.ws.addEventListener('open', function(e) {
            self.$store.commit(StoreMutations.CONNECTION_STATE, ConnectionState.CONNECTED);
            while (self.queuedMessages.length > 0) {
                let message = self.queuedMessages.shift();
                self.sendMessage(message);
            }
        });

        this.ws.addEventListener('close', function(e) {
            self.$store.commit(StoreMutations.CONNECTION_STATE, ConnectionState.NOT_CONNECTED);
        });

        this.ws.addEventListener('error', function(e) {
            self.$store.commit(StoreMutations.CONNECTION_STATE, ConnectionState.ERROR);
        });

        this.ws.addEventListener('reconnect', function(e) {
            if (self.ws.readyState === self.ws.CONNECTING) {
                self.$store.commit(StoreMutations.CONNECTION_STATE, ConnectionState.CONNECTING);
            }
        });

        this.ws.addEventListener('message', function(e) {
            const wsParseRegex = /(\w+)(?: (.*))?/;
            let match = wsParseRegex.exec(e.data);
            if (!match) {
                console.warn(`Got invalid message: ${e.data}`);
                return;
            }

            let command = match[1];
            let args = (match[2] || '').split(' ');

            if (command === 'PONG') {
                let time = performance.now();
                let serverTime = args[0];
                let id = args[1];
                if (self.pendingPings.hasOwnProperty(id)) {
                    let duration = (time - self.pendingPings[id]) / 2;
                    let actualServerTime = parseInt(serverTime);
                    let calculatedServerTime = performance.timing.navigationStart + self.pendingPings[id] + duration;
                    delete self.pendingPings[id];
                    self.$store.commit(StoreMutations.SERVER_CLOCK_SKEW, actualServerTime - calculatedServerTime);
                    SocketBus.$emit('pong', duration);
                }
            } else {
                SocketBus.$emit(command, args);
            }
        });

        SocketBus.$on(SocketEvents.SEND_MESSAGE, this.sendMessage);
        SocketBus.$on(SocketEvents.QUEUE_MESSAGE, this.queueMessage);
        setInterval(this.ping, 3000);
    },
    methods: {
        queueMessage: function(message) {
            if (this.ws && this.ws.readyState === this.ws.OPEN) {
                this.ws.send(message);
                return true;
            } else {
                console.log(`WebSocket not connected, so message was queued: ${message}`);
                this.queuedMessages.push(message);
            }
        },
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