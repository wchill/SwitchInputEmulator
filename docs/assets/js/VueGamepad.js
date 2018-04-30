new Vue({
    el: '#app',
    data: {
        connectionState: 'Not connected',
        turnState: 'Not your turn'
    },
    created () {
        let that = this;
        this.ws = new WebSocket('wss://api.chilly.codes/switch/ws');
        this.ws.addEventListener('open', function (e) {
            that.$data.connectionState = 'Connected';
        });
    }
});