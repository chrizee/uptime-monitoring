const http2 = require('http2');

const server = http2.createServer();

//on a stream, send back hello world (websocket connection)
server.on('stream', (stream, headers) => {
    stream.respond({
        status: 200,
        'content-type': 'text/html'
    });
    stream.end("<html><body><p>Hello world</p></body></html>")
})

server.listen(6000);