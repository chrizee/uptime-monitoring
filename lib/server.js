const http = require('http');
const https = require('https');
const url = require('url');
const path = require('path');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');
const handlers = require('./handlers');
const helpers = require('./helpers');
const util = require('util');

const debug = util.debuglog('server');
//const _data = require('./lib/data');

// helpers.sendTwilioSms("08182642340", "Testing from twilio", (err) => {
//     console.log(err);
// });
//delete file
// _data.delete('test', 'newfile', (err) => {
//     console.error("error", err);
// })
//update file 
// _data.update('test','newfile', {name: 'christopher3'}, (err) => {
//     console.error("error", err);
// })
//read from file
// _data.read('test','newfile', (err, data) => {
//     console.error("error", err, 'data', data);
// })

//create file
// _data.create('test','newfile', {new: 'okoro'}, (err, data) => {
//     console.error("error", err);
// })

const server = {};

//instantiate http server
server.httpServer = http.createServer((req,res) => {
   server.unifiedServer(req,res);
});

//create options for https server using generated certificate files
server.httpsServerOptions = {
    key: fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
    cert: fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
};

//instantiate https server
server.httpsServer = https.createServer(server.httpsServerOptions, (req,res) => {
    server.unifiedServer(req,res);
 });
 

//function to handle server logic
server.unifiedServer = (req,res) => {
     //get the request url and parse it
     const parseUrl = url.parse(req.url, true);

     //get the path
     const path = parseUrl.pathname;
     const trimmedPath = path.replace(/^\/+|\/+$/g,'');
 
     //get querystring as object
     const queryStringObject = parseUrl.query;
 
     //get http method
     const method = req.method.toLowerCase();
 
     //get the headers as an object
     const headers = req.headers
 
     //get the request payload
     const decoder = new StringDecoder('utf-8');
     let buffer = '';
     req.on('data', (data) => {
         buffer += decoder.write(data);
     });
     req.on('end', () => {
         buffer += decoder.end();
         let chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;
         //if the request is within the public directory, use the public handler instead
         chosenHandler = trimmedPath.indexOf("public/") > -1 ? handlers.public : chosenHandler;
         //construct data object to send to the handler
         const data = {
             trimmedPath,queryStringObject, method,headers,
             payload: helpers.parseJsonToObject(buffer)
         };
         //route the request to the handler specified in the router
         chosenHandler(data, (statusCode = 200, payload = {}, contentType) => {
            //determine the type of response (fallback to json)
            contentType = typeof(contentType) == 'string' ? contentType : "json";            

             let payloadString = '';
             if(contentType == 'json') {
                //convert payload to string
                payloadString = JSON.stringify(payload);          
                //set response headers
                res.setHeader('content-Type', 'application/json');
             }
             if(contentType == 'html') {
                //set response headers
                res.setHeader('content-Type', 'text/html');
                payloadString = typeof(payload) == 'string' ? payload : "";
             }
             if(contentType == 'favicon') {
                //set response headers
                res.setHeader('content-Type', 'image/x-icon');
                payloadString = typeof(payload) !== 'undefined' ? payload : "";
             }
             if(contentType == 'css') {
                //set response headers
                res.setHeader('content-Type', 'text/css');
                payloadString = typeof(payload) !== 'undefined' ? payload : "";
             }
             if(contentType == 'png') {
                //set response headers
                res.setHeader('content-Type', 'image/png');
                payloadString = typeof(payload) !== 'undefined' ? payload : "";
             }
             if(contentType == 'jpg') {
                //set response headers
                res.setHeader('content-Type', 'image/jpeg');
                payloadString = typeof(payload) !== 'undefined' ? payload : "";
             }
             if(contentType == 'plain') {
                //set response headers
                res.setHeader('content-Type', 'text/plain');
                payloadString = typeof(payload) !== 'undefined' ? payload : "";
             }

             //return the response
             res.writeHead(statusCode);
             res.end(payloadString);

             //if the response is 200, print in green otherwise print in red
             if(statusCode == 200) {
                debug('\x1b[32m%s\x1b[0m', method.toUpperCase()+ " /"+ trimmedPath+ " ", statusCode);
             } else {
                debug('\x1b[31m%s\x1b[0m', method.toUpperCase()+ " /"+ trimmedPath+ " ", statusCode);
             }
         });
     });
}

server.router = {
    sample: handlers.sample,
    ping: handlers.ping,
    "api/users": handlers.users,
    "api/tokens": handlers.tokens,
    "api/checks": handlers.checks,
    "" : handlers.index,
    "account/create": handlers.accountCreate,
    "account/edit": handlers.accountEdit,
    "account/deleted": handlers.accountDeleted,
    "session/create": handlers.sessionCreate,
    "session/deleted": handlers.sessionDeleted,
    "checks/all": handlers.checksList,
    "checks/create": handlers.checksCreate,
    "checks/edit": handlers.checksEdit,
    "favicon.ico": handlers.favicon,
    "public": handlers.public
}

//init server
server.init = () => {
    //start http server
    server.httpServer.listen(config.httpPort, () => {
        console.log('\x1b[35m%s\x1b[0m', "server started on port " +config.httpPort+" on "+config.envName+ " environment");
    });
    //start https server
    server.httpsServer.listen(config.httpsPort, () => {
        console.log('\x1b[36m%s\x1b[0m', "server started on port " +config.httpsPort+" on "+config.envName+ " environment");    
    })
}

module.exports = server;
//command to generate ssl certificate
//openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
