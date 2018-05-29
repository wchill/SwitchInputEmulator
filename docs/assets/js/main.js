import {StatusBus, store, BusEvents} from "./Common";
import {ControlModeSelect} from "./ControlModeSelect";
import {ControlWs} from "./ControlWebSocket";
import {ControllerRenderer} from "./ControllerRenderer";
import {JoyconStreamRenderer} from "./JoyconStreamRenderer";
import {JoyconStreamRendererWebRTC} from "./JoyconStreamRendererWebRTC";
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
        'joycon-stream-renderer-webrtc': JoyconStreamRendererWebRTC,
        'control-mode-select': ControlModeSelect,
        'twitch-auth': TwitchAuth,
        'server-status': ServerStatus
    },
    data: function() {
        return {
            controlEndpoint: 'wss://api.twitchplays.gg/switch/ws',
            streamEndpoint: 'wss://api.twitchplays.gg/switch/stream',
            webRtcEndpoint: 'wss://webrtc.twitchplays.gg/one2many',
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

            StatusBus.$emit(BusEvents.RENDER_TIME_START);
            // Give input sources a chance to perform operations before actually updating
            StatusBus.$emit(BusEvents.BEFORE_UPDATE_INPUT);
            StatusBus.$emit(BusEvents.UPDATE_INPUT);

            requestAnimationFrame(this.update);
            StatusBus.$emit(BusEvents.RENDER_TIME_END);
        }
    }
});
