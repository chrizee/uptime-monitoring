const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');
const handlers = {};

handlers.sample = (data, callback) => {
    callback(200, {name: "chris"});
}

handlers.ping = (data, callback) => {
    callback(200);
}

handlers.notFound = (data, callback) => {
    callback(404);
}

handlers.users = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data,callback);
    } else {
        callback(405);  //method not allowed http code
    }
}

handlers._users = {
    //required data: phone
    get: (data, callback) => {
        //check if the phone number is valid
        const {phone} = data.queryStringObject;
        if(phone && phone.length === 11) {
            //get token from headers
            const token = data.headers.token;
            handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
                if(tokenIsValid) {
                    _data.read('users', phone, (err, data) => {
                        if(!err && data) {
                            //remove password before sending response
                            delete data.password;
                            callback(200, data);
                        } else {
                            //not found
                            callback(404, {error: 'problem getting record'});
                        }
                    });
                } else {
                    callback(403, {error: 'Missing required token in header or token is invalid'});
                }
            });            
        } else {
            callback(400, {error: 'Invalid phone number'});
        }
    },
    //required data: firstname, lastname, phone, password, tosAgreement
    post: (data, callback) => {
        const {firstname, lastname, phone, password, tosAgreement} = data.payload;
        if(firstname && lastname && phone.length === 11 && password && tosAgreement) {
            //make sure the user doesn't already exist by trying to read file using phone
            _data.read('users', phone, (err, data) => {
                if(err) {   //meaning user doesn't exist
                    const hash = helpers.hash(password);
                    //create user object
                    if(hash) {
                        const user = {
                            firstname, lastname, phone,
                            password: hash,
                            tosAgreement: true
                        };
                        //store user
                        _data.create('users', phone, user, (err) => {
                            if(!err) {  //if no error
                                callback(200);
                            } else {
                                console.log(err);
                                callback(500, {error: "Could not create user"});
                            }
                        })
                    } else {
                        callback(500, {error: 'Could not hash the user\'s password'});
                    }
                } else {
                    //user already exists
                    callback(400, {error: "User with that phone already exists"});
                }
            });
        }else {
            callback(400, {error: "Missing required fields or incorrect format"});
        }
    },
    put: (data, callback) => {
        const {firstname, lastname, phone, password} = data.payload;
        if(phone && phone.length === 11) {
            if(firstname || lastname || password) {
                //get token from headers
                const token = data.headers.token;
                handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
                    if(tokenIsValid) {
                        _data.read('users', phone, (err, data) => {
                            if(!err && data) {
                                if(firstname) {
                                    data.firstname = firstname;
                                }
                                if(lastname) {
                                    data.lastname = lastname;
                                }
                                if(password) {
                                    data.password = helpers.hash(password);
                                }
                                _data.update('users', phone, data, (err) => {
                                    if(!err) {
                                        callback(200);
                                    } else {
                                        callback(500, {error: 'could not update user'});
                                    }
                                })
                            } else {
                                callback(400, {error: 'The user does not exist'});
                            }
                        });
                    } else {
                        callback(403, {error: 'Missing required token in header or token is invalid'});                    
                    }
                })                
            }else {
                callback(400, {error: 'All fields cannot be blank'});                
            }
        } else {
           callback(400, {error: 'Invalid phone number'});
        } 
    },
    delete: (data, callback) => {
        //check if the phone number is valid
        const {phone} = data.queryStringObject;
        if(phone && phone.length === 11) {
            //get token from headers
            const token = data.headers.token;
            handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
                if(tokenIsValid) {
                    _data.read('users', phone, (err, data) => {
                        if(!err && data) {
                            _data.delete('users', phone, (err) => {
                                if(!err) {
                                    //delete each checks assocoated with the user
                                    if(data.checks.length > 0) {
                                        const checks = data.checks;
                                        const checksToDelete = checks.length;
                                        let deletionErr = false;
                                        let checksDeleted = 0;
                                        checks.forEach(check => {
                                            _data.delete('checks',check, (err) => {
                                                if(err) {
                                                    deletionErr = true;
                                                }
                                                checksDeleted++;
                                                if(checksDeleted == checksToDelete) {
                                                    if(!deletionErr) {
                                                        callback(200);
                                                    } else {
                                                        callback(500, {error: 'Errors encountred while deleting users checks. All checks may not not have been deleted successfully'});
                                                    }
                                                }
                                            })
                                        });
                                    }else {
                                        callback(200);
                                    }
                                } else {
                                    callback(500, {error: 'could not delete the sppecified user'});
                                }
                            })
                        } else {
                            //not found
                            callback(400, {error: 'could not find user'});
                        }
                    });
                } else {
                    callback(403, {error: 'Missing required token in header or token is invalid'});
                }
            });           
        } else {
            callback(400, {error: 'Invalid phone number'});
        }
    },
}

