const server = require('./lib/server');
const workers = require('./lib/workers');
const cli = require('./lib/cli');
const exampleDebuggingProblem = require('./lib/exampleDebuggingProblem');

 const app = {
    init: () => {
        //start server
        server.init();
        debugger;
        //start the workers
        workers.init();
        setTimeout(() => {
            cli.init();
        }, 500);
        debugger;
        exampleDebuggingProblem.init();
        debugger;
    }
 }

 app.init();

 module.exports = app;