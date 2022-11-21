const constants = require('../config/constants');
const commonHelper = require('../helpers/commonHelper');
const userHelper= require('../helpers/userHelper');
const classHelper= require('../helpers/classHelper');
const teacherHelper= require('../helpers/teacherHelper');
var  userModel = require('../models/userModel');
const uuidv1 = require('uuid/v1');

const teacherNotification = {};


teacherNotification.notification = function(req, res){
    switch (data.type){
    }
}
teacherNotification.bulkNotification = function(data){
    switch (data.type){
        case 'TEACHER_PROFILE':
            teacherHelper.generalUpdate(data);
        break;
    }
   
}

teacherNotification.teacherStatusNotification = function(data){
 }

module.exports = teacherNotification;
