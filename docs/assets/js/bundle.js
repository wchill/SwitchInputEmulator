(function () {
    'use strict';

    const ConnectionState = Object.freeze({
        NOT_CONNECTED: 1,
        CONNECTED: 2,
        ERROR: 3,
        CONNECTING: 4
    });

    const PlayerState = Object.freeze({
        NOT_CONNECTED: 1,
        ERROR: 2,
        CONNECTING: 3,
        PLAYING: 4,
        PAUSED: 5
    });

    const ControlState = Object.freeze({
        NO_CONTROLLER: 1,
        UNSUPPORTED_CONTROLLER: 2,
        INACTIVE: 3,
        WAITING: 4,
        ACTIVE: 5
    });

    const ControlMode = Object.freeze({
        SINGLE_CONTROLLER: 1,
        MULTIPLE_CONTROLLERS: 2,
        KEYBOARD: 3,
        TOUCH: 4
    });

    const SwitchButtons = Object.freeze({
        Y: 1,
        B: 2,
        A: 4,
        X: 8,
        L: 16,
        R: 32,
        ZL: 64,
        ZR: 128,
        MINUS: 256,
        PLUS: 512,
        L3: 1024,
        R3: 2048,
        HOME: 4096,
        SHARE: 8192,
        DPAD_UP: 0,
        DPAD_UPRIGHT: 1,
        DPAD_RIGHT: 2,
        DPAD_DOWNRIGHT: 3,
        DPAD_DOWN: 4,
        DPAD_DOWNLEFT: 5,
        DPAD_LEFT: 6,
        DPAD_UPLEFT: 7,
        DPAD_NONE: 8
    });

    const BusEvents = Object.freeze({
        RENDER_TIME_START: 'start-render',
        RENDER_TIME_END: 'finish-render',
        UPDATE_INPUT: 'update-input',
        INPUT_CHANGED: 'input-changed',
        SEND_MESSAGE: 'send'
    });

    const StatusBus = new Vue();

    function enumToName(sourceEnum, val) {
        let keys = Object.keys(sourceEnum);
        for (let i = 0; i < keys.length; i++) {
            if (sourceEnum[keys[i]] === val) return keys[i];
        }
        return val;
    }

    const store = new Vuex.Store({
        state: {
            connectionState: ConnectionState.NOT_CONNECTED,
            controlState: ControlState.NO_CONTROLLER,
            controlMode: ControlMode.SINGLE_CONTROLLER,
            playerState: PlayerState.NOT_CONNECTED,
            gamepadState: {
                buttons: {
                    faceDown: false,
                        faceRight: false,
                        faceLeft: false,
                        faceUp: false,
                        leftTop: false,
                        rightTop: false,
                        leftTrigger: false,
                        rightTrigger: false,
                        select: false,
                        start: false,
                        leftStick: false,
                        rightStick: false,
                        home: false,
                        share: false,
                        dpadUp: false,
                        dpadDown: false,
                        dpadLeft: false,
                        dpadRight: false
                },
                sticks: {
                    leftStick: {
                        x: 0.0,
                            y: 0.0,
                            pressed: false
                    },
                    rightStick: {
                        x: 0.0,
                            y: 0.0,
                            pressed: false
                    }
                }
            },
        },
        mutations: {
            setConnectionState: function(state, newState) {
                console.log(`Changing connection state from ${enumToName(ConnectionState, state.connectionState)} to ${enumToName(ConnectionState, newState)}`);
                state.connectionState = newState;
            },
            setControlState: function(state, newState) {
                console.log(`Changing control state from ${enumToName(ControlState, state.controlState)} to ${enumToName(ControlState, newState)}`);
                state.controlState = newState;
            },
            setControlMode: function(state, newMode) {
                console.log(`Changing control mode from ${enumToName(ControlMode, state.controlMode)} to ${enumToName(ControlMode, newMode)}`);
                state.controlMode = newMode;
            },
            setPlayerState: function(state, newState) {
                console.log(`Changing player state from ${enumToName(PlayerState, state.playerState)} to ${enumToName(PlayerState, newState)}`);
                state.playerState = newState;
            },
            setGamepadState: function(state, newState) {
                if (newState) {
                    state.gamepadState = newState;
                }
            }
        }
    });

    Vue.mixin({
        delimiters: ['((', '))']
    });

    const InputSource = {
        data: function() {
            return {
                buttonValues: {
                    faceDown: SwitchButtons.B,
                    faceRight: SwitchButtons.A,
                    faceLeft: SwitchButtons.Y,
                    faceUp: SwitchButtons.X,
                    leftTop: SwitchButtons.L,
                    rightTop: SwitchButtons.R,
                    leftTrigger: SwitchButtons.ZL,
                    rightTrigger: SwitchButtons.ZR,
                    select: SwitchButtons.MINUS,
                    start: SwitchButtons.PLUS,
                    leftStick: SwitchButtons.L3,
                    rightStick: SwitchButtons.R3,
                    home: 0,
                    share: 0
                },
                dpadValues: {
                    'dpadUp dpadRight': SwitchButtons.DPAD_UPRIGHT,
                    'dpadDown dpadRight': SwitchButtons.DPAD_DOWNRIGHT,
                    'dpadDown dpadLeft': SwitchButtons.DPAD_DOWNLEFT,
                    'dpadUp dpadLeft': SwitchButtons.DPAD_UPLEFT,
                    'dpadUp': SwitchButtons.DPAD_UP,
                    'dpadRight': SwitchButtons.DPAD_RIGHT,
                    'dpadDown': SwitchButtons.DPAD_DOWN,
                    'dpadLeft': SwitchButtons.DPAD_LEFT
                },
                deadzone: 0.15,
                gamepadState: {
                    buttons: {
                        faceDown: false,
                        faceRight: false,
                        faceLeft: false,
                        faceUp: false,
                        leftTop: false,
                        rightTop: false,
                        leftTrigger: false,
                        rightTrigger: false,
                        select: false,
                        start: false,
                        leftStick: false,
                        rightStick: false,
                        home: false,
                        share: false,
                        dpadUp: false,
                        dpadDown: false,
                        dpadLeft: false,
                        dpadRight: false
                    },
                    sticks: {
                        leftStick: {
                            x: 0.0,
                            y: 0.0,
                            pressed: false
                        },
                        rightStick: {
                            x: 0.0,
                            y: 0.0,
                            pressed: false
                        }
                    }
                },
                prevState: {
                    buttons: {
                        faceDown: false,
                        faceRight: false,
                        faceLeft: false,
                        faceUp: false,
                        leftTop: false,
                        rightTop: false,
                        leftTrigger: false,
                        rightTrigger: false,
                        select: false,
                        start: false,
                        leftStick: false,
                        rightStick: false,
                        home: false,
                        share: false
                    },
                    sticks: {
                        leftStick: {
                            x: 0.0,
                            y: 0.0,
                            pressed: false
                        },
                        rightStick: {
                            x: 0.0,
                            y: 0.0,
                            pressed: false
                        }
                    }
                }
            };
        },
        mounted: function() {
            StatusBus.$on(BusEvents.UPDATE_INPUT, this.updateState);
        },
        methods: {
            compareState: function() {
                // Returns true on change
                let buttons = Object.keys(this.gamepadState.buttons);
                for (let i = 0; i < buttons.length; i++) {
                    let button = buttons[i];
                    if (this.gamepadState.buttons[button] !== this.prevState.buttons[button]) return true;
                }

                let sticks = Object.keys(this.gamepadState.sticks);
                for (let i = 0; i < sticks.length; i++) {
                    let stick = sticks[i];
                    if (this.gamepadState.sticks[stick].x !== this.prevState.sticks[stick].x) return true;
                    if (this.gamepadState.sticks[stick].y !== this.prevState.sticks[stick].y) return true;
                    if (this.gamepadState.sticks[stick].pressed !== this.prevState.sticks[stick].pressed) return true;
                }

                return false;
            },
            updateState: function() {
                let buttons = Object.keys(this.gamepadState.buttons);
                let sticks = Object.keys(this.gamepadState.sticks);

                this.prevState = this.gamepadState;
                this.gamepadState = {
                    buttons: {},
                    sticks: {}
                };

                for (let i = 0; i < buttons.length; i++) {
                    let button = buttons[i];
                    this.gamepadState.buttons[button] = this.isButtonPressed(button);
                }

                for (let i = 0; i < sticks.length; i++) {
                    let stick = sticks[i];
                    this.gamepadState.sticks[stick] = {
                        x: this.getStickX(stick),
                        y: this.getStickY(stick),
                        pressed: this.isButtonPressed(stick)
                    };
                }

                if (this.compareState()) {
                    StatusBus.$emit(BusEvents.INPUT_CHANGED, {
                        state: this.gamepadState,
                        stateStr: this.generateStateStr()
                    });
                    this.$store.commit('setGamepadState', this.gamepadState);
                }
            },
            isButtonPressed: function(name) {
                // Should be overridden
                console.warn(`Tried calling default isButtonPressed!`);
                return false;
            },
            getStickX: function(stick) {
                // Should be overridden
                console.warn(`Tried calling default getStickX!`);
                return 0.0;
            },
            getStickY: function(stick) {
                // Should be overridden
                console.warn(`Tried calling default getStickY!`);
                return 0.0;
            },
            generateStateStr: function() {
                let button = this.calculateButton();
                let dpad = this.calculateDpad();
                let ls = this.calculateStick('leftStick');
                let rs = this.calculateStick('rightStick');
                return `${button} ${dpad} ${ls[0]} ${ls[1]} ${rs[0]} ${rs[1]}`;
            },
            calculateStick: function(stick) {
                // Applies dead zone calculations and then maps the range [-1.0, 1.0] to [0, 255]
                // Reference: http://www.third-helix.com/2013/04/12/doing-thumbstick-dead-zones-right.html

                let x = this.getStickX(stick);
                let y = this.getStickY(stick);

                let res = [128, 128];
                let mag = Math.sqrt((x * x) + (y * y));
                if (mag >= this.deadzone) {
                    if (mag === 0) mag = 1;
                    let normX = Math.abs(x / mag);
                    let normY = Math.abs(y / mag);
                    let outX = normX * ((x - this.deadzone) / (1 - this.deadzone));
                    let outY = normY * ((y - this.deadzone) / (1 - this.deadzone));

                    res[0] += outX * 128;
                    if (res[0] < 0) res[0] = 0;
                    else if (res[0] > 255) res[0] = 255;
                    res[0] |= 0;

                    res[1] += outY * 128;
                    if (res[1] < 0) res[1] = 0;
                    else if (res[1] > 255) res[1] = 255;
                    res[1] |= 0;
                }

                return res;
            },
            calculateDpad: function() {
                let accumulator = '';
                let dpadButtons = ['dpadUp', 'dpadDown', 'dpadLeft', 'dpadRight'];
                for (let i = 0; i < dpadButtons.length; i++) {
                    if (this.isButtonPressed(dpadButtons[i])) {
                        accumulator += dpadButtons[i];
                    }
                }

                return this.dpadValues[accumulator] || SwitchButtons.DPAD_NONE;
            },
            calculateButton: function() {
                let that = this;
                return Object.keys(this.buttonValues).reduce(function (accumulator, button) {
                    if (that.isButtonPressed(button)) {
                        accumulator += that.buttonValues[button];
                    }
                    return accumulator;
                }, 0);
            },
        }
    };

    const ControlModeSelect = {
        data: function() {
            return {
                selectedMode: ControlMode.SINGLE_CONTROLLER,
                enabledModes: [
                    ControlMode.SINGLE_CONTROLLER,
                    ControlMode.MULTIPLE_CONTROLLERS
                ]
            }
        },
        watch: {
            selectedMode: function() {
                this.$store.commit('setControlMode', parseInt(this.selectedMode));
            }
        },
        methods: {
            getModeText: function(mode){
                if (mode === ControlMode.SINGLE_CONTROLLER) {
                    return 'Controller';
                } else if (mode === ControlMode.MULTIPLE_CONTROLLERS) {
                    return 'Joycons';
                } else if (mode === ControlMode.TOUCH) {
                    return 'Touch controls';
                }

                return 'Keyboard';
            }
        },
        template: '<select v-model="selectedMode">'+
        '<option v-for="mode in enabledModes" v-bind:value="mode">Use (( getModeText(mode) ))</option>' +
        '</select>'
    };

    const backoff = {
        exponential (attempt, delay) {
            return Math.floor(Math.random() * Math.pow(2, attempt) * delay);
        },

        fibonacci (attempt, delay) {
            let current = 1;

            return Math.floor(Math.random() * current * delay);
        }
    };

    function Backoff (func, options) {
        this.func = func;
        this.attempts = 0;
        this.delay = (typeof(options.initialDelay) !== "undefined")
            ? options.initialDelay
            : 100;
    }

    Backoff.prototype.backoff = function () {
        setTimeout(this.onReady, this.func(++this.attempts, this.delay));
    };

    function createBackoff(type, options) {
        return new Backoff(backoff[type], options);
    }

    class WebSocketClient {

        /**
         * @param url DOMString The URL to which to connect; this should be the URL to which the WebSocket server will respond.
         * @param protocols DOMString|DOMString[] Either a single protocol string or an array of protocol strings. These strings are used to indicate sub-protocols, so that a single server can implement multiple WebSocket sub-protocols (for example, you might want one server to be able to handle different types of interactions depending on the specified protocol). If you don't specify a protocol string, an empty string is assumed.
         */
        constructor (url, protocols, options = {}) {
            this.url = url;
            this.protocols = protocols;

            this.reconnectEnabled = true;
            this.listeners = {};

            this.backoff = createBackoff(options.backoff || 'fibonacci', options);
            this.backoff.onReady = this.onBackoffReady.bind(this);

            this.open();
        }

        open (reconnect = false) {
            this.isReconnect = reconnect;

            // keep binaryType used on previous WebSocket connection
            let binaryType = this.ws && this.ws.binaryType;

            this.ws = new WebSocket(this.url, this.protocols);
            this.ws.onclose = this.onCloseCallback.bind(this);
            this.ws.onerror = this.onErrorCallback.bind(this);
            this.ws.onmessage = this.onMessageCallback.bind(this);
            this.ws.onopen = this.onOpenCallback.bind(this);

            if (binaryType) {
                this.ws.binaryType = binaryType;
            }
        }

        /**
         * @ignore
         */
        onBackoffReady (number, delay) {
            // console.log("onBackoffReady", number + ' ' + delay + 'ms');
            this.open(true);
        }

        /**
         * @ignore
         */
        onCloseCallback (e) {
            if (!this.isReconnect && this.listeners['onclose']) {
                this.listeners['onclose'].apply(null, arguments);
            }
            if (this.reconnectEnabled && e.code < 3000) {
                this.backoff.backoff();
            }
        }

        /**
         * @ignore
         */
        onErrorCallback () {
            if (this.listeners['onerror']) {
                this.listeners['onerror'].apply(null, arguments);
            }
        }

        /**
         * @ignore
         */
        onMessageCallback () {
            if (this.listeners['onmessage']) {
                this.listeners['onmessage'].apply(null, arguments);
            }
        }

        /**
         * @ignore
         */
        onOpenCallback () {
            if (this.listeners['onopen']) {
                this.listeners['onopen'].apply(null, arguments);
            }

            if (this.isReconnect && this.listeners['onreconnect']) {
                this.listeners['onreconnect'].apply(null, arguments);
            }

            this.isReconnect = false;
        }

        /**
         * The number of bytes of data that have been queued using calls to send()
         * but not yet transmitted to the network. This value does not reset to zero
         * when the connection is closed; if you keep calling send(), this will
         * continue to climb.
         *
         * @type unsigned long
         * @readonly
         */
        get bufferedAmount () { return this.ws.bufferedAmount; }

        /**
         * The current state of the connection; this is one of the Ready state constants.
         * @type unsigned short
         * @readonly
         */
        get readyState () { return this.ws.readyState; }

        /**
         * A string indicating the type of binary data being transmitted by the
         * connection. This should be either "blob" if DOM Blob objects are being
         * used or "arraybuffer" if ArrayBuffer objects are being used.
         * @type DOMString
         */
        get binaryType () { return this.ws.binaryType; }
        set binaryType (binaryType) { this.ws.binaryType = binaryType; }

        /**
         * The extensions selected by the server. This is currently only the empty
         * string or a list of extensions as negotiated by the connection.
         * @type DOMString
         */
        get extensions () { return this.ws.extensions; }
        set extensions (extensions) { this.ws.extensions = extensions; }

        /**
         * A string indicating the name of the sub-protocol the server selected;
         * this will be one of the strings specified in the protocols parameter when
         * creating the WebSocket object.
         * @type DOMString
         */
        get protocol () { return this.ws.protocol; }
        set protocol (protocol) { this.ws.protocol = protocol; }

        /**
         * Closes the WebSocket connection or connection attempt, if any. If the
         * connection is already CLOSED, this method does nothing.
         *
         * @param code A numeric value indicating the status code explaining why the connection is being closed. If this parameter is not specified, a default value of 1000 (indicating a normal "transaction complete" closure) is assumed. See the list of status codes on the CloseEvent page for permitted values.
         * @param reason A human-readable string explaining why the connection is closing. This string must be no longer than 123 bytes of UTF-8 text (not characters).
         *
         * @return void
         */
        close (code, reason) {
            if (typeof code == 'undefined') { code = 1000; }

            this.reconnectEnabled = false;

            this.ws.close(code, reason);
        }

        /**
         * Transmits data to the server over the WebSocket connection.
         * @param data DOMString|ArrayBuffer|Blob
         * @return void
         */
        send (data) { this.ws.send(data); }

        /**
         * Add an event listener to this WebSocket (this function for backwards compatibiility).
         * @param event The name of the event.
         * @param listener EventListener
         * @return void
         */

        addEventListener (event, listener) {
            if (event === 'open') this.onopen = listener;
            else if (event === 'close') this.onclose = listener;
            else if (event === 'error') this.onerror = listener;
            else if (event === 'message') this.onmessage = listener;
            else if (event === 'reconnect') this.onreconnect = listener;
            else {
                console.warn(`Tried to add an event handler for an event that doesn't exist: ${event}`);
            }
        }

        /**
         * An event listener to be called when the WebSocket connection's readyState changes to CLOSED. The listener receives a CloseEvent named "close".
         * @param listener EventListener
         */
        set onclose (listener) { this.listeners['onclose'] = listener; }
        get onclose () { return this.listeners['onclose']; }

        /**
         * An event listener to be called when an error occurs. This is a simple event named "error".
         * @param listener EventListener
         */
        set onerror (listener) { this.listeners['onerror'] = listener; }
        get onerror () { return this.listeners['onerror']; }

        /**
         * An event listener to be called when a message is received from the server. The listener receives a MessageEvent named "message".
         * @param listener EventListener
         */
        set onmessage (listener) { this.listeners['onmessage'] = listener; }
        get onmessage () { return this.listeners['onmessage']; }

        /**
         * An event listener to be called when the WebSocket connection's readyState changes to OPEN; this indicates that the connection is ready to send and receive data. The event is a simple one with the name "open".
         * @param listener EventListener
         */
        set onopen (listener) { this.listeners['onopen'] = listener; }
        get onopen () { return this.listeners['onopen']; }

        /**
         * @param listener EventListener
         */
        set onreconnect (listener) { this.listeners['onreconnect'] = listener; }
        get onreconnect () { return this.listeners['onreconnect']; }
    }

    /**
     * The connection is not yet open.
     */
    WebSocketClient.prototype.CONNECTING = WebSocket.CONNECTING;

    /**
     * The connection is open and ready to communicate.
     */
    WebSocketClient.prototype.OPEN = WebSocket.OPEN;

    /**
     * The connection is in the process of closing.
     */
    WebSocketClient.prototype.CLOSING = WebSocket.CLOSING;

    /**
     * The connection is closed or couldn't be opened.
     */
    WebSocketClient.prototype.CLOSED = WebSocket.CLOSED;

    const SocketBus = new Vue();
    const SocketEvents = Object.freeze({
        SEND_MESSAGE: 'send',
        PONG: 'pong'
    });

    // This really shouldn't be a Vue component, but I don't know how I want to structure this. This works for now though
    const ControlWs = {
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

    const PlayerBus = new Vue();
    const PlayerEvents = Object.freeze({
        PLAY: 'play',
        PAUSE: 'pause',
        READY: 'ready'
    });

    const H264Player = {
        props: ['endpoint', 'canvas'],
        data: function() {
            return {
                player: null,
                ws: null
            };
        },
        computed: {
            internalCanvas: function() {
                if (this.canvas) return this.canvas;
                return this.$refs.playercanvas;
            },
            displayPlayer: function() {
                return !this.canvas;
            }
        },
        mounted: function() {
            let self = this;

            document.addEventListener('visibilitychange', function(e) {
                if (self.player) {
                    if (document.visibilityState ==='visible') {
                        console.log('Resuming stream because page received focus');
                        self.player.playStream();
                        self.$store.commit('setPlayerState', PlayerState.PLAYING);
                    } else {
                        console.log('Pausing stream because page lost focus');
                        self.player.stopStream();
                        self.$store.commit('setPlayerState', PlayerState.PAUSED);
                    }
                }
            }, false);

            this.ws = new WebSocketClient(this.endpoint, null, {
                backoff: 'fibonacci'
            });

            this.$store.commit('setPlayerState', PlayerState.CONNECTING);

            this.ws.addEventListener('open', function(e) {
                self.$store.commit('setPlayerState', PlayerState.PLAYING);
            });

            this.ws.addEventListener('close', function(e) {
                self.$store.commit('setPlayerState', PlayerState.NOT_CONNECTED);
            });

            this.ws.addEventListener('error', function(e) {
                self.$store.commit('setPlayerState', PlayerState.ERROR);
            });

            this.ws.addEventListener('reconnect', function(e) {
                self.$store.commit('setPlayerState', PlayerState.CONNECTING);
            });

            this.player = new WSAvcPlayer(this.internalCanvas, "webgl", 1, 35);
            this.player.on('canvasReady', function(w, h){
                console.log('Player canvas is ready');
                PlayerBus.$emit(PlayerEvents.READY, {
                    width: w,
                    height: h
                });
            });
            this.player.connect(this.ws);
        },
        template: "<canvas ref='playercanvas' v-show='this.displayPlayer'></canvas>"
    };

    const ProControllerSprites = {
        data: function() {
            return {
                spriteSheetUrl: 'assets/images/proControllerSpritesheet.png',
                buttonSprites: {faceRight:{x:838,y:178,w:78,h:79,inactive:{x:5,y:5},active:{x:93,y:5}},faceDown:{x:757,y:249,w:78,h:79,inactive:{x:181,y:5},active:{x:269,y:5}},faceUp:{x:757,y:107,w:78,h:79,inactive:{x:873,y:5},active:{x:961,y:5}},faceLeft:{x:675,y:178,w:78,h:79,inactive:{x:873,y:94},active:{x:961,y:94}},leftTop:{x:114,y:0,w:248,h:85,inactive:{x:357,y:5},active:{x:615,y:5}},rightTop:{x:679,y:0,w:248,h:85,inactive:{x:5,y:100},active:{x:263,y:100}},leftTrigger:{x:300,y:533,w:150,h:150,inactive:{x:521,y:183},active:{x:681,y:183}},rightTrigger:{x:590,y:533,w:150,h:150,inactive:{x:841,y:183},active:{x:5,y:343}},select:{x:370,y:117,w:44,h:44,inactive:{x:225,y:269},active:{x:279,y:269}},start:{x:627,y:117,w:44,h:44,inactive:{x:333,y:269},active:{x:387,y:269}},share:{x:427,y:198,w:39,h:39,inactive:{x:113,y:269},active:{x:440,y:269}},home:{x:572,y:196,w:44,h:44,inactive:{x:5,y:269},active:{x:59,y:269}},dpadUp:{x:335,y:285,w:50,h:76,inactive:{x:1001,y:269},active:{x:165,y:355},opacity:!0},dpadDown:{x:335,y:361,w:50,h:76,inactive:{x:1001,y:183},active:{x:165,y:269},opacity:!0},dpadLeft:{x:284,y:336,w:75,h:50,inactive:{x:225,y:343},active:{x:310,y:343},opacity:!0},dpadRight:{x:360,y:336,w:76,h:51,inactive:{x:395,y:343},active:{x:481,y:343},opacity:!0}},
                stickSprites: {leftStick:{x:174,y:155,w:120,h:120,travel:40,inactive:{x:5,y:738},active:{x:135,y:738}},rightStick:{x:598,y:299,w:120,h:120,travel:40,inactive:{x:5,y:738},active:{x:135,y:738}}},
                canvasSize: {
                    x: 1061,
                    y: 5,
                    width: 1040,
                    height: 723,
                    scale: 0.75
                }
            };
        }
    };

    const JoyconSprites = {
        data: function() {
            return {
                spriteSheetUrl: 'assets/images/joyconSpritesheet2.png',
                buttonSprites: {faceRight:{controller:'right',x:154,y:179,w:58,h:58,inactive:{x:5,y:5},active:{x:73,y:5}},faceDown:{controller:'right',x:92,y:238,w:58,h:58,inactive:{x:141,y:5},active:{x:209,y:5}},faceUp:{controller:'right',x:92,y:120,w:58,h:58,inactive:{x:709,y:5},active:{x:777,y:5}},faceLeft:{controller:'right',x:31,y:179,w:58,h:58,inactive:{x:709,y:73},active:{x:777,y:73}},leftTop:{controller:'left',x:7,y:1,w:206,h:110,inactive:{x:277,y:5},active:{x:493,y:5}},rightTop:{controller:'right',x:47,y:1,w:207,h:110,inactive:{x:5,y:125},active:{x:222,y:125}},leftTrigger:{controller:'left',x:79,y:10,w:150,h:150,scale:0.75,inactive:{x:439,y:141},active:{x:599,y:141}},rightTrigger:{controller:'right',x:61,y:10,w:150,h:150,scale:0.75,inactive:{x:5,y:301},active:{x:165,y:301}},select:{controller:'left',x:196,y:80,w:42,h:14,inactive:{x:845,y:5},active:{x:845,y:29}},start:{controller:'right',x:21,y:65,w:44,h:44,inactive:{x:845,y:53},active:{x:827,y:282}},share:{controller:'left',x:157,y:550,w:49,h:49,inactive:{x:529,y:336},active:{x:588,y:336}},home:{controller:'right',x:47,y:543,w:63,h:63,inactive:{x:759,y:209},active:{x:832,y:209}},dpadUp:{controller:'left',x:110,y:339,w:58,h:58,inactive:{x:647,y:336},active:{x:827,y:336}},dpadDown:{controller:'left',x:110,y:456,w:58,h:58,inactive:{x:759,y:141},active:{x:827,y:141}},dpadLeft:{controller:'left',x:48,y:398,w:58,h:58,inactive:{x:325,y:282},active:{x:759,y:282}},dpadRight:{controller:'left',x:171,y:398,w:58,h:58,inactive:{x:393,y:336},active:{x:461,y:336}}},
                stickSprites: {leftStick:{controller:'left',x:79,y:148,w:120,h:120,travel:25,inactive:{x:5,y:813},active:{x:135,y:813}},rightStick:{controller:'right',x:61,y:367,w:120,h:120,travel:25,inactive:{x:535,y:813},active:{x:665,y:813}}},
                controllers: {
                    left: {
                        x: 905,
                        y: 5
                    },
                    right: {
                        x: 265,
                        y: 813
                    },
                    w: 260,
                    h: 798
                },
                console: {
                    body: {
                        x: 792,
                        y: 816,
                        w: 1349,
                        h: 792
                    },
                    screen: {
                        x: 922,
                        y: 908,
                        w: 1088,
                        h: 612
                    }
                }
            };
        }
    };

    const ControllerRenderer = {
        mixins: [ProControllerSprites],
        data: function() {
            return {
                spriteSheetReady: false
            };
        },
        methods: {
            setStylesheet: function(stylesheet) {
                this.spriteSheetReady = false;
                this.buttonSprites = stylesheet.buttonSprites;
                this.stickSprites = stylesheet.stickSprites;
                this.canvasSize = stylesheet.canvasSize;
                this.spriteSheetUrl = stylesheet.spriteSheetUrl;
            },
            renderImage: function(newState) {
                if (!this.spriteSheetReady) return;

                let that = this;
                let canvas = this.$refs.controlCanvas;
                let context = canvas.getContext('2d');
                let spriteSheet = this.$refs.spriteSheet;

                StatusBus.$emit(BusEvents.RENDER_TIME_START);

                context.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
                context.drawImage(spriteSheet, this.canvasSize.x, this.canvasSize.y, this.canvasSize.width, this.canvasSize.height, 0, 0, this.canvasSize.width, this.canvasSize.height);

                if (!newState) {
                    // draw controller with default state
                    Object.keys(this.buttonSprites).map(function (button) {
                        that.renderButton(context, spriteSheet, button, false);
                    });

                    Object.keys(this.stickSprites).map(function (stick) {
                        that.renderStick(context, spriteSheet, stick, false, 0, 0);
                    });
                } else {
                    let buttons = newState.state.buttons;
                    let sticks = newState.state.sticks;

                    Object.keys(this.buttonSprites).map(function (button) {
                        let pressed = buttons[button];
                        that.renderButton(context, spriteSheet, button, pressed);
                    });

                    Object.keys(this.stickSprites).map(function (stick) {
                        let pressed = sticks[stick].pressed;
                        let x = sticks[stick].x;
                        let y = sticks[stick].y;
                        that.renderStick(context, spriteSheet, stick, pressed, x, y);
                    });
                }
                StatusBus.$emit(BusEvents.RENDER_TIME_END);
            },
            renderButton: function(context, spriteSheet, name, pressed) {
                let sprite = this.buttonSprites[name];

                if (!pressed || sprite.opacity) {
                    let coord = sprite.inactive;
                    context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, sprite.x, sprite.y, sprite.w, sprite.h);
                }
                if (pressed) {
                    let coord = sprite.active;
                    context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, sprite.x, sprite.y, sprite.w, sprite.h);
                }
            },
            renderStick: function(context, spriteSheet, name, pressed, x, y) {
                let sprite = this.stickSprites[name];
                if (!sprite) return;

                let coord = pressed ? sprite.active : sprite.inactive;
                context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, sprite.x + x * sprite.travel, sprite.y + y * sprite.travel, sprite.w, sprite.h);
            },
            imageLoaded: function() {
                let canvas = this.$refs.controlCanvas;
                canvas.width = this.canvasSize.width * this.canvasSize.scale;
                canvas.height = this.canvasSize.height * this.canvasSize.scale;

                let context = canvas.getContext('2d');
                context.scale(this.canvasSize.scale, this.canvasSize.scale);

                this.spriteSheetReady = true;
                this.renderImage();
            }
        },
        mounted: function() {
            StatusBus.$on(BusEvents.INPUT_CHANGED, this.renderImage);
        },
        beforeDestroy: function() {
            this.spriteSheetReady = false;
        },
        template: '<div><canvas class="controlCanvas" ref="controlCanvas"></canvas><img ref="spriteSheet" v-bind:src="spriteSheetUrl" style="display:none;" @load="imageLoaded"/></div>'
    };

    const JoyconStreamRenderer = {
        mixins: [JoyconSprites],
        props: ['endpoint'],
        components: {
            'h264-ws-player': H264Player
        },
        data: function() {
            return {
                spriteSheetReady: false,
                streamCanvas: document.createElement('canvas'),
                streamReady: false,
                renderScale: 0.75
            };
        },
        computed: {
            rightControllerX: function() {
                return this.canvasWidth - this.controllers.w;
            },
            leftControllerX: function() {
                return 0;
            },
            canvasWidth: function() {
                return this.controllers.w * 2 + this.console.body.w;
            },
            canvasHeight: function() {
                return this.controllers.h;
            },
            consoleYOffset: function() {
                return this.controllers.h - this.console.body.h;
            },
            playerX: function() {
                return this.controllers.w + this.console.screen.x - this.console.body.x;
            },
            playerY: function() {
                return this.consoleYOffset + (this.console.screen.y - this.console.body.y);
            },
            playerScale: function() {
                if (this.streamReady) return this.console.screen.h / this.streamCanvas.height;
                return this.console.screen.h / 540;
            },
            playerWidth: function() {
                if (this.streamReady) return this.streamCanvas.width * this.playerScale;
                return 960 * this.playerScale;
            },
            playerHeight: function() {
                if (this.streamReady) return this.streamCanvas.height * this.playerScale;
                return 540 * this.playerScale;
            }
        },
        methods: {
            getAbsoluteX: function(controller, relX) {
                if (controller === 'left') return this.leftControllerX + relX;
                else return this.rightControllerX + relX;
            },
            getAbsoluteY: function(controller, relY) {
                return relY;
            },
            renderImage: function() {
                if (!this.spriteSheetReady) return;

                let self = this;
                let canvas = this.$refs.controlCanvas;
                let context = canvas.getContext('2d');
                let spriteSheet = this.$refs.spriteSheet;

                StatusBus.$emit(BusEvents.RENDER_TIME_START);

                context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
                // draw body
                context.drawImage(spriteSheet, this.console.body.x, this.console.body.y, this.console.body.w, this.console.body.h, this.controllers.w, this.consoleYOffset, this.console.body.w, this.console.body.h);
                // draw left controller
                context.drawImage(spriteSheet, this.controllers.left.x, this.controllers.left.y, this.controllers.w, this.controllers.h, this.leftControllerX, 0, this.controllers.w, this.controllers.h);
                // draw right controller
                context.drawImage(spriteSheet, this.controllers.right.x, this.controllers.right.y, this.controllers.w, this.controllers.h, this.rightControllerX, 0, this.controllers.w, this.controllers.h);
                if (this.streamReady) {
                    context.drawImage(this.streamCanvas, this.playerX, this.playerY, this.playerWidth, this.playerHeight);
                }
                //context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

                let myState = this.$store.state.gamepadState;
                let buttons = myState.buttons;
                let sticks = myState.sticks;

                Object.keys(this.buttonSprites).map(function (button) {
                    let pressed = buttons[button];
                    self.renderButton(context, spriteSheet, button, pressed);
                });

                Object.keys(this.stickSprites).map(function (stick) {
                    let pressed = sticks[stick].pressed;
                    let x = sticks[stick].x;
                    let y = sticks[stick].y;
                    self.renderStick(context, spriteSheet, stick, pressed, x, y);
                });

                StatusBus.$emit(BusEvents.RENDER_TIME_END);

                requestAnimationFrame(this.renderImage);
            },
            renderButton: function(context, spriteSheet, name, pressed) {
                let sprite = this.buttonSprites[name];

                let dstX = this.getAbsoluteX(sprite.controller, sprite.x);
                let dstY = this.getAbsoluteY(sprite.controller, sprite.y);

                let scale = sprite.scale || 1;
                
                if (!pressed || sprite.opacity) {
                    let coord = sprite.inactive;
                    context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, dstX, dstY, sprite.w * scale, sprite.h * scale);
                }
                if (pressed) {
                    let coord = sprite.active;
                    context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, dstX, dstY, sprite.w * scale, sprite.h * scale);
                }
            },
            renderStick: function(context, spriteSheet, name, pressed, x, y) {
                let sprite = this.stickSprites[name];
                if (!sprite) return;

                let relX = sprite.x + x * sprite.travel;
                let relY = sprite.y + y * sprite.travel;

                let dstX = this.getAbsoluteX(sprite.controller, relX);
                let dstY = this.getAbsoluteY(sprite.controller, relY);

                let coord = pressed ? sprite.active : sprite.inactive;
                context.drawImage(spriteSheet, coord.x, coord.y, sprite.w, sprite.h, dstX, dstY, sprite.w, sprite.h);
            },
            imageLoaded: function() {
                this.spriteSheetReady = true;
                this.renderImage();
            }
        },
        created: function() {
            let self = this;
            PlayerBus.$on(PlayerEvents.READY, function(size) {
                self.streamReady = true;

                let canvas = self.$refs.controlCanvas;
                canvas.width = self.canvasWidth * self.renderScale;
                canvas.height = self.canvasHeight * self.renderScale;
                let context = canvas.getContext('2d');
                context.scale(self.renderScale, self.renderScale);
            });
        },
        mounted: function() {
            //StatusBus.$on(BusEvents.INPUT_CHANGED, this.renderImage);
            this.renderImage();
        },
        beforeDestroy: function() {
            this.spriteSheetReady = false;
            this.streamReady = false;
        },
        template: '<div><h264-ws-player v-bind:endpoint="endpoint" v-bind:canvas="streamCanvas"></h264-ws-player><canvas class="controlCanvas" ref="controlCanvas"></canvas><img ref="spriteSheet" v-bind:src="spriteSheetUrl" style="display:none;" @load="imageLoaded"/></div>'
    };

    let noController = {
        template: '<p class="center-text">No controller connected.</p>'
    };

    let unsupportedController = {
        template: '<div><p class="center-text">This isn\'t a supported controller. Select another controller or check the help documentation for details.</p></div>'
    };

    let StandardMappings = {
        data: function() {
            return {
                buttonMapping: {
                    faceDown: 0,
                    faceRight: 1,
                    faceLeft: 2,
                    faceUp: 3,
                    leftTop: 4,
                    rightTop: 5,
                    leftTrigger: 6,
                    rightTrigger: 7,
                    select: 8,
                    start: 9,
                    leftStick: 10,
                    rightStick: 11,
                    dpadUp: 12,
                    dpadDown: 13,
                    dpadLeft: 14,
                    dpadRight: 15
                },
                stickMapping: {
                    leftStick: {axisX: 0, axisY: 1},
                    rightStick: {axisX: 2, axisY: 3}
                }
            };
        }
    };

    let BaseController = {
        mixins: [InputSource],
        props: ['gamepadindex', 'gamepadname', 'axes', 'buttons'],
        data: function() {
            return {
                experimental: false
            };
        },
        methods: {
            isButtonPressed: function(name) {
                // May need to override for certain controllers due to dpad
                let index = this.buttonMapping[name];
                if (index === null || index === undefined || index < 0) return false;
                return !!this.buttons[index];
            },
            getStickX: function(name) {
                return this.axes[this.stickMapping[name].axisX];
            },
            getStickY: function(name) {
                return this.axes[this.stickMapping[name].axisY];
            }
        },
        mounted: function() {
            if (this.experimental) {
                this.$notify({
                    title: 'Experimental controller support',
                    text: `Please note that support for this controller (${this.canonicalName}) is experimental and may have issues or limitations. Please check the help documentation for details.`,
                    duration: 10000
                });
            }
            if (this.notifyMessage) {
                this.$notify({
                    type: 'warn',
                    title: 'Warning',
                    text: this.notifyMessage,
                    duration: 10000
                });
            }
        },
        template: '<div><span class="center-text">Controller (( gamepadindex )): (( gamepadname ))</span><span class="center-text">Detected as: (( canonicalName ))</span></div>'
    };

    let xboxController = {
        mixins: [BaseController, StandardMappings],
        data: function() {
            return {
                canonicalName: 'Xbox/XInput controller'
            };
        }
    };

    let SwitchProControllerBase = {
        mixins: [BaseController],
        data: function() {
            return {
                canonicalName: 'Switch Pro Controller'
            };
        }
    };

    let SwitchProControllerStandard = {
        mixins: [SwitchProControllerBase, StandardMappings]
    };

    let SwitchProControllerMacFirefox = {
        mixins: [SwitchProControllerBase, StandardMappings]
    };

    let powerAWiredControllerBase = {
        mixins: [BaseController],
        data: function() {
            return {
                canonicalName: 'PowerA Wired Controller'
            };
        }
    };

    let PowerAWiredControllerStandard = {
        mixins: [powerAWiredControllerBase, StandardMappings]
    };

    let PowerAWiredControllerMacFirefox = {
        mixins: [powerAWiredControllerBase],
        data: function() {
            return {
                buttonMapping: {
                    faceLeft: 0,
                    faceDown: 1,
                    faceRight: 2,
                    faceUp: 3,
                    leftTop: 4,
                    rightTop: 5,
                    leftTrigger: 6,
                    rightTrigger: 7,
                    select: 8,
                    start: 9,
                    leftStick: 10,
                    rightStick: 11,
                    dpadUp: 14,
                    dpadDown: 15,
                    dpadLeft: 16,
                    dpadRight: 17
                }
            };
        }
    };

    let PowerAWiredControllerChromeOS = {
        mixins: [powerAWiredControllerBase],
        data: function() {
            return {
                buttonMapping: {
                    faceLeft: 0,
                    faceDown: 1,
                    faceRight: 2,
                    faceUp: 3,
                    leftTop: 4,
                    rightTop: 5,
                    leftTrigger: 6,
                    rightTrigger: 7,
                    select: 8,
                    start: 9,
                    leftStick: 10,
                    rightStick: 11
                },
                dpadMapping: {
                    dpadUp: {axis: 5, sign: -1},
                    dpadDown: {axis: 5, sign: 1},
                    dpadLeft: {axis: 4, sign: -1},
                    dpadRight: {axis: 4, sign: 1}
                }
            };
        },
        methods: {
            isButtonPressed: function(name) {
                if (this.dpadMapping.hasOwnProperty(name)) {
                    let mapping = this.dpadMapping[name];
                    return mapping && mapping.hasOwnProperty('axis') && mapping.hasOwnProperty('sign') && this.axes[mapping.axis] * mapping.sign > this.deadzone;
                } else {
                    let index = this.buttonMapping[name];
                    if (index === null || index === undefined || index < 0) return false;
                    return this.buttons[index];
                }
            }
        }
    };

    let PowerAWiredControllerChrome = {
        mixins: [powerAWiredControllerBase],
        data: function() {
            return {
                buttonMapping: {
                    faceLeft: 0,
                    faceDown: 1,
                    faceRight: 2,
                    faceUp: 3,
                    leftTop: 4,
                    rightTop: 5,
                    leftTrigger: 6,
                    rightTrigger: 7,
                    select: 8,
                    start: 9,
                    leftStick: 10,
                    rightStick: 11
                },
                dpadMapping: {
                    dpadUp: {axis: 9, axisVals: [-7, -5, 7]},
                    dpadDown: {axis: 9, axisVals: [-1, 1, 3]},
                    dpadLeft: {axis: 9, axisVals: [3, 5, 7]},
                    dpadRight: {axis: 9, axisVals: [-5, -3, -1]},
                },
                stickMapping: {
                    leftStick: {axisX: 0, axisY: 1},
                    rightStick: {axisX: 2, axisY: 5}
                }
            }
        },
        methods: {
            isButtonPressed: function(name) {
                if (this.dpadMapping.hasOwnProperty(name)) {
                    let mapping = this.dpadMapping[name];
                    if (!(mapping && mapping.hasOwnProperty('axis') && mapping.hasOwnProperty('axisVals'))) return false;
                    let axisValNormalized = this.axes[mapping.axis] * 7;
                    for (let i = 0; i < mapping.axisVals.length; i++) {
                        if (Math.abs(mapping.axisVals[i] - axisValNormalized) < 0.1) return true;
                    }
                    return false;
                } else {
                    let index = this.buttonMapping[name];
                    if (index === null || index === undefined || index < 0) return false;
                    return this.buttons[index];
                }
            }
        }
    };

    let PowerAWiredControllerWinFirefox = {
        mixins: [powerAWiredControllerBase],
        data: function() {
            return {
                buttonMapping: {
                    faceLeft: 0,
                    faceDown: 1,
                    faceRight: 2,
                    faceUp: 3,
                    leftTop: 4,
                    rightTop: 5,
                    leftTrigger: 6,
                    rightTrigger: 7,
                    select: 8,
                    start: 9,
                    leftStick: 10,
                    rightStick: 11,
                    // DPad Up is mapped to share, DPad down is mapped to home
                    dpadUp: 13,
                    dpadDown: 12,
                    dpadLeft: null,
                    dpadRight: null
                },
                notifyMessage: 'The D-Pad does not work properly in Firefox on Windows. The Share button has been mapped to D-Pad Up. If this doesn\'t work for you, try using Chrome.'
            }
        }
    };

    let dualShockControllerBase = {
        mixins: [BaseController],
        data: function() {
            return {
                canonicalName: 'DualShock Controller'
            };
        }
    };

    let dualShockControllerStandard = {
        mixins: [dualShockControllerBase, StandardMappings]
    };

    let dualShockControllerWinFirefox = {
        mixins: [dualShockControllerBase],
        data: function() {
            return {
                buttonMapping: {
                    faceLeft: 0,
                    faceDown: 1,
                    faceRight: 2,
                    faceUp: 3,
                    leftTop: 4,
                    rightTop: 5,
                    leftTrigger: 6,
                    rightTrigger: 7,
                    select: 8,
                    start: 9,
                    leftStick: 10,
                    rightStick: 11,
                    // Remap the guide button to index 12
                    // The other buttons don't seem to work, so leave them blank.
                    dpadUp: 13,
                    dpadDown: 12,
                    dpadLeft: null,
                    dpadRight: null
                },
                stickMapping: {
                    leftStick: {axisX: 0, axisY: 1},
                    rightStick: {axisX: 2, axisY: 5}
                },
                notifyMessage: 'The D-Pad does not work properly in Firefox on Windows. The touchpad has been mapped to D-Pad Up. If this doesn\'t work for you, try using Chrome.'
            };
        }
    };

    let dualShockControllerMacFirefox = {
        mixins: [dualShockControllerBase],
        data: function() {
            return {
                buttonMapping: {
                    faceLeft: 0,
                    faceDown: 1,
                    faceRight: 2,
                    faceUp: 3,
                    leftTop: 4,
                    rightTop: 5,
                    leftTrigger: 6,
                    rightTrigger: 7,
                    select: 8,
                    start: 9,
                    leftStick: 10,
                    rightStick: 11,
                    dpadUp: 14,
                    dpadDown: 15,
                    dpadLeft: 16,
                    dpadRight: 17
                },
                stickMapping: {
                    leftStick: {axisX: 0, axisY: 1},
                    rightStick: {axisX: 2, axisY: 5}
                }
            };
        }
    };

    let detectBrowser = function() {
        if(navigator.userAgent.indexOf("Chrome") !== -1 ) {
            return 'Chrome';
        } else if(navigator.userAgent.indexOf("Firefox") !== -1 ) {
            return 'Firefox';
        } else {
            return 'unknown';
        }
    };
    let detectOS = function() {
        let userAgent = window.navigator.userAgent,
            platform = window.navigator.platform,
            macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
            windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
            iosPlatforms = ['iPhone', 'iPad', 'iPod'];

        if (macosPlatforms.indexOf(platform) !== -1) {
            return 'Mac OS';
        } else if (iosPlatforms.indexOf(platform) !== -1) {
            return 'iOS';
        } else if (windowsPlatforms.indexOf(platform) !== -1) {
            return 'Windows';
        } else if (/Android/.test(userAgent)) {
            return 'Android';
        } else if (/CrOS/.test(userAgent)) {
            return 'Chrome OS';
        } else if (/Linux/.test(platform)) {
            return 'Linux';
        }

        return 'unknown';
    };
    let checkVidPid = function(id, vid, pid) {
        return id.indexOf(vid) > -1 && id.indexOf(pid) > -1;
    };
    let getControllerProfile = function(browser, os, id, mapping) {
        if (mapping === 'standard') {
            // Check for Pro Controller (2009) or Joycon Grip (200e) connected via cable (won't work)
            if (id.indexOf('Nintendo Co., Ltd.') > -1) {
                return 'unsupported-controller';
            }

            // Pro Controller reported as standard on Chrome OS only
            if (checkVidPid(id, '57e', '2009')) {
                return 'switch-pro-controller-standard';
            }

            // DualShock 4 reported as standard by Chrome on all OSes
            if (checkVidPid(id, '54c', '9cc')) {
                return 'dualshock-controller-standard';
            }

            // Not reported as standard mappings on any tested OS/browser, but here just in case
            if (checkVidPid(id, '20d6', 'a711')) {
                return 'powera-wired-controller-standard';
            }

            // Xbox controller works on Windows and Chrome on Mac OS only
            return 'xbox-controller';
        }

        // Pro Controller uses standard mappings (but not reported as standard) on Mac OS/Firefox
        if (checkVidPid(id, '57e', '2009')) {
            if (os === 'Mac OS' && browser === 'Firefox') {
                return 'switch-pro-controller-mac-firefox';
            }
        }

        // DualShock 4 D-Pad doesn't work properly on Windows/Firefox. On Mac OS/Firefox it works fine but needs remapping.
        if (checkVidPid(id, '54c', '9cc')) {
            if (os === 'Windows' && browser === 'Firefox') return 'dualshock-controller-win-firefox';
            if (os === 'Mac OS' && browser === 'Firefox') return 'dualshock-controller-mac-firefox';
        }

        // PowerA Wired Controller Plus works fine on every OS (Windows/Firefox needs D-Pad fix), but needs remapping.
        if (checkVidPid(id, '20d6', 'a711')) {
            if (os === 'Chrome OS') {
                return 'powera-wired-controller-chromeos';
            }
            if (browser === 'Chrome') {
                return 'powera-wired-controller-chrome';
            }
            if (browser === 'Firefox') {
                if (os === 'Windows') return 'powera-wired-controller-win-firefox';
                if (os === 'Mac OS') return 'powera-wired-controller-mac-firefox';
            }
        }

        // No supported profile found
        return 'unsupported-controller';
    };

    Vue.component('controller-select', {
        props: ['gamepads', 'gamepadindex'],
        model: {
            prop: 'gamepadindex',
            event: 'change'
        },
        computed: {
            selectedindex: {
                get() {
                    return this.gamepadindex;
                },
                set(val) {
                    this.$emit('change', val);
                }
            }
        },
        template: '<select v-model="selectedindex"><option disabled value="">Please select a controller</option>' +
        '<option v-for="gamepad in gamepads" v-bind:value="gamepad.index" v-if="gamepad !== null">#(( gamepad.index )): (( gamepad.id ))</option>' +
        '</select>'
    });

    Vue.component('server-status', {
        props: ['state'],
        data: function() {
            // TODO: Have this handle all server status things.
            let stats = new Stats();
            let pingPanel = stats.addPanel(new Stats.Panel('ms ping', '#f08', '#201'));
            pingPanel.update(0, 1000);
            stats.showPanel(0);
            stats.showPanel(1);
            stats.showPanel(2);

            return {
                stats: stats,
                pingPanel: pingPanel,
                pendingPings: {}
            };
        },
        mounted: function() {
            let that = this;
            this.$nextTick(function() {
                this.$refs.statsContainer.appendChild(this.stats.dom);
                StatusBus.$on(BusEvents.RENDER_TIME_START, this.stats.begin);
                StatusBus.$on(BusEvents.RENDER_TIME_END, this.stats.end);
            });
            SocketBus.$on(SocketEvents.PONG, function(time) {
                that.pingPanel.update(time, 1000);
            });
            // todo: handle countdown for until it's user's turn
        },
        methods: {
            requestTurn: function() {
                if (this.canRequestTurn) {
                    SocketBus.$emit(SocketEvents.SEND_MESSAGE, 'REQUEST_TURN');
                    this.$store.commit('setControlState', ControlState.WAITING);
                }
            }
        },
        computed: {
            turnState: function() {
                let connectionState = this.$store.state.connectionState;
                let controlState = this.$store.state.controlState;

                if (connectionState === ConnectionState.CONNECTED) {
                    if (controlState === ControlState.NO_CONTROLLER) {
                        return 'No controller connected';
                    } else if (controlState === ControlState.UNSUPPORTED_CONTROLLER) {
                        return 'Unsupported controller';
                    } else if (controlState === ControlState.INACTIVE) {
                        return 'Request turn';
                    } else if (controlState === ControlState.ACTIVE) {
                        return 'Currently your turn';
                    } else if (controlState === ControlState.WAITING) {
                        return 'Waiting for turn';
                    }
                } else if (connectionState === ConnectionState.NOT_CONNECTED) {
                    return 'Not connected';
                } else if (ConnectionState === ConnectionState.CONNECTING) {
                    return 'Connecting to server';
                } else if (ConnectionState === ConnectionState.ERROR) {
                    return 'Connection error';
                }

                return 'Unknown state';
            },
            canRequestTurn: function() {
                let connectionState = this.$store.state.connectionState;
                let controlState = this.$store.state.controlState;

                return connectionState === ConnectionState.CONNECTED && controlState === ControlState.INACTIVE;
            }
        },
        template: '<div class="center-text"><button type="button" class="center-text min-padding" @click="requestTurn" v-text="turnState" v-bind:disabled="!canRequestTurn"></button><div ref="statsContainer" class="stats"></div></div>'
    });

    new Vue({
        el: '#app',
        store,
        components: {
            'control-ws': ControlWs,
            'controller-renderer': ControllerRenderer,
            'joycon-stream-renderer': JoyconStreamRenderer,
            'control-mode-select': ControlModeSelect,
            'no-controller': noController,
            'unsupported-controller': unsupportedController,
            'xbox-controller': xboxController,
            'switch-pro-controller-standard': SwitchProControllerStandard,
            'switch-pro-controller-mac-firefox': SwitchProControllerMacFirefox,
            'powera-wired-controller-standard': PowerAWiredControllerStandard,
            'powera-wired-controller-chromeos': PowerAWiredControllerChromeOS,
            'powera-wired-controller-chrome': PowerAWiredControllerChrome,
            'powera-wired-controller-win-firefox': PowerAWiredControllerWinFirefox,
            'powera-wired-controller-mac-firefox': PowerAWiredControllerMacFirefox,
            'dualshock-controller-standard': dualShockControllerStandard,
            'dualshock-controller-win-firefox': dualShockControllerWinFirefox,
            'dualshock-controller-mac-firefox': dualShockControllerMacFirefox,
        },
        data: function() {
            return {
                currentController: -1,
                axes: [],
                buttons: [],
                deadzone: 0.15,
                allControllers: [],
                controlEndpoint: 'wss://api.chilly.codes/switch/ws',
                streamEndpoint: 'wss://api.chilly.codes/switch/stream'
            };
        },
        created: function() {
            let that = this;

            window.addEventListener('gamepadconnected', function(e) {
                console.log('Detected gamepad: ' + e.gamepad.id);
                if (that.currentController < 0 || that.currentControllerComponent === 'unsupported-controller') {
                    that.currentController = e.gamepad.index;
                }
                that.allControllers = that.getGamepads();
            });

            window.addEventListener('gamepaddisconnected', function(e) {
                console.log('Gamepad disconnected: ' + e.gamepad.id);
                if (that.currentController.index === e.gamepad.index) {
                    that.currentController = that.getGamepad().index;
                }
                that.allControllers = that.getGamepads();
            });

            SocketBus.$on('CLIENT_ACTIVE', function() {
                that.$store.commit('setControlState', ControlState.ACTIVE);
            });

            SocketBus.$on('CLIENT_INACTIVE', function() {
                that.$store.commit('setControlState', ControlState.INACTIVE);
            });
        },
        watch: {
            currentController: function() {
                let controlState = this.$store.state.controlState;

                if (!this.isControllerConnected) {
                    this.$store.commit('setControlState', ControlState.NO_CONTROLLER);
                } else if (!this.isControllerSupported) {
                    this.$store.commit('setControlState', ControlState.UNSUPPORTED_CONTROLLER);
                } else if (controlState === ControlState.NO_CONTROLLER || ControlState.UNSUPPORTED_CONTROLLER) {
                    this.$store.commit('setControlState', ControlState.INACTIVE);
                }

                requestAnimationFrame(this.update);
            },
            currentControllerComponent: function() {
                console.log(`Loading controller component ${this.currentControllerComponent}`);
            }
        },
        mounted: function() {
            let browser = detectBrowser();
            let os = detectOS();

            console.log(`Running on ${os}/${browser}`);

            StatusBus.$on(BusEvents.INPUT_CHANGED, this.onControllerUpdate);

            this.$nextTick(function() {
                requestAnimationFrame(this.update);
            });
        },
        methods: {
            getGamepads: function() {
                let gamepads;
                if (navigator.getGamepads()) {
                    gamepads = navigator.getGamepads();
                } else if (navigator.webkitGetGamepads) {
                    gamepads = navigator.webkitGetGamepads();
                }
                return gamepads;
            },
            getGamepad: function() {
                // TODO: Support Joycons.
                let gamepads = this.getGamepads();
                if (this.currentController >= 0) {
                    let gamepad = gamepads[this.currentController];
                    if (gamepad && gamepad.connected) return gamepad;
                }
                for (let i = 0; i < gamepads.length; i++) {
                    if (gamepads[i] && gamepads[i].connected) {
                        this.currentController = gamepads[i].index;
                        return gamepads[i];
                    }
                }
                return null;
            },
            update: function() {
                let gamepad = this.getGamepad();
                if (!gamepad) return;

                let newButtons = [];
                let newAxes = [];

                for (let i = 0; i < gamepad.buttons.length; i++) {
                    newButtons.push(gamepad.buttons[i].value);
                }
                for (let i = 0; i < gamepad.axes.length; i++) {
                    newAxes.push(gamepad.axes[i]);
                }
                this.axes = newAxes;
                this.buttons = newButtons;

                StatusBus.$emit(BusEvents.UPDATE_INPUT);

                requestAnimationFrame(this.update);
            },
            onControllerUpdate: function(newState) {
                if (this.connected && this.controlActive) {
                    SocketBus.$emit(SocketEvents.SEND_MESSAGE, `UPDATE ${newState.stateStr}`);
                }
            }
        },
        computed: {
            connected: function() {
                return this.$store.state.connectionState === ConnectionState.CONNECTED;
            },
            controlActive: function() {
                return this.$store.state.controlState === ControlState.ACTIVE;
            },
            isControllerConnected: function() {
                return this.currentControllerComponent !== 'no-controller';
            },
            isControllerSupported: function() {
                return this.currentControllerComponent !== 'unsupported-controller';
            },
            currentControllerComponent: function() {
                // TODO: make this code less unwieldy.
                if (this.currentController < 0) return 'no-controller';
                let gamepad = this.getGamepad();
                if (!gamepad) {
                    return 'no-controller';
                }

                let browser = detectBrowser();
                let os = detectOS();
                let id = gamepad.id;
                let mapping = gamepad.mapping;

                return getControllerProfile(browser, os, id, mapping);
            },
            gamepadName: function() {
                if (this.currentController < 0) {
                    return '';
                }
                let gamepad = this.getGamepad();
                if (!gamepad) return '';
                return gamepad.id;
            }
        }
    });

}());
