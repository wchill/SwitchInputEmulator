(function() {
    let gamepadButtons = {
        'y': 8,
        'b': 4,
        'a': 2,
        'x': 1,
        'leftTop': 16,
        'rightTop': 32,
        'leftTrigger': 64,
        'rightTrigger': 128,
        'select': 256,
        'start': 512,
        'leftStick': 1024,
        'rightStick': 2048
    };

    let dpadButtons = {
        'dpadUp': 0,
        'dpadUp dpadRight': 1,
        'dpadRight': 2,
        'dpadDown dpadRight': 3,
        'dpadDown': 4,
        'dpadDown dpadLeft': 5,
        'dpadLeft': 6,
        'dpadUp dpadLeft': 7
    };

    let gamepadSticks = ['leftStick', 'rightStick'];

    const wsParseRegex = /(PONG|CLIENT_ID|NUM_CLIENTS|CLIENT_ACTIVE|CLIENT_INACTIVE|LINE_POSITION|TIME_LEFT)(?: (.*))?/;
    const gpStatus = document.getElementById('gamepadStatus');
    const gpActive = document.getElementById('gamepadActive');
    let clientId = 0;
    let numClients = 0;
    let isClientActive = false;
    let isWaitingForTurn = false;
    let positionInLine = 0;
    let numberInLine = 0;
    let timeLeft = 0;
    let username = '';

    function buildStateStr() {
        let buttonState = 0;
        Object.keys(gamepadButtons).map(function (button) {
            let pressed = !!gamepad.buttons[button];
            if (pressed) buttonState += gamepadButtons[button];
        });

        let dpadState = 8;
        Object.keys(dpadButtons).map(function (button) {
            let buttons = button.split(' ');
            for (let i = 0; i < buttons.length; i++) {
                let pressed = !!gamepad.buttons[button];
                if (!pressed) return;
            }
            dpadState = dpadButtons[button];
        });

        let stickX = {
            'leftStick': 128,
            'rightStick': 128
        };

        let stickY = {
            'leftStick': 128,
            'rightStick': 128
        };

        let deadzone = 0.01;

        gamepadSticks.forEach(function(stick) {
            let stickAxes = gamepad[stick];

            if (Math.abs(stickAxes.x) - deadzone > 0) {
                stickX[stick] += stickAxes.x * 128;
            }

            if (stickX[stick] < 0) stickX[stick] = 0;
            else if (stickX[stick] > 255) stickX[stick] = 255;
            stickX[stick] |= 0;

            if (Math.abs(stickAxes.y) - deadzone > 0) {
                stickY[stick] += stickAxes.y * 128;
            }

            if (stickY[stick] < 0) stickY[stick] = 0;
            else if (stickY[stick] > 255) stickY[stick] = 255;
            stickY[stick] |= 0;
        });

        return `${buttonState} ${dpadState} ${stickX['leftStick']} ${stickY['leftStick']} ${stickX['rightStick']} ${stickY['rightStick']}`;
    }

    function draw() {

        stats.begin();

        gamepad.update();
        let currentState = buildStateStr();
        if (currentState !== stateStr && ws && ws.readyState === ws.OPEN && isClientActive) {
            stateStr = currentState;
            ws.send('UPDATE ' + stateStr);
        }
        canvas2d.clearRect(0, 0, canvasSize.width, canvasSize.height);
        canvas2d.drawImage(gamepadSpriteSheet, 0, 0, canvasSize.width, canvasSize.height, 0, 0, canvasSize.width, canvasSize.height);
        Object.keys(buttonSprites).map(function (button) {
            let spriteData = buttonSprites[button];
            let pressed = !!gamepad.buttons[button];
            if (!pressed || spriteData.opacity) {
                let spriteCoordinates = spriteData.inactive;
                canvas2d.drawImage(gamepadSpriteSheet, spriteCoordinates.x, spriteCoordinates.y, spriteData.w, spriteData.h, spriteData.x, spriteData.y, spriteData.w, spriteData.h);
            }
            if (pressed) {
                let spriteCoordinates = spriteData.active;
                canvas2d.drawImage(gamepadSpriteSheet, spriteCoordinates.x, spriteCoordinates.y, spriteData.w, spriteData.h, spriteData.x, spriteData.y, spriteData.w, spriteData.h);
            }
        });
        Object.keys(stickSprites).map(function (stick) {
            let spriteData = stickSprites[stick];
            let pressed = !!gamepad.buttons[stick];
            let spriteCoordinates = pressed ? spriteData.active : spriteData.inactive;
            let stickAxes = gamepad[stick];
            canvas2d.drawImage(gamepadSpriteSheet, spriteCoordinates.x, spriteCoordinates.y, spriteData.w, spriteData.h, spriteData.x + stickAxes.x * spriteData.travel, spriteData.y + stickAxes.y * spriteData.travel, spriteData.w, spriteData.h);
        });

        stats.end();

        window.requestAnimationFrame(draw);
    }

    function checkGamepad() {
        let gp = gamepad.getGamepad();
        if (gp) {
            gpStatus.innerText = 'Controller connected, connecting to server';
            gpStatus.className = 'connecting';

            ws = new WebSocket('wss://api.chilly.codes/switch/ws');
            ws.onmessage = handleWsMsg;
            ws.onopen = function(e) {
                gpStatus.innerText = 'Connected';
                gpStatus.className = 'active';
                ws.send('USERNAME ' + username);
                setTimeout(ping, 1000);
            };
            ws.onerror = function(e) {
                gpStatus.innerText = 'Disconnected due to error';
                gpStatus.className = 'error';
                setTimeout(function() {
                    ws = new WebSocket('wss://api.chilly.codes/switch/ws');
                }, 10000);
            };
            ws.onclose = function(e) {
                gpStatus.innerText = 'Not connected';
                gpStatus.className = 'inactive';
                setTimeout(function() {
                    ws = new WebSocket('wss://api.chilly.codes/switch/ws');
                }, 10000);
            };
            canvas.addEventListener('click', function () {
                if (ws && ws.readyState === ws.OPEN && !isWaitingForTurn) {
                    ws.send('REQUEST_TURN');
                    isWaitingForTurn = true;
                    updateStatusText();
                }
            });
        } else {
            setTimeout(checkGamepad, 1000);
        }
    }

    let ws;
    let lastPing;
    let stateStr = '0 8 128 128 128 128';

    function ping() {
        lastPing = performance.now();
        if (ws && ws.readyState === ws.OPEN)
            ws.send('PING');
    }

    function handleWsMsg(event) {
        let match = wsParseRegex.exec(event.data);
        if (!match) {
            console.log(`Unknown event: ${event.data}`);
            return;
        }

        let command = match[1];
        let args = match[2];

        if (command === 'PONG') {
            let time = performance.now();
            let duration = (time - lastPing) / 2;
            pingPanel.update(duration, 1000);
            setTimeout(ping, Math.max(duration, 1000));
        } else {
            console.log(event.data);
            if (command === 'CLIENT_ID') {
                clientId = parseInt(args);
            } else if (command === 'NUM_CLIENTS') {
                numClients = parseInt(args);
            } else if (command === 'CLIENT_ACTIVE') {
                isWaitingForTurn = false;
                isClientActive = true;
                positionInLine = 0;
                timeLeft = 0;
            } else if (command === 'CLIENT_INACTIVE') {
                isWaitingForTurn = false;
                isClientActive = false;
                positionInLine = 0;
                timeLeft = 0;
            } else if (command === 'LINE_POSITION') {
                let argsArr = args.split(' ');
                positionInLine = parseInt(argsArr[0]);
                numberInLine = parseInt(argsArr[1]);
            } else if (command === 'TIME_LEFT') {
                if (args)
                    timeLeft = parseInt(args);
            }
            updateStatusText();
        }
    }

    function updateStatusText() {
        gpStatus.innerText = `Connected (client id #${clientId}, ${numClients} people online)`;
        gpStatus.className = 'active';

        if (isClientActive) {
            if (timeLeft > 0) {
                gpActive.innerText = `It's your turn - ${timeLeft} seconds left`;
            } else {
                gpActive.innerText = `It's your turn`;
            }
            gpActive.className = 'active';
        } else if (isWaitingForTurn) {
            if (positionInLine > 0) {
                if (timeLeft > 0) {
                    gpActive.innerText = `Waiting for turn (${positionInLine}/${numberInLine} in line, ${timeLeft} seconds left)`;
                } else {
                    gpActive.innerText = `Waiting for turn (${positionInLine}/${numberInLine} in line)`;
                }
            } else {
                gpActive.innerText = 'Waiting for turn';
            }
            gpActive.className = 'inactive';
        } else {
            gpActive.innerText = `It's not your turn (click to request turn)`;
            gpActive.className = 'inactive';
        }
    }

    let stats = new Stats();
    let pingPanel = stats.addPanel(new Stats.Panel('ms ping', '#f08', '#201'));
    pingPanel.update(0, 1000);
    stats.showPanel(0);
    stats.showPanel(1);
    stats.showPanel(2);
    document.getElementById("statsContainer").appendChild(stats.dom);

    let canvasSize = {
        width: 1040,
        height: 815
    };

    let buttonSprites = {
        a: {
            x: 745,
            y: 242,
            w: 79,
            h: 79,
            inactive: {
                x: 1217,
                y: 643
            },
            active: {
                x: 1062,
                y: 643
            }
        },
        b: {
            x: 820,
            y: 175,
            w: 79,
            h: 79,
            inactive: {
                x: 1140,
                y: 800
            },
            active: {
                x: 1141,
                y: 725
            }
        },
        x: {
            x: 678,
            y: 176,
            w: 79,
            h: 79,
            inactive: {
                x: 1220,
                y: 725
            },
            active: {
                x: 1065,
                y: 801
            }
        },
        y: {
            x: 745,
            y: 105,
            w: 79,
            h: 79,
            inactive: {
                x: 1140,
                y: 645
            },
            active: {
                x: 1062,
                y: 721
            }
        },
        leftTop: {
            x: 144,
            y: 0,
            w: 245,
            h: 90,
            inactive: {
                x: 613,
                y: 818
            },
            active: {
                x: 1062,
                y: 94
            }
        },
        rightTop: {
            x: 645,
            y: 0,
            w: 245,
            h: 90,
            inactive: {
                x: 1056,
                y: 0
            },
            active: {
                x: 1056,
                y: 188
            }
        },
        select: {
            x: 414,
            y: 183,
            w: 54,
            h: 54,
            inactive: {
                x: 1241,
                y: 552
            },
            active: {
                x: 1244,
                y: 460
            }
        },
        start: {
            x: 569,
            y: 183,
            w: 54,
            h: 54,
            inactive: {
                x: 1245,
                y: 370
            },
            active: {
                x: 1247,
                y: 278
            }
        },
        dpadUp: {
            x: 352,
            y: 290,
            w: 70,
            h: 87,
            inactive: {
                x: 1074,
                y: 557
            },
            active: {
                x: 1166,
                y: 557
            },
            opacity: !0
        },
        dpadDown: {
            x: 351,
            y: 369,
            w: 70,
            h: 87,
            inactive: {
                x: 1074,
                y: 366
            },
            active: {
                x: 1165,
                y: 366
            },
            opacity: !0
        },
        dpadLeft: {
            x: 298,
            y: 342,
            w: 87,
            h: 70,
            inactive: {
                x: 1066,
                y: 475
            },
            active: {
                x: 1158,
                y: 475
            },
            opacity: !0
        },
        dpadRight: {
            x: 383,
            y: 342,
            w: 87,
            h: 70,
            inactive: {
                x: 1062,
                y: 292
            },
            active: {
                x: 1156,
                y: 292
            },
            opacity: !0
        }
    };

    let stickSprites = {
        leftStick: {
            x: 185,
            y: 134,
            w: 150,
            h: 150,
            travel: 40,
            inactive: {
                x: 464,
                y: 816
            },
            active: {
                x: 310,
                y: 813
            }
        },
        rightStick: {
            x: 581,
            y: 290,
            w: 150,
            h: 150,
            travel: 40,
            inactive: {
                x: 464,
                y: 816
            },
            active: {
                x: 310,
                y: 813
            }
        }
    };

    let padState = {};
    Object.keys(buttonSprites).map(function (button) {
        padState[button] = false;
    });

    let gamepad = new PxGamepad();
    gamepad.start();
    let canvas = document.getElementById("gamepadCanvas");
    canvas.width = canvasSize.width * 0.75;
    canvas.height = canvasSize.height * 0.75;

    let assetLoader = new PxLoader();
    let canvas2d = canvas.getContext("2d");
    canvas2d.scale(0.75, 0.75);
    let gamepadSpriteSheet = assetLoader.addImage("assets/images/gamepadSprite.png");
    assetLoader.addCompletionListener(function () {
        window.requestAnimationFrame(draw);
        if (!localStorage || !localStorage.getItem('username')) {
            username = prompt('Please enter a username');
            localStorage.setItem('username', username);
        } else {
            username = localStorage.getItem('username');
        }
        checkGamepad();
    });
    assetLoader.start();
})();