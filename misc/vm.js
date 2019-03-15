/*
*   an example VM
*   running arbitrary commands
*/
const vm = require('vm');

//define a context for the script to run in
const context = {
    foo: 25
}

const script = new vm.Script(`
    foo = foo * 2;
    let bar =  foo + 1;
    let fizz = 52;
`);

//run the script
script.runInNewContext(context)
console.log(context);