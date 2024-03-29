const server = require('./lib/server');
const workers = require('./lib/workers');
const cli = require('./lib/cli');

 const app = {
    init: (callback) => {
        //start server
        server.init();
        //start the workers
        workers.init();
        setTimeout(() => {
            cli.init();
            callback();
        }, 500);
    }
 }

 //self invoking only if required directly 
 //returns true if this file is executed directly from the terminal and not when in another module
 if(require.main === module) {
    app.init(() => {});
 }

 module.exports = app;