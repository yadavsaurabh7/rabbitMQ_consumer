var userModel = require('../models/userModel');
var auth = {}
auth.validateUser = function(token,returnResult) {
    projection = 'userId,userName,userAvatarURL,likedInsight,userNoc,clubId,checkIn,checkedIn,follower,following,stats';
    
    userModel.applicationTokenCheck(token, projection,returnResult);
    
 }
module.exports = auth;