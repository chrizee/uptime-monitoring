/*
*   Example UDP
*   sending a message to a UDP server on port 6000
*/
const dgram = require('dgram');

//create a client
const client = dgram.createSocket('udp4');

//define the message and pull it into a buffer
const messageString = "This is message";
const messageBuffer = Buffer.from(messageString);

//send the message
client.send(messageBuffer, 6000, 'localhost', (err) => {
    client.close();
})