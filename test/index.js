//application logic for test runner

//override the NODE_ENV variable
process.env.NODE_ENV = 'testing';

const _app = {
    tests: {
        unit: require('./unit'),
        api: require('./api'),
    },
    runTests: () => {
        let errors = [];
        let successes = 0;
        const limit = _app.countTests();
        let counter = 0;
        for(let key in _app.tests) {
            if(_app.tests.hasOwnProperty(key)) {
                const subTest = _app.tests[key];
                for(let testName in subTest) {
                    if(subTest.hasOwnProperty(testName)) {
                        (function() {
                            let tempTestName = testName;
                            let testValue = subTest[testName];
                            //call the test
                            try {
                                testValue(() => {
                                    //if it calls back with out throwing, then it succeed
                                    console.log('\x1b[32m%s\x1b[0m', tempTestName);
                                    counter++;
                                    successes++;
                                    if(counter == limit) {
                                        _app.produceTestReport(limit, successes,errors);
                                    }
                                })
                            } catch (error) {
                                errors.push({
                                    name: testName,
                                    error: error
                                });
                                console.log('\x1b[31m%s\x1b[0m', tempTestName);
                                counter++;
                                if(counter == limit) {
                                    _app.produceTestReport(limit, successes,errors);
                                }
                            }
                        })();
                    }
                }
            }
        }
    },
    countTests: () => {
        let counter = 0;
        for(let key in _app.tests) {
            if(_app.tests.hasOwnProperty(key)) {
                let subTest = _app.tests[key];
                for(let testName in subTest) {
                    if(subTest.hasOwnProperty(testName)) {
                        counter++;
                    }
                }
            }
        }
        return counter;
    },
    produceTestReport: (limit, successes, errors) => {
        console.log("");
        console.log("---------------------BEGIN TEST REPORT---------------------");
        console.log('');
        console.log("Total Tests: ", limit);
        console.log("Pass: ", successes);
        console.log("Fail: ", errors.length);
        console.log("");
        //if there are errors, print then in details
        if(errors.length > 0) {
            console.log("---------------------BEGIN ERROR DETAILS---------------------");
            console.log("");

            errors.forEach(error => {
                console.log('\x1b[31m%s\x1b[0m', error.name);
                console.log(error.error);
                console.log("");                
            });

            console.log("");
            console.log("---------------------END ERROR DETAILS---------------------");

        }

        console.log("");
        console.log("---------------------END TEST REPORT---------------------");        
        //stop the app from running after test cos the init function has been called in the test
        process.exit(0);
    }
}
_app.runTests();

