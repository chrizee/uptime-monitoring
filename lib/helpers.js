const crypto = require('crypto');
const config = require('./config');
const querystring = require('querystring');
const https = require('https');

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
    }
};


module.exports = helpers;