handlers.tokens = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data,callback);
    } else {
        callback(405);  //method not allowed http code
    }
}

handlers._tokens = {
    //required data: id 
    get: (data, callback) => {
         const {id} = data.queryStringObject;
         if(id && id.length === 20) {
             _data.read('tokens', id, (err, data) => {
                if(!err && data) {
                     callback(200, data);
                } else {
                    //not found
                    callback(404, {error: 'problem getting record'});
                }
             });
         } else {
             callback(400, {error: 'Missing required fields'});
         }
    },
    //required: phone anfd password
    post: (data, callback) => {
        const {phone, password} = data.payload;
        if(phone && password && phone.length === 11) {
            _data.read('users', phone, (err, data) => {
                if(!err && data) {
                    const hash = helpers.hash(password);
                    if(hash === data.password) {
                        const tokenId = helpers.createRandomString(20); 
                        const tokenObject = {
                            phone,
                            id: tokenId,
                            expires: Date.now() + 1000 * 60 * 60
                        };
                        _data.create('tokens', tokenId, tokenObject, (err) => {
                            if(!err) {
                                callback(200, tokenObject);
                            } else {
                                callback(500, {error: 'could not create new token'});
                            }
                        })
                    } else {
                        callback(400, {error: 'Wrong password'});
                    }
                } else {
                    callback(400, {error: 'could not find the specified user'});
                }
            })
        } else {
            callback(400, {error: 'Missing or incorrect required fields '})
        }

    },
    //required: id, extend
    put: (data, callback) => {
        const {id, extend} = data.payload;
        if(id && extend && id.length === 20) {
            _data.read('tokens', id, (err, data) => {
                if(!err && data) {
                    if(data.expires > Date.now()) {
                        data.expires = Date.now() + 1000 * 60 * 60;
                        _data.update('tokens', id, data, (err) => {
                            if(!err) {
                                callback(200);
                            } else {
                                callback(500, {error: "Token could not be extended"});
                            }
                        })
                    } else {
                        callback(400, {error: "The token has already expired and cannot be extended"});
                    }
                } else {
                    callback(400, {error: 'Specified token does not exist'});
                }
            });
        } else {
            callback(400, {error: "Missing or incorrect required fields"})
        }
    },
    //required: id
    delete: (data, callback) => {
        const id = data.queryStringObject.id;
        if(id && id.length === 20) {
            _data.read('tokens', id, (err, data) => {
                if(!err && data) {
                    _data.delete("tokens", id, (err) => {
                        if(!err) {
                            callback(200);
                        } else {
                            callback(500, {error: 'Could not delete token'});                
                        }
                    });
                } else {
                    callback(400, {error: 'The specified token does not exist'});
                }
            });     
        } else {
            callback(400, {error: "Missing or incorrect required parameter"});
        }
    },
    verifyToken: (id, phone, callback) => {
        _data.read('tokens', id, (err, data) => {
            if(!err && data) {
                //check if the token is for the given user and that the token is valid
                if(data.phone === phone && data.expires > Date.now()) {
                    callback(true);
                } else {
                    callback(false);
                }
            } else {
                callback(false);
            }
        })
    }
}

handlers.checks = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, callback);
    } else {
        callback(405);  //method not allowed
    }
}

