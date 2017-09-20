const express = require('express');

const app = express();

const http = require('http').Server(app);

const WebSocketServer = require('ws').Server;

const wss = new WebSocketServer({
  port: 9000,
});
const users = {};

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

wss.broadcast = data => wss.clients.forEach(client => client.send(data));

wss.on('connection', (ws, req) => {
  users[req.url.substring(1)] = ws;
  console.log(0, req.url.substring(1));
  users[req.url.substring(1)].send(JSON.stringify({ type: 'ready' }));
  ws.on('message', (msg) => {
    const message = JSON.parse(msg);
    // if (message.type === 'localIceCandidate') {
    //   console.log(msg);
    //   wss.broadcast(msg);
    // }
    // if (message.type === 'remoteIceCandidate') {
    //   console.log(msg);
    //   wss.broadcast(msg);
    // }
    // if (message.type === 'offer') {
    //   console.log(msg);
    //   wss.broadcast(msg);
    // }
    // if (message.type === 'answer') {
    //   console.log(msg);
    //   wss.broadcast(msg);
    // }
    if (message.data.type === 'iceCandidate') {
      console.log(1, message.toUser);
      users[message.toUser].send(msg);
    }
    if (message.data.type === 'incoming call') {
      console.log(2, message);
      users[message.toUser].send(msg);
    }
    if (message.data.type === 'offer') {
      console.log(3, message.toUser);
      users[message.toUser].send(msg);
    }
    if (message.data.type === 'answer') {
      console.log(4, message.toUser);
      users[message.toUser].send(msg);
    }
  });
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
