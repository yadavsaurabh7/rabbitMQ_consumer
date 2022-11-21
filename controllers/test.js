var test = {};
const constants = require('../config/constants');
var testModel = require('../models/testModel');
var commonModel = require('../models/commonModel');
var insightLikeHelper = require('../helpers/insightLikeHelper');
var userHelper = require('../helpers/userHelper');
var pushNotificationHelper = require('../helpers/pushNotificationHelper');
var pointHelper = require('../helpers/pointHelper');
var pointModel = require('../models/pointModel');

const uuidv1 = require('uuid/v1');


test.manageLike = async function (req, res) {
  result = {};
  if (req) {
    
    var likedInsight = req.user.likedInsight?req.user.likedInsight.values:[];
    var user = req.user;
    var userId = req.user.userId;
    var insightId = req.body.insightId;
    var likeCount = 0;
    result["error_code"] = 0;
    if (insightId) {

      insightRequestParameter = insightLikeHelper.createRequestModel(insightId);

      insightResponse = await testModel.get(insightRequestParameter)
      console.log(insightResponse);

        
        if (insightResponse) {
          if (insightResponse.likeArray) {
            likeCount = Object.keys(insightResponse.likeArray).length;
          }
          if (likedInsight.indexOf(insightId) >= 0) {
            result["like"] = { "error_code": 0, "isliked": false, 'likesCount': likeCount - 1 };
          } else {
            result["like"] = { "error_code": 0, "isliked": true, 'likesCount': likeCount + 1 };
          }

          res.json(result);
          
          if (likedInsight.indexOf(insightId) >= 0) {
            unLikeRequestUserModel = insightLikeHelper.RequestUserModel('unLike', userId, insightId);
            console.log(unLikeRequestUserModel);
            commonModel.updateMap(unLikeRequestUserModel, function (err, data) {
              if (err) throw err;
              console.log("insight unliked from user table at -", new Date());
            });

            unLikeRequestInsightModel = insightLikeHelper.unLikeRequestInsightModel(userId, insightId);
            commonModel.updateMap(unLikeRequestInsightModel, function (err, data) {
              if (err) throw err;
              console.log("insight unliked from insight table at -", new Date());
            });
            notificationRequest = insightLikeHelper.getNotificationRequest(insightResponse.userId, user.userId, insightResponse.insightId);

            commonModel.getArrOfData(notificationRequest, function (err, notificationResponse) {
              if (err) throw err;
              if (notificationResponse) {
                notificationResponse.forEach(notification => {
                  deleteNotificationRequest = insightLikeHelper.deleteNotificationRequest(notification.notificationId);
                  commonModel.delete(deleteNotificationRequest, function (err, data) {
                    if (err) throw err;
                    console.log("Like Notification deleted sucessfully at -", new Date())
                  });
                });

              }
            });


          } else {
            likeRequestUserModel = insightLikeHelper.RequestUserModel('like', userId, insightId);
            commonModel.updateMap(likeRequestUserModel, function (err, data) {
              if (err) throw err;
              console.log("insight liked at -", new Date())
            });

            likeRequestInsightModel = insightLikeHelper.likeRequestInsightModel(insightResponse, user);
            commonModel.updateMap(likeRequestInsightModel, function (err, data) {
              if (err) throw err;
              console.log("insight liked in insight table at -", new Date());
            });
            notificationRequestModel = insightLikeHelper.setNotificationRequest(insightResponse, req.user);
            commonModel.set(notificationRequestModel, function (err, data) {
              if (err) throw err;
              console.log("set notification for liked insight at -", new Date())
            });

            pointModel.insightPoints(user.userId, insightResponse.insightId, function (err, insightPoints) {
              if (err) throw err;
              if (insightPoints) {
               
                isLikedInsightPoints = (insightPoints.likedByUserId && insightPoints.likedByUserId == user.userId ? 1 : 0);

                if (!isLikedInsightPoints) {

                  item = pointHelper.createParameterForPoints(insightResponse.userId, user.userId, insightResponse.insightId, 'insightLike');

                  pointModel.addPoints(item, function (err, data) {
                    if (err) throw err;
                    console.log("adding points at -", new Date());
                  });
                  userProjection = 'userId,deviceToken,deviceType,latestRequestFeed';
                  userRequestParameter = userHelper.createRequestModel(insightResponse.userId, userProjection);
                  commonModel.get(userRequestParameter, function (err, insightUserResponse) {
                    if (err) throw err;
                    if (insightUserResponse.deviceToken) {


                      insightPoints.count++;
                      if (insightUserResponse.userId != user.userId) {
                        latestRequestFeed = insightUserResponse.latestRequestFeed || Math.floor(Date.now() / 1000);

                        notificationRequest = pushNotificationHelper.countNotificationRequest(insightResponse.userId, latestRequestFeed);
                        totalNotification = 0;
                        commonModel.getArrOfData(notificationRequest, function (err, data) {
                          if (err) throw err;

                          totalNotification = data.length;

                        });

                        deviceToken = insightUserResponse.deviceToken;
                        var pushNotification = {};
                        pushNotification = {
                          
                          userId: user.userId,
                          insightId: insightResponse.insightId,
                          image: user.userAvatarURL || "",
                          type: 'INSIGHT_LIKE'
                        }


                        if (insightUserResponse.deviceType) {
                          pushNotification.message = user.userName + " has liked your Insight!";
                          pushNotificationHelper.fcmPushNotification(deviceToken, pushNotification);
                          console.log("push notification sent on Android at -", new Date());
                        } else {
                          pushNotification.alert = user.userName + " has liked your Insight!";
                          pushNotification.badge = totalNotification;

                          pushNotificationHelper.apnPushNotification(deviceToken, pushNotification);
                          console.log("push notification sent on Ios at -", new Date());
                        }


                        if (insightPoints.count != 0 && insightPoints.count % 10 === 0) {
                          id = uuidv1();

                          setNotificationRequest = {
                            TableName: process.env.TABLE_PREFIX + 'notification',
                            Item: {
                              notificationId: id,
                              dataByUserId: insight.userId,
                              type: likeNocs
                            }
                          }
                          commonModel.set(setNotificationRequest, function (err, data) {
                            if (err) throw err;
                            console.log("set notification in notification table for free nocs at -", new Date());
                          });
                          pointRequest = {
                            TableName: process.env.TABLE_PREFIX + 'user',
                            ExpressionAttributeValues: {
                              ':val1': 1
                            },
                            updateExpression: 'ADD userNoc :val1',
                            key: { userId: insightUserResponse.userId }
                          }
                          Common_model.updateMap(pointRequest, function (err, data) {
                            if (err) throw err;
                            console.log("point updated in user table at -", new Date());
                          });

                          pushNotif.message = "10 more Likes = 1 more Noc! Hoot Hoot!";
                          pushNotif.userId = user.userId;
                          pushNotif.insightId = insight.insightId;
                          pushNotif.image = user.userAvatarURL;
                          pushNotif.type = 'INSIGHT_LIKE';
                          if (insightUserResponse.deviceType) {
                            pushNotificationHelper.fcmPushNotification(deviceToken, pushNotif);
                            console.log("push notification sent on Android for extra nocs at -", new Date());
                          } else {
                            pushNotif.badge = totalNotification;
                            pushNotificationHelper.apnPushNotification(deviceToken, pushNotif);
                            console.log("push notification sent on Ios for extra nocs at -", new Date());
                          }
                        }
                      }
                    }
                    console.log("liked successfully at -", new Date());
                  });
                }
              }
            });
          }
        }
     
    } else {
      result["error_code"] = 1;
      result["error_message"] = 'insightId is required';
      res.json(result);
    }
  } else {
    result["error_code"] = 1;
    result["error_message"] = 'parameters are required';
    res.json(result);
  }
}


test.testPromise = function(){
    var params = {
        TableName: process.env.TABLE_PREFIX + 'club',
        Key: { clubId: { S: '1125201611554639376000' } },
    };

    
    let promises = [];
  promises[0] = testModel.get(params);   
  Promise.all(promises)
  .then(function(values) {
    console.log(values);
  })
  .catch(function(err) {
    console.log(err);
  });
}

test.sendPush = function(req,res){
  var params = {
    TableName: process.env.TABLE_PREFIX + "user",
    FilterExpression: 'attribute_exists(deviceToken) AND attribute_not_exists(deviceType)',
    ProjectionExpression: 'userId,userName,deviceToken'
}
commonModel.loadMore(params, [], 800, null, function (err, userRes) {
    if (err) throw err;
   
      userRes.output.forEach(element => {
        
          var deviceToken = element.deviceToken;
          var pushNotification = {};
          pushNotification.alert = "Happy Holidays and a Happy New Year from Nocto! :)";
          pushNotification.badge = 0;

          pushNotificationHelper.apnPushNotification(deviceToken, pushNotification);
          console.log("push notification sent on Ios at -", new Date());
        
    });
    res.send("push notification sent on Ios at -", new Date());
  });
}


module.exports = test;