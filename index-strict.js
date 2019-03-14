const server = require('./lib/server');
const workers = require('./lib/workers');
const cli = require('./lib/cli');

foo = 'bar';
 const app = {
    init: () => {
        //start server
        server.init();
        //start the workers
        workers.init();
        setTimeout(() => {
            cli.init();
        }, 500);
    }
 }

 app.init();

 module.exports = app;