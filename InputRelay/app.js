const NS_PER_SEC = 1e9;
const TURN_TIME = 30;
var net = require('net');

var client = new net.Socket();
client.setEncoding('utf8');

client.connect(31337, '127.0.0.1', function() {
	console.log('Connected');
});

client.on('data', function(data) {
	console.log(`Socket received data: ${data}`)
});

client.on('close', function() {
	console.log('Connection closed');
});

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080, clientTracking: true, maxPayload: 32 });
const commandRegex = /UPDATE(?: \d+){6}/;
let clientId = 0;
let activeClient = 0;
let connectedClients = new Set();
let connectedClientsMap = {};
let waitingTurns = new Set();
let lastTurnTime = process.hrtime();

// Broadcast to all.
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

function noop() {}

function heartbeat() {
	this.isAlive = true;
}

function handleDisconnect(event) {
	connectedClients.delete(this.clientId);
	delete connectedClientsMap[this.clientId];

	wss.broadcast('NUM_CLIENTS ' + connectedClients.size);

	if (waitingTurns.has(this.clientId)) {
		waitingTurns.delete(this.clientId);
		let counter = 0;
		notifyClientsOfLinePosition();
	}

	if (activeClient === this.clientId && waitingTurns.size > 0) {
		nextTurn();
	}
}

function nextTurn() {
	let diff = process.hrtime(lastTurnTime);
	if (diff[0] < TURN_TIME && waitingTurns.size > 0 && connectedClients.has(activeClient)) {
		connectedClientsMap[activeClient].send('TIME_LEFT ' + (TURN_TIME - diff[0]));
		if (waitingTurns.size > 0) {
			let clientId = waitingTurns.entries().next()[0];
			if (connectedClients.has(clientId)) {
				connectedClientsMap[clientId].send('TIME_LEFT ' + (TURN_TIME - diff[0]));
			}
		}
		return;
	}
	else if (waitingTurns.size === 0 && connectedClients.has(activeClient)) {
		connectedClientsMap[activeClient].send('TIME_LEFT');
	}


	if (waitingTurns.size > 0 && connectedClients.has(activeClient)) {
		client.write('UPDATE 128 128 128 128 0 16383 8\r\n');
		connectedClientsMap[activeClient].send('CLIENT_INACTIVE');
	}
	let before = -1;
	for (let entry of waitingTurns.entries()) {
		let clientId = entry[0];
		if (connectedClients.has(clientId)) {
			if (before >= 0) {
				before++;
			} else {
				activeClient = clientId;
				connectedClientsMap[activeClient].send('CLIENT_ACTIVE');
				waitingTurns.delete(clientId);
				before = 0;
				lastTurnTime = process.hrtime();
			}
		} else {
			waitingTurns.delete(clientId);
		}
	}
	notifyClientsOfLinePosition();
}

function notifyClientsOfLinePosition() {
	let counter = 0;
	for (let entry of waitingTurns.entries()) {
		if (connectedClients.has(entry[0])) {
			counter++;
			connectedClientsMap[entry[0]].send(`LINE_POSITION ${counter} ${waitingTurns.size}`);
		}
	}
}

function waitForTurn(client_id) {
	if (connectedClients.has(client_id)) {
		console.log(`Adding client ${clientId} to queue`);
		waitingTurns.add(client_id);
		notifyClientsOfLinePosition();
	}
	if (!connectedClients.has(activeClient)) {
		console.log(`No other clients, so choosing a new client`);
		nextTurn();
	}
}

wss.on('connection', function connection(ws) {
	clientId++;

	ws.isAlive = true;
	ws.clientId = clientId;

	ws.on('pong', heartbeat);
	ws.on('message', function incoming(data) {
		if (data == "PING") ws.send("PONG");
		else {
			if (activeClient == ws.clientId && commandRegex.exec(data)) client.write(data + "\r\n");
			else if (data == "REQUEST_TURN" && connectedClients.has(ws.clientId)) waitForTurn(ws.clientId);
			//console.log(`Websocket received data: ${data}`);
		}

	});
	ws.on('error', handleDisconnect);
	ws.on('close', handleDisconnect);

	connectedClients.add(ws.clientId);
	connectedClientsMap[ws.clientId] = ws;

	ws.send('CLIENT_ID ' + ws.clientId);
	wss.broadcast('NUM_CLIENTS ' + connectedClients.size);

	if (connectedClients.size == 1) {
		waitForTurn(ws.clientId);
	}
});

const interval = setInterval(function ping() {
	wss.clients.forEach(function each(ws) {
		if (ws.isAlive === false)
			return ws.terminate();
		ws.isAlive = false;
		ws.ping(noop);
	});
}, 30000);

setInterval(nextTurn, 1000);