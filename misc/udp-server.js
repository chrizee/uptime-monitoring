/*
*   Example UDP
*   Creating a UDP datagram server on port 6000
*/
const dgram = require('dgram');

//create a server
const server = dgram.createSocket('udp4');

server.on('message', (messageBuffer, sender) => {
    const messageString = messageBuffer.toString();
    console.log(messageString);
});

//bind to port
server.bind(6000);