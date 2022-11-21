var test = {};
const constants = require('../config/constants');
const commonHelper = require('../helpers/commonHelper');
//var pushNotificationHelper = require('../helpers/pushNotificationHelper');
const uuidv1 = require('uuid/v1');
var producer = require('../helpers/producer');
const emailNotification = {};


emailNotification.email = function(req, res){
    var work = req.query;
    producer.emailChannel.sendToQueue(constants.emailQueue, commonHelper.encode(work), {
        persistent: true
    });
}

emailNotification.bulkEmail = function(req, res){
    var work = req.query;
    producer.bulkEmailChannel.sendToQueue(constants.bulkEmailQueue, commonHelper.encode(work), {
        persistent: false
    });
}

emailNotification.notification = function(req, res){
    var work = req.query;
    producer.pushNotificationChannel.sendToQueue(constants.pushNotificationQueue, commonHelper.encode(work), {
        persistent: true
    });
}

emailNotification.bulkNotification = function(req, res){
    var work = req.query;
    producer.pushNotificationChannel.sendToQueue(constants.pushNotificationQueue, commonHelper.encode(work), {
        persistent: true
    });
}

module.exports = emailNotification;