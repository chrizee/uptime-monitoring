//example tcp client
//connects to port 6000 and sends 'ping' to the server

const net = require('net');

const message = 'ping';

//create the client
const client = net.createConnection({port: 6000}, () => {
    //send the message
    client.write(message);
});

//when the server writes back, log the response
client.on('data', (inBoundMessage) => {
    const messageString = inBoundMessage.toString();
    console.log("I wrote "+ message+ " and they said "+ messageString);
})

