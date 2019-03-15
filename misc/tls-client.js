//example tls client
//connects to port 6000 and sends 'ping' to the server

const tls = require('tls');
const fs = require('fs');
const path = require('path');

const options = {
    ca: fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))  //only required for self signed certificate
}

const message = 'ping';

//create the client
const client = tls.connect(6000, options, () => {
    //send the message
    client.write(message);
});

//when the server writes back, log the response
client.on('data', (inBoundMessage) => {
    const messageString = inBoundMessage.toString();
    console.log("I wrote "+ message+ " and they said "+ messageString);
})

