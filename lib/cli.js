const readline = require('readline');
const util = require('util');
const debug = util.debuglog('cli');
const events = require('events');
const os = require('os');
const v8 = require('v8');
const _data = require('./data');
const logs = require('./logs');
const helpers = require('./helpers');
class _events extends events{};

const e = new _events();

const cli = {
    init: () => {
        //send the start message to the console
        console.log('\x1b[34m%s\x1b[0m', "The cli is running");

        //start the interface
        const _interface = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            promt: ""
        })

        //create an initial prompt
        _interface.prompt();

        //handle each line of input separately
        _interface.on("line", (str) => {
           //pass to the input processor
           cli.processInput(str);
           //reintialize the prompt
           _interface.prompt(); 
        });

        //if the user stops the cli, kill the process
        _interface.on("close", () => {
            process.exit(0);
        })
    },
    processInput: (str) => {
        str = typeof(str) == 'string' && str.trim().length > 0 ? str : false;
        if(str) {
            //codify the unique strings that the unique question are allowed to 
            const uniqueInputs = [
                'man',
                'help',
                'exit',
                'stats',
                'list users',
                'more user info',
                'list checks',
                'more check info',
                'list logs',
                'more log info'
            ];

            //go through the possible inputs and emit an event when  a match is found
            let matchedFound = false;
            uniqueInputs.some((input) => {
                if(str.toLowerCase().indexOf(input) > -1) {
                    matchedFound = true;
                    //emit an event matching the given input and include the full string entered by the user
                    e.emit(input, str);
                    return true;
                }
            });
            //if no match is found, tell the user to start again
            if(!matchedFound) {
                console.log("Sorry, try again");
            } 
        }
    },
    horizontalLine: () => {
        //get the available screen size
        const width = process.stdout.columns;
        let line = '';
        for(let i = 0; i < width; i++) {
            line += '-';
        }
        console.log(line);
    },
    verticalSpace: (lines) => {
        lines = typeof(lines) == 'number' && lines > 0 ? lines : 1;
        for(let i = 0; i < lines; i++) {
           console.log(""); 
        }
    },
    centered: (str) => {
        str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : "";
        const width = process.stdout.columns;
        const leftPadding = Math.floor((width - str.length) /2);
        //put in left padded spaces before the string itself
        let line = '';
        for(i = 0; i < leftPadding; i++) {
           line += ' '; 
        }
        line += str;
        console.log(line);
    },
    responders: {
        help: () => {
            const commands = {
                man : "Show this help page",
                help : 'Alias of the "man" command',
                exit : "KIll the cli and the rest of the app",
                stats : "Get the statistics on the underlying operating system and resource utilization",
                'list users': "Show a list of all the registered (undeleted) users in the system",
                'more user info --{userId}': "Show details of a specific user",
                'list checks --up --down': 'Show a list of all the active checks in the system including their state. The "--up" and the "--down" are both optional',
                'more check info --{checkId}': "Show details of a specified check",
                'list logs': "Show a list of all log files available to be read (compressed and uncompressed)",
                'more log info --{fileName}': "Show details of a specified log file"
            };
            //show a header for the help page that is as wide as the screen
            cli.horizontalLine();
            cli.centered("CLI MANUAL");
            cli.horizontalLine();
            cli.verticalSpace(2);

            //show each command followed by its explanation in white and yellow respectively
            for(let key in commands) {
                if(commands.hasOwnProperty(key)) {
                    const value = commands[key];
                    let line = '\x1b[33m'+ key +'\x1b[0m';
                    const padding = 60 - line.length;
                    for(let i = 0; i < padding; i++) {
                        line += " ";
                    }
                    line += value;
                    console.log(line);
                    cli.verticalSpace();
                }
            }
            cli.verticalSpace();
            //end with an horizontal line
            cli.horizontalLine();
        },
        exit: () => {
            console.log("Goodbye from this app");
            process.exit(0);
        },
        stats: () => {
            //compile an object of stats
            const stats = {
                'Load Average': os.loadavg().join(' '),
                'CPU Count': os.cpus.length,
                'Free Memory': os.freemem(),
                'Current Malloced Memory': v8.getHeapStatistics().malloced_memory,
                'Peak Malloced Memory': v8.getHeapStatistics().peak_malloced_memory,
                'Allocated Heap Used(%)': Math.round((v8.getHeapStatistics().used_heap_size / v8.getHeapStatistics().total_heap_size) * 100),
                'Available Haep Allocated (%)': Math.round((v8.getHeapStatistics().total_heap_size / v8.getHeapStatistics().heap_size_limit) * 100),
                'Uptime': os.uptime()+" seocnds" , 
            }

            cli.horizontalLine();
            cli.centered("System Statistics");
            cli.horizontalLine();
            cli.verticalSpace(2);

            for(let key in stats) {
                if(stats.hasOwnProperty(key)) {
                    const value = stats[key];
                    let line = '\x1b[33m'+ key +'\x1b[0m';
                    const padding = 60 - line.length;
                    for(let i = 0; i < padding; i++) {
                        line += " ";
                    }
                    line += value;
                    console.log(line);
                    cli.verticalSpace();
                }
            }

            cli.verticalSpace();
            //end with an horizontal line
            cli.horizontalLine();
        },
        listUsers: () => {
           _data.list("users", (err, userId) => {
              if(!err && userId && userId.length > 0) {
                cli.verticalSpace();
                userId.forEach(id => {
                    _data.read('users', id, (err, userData) => {
                        if(!err && userData) {
                            let line = "Name: "+ userData.firstname+ ' '+ userData.lastname+ ' Phone: '+ userData.phone+ ' Checks: ';
                            const numberOfChecks = typeof(userData.checks) == 'object' && Array.isArray(userData.checks) && userData.checks.length > 0 ? userData.checks.length : 0;
                            line += numberOfChecks;
                            console.log(line);
                            cli.verticalSpace();
                        }
                    })
                });
              }
           }) 
        },
        moreUserInfo: (str) => {
            //get user id from the str variable
            const arr = str.split("--");
            const userId = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
            if(userId) {
                _data.read("users", userId, (err, userData) => {
                    if(!err && userData) {
                        //remove the hash password
                        delete userData.password;
                        cli.verticalSpace();
                        console.dir(userData, {colors: true});
                        cli.verticalSpace();
                    }
                })
            }
        },
        listChecks: (str) => {
            _data.list("checks", (err, checkList) => {
                if(!err && checkList && checkList.length > 0) {
                    cli.verticalSpace();
                    checkList.forEach(id => {
                        _data.read("checks", id, (err, checkData) => {                            
                            let lowerString = str.toLowerCase();
                            //get state of the check
                            const state = typeof(checkData.state) == 'string' ? checkData.state : "down";
                            const stateOrUnknown = typeof(checkData.state) == 'string' ? checkData.state : "unknown";
                             if(lowerString.indexOf('--'+state) > -1 || (lowerString.indexOf('--down') == -1 && lowerString.indexOf('--up') == -1)) {
                                const line = "ID: "+ checkData.id+' '+checkData.method.toUpperCase()+' '+checkData.protocol+'://'+checkData.url+' State: '+ stateOrUnknown;
                                console.log(line);
                                cli.verticalSpace();
                             }
                        })
                    });
                }
            })
        },
        moreCheckInfo: (str) => {
            const arr = str.split("--");
            const checkId = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
            if(checkId) {
                _data.read("checks", checkId, (err, checkData) => {
                    if(!err && checkData) {
                        cli.verticalSpace();
                        console.dir(checkData, {colors: true});
                        cli.verticalSpace();
                    }
                })
            }
        },
        listLogs: () => {
            logs.list(true, (err, logFilenames) => {
                if(!err && logFilenames && logFilenames.length > 0) {
                    cli.verticalSpace();
                    logFilenames.forEach(filename => {
                        if(filename.indexOf('-') > -1) {
                            console.log(filename);
                            cli.verticalSpace();
                        }
                    });
                }
            })
        },
        moreLogInfo: (str) => {
            const arr = str.split("--");
            const logFilename = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
            if(logFilename) {
               cli.verticalSpace();
               //decompress the logfile
               logs.decompress(logFilename, (err, data) => {
                   if(!err && data) {
                        //split into lines
                        const arr2 = data.split('\n');
                        arr2.forEach(str => {
                            const logObject = helpers.parseJsonToObject(str);
                            if(logObject && JSON.stringify(logObject) !== {}) {
                                console.dir(logObject, {colors: true});
                                cli.verticalSpace();
                            }
                        });
                   }
               })
            }
        }
    }
}

//event listeners 
e.on("man", (str) => {
    cli.responders.help();
});
e.on("help", (str) => {
    cli.responders.help();
});
e.on("exit", (str) => {
    cli.responders.exit();
});
e.on("stats", (str) => {
    cli.responders.stats();
});
e.on("list users", (str) => {
    cli.responders.listUsers();
});
e.on("more user info", (str) => {
    cli.responders.moreUserInfo(str);
});
e.on("list checks", (str) => {
    cli.responders.listChecks(str);
});
e.on("more check info", (str) => {
    cli.responders.moreCheckInfo(str);
});
e.on("list logs", (str) => {
    cli.responders.listLogs();
});
e.on("more log info", (str) => {
    cli.responders.moreLogInfo(str);
});

module.exports = cli;