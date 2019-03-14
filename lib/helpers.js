const crypto = require('crypto');
const config = require('./config');
const querystring = require('querystring');
const https = require('https');
const path = require('path');
const fs = require('fs');

const helpers = {
    hash: (string) => {
        if(typeof(string) == 'string' && string.length > 0) {
            return crypto.createHmac('sha256', config.hashSecret).update(string).digest('hex');
        } else {
            return false;
        }
    },
    parseJsonToObject: (string) => {
        try {
            return JSON.parse(string);
        } catch (error) {
            return {};
        }
    },
    //creates a string of random alphanumeric characters of a given length
    createRandomString: (stringLength) => {
        if(stringLength) {
            const possibleCharaters = 'abcdefghijklmnopqrstuvwxyz0123456789';
            let randString = '';
            for(let i = 1; i <= stringLength; i++) {
                randString += possibleCharaters.charAt(Math.floor(Math.random() * possibleCharaters.length));
            }
            return randString;
        } else {
            return false;
        }
    },
    sendTwilioSms: (phone, msg, callback) => {
        if(phone && phone.length == 11 && msg && msg.length > 0 && msg.length <=1600) {
            const payload = {
                From: config.twilio.fromPhone,
                To: "+234" + phone.substring(1),    //remove the first 0 from the number and add the country code
                Body: msg
            };
            const stringPayload = querystring.stringify(payload);
            const requestDetails = {
                protocol: 'https:',
                hostname: 'api.twilio.com',
                method: 'POST',
                path: '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
                auth: config.twilio.accountSid+':'+config.twilio.authToken,
                headers: {
                    "Content-Type": 'application/x-www-form-urlencoded',
                    "Content-Length": Buffer.byteLength(stringPayload)
                }        
            }
            const request = https.request(requestDetails, (res) => {
                //get status of the request
                const status = res.statusCode;
                if(status == 200 || status == 201) {
                    callback(false);
                } else {
                    callback('Status code returned was '+ status);
                }
            });
            //bind to the error event so it doesn't get thrown
            request.on('error', (err) => {
                callback(err);
            });
            //add the payload
            request.write(stringPayload);
            //end the request
            request.end();
        } else {
           callback("Given parameters are missing are or invalid"); 
        }
    },
    //get the string content of a template
    getTemplate: (templateName, data, callback) => {
        templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false;
        data = typeof(data) == 'object' && data !== null ? data : {};
        if(templateName) {
            const templateDir = path.join(__dirname, "/../templates/");
            fs.readFile(templateDir+templateName+".html", 'utf-8', (err, str) => {
                if(!err && str && str.length > 0) {
                    //do interpolation on the string before returning it
                    const finalString = helpers.interpolate(str, data);
                    callback(false, finalString);
                } else {
                    callback("No template could be found");
                }
            })
        } else {
            callback("A valid template name was not specified");
        }
    },
    //add the universal header and footer to a string and pass provided data object to the header and footer
    addUniversalTemplate: (str, data, callback) => {
        str = typeof(str) == 'string' && str.length > 0 ? str : '';
        data = typeof(data) == 'object' && data !== null ? data : {};
        //get the header
        helpers.getTemplate("_header", data, (err, headerStr) => {            
            if(!err && headerStr) {
                helpers.getTemplate("_footer", data, (err, footerString) => {
                    if(!err && footerString) {
                        const fullString = headerStr+ str + footerString;
                        callback(false, fullString);
                    } else {
                        callback("could not find the footer template");
                    }
                })
            } else {
                callback("Could not find the header template");
            }
        })
    },
    //take string and data object and find/replace all keys within it
    interpolate: (str, data) => {
        str = typeof(str) == 'string' && str.length > 0 ? str : '';
        data = typeof(data) == 'object' && data !== null ? data : {};

        //add the templateGlobals to the data object, prepending their keyname with .global
        for(let keyname in config.templateGlobals) {
            if(config.templateGlobals.hasOwnProperty(keyname)) {
                data['global.'+keyname] = config.templateGlobals[keyname];
            }
        }

        for(let key in data) {;
            if(data.hasOwnProperty(key) && typeof(data[key]) == 'string') {
                const replace = data[key];
                const find = '{'+key+'}';
                str = str.replace(find, replace);
            }
        }
        return str;
    },
    //get the contents of a static (public) asset
    getStaticAssets: (filename, callback) => {
        filename = typeof(filename) == 'string' && filename.length > 0 ? filename : false;
        if(filename) {
            const publicDir = path.join(__dirname, "/../public/");
            fs.readFile(publicDir+filename, (err, data) => {
                if(!err && data) {
                    callback(false, data);
                } else {
                    callback("No file could be found");
                }
            })
        } else {
            callback("A valid filename was not specified");
        }
    },
    //used for testing the app
    getANumber: () => {
        return 1;
    }
};


module.exports = helpers;