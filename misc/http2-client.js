const http2 = require('http2');

const client = http2.connect("http://localhost:6000");

//create the request
const request = client.request({
    ":path" : '/'
})

//when a message is recieved, add the pieces of it together until the end is reached
let str = '';
request.on('data', (chunk) => {
    str += chunk;
})

//when the message ends, log it out

request.on('end', () => {
    console.log(str);
})

//end the request
request.end();