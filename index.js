const server = require('./lib/server');
const workers = require('./lib/workers');

 const app = {
    init: () => {
        //start server
        server.init();
        //start the workers
        workers.init();
    }
 }

 app.init();

 module.exports = app;