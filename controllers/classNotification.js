const constants = require('../config/constants');
const commonHelper = require('../helpers/commonHelper');
const userHelper= require('../helpers/userHelper');
const classHelper= require('../helpers/classHelper');
var  userModel = require('../models/userModel');
const uuidv1 = require('uuid/v1');

const classNotification = {};


classNotification.notification = function(req, res){
    switch (data.type){
       
    }

}

classNotification.bulkNotification = function(data){
    switch (data.type){
        case 'CLASS_PROFILE':
            userHelper.generalUpdate(data);
        break;
        case 'START_CLASS':
            classHelper.classStartReminder(data);
        break;
        case 'CLASS_RE-SCHEDULED':
            classHelper.modifyscheduleclass(data);
        break;
        case 'CLASS_DELETED':
            userHelper.appUpdate(data);
        break;
        case 'ENTERPRISE_ADDED':
        userHelper.generalUpdate(data);
        break;
    }
   
}

classNotification.classStatusNotification = function(data){
 }

module.exports = classNotification;