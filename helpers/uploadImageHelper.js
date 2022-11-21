var AWS = require("aws-sdk");

var credentials = new AWS.SharedIniFileCredentials({ profile: 'us-profile' });
AWS.config.credentials = credentials;
var ep = new AWS.Endpoint('http://s3.eu-central-1.amazonaws.com/');
var s3 = new AWS.S3({endpoint: ep});
var ffmpeg = require('ffmpeg');
var uploadImageHelper = {};

uploadImageHelper.s3PutObject = function (fileParams, cb) {
    s3.putObject(fileParams, function (err, pres) {
        cb(err, pres);
    });
}

uploadImageHelper.generateThumb = function (video, Item, middleName, cb) {
    var process = new ffmpeg(video.path);
    process.then(function (videoObj) {
        // Callback mode
        videoObj.fnExtractFrameToJPG('public', {
            frame_rate: 1,
            number: 1,
            file_name: middleName + ".jpg",
            size: String(Item.width.S + 'x' + Item.height.S)
        }, function (error, files) {
            cb(error, files); 
        });

    }, function (err) {
        console.log('Error: ' + err);
        cb(err, files||'');
    });
}

uploadImageHelper.s3deleteThumb = function(params,cb){
    s3.deleteObjects(params,cb);
}

uploadImageHelper.videoConversion = function(path,outputPath,cb){
    const hbjs = require('handbrake-js')

    hbjs.spawn({ input: path, output: outputPath })
    .on('error', err => {
        // invalid user input, no video found etc
        console.log(err);
    })
    .on('progress', progress => {
        // console.log(
        // 'Percent complete: %s, ETA: %s',
        // progress.percentComplete,
        // progress.eta
        // )
    })
    .on('end', () => {
        cb("done");
    })
    
}
module.exports = uploadImageHelper;