handlers._checks = {
    //required: checkid
    get: (data, callback) => {
        const {id} = data.queryStringObject;
        //lookup check
        if(id && id.length) {
            _data.read('checks', id, (err, checkData) => {
                if(!err && checkData) {
                    //get token from headers
                    const token = data.headers.token;
                    //check if the auth user is the one that created the check
                    handlers._tokens.verifyToken(token, checkData.phone, (tokenIsValid) => {
                        if(tokenIsValid) {                        
                            callback(200, checkData);                              
                        } else {
                            callback(403);
                        }
                    });       
                } else {
                    callback(404);
                }
            })
        } else {
            callback(400, {error: 'Missing required field'});
        }
                
    },
    //required: protocol, url, method, successCodes, timeoutSeconds
    post: (data, callback) => {
        const {protocol, url, method, successCodes, timeoutSeconds} = data.payload;
        const allowedProtocols = ['http', 'https'];
        const allowedMethods = ['post', 'get', 'put', 'delete'];
        if(protocol && allowedProtocols.indexOf(protocol) > -1 
            && url
            && method && allowedMethods.indexOf(method) > -1
            && Array.isArray(successCodes) && successCodes.length > 0
            && timeoutSeconds && timeoutSeconds >= 1 && timeoutSeconds <= 5 && timeoutSeconds % 1 === 0)
        {
            //get token from headers
            const token = data.headers.token;
            _data.read('tokens', token, (err, tokenData) => {
                if(!err && tokenData) {
                    const phone = tokenData.phone;
                    _data.read('users', phone, (err, userData) => {
                        if(!err && userData) {
                            const userChecks = userData.checks instanceof Array ? userData.checks: [];
                            if(userChecks.length < config.maxChecks) {
                                const checkId = helpers.createRandomString(20);
                                const checkObject = {
                                    id: checkId,
                                    phone, protocol, url, method, successCodes, timeoutSeconds
                                };
                                _data.create('checks', checkId, checkObject, (err) => {
                                    if(!err) {
                                        //add checkid to user object
                                        userData.checks = userChecks;
                                        userData.checks.push(checkId);
                                        _data.update('users', phone,userData, (err) => {
                                            if(!err) {
                                                callback(200, checkObject);
                                            } else {
                                                callback(500, {error: 'Could not update the user with the new check'});
                                            }
                                        });
                                    } else {
                                        callback(500, {error: 'could not create a new check'});
                                    }
                                })
                            } else {
                                callback(400, {error: 'Maximun number of checks reached ('+ config.maxChecks + ')'});
                            }
                        } else {
                            callback(403, {error: 'unauthorized'});
                        }
                    });
                } else {
                    callback(403, {error: 'unauthorized'});
                }
            })
        } else {
            callback(400, {error: 'Missing or invalid required inputs'});
        }
    },
    put: (data, callback) => {
        const {id, protocol, url, method, successCodes, timeoutSeconds} = data.payload;
        if(id) {
            if(protocol || url || method || successCodes || timeoutSeconds) {
                //lookup the check
                _data.read('checks', id, (err, checkData) => {
                    if(!err && checkData) {
                        //get token from headers
                        const token = data.headers.token;
                        //check if the auth user is the one that created the check
                        handlers._tokens.verifyToken(token, checkData.phone, (tokenIsValid) => {
                            if(tokenIsValid) {                        
                                //update the check where necessary
                                if(protocol) {
                                   checkData.protocol = protocol; 
                                }
                                if(url) {
                                    checkData.url = url; 
                                }
                                if(method) {
                                    checkData.method = method; 
                                }                            
                                if(successCodes) {
                                    checkData.successCodes = successCodes; 
                                }
                                if(timeoutSeconds) {
                                    checkData.timeoutSeconds = timeoutSeconds; 
                                }
                                _data.update('checks', id, checkData, (err) => {
                                    if(!err) {
                                        callback(200);
                                    } else {
                                        callback(500, {error: 'Could not update the check'});
                                    }
                                })
                            } else {
                                callback(403);
                            }
                        });      
                    } else {
                        callback(400, {error: 'Check id does not exist'});
                    }
                })
            } else {
                callback(400, {error: 'Missing optional field'});
            }
        } else {
            callback(400, {error: 'Missing required field'});
        }
    },
    delete: (data, callback) => {
        const id = data.queryStringObject.id;
        if(id && id.length === 20) {
            _data.read("checks", id, (err, checkData) => {
                if(!err && checkData) {
                    const token = data.headers.token;
                    //check if auth user is the owner of the check
                    handlers._tokens.verifyToken(token, checkData.phone, (tokenIsValid) => {
                        if(tokenIsValid) {
                            _data.delete('checks', id, (err) => {
                                if(!err) {
                                    _data.read('users', checkData.phone, (err, userData) => {
                                        if(!err && userData) {
                                            //delete check from user array
                                            userData.checks.splice(userData.checks.indexOf(id), 1);
                                            _data.update('users', checkData.phone, userData, (err) => {
                                                if(!err) {
                                                    callback(200);
                                                } else {
                                                    callback(500, {error: 'could not update the user'});
                                                }
                                            })
                                        } else {
                                            callback(500, {error: 'Could not find the user who created the check'});
                                        }
                                    })
                                } else {
                                    callback(500, {error: 'Problem deleting check'});
                                }
                            });
                        } else {
                            callback(403);
                        }
                    })
                } else {
                    callback(400, {error: 'could not find the specified check'});
                }
            })
        } else {
            callback(400, {error: 'Missing or invalid required field'});
        }
    },
}

module.exports = handlers

// function (arr) {
//     let out = {};
//     for(let i = 0; i < arr.length; i++) {
//         let type = typeof(arr[i]);
//         if(type in out) {
//             out[type].push(arr[i]);
//         }else {
//             out[type] = [arr[i]];
//         }
//     }
//     return out;
// }