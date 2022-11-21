var constants = require('../config/constants')
var  NotificationLog = require('../models/notificationLogModel');
var PushNotificationLog = require('../models/pushNotificationLogModel');
var ObjectID = require('mongodb').ObjectID;
var apn = require('apn');
var admin = require('firebase-admin');
var home_dir = require('os').homedir();

var serviceAccount = require(process.env.FIREBASE_CONFIG||"/var/www/html/project/meditation.live_consumer/dev_cert/meditationlive-1538995686096-firebase-adminsdk-d6248-e3faea2f9a");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: constants.FIREBASE_DB_URL
});

pushNotificationHelper = {}

pushNotificationHelper.countNotificationRequest = function (userId, latestRequestFeed) {
    notificationRequest = {
        }
    return notificationRequest;
}
pushNotificationHelper.apnPushNotification = function (deviceToken, message, payload, data){
    return new Promise(function (resolve, reject) {
        const options = {
            key: process.env.KEY,
            cert: process.env.CERT,

            debug: true,
            production: process.env.NODE_ENV == "development" ? false : true,
            teamId: "B553YLN78C"
        };
        var apnProvider = new apn.Provider(options);
        const notification = new apn.Notification();

        notification.alert = message;

        notification.payload = payload;
        // Replace this with your app bundle ID:
        notification.topic = "www.meditation.live";
        
        apnProvider.send(notification, deviceToken).then(result => {
            console.log(result)
       
            resolve(result);
            if (result.sent.length>0) {
              
                const pn = {
                    _id:payload.userInfo.data.notif_id,
                    user_id: ObjectID(data.user_id),
                    user_id_str: data.user_id,
                    stats_id: data.stats_id,
                    device_id: data.device_id,
                    token: deviceToken,
                    payload: payload,
                    response: result,
                    message: message,
                    sent_on: new Date(),
                    os_type: 'iOS',
                };
                NotificationLog.create(pn).then(created => {
                    console.log('PUSH NOTIFICATION LOG INSERTED IN RMQ:' + JSON.stringify(pn));
                }).catch(err=>console.log(err));
                
                PushNotificationLog.create(pn).then(created => {
                    console.log('PUSH NOTIFICATION LOG INSERTED IN CMS:' + JSON.stringify(pn));
                }).catch(err=>console.log(err));
                
            }
            if (result.failed[0]) {
               reject(result);
                const pn = {
                    _id:payload.userInfo.data.notif_id,
                    user_id: ObjectID(data.user_id),
                    user_id_str: data.user_id,
                    stats_id: data.stats_id,
                    device_id: data.device_id,
                    token: deviceToken,
                    payload: payload,
                    response: result,
                    message: message,
                    sent_on: new Date(),
                    os_type: 'iOS',
                   
                };
                NotificationLog.create(pn).then(created => {
                    console.log('PUSH NOTIFICATION LOG INSERTED IN RMQ:' + JSON.stringify(pn));
                }).catch(err=>console.log(err));
               
                PushNotificationLog.create(pn).then(created => {
                    console.log('PUSH NOTIFICATION LOG INSERTED IN CMS:' + JSON.stringify(pn));
                }).catch(err=>console.log(err));
               console.log(result.failed[0].response);
            }

            return result;
            // see documentation for an explanation of result
        }).catch( err =>{
            return err;
        })
        apnProvider.shutdown();
    });
}
pushNotificationHelper.fcmPushNotification = function (deviceToken, payload, data) {
    return new Promise(function (resolve, reject) { 
    const dataForSend = {
        data: { data: JSON.stringify(payload) },
        token: deviceToken
    };
    admin.messaging().send(dataForSend)
        .then(function (response) {
            resolve(response);
           // console.log(response);
            // See the MessagingDevicesResponse reference documentation for
            // the contents of response.
            // if(response.successCount){
            //     console.log("Successfully sent message:", response);
            // }else{
                console.log("sending message:", response);
            // }
            const pn = {
                _id:payload.userInfo.data.notif_id,
                user_id: ObjectID(data.user_id),
                user_id_str: data.user_id,
                stats_id: data.stats_id,
                device_id: data.device_id,
                token: deviceToken,
                payload: payload,
                response: response,
                message: payload.message,
                sent_on: new Date(),
                os_type: 'Android'
            };
            NotificationLog.create(pn).then(created => {
                console.log('PUSH NOTIFICATION LOG INSERTED RMQ:' + JSON.stringify(pn));
            }).catch(err=>console.log(err));
            
            PushNotificationLog.create(pn).then(created => {
                console.log('PUSH NOTIFICATION LOG INSERTED CMS:' + JSON.stringify(pn));
            }).catch(err=>console.log(err));
        })
        .catch(function (error) {
            
            reject(error);
            //console.log(error);
            const pn = {
                _id:payload.userInfo.data.notif_id,
                user_id: ObjectID(data.user_id),
                user_id_str: data.user_id,
                stats_id: data.stats_id,
                device_id: data.device_id,
                token: deviceToken,
                payload: payload,
                response: error,
                message: payload.message,
                sent_on: new Date(),
                os_type: 'Android'
                
            };
            NotificationLog.create(pn).then(created => {
                console.log('PUSH NOTIFICATION LOG INSERTED ERROR IN RMQ:' + JSON.stringify(pn));
            }).catch(err=>console.log(err));
            
            PushNotificationLog.create(pn).then(created => {
                console.log('PUSH NOTIFICATION LOG INSERTED IN CMS:' + JSON.stringify(pn));
            }).catch(err=>console.log(err));
            console.log("Error sending message:", error.errorInfo.message);
        });
    });
}
module.exports = pushNotificationHelper;
