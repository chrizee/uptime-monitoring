//example TLS server

const tls = require('tls');
const fs = require('fs');
const path = require('path');

const options = {
    key: fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
    cert: fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
}

const server = tls.createServer(options, (connection) => {
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