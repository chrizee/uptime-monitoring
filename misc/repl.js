const repl = require('repl');

repl.start({
    prompt: '>',
    eval: (str) => {
        //evaluation function
        console.log("We are in the evaluation stage", str);

        if(str.indexOf('fizz') > -1) {
            console.log('buzz');
        }
    }
})