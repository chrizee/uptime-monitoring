const _data = require('./data');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const helpers = require('./helpers');
const url = require('url');
const _logs = require('./logs');
const util = require('util');

const debug = util.debuglog('workers');

const workers = {
    init: () => {
        //log in yellow
        console.log('\x1b[33m%s\x1b[0m', "Backgroud workers running");
        workers.gatherAllchecks();
        //workers.loop();
        //compress all the logs immediately
        workers.rotateLogs();
        //call the compression loop
        workers.logRotationLoop();
    },
    //timer to execute worker process once per minute
    loop: () => {
        setInterval(() => {
            workers.gatherAllchecks();
        }, 1000 * 5)
    },
    gatherAllchecks: () => {
        //get all checks in the system
        _data.list('checks', (err, data) => {
            if(!err && data && data.length > 0) { 
                data.forEach(check => {
                    //read check data
                    _data.read("checks", check, (err, originalCheckData) => {
                        if(!err && originalCheckData) {
                            //pass data to validator
                            workers.validateCheckData(originalCheckData);
                        } else {
                            debug("Error reading one of the checks data");
                        }
                    })
                });
            } else {
                debug("Could not find any checks to process");
            }
        })
    },
    validateCheckData: (originalCheckData) => {
        originalCheckData = typeof(originalCheckData) === 'object' && originalCheckData !== 'null' ? originalCheckData : {};
        originalCheckData.id = typeof(originalCheckData.id) === 'string' && originalCheckData.id.trim().length == 20 ? originalCheckData.id : false;
        originalCheckData.phone = typeof(originalCheckData.phone) === 'string' && originalCheckData.phone.trim().length == 11 ? originalCheckData.phone : false;
        originalCheckData.protocol = typeof(originalCheckData.protocol) === 'string' && ['http', 'https'].indexOf(originalCheckData.protocol.trim()) > -1 ? originalCheckData.protocol : false;
        originalCheckData.url = typeof(originalCheckData.url) === 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url : false;
        originalCheckData.method = typeof(originalCheckData.method) === 'string' && ['post', 'get', 'put', 'delete'].indexOf(originalCheckData.method.trim()) > -1 ? originalCheckData.method : false;
        originalCheckData.successCodes = Array.isArray(originalCheckData.successCodes) && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes : false;
        originalCheckData.timeoutSeconds = originalCheckData.timeoutSeconds >= 1 && originalCheckData.timeoutSeconds <= 5 && originalCheckData.timeoutSeconds % 1 === 0 ? originalCheckData.timeoutSeconds : false;
        
        //set new keys that will be updated by the workers
        originalCheckData.state = typeof(originalCheckData.protocol) === 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down';
        originalCheckData.lastchecked = originalCheckData.lastchecked >= 1 ? originalCheckData.lastchecked : false;
        //if validation passes, pass it down to the actual
        if(originalCheckData.id &&
            originalCheckData.phone &&
            originalCheckData.protocol &&
            originalCheckData.url &&
            originalCheckData.method &&
            originalCheckData.successCodes &&
            originalCheckData.timeoutSeconds
        ) {
            workers.performCheck(originalCheckData);
        } else {
            debug("Error: One of the check is not properly formatted");
        }
    },
    performCheck: (originalCheckData) => {
        //prepare the initial check outcome
        let checkOutcome = {
            error: false,
            responseCode: false
        }

        let outcomeSent = false;
        let parsedUrl = url.parse(originalCheckData.protocol + '://' + originalCheckData.url.trim(), true);
        const hostname = parsedUrl.hostname;
        const path = parsedUrl.path //using path and not pathname because we want the query string too
        
        //construct the request
        const requestDetails = {
            protocol: originalCheckData.protocol+ ':',
            hostname,
            method: originalCheckData.method.toUpperCase(),
            path,
            timeout: originalCheckData.timeoutSeconds * 1000
        }
        

        //instantiate the request object  using the right module
        const _moduleToUse = originalCheckData.protocol == 'http' ? http : https;
        const req = _moduleToUse.request(requestDetails, (res) => {
            //update check outcome and pass data along
            checkOutcome.responseCode  = res.statusCode;
            if(!outcomeSent) {
                workers.processCheckData(originalCheckData, checkOutcome);
                outcomeSent = true;
            }            
        });

        //bind to error event so it doesn't get thrown
        req.on("error", (err) => {
            checkOutcome.error = {
                error: true,
                value: err
            }
            if(!outcomeSent) {
                workers.processCheckData(originalCheckData, checkOutcome);
                outcomeSent = true;
            }
        });
        
        //bind to the timeout event
        req.on("timeout", (err) => {
            checkOutcome.error = {
                error: true,
                value: "timeout"
            }
            if(!outcomeSent) {
                workers.processCheckData(originalCheckData, checkOutcome);
                outcomeSent = true;
            }
        });

        //end the request
        req.end();

    },
    //process check outcome
    processCheckData: (originalCheckData, checkOutcome) => {
        const state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';
        //decide if alert is wanted
        const alertWanted =  originalCheckData.lastchecked && originalCheckData.state != state ? true : false;
        //update the check data
        const timeOfCheck = Date.now();
        let newCheckData = originalCheckData;
        newCheckData.state = state;
        newCheckData.lastchecked = timeOfCheck;

        //log the outcome of the check
        
        workers.log(originalCheckData, checkOutcome, state, alertWanted, timeOfCheck);
        //save the update
        _data.update("checks", newCheckData.id, newCheckData, (err) => {
            if(!err) {
                if(alertWanted) {
                    workers.alertUserToStatusChange(newCheckData);
                } else {
                    debug("check outcome has not changed yet");
                }
            } else {
                debug("Erro trying the save updates to one of the checks");
            }
        });
    },
    alertUserToStatusChange: (newCheckData) => {
        const msg = "Alert: your check for "+ newCheckData.method.toUpperCase()+ " "+ newCheckData.protocol+ "://"+ newCheckData.url+ "is currently " + newCheckData.state;
        helpers.sendTwilioSms(newCheckData.phone, msg, (err) => {
            if(!err) {
                debug("user was alerted to a change in their check", msg);
            } else {
                debug("Could not send message to user");
            }
        })
    },
    log: (originalCheckData, checkOutcome, state, alertWanted, timeOfCheck) => {
        //form the log data
        const logData = {
            check: originalCheckData,
            outcome: checkOutcome,
            state,
            alert: alertWanted,
            time: timeOfCheck
        }

        const logString = JSON.stringify(logData);

        //determine the name of the log file
        const logFileName = originalCheckData.id
        //append the log string to the file
        _logs.append(logFileName, logString, (err) => {
            if(!err) {
                debug("logging to file succeeded");
            } else {
                debug("logging to file failed");
            }
        });
    },
    //rotate logs once a day
    logRotationLoop: () => {
        setInterval(() => {
            workers.rotateLogs();
        }, 1000 * 60 * 60 * 24);
    },
    rotateLogs: () => {
        //list all the non compressed log files
        _logs.list(false, (err, logs) => {
            if(!err && logs && logs.length) {
                logs.forEach((log) => {
                    //compress the data to a different file
                    const logId = log.replace(".log", '');
                    const newfileId = logId+ '-'+ Date.now();
                    _logs.compress(logId, newfileId, (err) => {
                        if(!err) {
                            //truncate the log
                            _logs.truncate(logId, (err) => {
                                if(!err) {
                                    debug("Success truncting the log file");
                                } else {
                                    debug("Error truncting the log file");
                                }
                            });
                        } else {
                            debug("Error compressing one of the log files", err);
                        }
                    });

                })
            } else {
                debug("Error: could not find logs to rotate");
            }
        });
    }

}

module.exports = workers;