import {StatusBus, store, BusEvents} from "./Common";
import {ControlModeSelect} from "./ControlModeSelect";
import {ControlWs} from "./ControlWebSocket";
import {ControllerRenderer, JoyconStreamRenderer} from "./ControllerRenderer";
import {TwitchAuth} from "./twitch-auth";
import {ServerStatus} from "./ServerStatus";
import * as Utils from "./Utils";

new Vue({
    el: '#app',
    store,
    components: {
        'control-ws': ControlWs,
        'controller-renderer': ControllerRenderer,
        'joycon-stream-renderer': JoyconStreamRenderer,
        'control-mode-select': ControlModeSelect,
        'twitch-auth': TwitchAuth,
        'server-status': ServerStatus
    },
    data: function() {
        return {
            controlEndpoint: 'wss://api.twitchplays.gg/switch/ws',
            streamEndpoint: 'wss://api.twitchplays.gg/switch/stream'
        };
    },
    mounted: function() {
        let browser = Utils.detectBrowser();
        let os = Utils.detectOS();

        console.log(`Running on ${os}/${browser}`);

        this.$nextTick(function() {
            requestAnimationFrame(this.update);
        });
    },
    methods: {
        update: function() {
            // Give input sources a chance to perform operations before actually updating
            StatusBus.$emit(BusEvents.BEFORE_UPDATE_INPUT);
            StatusBus.$emit(BusEvents.UPDATE_INPUT);

            requestAnimationFrame(this.update);
        }
    }
});
