const express = require('express');

const app = express();

const http = require('http').Server(app);

const WebSocketServer = require('ws').Server;

const wss = new WebSocketServer({
  port: 8000,
});
const users = {};

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

wss.broadcast = data => wss.clients.forEach(client => client.send(data));

wss.on('connection', (ws, req) => {
  users[req.url.substring(1)] = ws;
  users[req.url.substring(1)].send(JSON.stringify({ type: 'ready' }));
  ws.on('message', (msg) => {
    const message = JSON.parse(msg);
    if (message.type === 'localIceCandidate') {
      console.log(msg);
      users[message.toUser].send(msg);
    }
    if (message.type === 'remoteIceCandidate') {
      console.log(msg);
      users[message.toUser].send(msg);
    }
    if (message.type === 'offer') {
      console.log(msg);
      wss.broadcast(msg);
    }
    if (message.type === 'answer') {
      console.log(msg);
      wss.broadcast(msg);
    }
  });
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
