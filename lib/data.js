//for storing and reading data

const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');


const lib = {
    baseDir: path.join(__dirname,'/../.data/'),
    /*function for writing data to a file
    * @param dir string directory where the file will be created  
    * @param file string filename    
    * @param data object data to be stored in the file    
    * @param callback function called when the method is run    
    */
    create: (dir, file, data, callback) => {
        //open the file for writing
        fs.open(lib.baseDir+dir+'/'+file+'.json', 'wx', (err, fileDescriptor) => {
            if(!err && fileDescriptor) {
                //convert data to string
                const stringData = JSON.stringify(data);
                //write to file and close
                fs.writeFile(fileDescriptor, stringData, (err) => {
                    if(!err) {
                        fs.close(fileDescriptor, (err) => {
                            if(!err) {
                                callback(false);
                            } else {
                                callback("error closing new file");
                            }
                        })
                    } else {
                        callback("error writing to new file");
                    }
                });
            } else {
                callback("could not create a new file, it may already exists");
            }
        });
    },
    //read data from an existing file
    read: (dir, file, callback) => {
        fs.readFile(lib.baseDir+dir+'/'+file+'.json', 'utf-8', (err, data) => {
            if(!err && data) {
                const jsonObject = helpers.parseJsonToObject(data);
                callback(false, jsonObject);
            } else {
                callback(err, data);
            }
        })
    },
    //update an existing file with data
    update: (dir, file, data, callback) => {
        //open the file for writing
        fs.open(lib.baseDir+dir+'/'+file+'.json', 'r+', (err, fileDescriptor) => {
            if(!err && fileDescriptor) {
                const stringData = JSON.stringify(data);
                fs.ftruncate(fileDescriptor, (err) => {
                    if(!err) {
                        //write to file and close it
                        fs.writeFile(fileDescriptor, stringData, (err) => {
                            if(!err) {
                                fs.close(fileDescriptor, (err) => {
                                    if(!err) {
                                        callback(false);
                                    } else {
                                        callback("error closing existing file");
                                    }
                                })
                            } else {
                                callback("error writing to existing file");
                            }
                        });
                    } else {
                        callback('error truncating file');
                    }
                });
            } else {
                callback('could not open the file for updating, it may not exist yet');
            }
        })
    },
    //delete a file
    delete: (dir, file, callback) => {
        fs.unlink(lib.baseDir+dir+'/'+file+'.json', (err) => {
            if(!err) {
                callback(false);
            } else {
                callback("error deleting file");
            }
        })
    },
    //list all items in a directory
    list: (dir, callback) => {
        fs.readdir(lib.baseDir+dir+'/', (err, data) => {
            if(!err && data && data.length > 0) {
                const trimmedFilenames = [];
                data.forEach(filename => {
                    trimmedFilenames.push(filename.replace('.json', ''));
                });
                callback(false, trimmedFilenames);
            } else {
                callback(err, data);
            }
        })
    }
};




module.exports = lib;