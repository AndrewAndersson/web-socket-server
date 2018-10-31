import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

interface ExtWebSocket extends WebSocket {
    isAlive: boolean;
}

function createMessage(content: string, isBroadcast = false, sender = 'NS'): string {
    return JSON.stringify(new Message(content, isBroadcast, sender));
}

export class Message {
    constructor(
        public content: string,
        public isBroadcast = false,
        public sender: string
    ) { }
}

wss.on('connection', (ws: WebSocket) => {
    const extWs = ws as ExtWebSocket;

    extWs.isAlive = true;
    ws.on('pong', () => {
        extWs.isAlive = true;
    });

    ws.on('message', (msg: string) => {
        const message = JSON.parse(msg) as Message;

        setTimeout(() => {
            if (message.isBroadcast) {

                wss.clients
                    .forEach(client => {
                        if (client != ws) {
                            client.send(createMessage(message.content, true, message.sender));
                        }
                    });
            }

            ws.send(createMessage(`You sent -> ${message.content}`, message.isBroadcast));

        }, 1000);
    });

    ws.send(createMessage('Hi there, I am a WebSocket server'));
    ws.on('error', (err) => {
        console.warn(`Client disconnected - reason: ${err}`);
    })
});

setInterval(() => {
    wss.clients.forEach((ws: WebSocket) => {

        const extWs = ws as ExtWebSocket;

        if (!extWs.isAlive) return ws.terminate();

        extWs.isAlive = false;
        ws.ping(null, undefined);
    });
}, 10000);
server.listen(process.env.PORT || 3000, () => {
    console.log(`Server started on port ${server.address().port} :)`);
});