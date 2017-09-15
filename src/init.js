// // let isInitiator = false;
// const roomName = prompt('Enter room name:');
// /* eslint-disable no-undef */
// const socket = io.connect('http://127.0.0.1:3000');
//
// if (roomName !== '') {
//   console.log(`Joining room ${roomName}`);
//   socket.emit('create or join', roomName);
// }
//
// socket.on('full', (room) => {
//   console.log(`Room ${room} is full`);
// });
//
// socket.on('empty', (room) => {
//   // isInitiator = true;
//   console.log(`Room ${room} is empty`);
// });
//
// socket.on('join', (room) => {
//   console.log(`Making request to join room ${room}`);
//   console.log('You are the initiator!');
// });
//
// socket.on('log', (array) => {
//   console.log(...array);
// });
