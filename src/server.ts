import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({server});
wss.on('connection', (ws: ExtWebSocket) => {
    ws.isAlive = true;
    ws.on('pong', () => {
        ws.isAlive = true;
    });
    ws.on('message', (message: string) => {
       console.log('received: %s' + message);

       const broadcastRegex = /^broadcast\:/;

       if (broadcastRegex.test(message)) {
           message = message.replace(broadcastRegex, '');

           //send back the message to the other clients
           wss.clients
               .forEach(client => {
                   if (client != ws) {
                       client.send(`Hello, broadcast message -> ${message}`);
                   }
               });

       } else {
           ws.send(`Hello, you sent -> ${message}`);
       }
   });
});

setInterval(()=>{
    wss.clients.forEach((ws: ExtWebSocket) =>{
        if (!ws.isAlive) return ws.terminate();
        ws.isAlive = false;
        ws.ping(null, false, true);
    });
}, 10000);

server.listen(process.env.PORT || 3000, () => {
    console.log(`Server started on port ${server.address().port}:)))`);
});
