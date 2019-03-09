//for storing and rotating logs

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const logs = {
    baseDir: path.join(__dirname,'/../.logs/'),
    //append a string to a file, create the file if it does not exist
    append: (file, str, callback) => {
        //open the file for appending
        fs.open(logs.baseDir+file+".log", 'a', (err, fileDescriptor) => {
            if(!err && fileDescriptor) {
                //append to the file and close it
                fs.appendFile(fileDescriptor, str+'\n', (err) => {
                    if(!err) {
                        fs.close(fileDescriptor, (err) => {
                            if(!err) {
                              callback(false);  
                            } else {
                                callback("Error closing file that was being appended");
                            }
                        });
                    } else {
                        callback("Error appending to file");
                    }
                })
            } else {
                callback("could not open the file for appending");
            }
        })
    },
    //list all logs and optionally include compressed logs
    list: (includeCompressedLogs, callback) => {
        fs.readdir(logs.baseDir, (err, data) => {
            if(!err && data && data.length) {
                const trimmedFileName = [];
                data.forEach(filename => {
                    //add the .log file
                    if(filename.indexOf(".log") > -1) {
                        trimmedFileName.push(filename.replace(".log", ''));
                    }
                    //add .gz files
                    if(includeCompressedLogs && filename.indexOf(".gz.b64") > -1) {
                        trimmedFileName.push(filename.replace(".gz.b64", ''));
                    }
                });
                callback(false, trimmedFileName);
            } else {
                callback(err, data);
            }
        })
    },
    //compress the content on .log file into .gz.b64 file within the same directory
    compress: (logId, newfileId, callback) => {
        const sourceFile = logId + '.log';
        const destinationFile = newfileId+ ".gz.b64";
        //read the source file
        fs.readFile(logs.baseDir+sourceFile, 'utf-8', (err, data) => {
            if(!err && data) {
                //compress the data using gzip
                zlib.gzip(data, (err, buffer) => {
                    if(!err && buffer) {
                        //send the compressed data to the destination file
                        fs.open(logs.baseDir+destinationFile, 'wx', (err, fileDescriptor) => {
                            if(!err && fileDescriptor) {
                                //write to destination file
                                fs.writeFile(fileDescriptor, buffer.toString('base64'), (err) => {
                                    if(!err) {
                                        //close the file
                                        fs.close(fileDescriptor, (err) => {
                                            if(!err) {
                                                callback(false);
                                            } else {
                                                callback(err);
                                            }
                                        })
                                    } else {
                                        callback(err);
                                    }
                                })
                            } else {
                                callback(err);
                            }
                        })
                    } else {
                       callback(err); 
                    }
                })
            } else {
                callback(err);
            }
        });
    },
    //decompress the contents of a .gz.b64 file into a string
    decompress: (fileId, callback) => {
        const filename = fileId+".gz.b64";
        fs.readFile(logs.baseDir+filename, 'utf-8', (err, str) => {
            if(!err && str) {
                //decompress the data
                const inputBuffer = Buffer.from(str, 'base64');
                zlib.unzip(inputBuffer, (err, outputBuffer) => {
                    if(!err && outputBuffer) {
                        callback(false, outputBuffer.toString());
                    } else {
                        callback(err);
                    }
                })
            } else {
                callback(err);
            }
        })
    },
    //truncating a log file
    truncate: (logId, callback) => {
        fs.truncate(logs.baseDir+logId+".log", 0, (err) => {
            if(!err) {
                callback(false);
            } else {
                callback(err);
            }
        })
    }
}

module.exports = logs;