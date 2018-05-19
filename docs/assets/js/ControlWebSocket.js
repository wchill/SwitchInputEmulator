import {connectionStateEnum} from "./Common"

export const socketBus = new Vue();

// This really shouldn't be a Vue component, but I don't know how I want to structure this. This works for now though
export const controlWs = {
    props: ['endpoint'],
    data: function() {
        return {
            ws: null,
            pendingPings: {}
        };
    },
    created: function() {
        let self = this;

        this.ws = new WebSocket(this.endpoint, null, {
            backoff: 'fibonacci'
        });

        this.$store.commit('setConnectionState', connectionStateEnum.CONNECTING);

        this.ws.addEventListener('open', function(e) {
            console.log('Control websocket connected');
            self.$store.commit('setConnectionState', connectionStateEnum.CONNECTED);
        });

        this.ws.addEventListener('close', function(e) {
            console.log('Control websocket closed');
            self.$store.commit('setConnectionState', connectionStateEnum.NOT_CONNECTED);
        });

        this.ws.addEventListener('error', function(e) {
            console.log('Control websocket errored out');
            self.$store.commit('setConnectionState', connectionStateEnum.ERROR);
        });

        this.ws.addEventListener('reconnect', function(e) {
            console.log('Control websocket reconnecting');
            self.$store.commit('setConnectionState', connectionStateEnum.CONNECTING);
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
                    socketBus.$emit('pong', duration);
                }
            } else {
                socketBus.$emit(command, args);
            }
        });

        socketBus.$on('send', this.sendMessage);
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