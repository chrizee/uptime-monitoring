const helpers = require('./../lib/helpers');
const assert = require('assert');
const logs = require("./../lib/logs");
const exampleDebuggingProblem = require('./../lib/exampleDebuggingProblem');

//application logic for test runner

const unit = {
    //assert that getANumber function is returning 1
    "helpers.getANumber should return 1": (done) => {
        const val = helpers.getANumber();
        assert.equal(val, 1);
        done();
    },
    //assert that getANumber function is returning a number
    "helpers.getANumber should return a number": (done) => {
        const val = helpers.getANumber();
        assert.equal(typeof(val), 'number');
        done();
    },
    //assert that getANumber function is returning a number
    "helpers.getANumber should return 2": (done) => {
        const val = helpers.getANumber();
        assert.equal(val, 2);
        done();
    },
    //logs.list should callback an array and a false error
    "logs.list should callback a false error and an array of logs names": (done) => {
        logs.list(true, (err, logFilenames) => {
            assert.equal(err, false);
            assert.ok(logFilenames instanceof Array);
            assert.ok(logFilenames.length > 1);
            done();
        });
    },
    //logs.truncate should not throw if the log id doesn't exist
    "logs.truncate should not throw if the logId does not exist. It should callback an error instead": (done) => {
        assert.doesNotThrow(() => {
            logs.truncate("i dont not exist", (err) => {
                assert.ok(err);
                done();
            });
        }, TypeError);
    },
    //exampleDebuggingProblem.init should not throw (but it does)
    "exampleDebuggingProblem.init should not throw when called": (done) => {
        assert.doesNotThrow(() => {
            exampleDebuggingProblem.init();
            done();
        }, TypeError);
    }
}

module.exports = unit;