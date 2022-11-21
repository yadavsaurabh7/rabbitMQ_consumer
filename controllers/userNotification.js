const constants = require('../config/constants');
const commonHelper = require('../helpers/commonHelper');
const userHelper= require('../helpers/userHelper');
var  userModel = require('../models/userModel');
//var pushNotificationHelper = require('../helpers/pushNotificationHelper');
const uuidv1 = require('uuid/v1');

const userNotification = {};


userNotification.notification = function(req, res){
    switch (data.type){
        case 'NEW_USER':
            userHelper.appUpdate(data);
        break;
    }

}

userNotification.bulkNotification = function(data){
    switch (data.type){
        case 'UPDATE_APP':
            userHelper.appUpdate(data);
        break;
        case 'GENERAL':
            userHelper.generalUpdate(data);
        break;
       
        
    }
   
}

userNotification.email = function(req, res){
    switch (data.type){
        case 'NEW_USER':
            userHelper.appUpdate(data);
        break;
    }

}

userNotification.bulk = function(data){
    switch (data.type){
        case 'UPDATE_APP':
            userHelper.appUpdate(data);
        break;
        case 'GENERAL':
            
        break;
        
    }
   
}

module.exports = userNotification;