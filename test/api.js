//api tests

const app = require('./../index');
const assert = require('assert');
const http = require('http');
const config = require('./../lib/config');

const api = {
    //the main init function should run without throwing
    "app init should start without throwing": (done) => {
       assert.doesNotThrow(() => {
           app.init(() => {
               done();
           });
       }, TypeError) 
    },
    "/ping should respond to GET with 200": (done) => {
        helpers.makeGetRequest('/ping', (res) => {
            assert.equal(res.statusCode, 200);
            done();
        });
    },
    "/api/users should response to GET with 400": (done) => {
        helpers.makeGetRequest('/api/users', (res) => {
            assert.equal(res.statusCode, 400);
            done();
        });
    },
    "A random path should respond to GET with 404": (done) => {
        helpers.makeGetRequest('/this/path/should/not/exist', (res) => {
            assert.equal(res.statusCode, 404);
            done();
        });
    }
}


const helpers = {
    makeGetRequest: (path, callback) => {
        //configure the request details
        const requestDetails = {
            protocol: 'http:',
            hostname: 'localhost',
            port: config.httpPort,
            method: "GET",
            path,
            headers : {
                "Content-Type": 'appication/json'
            }
        }

        const req = http.request(requestDetails, (res) => {
            callback(res);
        })
        //send the request
        req.end();
    }
}
module.exports = api;