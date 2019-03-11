//create an export configuration variables
const environments = {};

//staging (default) environment
environments.staging = {
    httpPort: 3000,
    httpsPort: 3001,
    envName: 'staging',
    hashSecret: "secret",
    maxChecks: 5,
    twilio: {
        fromPhone: "+16099976025",
        accountSid: "AC70a95bf794a502d6565d0a65b7f535f8",
        authToken: "45b0ad996066d9fd8c85ac03ab69056e"
    },
    templateGlobals : {
       appName : "Uptimechecker",
       companyName: "Valence web, inc",
       yearCreated : "2010",
       baseUrl: "http://localhost:3000/"
    }
 }

//production environment
environments.production = {
    httpPort: 5000,
    httpsPort: 5001,
    envName: 'production',
    hashSecret: "secret",
    maxChecks: 5,
    twilio: {
        fromPhone: "+16099976025",
        accountSid: "AC70a95bf794a502d6565d0a65b7f535f8",
        authToken: "45b0ad996066d9fd8c85ac03ab69056e"
    },
    templateGlobals : {
        appName : "Uptimechecker",
        companyName: "Valence web, inc",
        yearCreated : "2010",
        baseUrl: "http://localhost:5000/"
     }
}

//determine which environment should be exported
const currentEnvironment = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

module.exports = typeof(environments[currentEnvironment]) === 'object' ? environments[currentEnvironment] : environments.staging;