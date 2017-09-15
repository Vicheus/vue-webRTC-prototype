const serverStatic = require('node-static');
const http = require('http');
const file = new serverStatic.Server();
const app = http.createServer((req, res) => {
  file.serve(req, res);
}).listen(3000);

const io = require('socket.io').listen(app);

io.sockets.on('connection', (socket) => {
  // convenience function to log server messages on the client
  function log(...args) {
    const array = ['>>> Message from server: '];
    for (let i = 0; i < args.length; i++) {
      array.push(args[i]);
    }
    socket.emit('log', array);
  }

  socket.on('message', (message) => {
    log('Got message:', message);
    // for a real app, would be room only (not broadcast)
    socket.broadcast.emit('message', message);
  });

  socket.on('create or join', (room) => {
    const numClients = io.sockets.clients(room).length;

    log(`Room ${room} has ${numClients} client(s)`);
    log(`Request to create or join room ${room}`);
    if (numClients === 0) {
      socket.join(room);
      socket.emit('created', room);
    } else if (numClients === 1) {
      io.sockets.in(room).emit('join', room);
      socket.join(room);
      socket.emit('joined', room);
    } else { // max two clients
      socket.emit('full', room);
    }
    socket.emit(`emit(): client ${socket.id} joined room ${room}`);
    socket.broadcast.emit(`broadcast(): client ${socket.id} joined room ${room}`);
  });
});
