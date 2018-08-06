<template>

</template>

<script>
  import Vue from 'vue';
  import { ConnectionState, StoreMutations } from '../mixins/Common';
  import WebSocketClient from '../utils/WebSocketClient';

  export const SocketBus = new Vue();
  export const SocketEvents = Object.freeze({
    SEND_MESSAGE: 'send',
    QUEUE_MESSAGE: 'queue',
    PONG: 'pong',
  });

  export default {
    props: ['endpoint'],
    data() {
      return {
        ws: null,
        pendingPings: {},
        serverClockRequestTime: 0,
        queuedMessages: [],
      };
    },
    created() {
      const self = this;

      this.ws = new WebSocketClient(this.endpoint, null, {
        backoff: 'fibonacci',
      });

      this.$store.commit(StoreMutations.CONNECTION_STATE, ConnectionState.CONNECTING);

      this.ws.addEventListener('open', () => {
        self.$store.commit(StoreMutations.CONNECTION_STATE, ConnectionState.CONNECTED);
        while (self.queuedMessages.length > 0) {
          const message = self.queuedMessages.shift();
          self.sendMessage(message);
        }
      });

      this.ws.addEventListener('close', () => {
        self.$store.commit(StoreMutations.CONNECTION_STATE, ConnectionState.NOT_CONNECTED);
      });

      this.ws.addEventListener('error', () => {
        self.$store.commit(StoreMutations.CONNECTION_STATE, ConnectionState.ERROR);
      });

      this.ws.addEventListener('reconnect', () => {
        if (self.ws.readyState === self.ws.CONNECTING) {
          self.$store.commit(StoreMutations.CONNECTION_STATE, ConnectionState.CONNECTING);
        }
      });

      this.ws.addEventListener('message', (e) => {
        const wsParseRegex = /(\w+)(?: (.*))?/;
        const match = wsParseRegex.exec(e.data);
        if (!match) {
          // console.warn(`Got invalid message: ${e.data}`);
          return;
        }

        const command = match[1];
        const args = (match[2] || '').split(' ');

        if (command === 'PONG') {
          const time = performance.now();
          const serverTime = args[0];
          const id = args[1];
          if (Object.prototype.hasOwnProperty.call(self.pendingPings, id)) {
            const duration = (time - self.pendingPings[id]) / 2;
            const actualServerTime = parseInt(serverTime, 10);
            const calculatedServerTime = performance.timeOrigin + self.pendingPings[id] + duration;
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
      queueMessage(message) {
        console.log('Message queued: ' + message);
        if (this.ws && this.ws.readyState === this.ws.OPEN) {
          this.ws.send(message);
        } else {
          // console.log(`WebSocket not connected, so message was queued: ${message}`);
          this.queuedMessages.push(message);
        }
      },
      sendMessage(message) {
        if (this.ws && this.ws.readyState === this.ws.OPEN) {
          this.ws.send(message);
          return true;
        }
        // console.warn(`Failed to send message: ${message}`);
        return false;
      },
      ping() {
        if (this.ws && this.ws.readyState === this.ws.OPEN) {
          const id = Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER));
          this.pendingPings[id] = performance.now();
          this.sendMessage(`PING ${id}`);
        }
      },
    },
    name: 'ControlWebSocket',
  };
</script>

<style scoped>

</style>
