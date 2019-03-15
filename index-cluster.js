const server = require('./lib/server');
const workers = require('./lib/workers');
const cli = require('./lib/cli');
const cluster = require('cluster');
const os = require('os');

 const app = {
    init: (callback) => {
        //start workers and cli in master thread
        if(cluster.isMaster) {
            //start the workers
            workers.init();
            setTimeout(() => {
                cli.init();
                callback();
            }, 500);
            //fork the process
            for(let i = 0; i <= os.cpus.length; i++) {
                cluster.fork();
            }
        } else {
            //start server if not on master thread
            server.init();
        }                
    }
 }

 //self invoking only if required directly 
 //returns true if this file is executed directly from the terminal and not when in another module
 if(require.main === module) {
    app.init(() => {});
 }

 module.exports = app;