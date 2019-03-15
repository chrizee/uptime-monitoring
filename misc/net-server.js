//example TCP (NET) server

const net = require('net');

const server = net.createServer((connection) => {
    const message = 'pong';
    connection.write(message);

    //when the client writes something, log it out
    connection.on('data', (inboundMessage) => {
        const messageString = inboundMessage.toString();
        console.log('i wrote '+ message + ' and they said '+ messageString);
    })
})

//listen
server.listen(6000);