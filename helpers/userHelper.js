var pushNotification = require('./pushNotificationHelper')
var User = require('../models/userModel');
var UserDeviceModel = require('../models/userDeviceModel');
var ObjectID = require('mongodb').ObjectID;
var notificationLog = require('../models/notificationLogModel');
var pushNotificationLog = require('../models/pushNotificationLogModel');
var pushNotificationStats = require('../models/pushNotificationStatsModel');
const userHelper = {};
var async = require('async');

userHelper.appUpdate = function (data) {
    let pnStats = {
        _id: ObjectID(),
        iOS:{
            success:0,
            failed:0,
        },
        Android:{
            success:0,
            failed:0,
        },
        sent_to:{},
        
    };
    const pn = {};
    let userDeviceRequest = {
        status: 1
    }
    const deviceIdcheck = {
        ios:{},
        android:{}
    };

    pnStats.sent_to.os_type = data.payload.os_type;
    if (data.payload.os_type == 'ALL') {
        query = { status: 1 , push_notif_status:1}
        userDeviceRequest.app_type = { $in: ['iOS','Android'] };
    } else if (data.payload.os_type == 'Single') {
        query = { _id: ObjectID(data.payload.user_id), push_notif_status:1}
        pnStats.sent_to.user_id = data.payload.user_id;
        userDeviceRequest.app_type = { $in: ['iOS','Android'] };
    } else if (data.payload.os_type == 'Corporate') {
        query = { corporate_id: { $in: data.payload.corporate_entities }, status: 1, push_notif_status:1 };
        pnStats.sent_to.corporate_id = data.payload.corporate_entities;
        userDeviceRequest.app_type = { $in: ['iOS','Android'] };
    } else if(data.payload.os_type == 'IOS'){
        query = { os_type: 'iOS', status: 1 , push_notif_status:1}
        userDeviceRequest.app_type = 'iOS';
       
    } else if(data.payload.os_type == 'Android'){
        query = { os_type: 'Android', status: 1, push_notif_status:1}
        userDeviceRequest.app_type = 'Android';
    }
    User.find(query).then(users => {
        async.forEachOf(users, (element, key, callback) => {
        // users.forEach(element => {
            element = element.toObject();
            userDeviceRequest.user_id = String(element._id);
            UserDeviceModel.find(userDeviceRequest).then(userDevices => {
                // if (userDevices.length>0) {
                    // userDevices.forEach(userDevice => {
                    async.forEachOf(userDevices, (userDevice, key2, callback2) => {
                        
                        userDevice = userDevice.toObject();
                       
                        const message = data.payload.push_message;
                        const payload = {

                            messageFrom: 'Meditation.live',
                            userInfo: {
                                type: data.type,
                                data: {
                                    notif_id: String(ObjectID())
                                }
                            }
                        }
                        pnStats.payload = payload;
                        pnStats.message = data.payload.push_message;
                        pnStats.user_id_str = data.payload.sent_by_user_id;
                       
                        let device_token = userDevice.notif_token||' '
                        // if (element.push_notif_status=== 1 || element.push_notif_status=== 1.0) {
                            if (userDevice.app_type && userDevice.app_type.toLowerCase() == 'ios' &&  !deviceIdcheck.ios[userDevice.device_id]) {
                                const message = data.payload.push_message;
                                
                                pushNotification.apnPushNotification(device_token, message, payload, {user_id: element._id,stats_id: pnStats._id, device_id: userDevice.device_id, push_notif_status: element.push_notif_status}).then(result => {
                                    
                                    if(result.failed[0]){
                                        pnStats.iOS.failed += 1;
                                    }else{
                                        pnStats.iOS.success += 1;
                                    }
                                    
                                    callback2();
                                }).catch(err => {
                                    console.log(err)
                                    if(err.failed[0]){
                                        pnStats.iOS.failed += 1;
                                    }
                                   
                                    callback2();
                                });
                                deviceIdcheck.ios[userDevice.device_id] = userDevice.device_id;
                            } else if(userDevice.app_type && userDevice.app_type.toLowerCase() == 'android' &&  !deviceIdcheck.android[userDevice.device_id]) {

                                if (data.payload.push_message) {
                                    payload.message = data.payload.push_message;
                                }
                            
                                pushNotification.fcmPushNotification(device_token, payload, {user_id: element._id,stats_id: pnStats._id, device_id: userDevice.device_id, push_notif_status: element.push_notif_status}).then(result=>{
                                    pnStats.Android.success += 1;
                                    //deviceIdcheck.android[userDevice.device_id] = userDevice.device_id;
                                    callback2();
                                }).catch(err =>{
                                    
                                    //deviceIdcheck.android[userDevice.device_id] = userDevice.device_id;
                                    if(err.errorInfo){
                                        pnStats.Android.failed += 1;
                                    }
                                    callback2();
                                });
                                deviceIdcheck.android[userDevice.device_id] = userDevice.device_id;
                                
                            }else{
                                callback2();
                            }
                        // }
                        // else {
                        //         pn._id = payload.userInfo.data.notif_id,
                        //         pn.user_id = ObjectID(element._id),
                        //         pn.user_id_str = element._id,
                        //         pn.payload =  pnStats.payload;
                        //         pn.message = pnStats.message,
                        //         pn.sent_on = new Date(),
                        //         pn.os_type = userDevice.app_type,
                        //         pn.stats_id = pnStats._id,
                        //         pn.device_id = userDevice.device_id,
                        //         pn.token = device_token,
                        //         pn.response = {code: "Push Notification disabled"},
                        //         pn.push_notif_status = element.push_notif_status

                                
                        //     if (userDevice.app_type && userDevice.app_type.toLowerCase() == 'ios') {
                        //         pnStats.iOS.failed += 1;
                        //     }else if(userDevice.app_type && userDevice.app_type.toLowerCase() == 'android'){
                        //         pnStats.Android.failed += 1;
                        //     }
                            
                        //     callback2();
                        //     notificationLog.create(pn).then(created => {
                        //         console.log('PUSH NOTIFICATION LOG INSERTED RMQ:' + JSON.stringify(pn));
                        //     }).catch(err=>console.log(err));
                            
                        //     pushNotificationLog.create(pn).then(created => {
                        //         console.log('PUSH NOTIFICATION LOG INSERTED CMS:' + JSON.stringify(pn));
                        //     }).catch(err=>console.log(err));
                        // }
                    }, (err) => {
                        if (err) {
                            console.log(err);
                        }
                        callback();
                    
                    })
                // } else {
                //     callback();
                //     console.log("No devices found for this user");
                // }
            }).catch(err => { console.log(err) });
        }, (err) => {
            if (err) {
                console.log(err);
            }
            console.log(deviceIdcheck);
            pnStats.sent_on = Date.now();
            pushNotificationStats.create(pnStats).then(created => {
                console.log('PUSH NOTIFICATION STATS INSERTED:' + JSON.stringify(pnStats));
            }).catch(err => console.log(err));
        
        });
    }).catch(err => { console.log(err) });
}
userHelper.generalUpdate =  function (data) {
    let pnStats = {
        _id: ObjectID(),
        iOS:{
            success:0,
            failed:0,
        },
        Android:{
            success:0,
            failed:0,
        },
        sent_to:{}
        
    };
    const pn = {};
    let userDeviceRequest = {
        status: 1
    }
    const deviceIdcheck = {
        ios:{},
        android:{}
    };

    pnStats.sent_to.os_type = data.payload.os_type;
    if (data.payload.os_type == 'ALL') {
        query = { status: 1 , push_notif_status:1}
        userDeviceRequest.app_type = { $in: ['iOS','Android'] };
    } else if (data.payload.os_type == 'Single') {
        query = { _id: ObjectID(data.payload.user_id), push_notif_status:1}
        pnStats.sent_to.user_id = data.payload.user_id;
        userDeviceRequest.app_type = { $in: ['iOS','Android'] };
    } else if (data.payload.os_type == 'Corporate') {
        query = { corporate_id: { $in: data.payload.corporate_entities }, status: 1, push_notif_status:1 };
        pnStats.sent_to.corporate_id = data.payload.corporate_entities;
        userDeviceRequest.app_type = { $in: ['iOS','Android'] };
    } else if(data.payload.os_type == 'IOS'){
        query = { os_type: 'iOS', status: 1 , push_notif_status:1}
        userDeviceRequest.app_type = 'iOS';
       
    } else if(data.payload.os_type == 'Android'){
        query = { os_type: 'Android', status: 1, push_notif_status:1}
        userDeviceRequest.app_type = 'Android';
    }
    // query.email =  {$regex : ".*meditation.*"};
    // query.timezone =  'Asia/Kolkata';
    
    User.find(query).then(users => {
        
       
        async.forEachOf(users, (element, key, callback) => {
        // users.forEach(element => {
            
            element = element.toObject();
            userDeviceRequest.user_id = String(element._id);
        

            UserDeviceModel.find(userDeviceRequest).then( userDevices => {
                async.forEachOf(userDevices, (userDevice, key2, callback2) => {
                // userDevices.forEach( async userDevice => {
                    userDevice = userDevice.toObject();
                    let device_token = userDevice.notif_token||' ';
                    console.log(device_token)
                   
                        const payload = {
                            messageFrom: 'Meditation.live',
                            userInfo: {
                                type: data.type,
                                data: {
                                    notif_id: String(ObjectID()),
                                }
                            }
                        };
                        if (data.payload.class_id) {
                            payload.userInfo.data.class = {};
                            payload.userInfo.data.class_id = data.payload.class_id;
                            payload.userInfo.data.class.class_id = data.payload.class_id;
                        }
                        if (data.payload.class_name) {
                            payload.userInfo.data.class_name = data.payload.class_name;
                            payload.userInfo.data.class.class_name = data.payload.class_name;
                        }
                        if (data.payload.class_schedule_id) {
                            payload.userInfo.data.class_schedule_id = data.payload.class_schedule_id;
                            payload.userInfo.data.class.class_schedule_id = data.payload.class_schedule_id;
                        }
                        if (data.payload.corporate_id) {
                            payload.userInfo.data.corporate = {};
                            payload.userInfo.data.corporate_id = data.payload.corporate_id;
                            payload.userInfo.data.corporate.corporate_id = data.payload.corporate_id;
                        }
                        if (data.payload.corporate_name) {
                            payload.userInfo.data.corporate_name = data.payload.corporate_name;
                            payload.userInfo.data.corporate.corporate_name = data.payload.corporate_name;
                        }
                        pn.payload = payload;
                        pnStats.payload = payload;
                        pnStats.message = data.payload.push_message;
                        pnStats.user_id_str = data.payload.sent_by_user_id;
                       
                        // if (element.push_notif_status=== 1 || element.push_notif_status=== 1.0) {
                            console.log(deviceIdcheck);
                            if (userDevice.app_type && userDevice.app_type.toLowerCase() == 'ios' && !deviceIdcheck.ios[userDevice.device_id]) {
                                const message = data.payload.push_message;
                                
                                pushNotification.apnPushNotification(device_token, message, payload, {user_id: element._id,stats_id: pnStats._id, device_id: userDevice.device_id, push_notif_status: element.push_notif_status}).then(result => {
                                    
                                    if(result.failed[0]){
                                        pnStats.iOS.failed += 1;
                                    }else{
                                        pnStats.iOS.success += 1;
                                    }
                                    //deviceIdcheck.ios[userDevice.device_id] = userDevice.device_id;
                                    callback2();
                                }).catch(err => {
                                    console.log(err)
                                    if(err.failed[0]){
                                        pnStats.iOS.failed += 1;
                                    }
                                    //deviceIdcheck.ios[userDevice.device_id] = userDevice.device_id;
                                    callback2();
                                });
                                deviceIdcheck.ios[userDevice.device_id] = userDevice.device_id;
                            } else if(userDevice.app_type && userDevice.app_type.toLowerCase() == 'android' && !deviceIdcheck.android[userDevice.device_id]) {

                                if (data.payload.push_message) {
                                    payload.message = data.payload.push_message;
                                }
                            
                                pushNotification.fcmPushNotification(device_token, payload, {user_id: element._id,stats_id: pnStats._id, device_id: userDevice.device_id, push_notif_status: element.push_notif_status}).then(result=>{
                                    pnStats.Android.success += 1;
                                   // deviceIdcheck.android[userDevice.device_id] = userDevice.device_id;
                                    callback2();
                                }).catch(err =>{
                                    //deviceIdcheck.android[userDevice.device_id] = userDevice.device_id;
                                    if(err.errorInfo){
                                        pnStats.Android.failed += 1;
                                    }
                                    callback2();
                                });
                            
                                deviceIdcheck.android[userDevice.device_id] = userDevice.device_id;
                            }else{
                                callback2();
                            }
                        // } 
                        // else {
                        //         pn._id = payload.userInfo.data.notif_id,
                        //         pn.user_id = ObjectID(element._id),
                        //         pn.user_id_str = element._id,
                        //         pn.message =  pnStats.message,
                        //         pn.sent_on = new Date(),
                        //         pn.os_type = userDevice.app_type,
                        //         pn.stats_id = pnStats._id,
                        //         pn.device_id = userDevice.device_id,
                        //         pn.token = device_token,
                        //         pn.response = {code: "Push Notification disabled",},
                        //         pn.push_notif_status = element.push_notif_status

                                
                        //     if (userDevice.app_type && userDevice.app_type.toLowerCase() == 'ios') {
                        //         pnStats.iOS.failed += 1;
                        //     }else if(userDevice.app_type && userDevice.app_type.toLowerCase() == 'android'){
                        //         pnStats.Android.failed += 1;
                        //     }
                            
                        //     callback2();
                        //     notificationLog.create(pn).then(created => {
                        //         console.log('PUSH NOTIFICATION LOG INSERTED RMQ:' + JSON.stringify(pn));
                        //     }).catch(err=>console.log(err));
                            
                        //     pushNotificationLog.create(pn).then(created => {
                        //         console.log('PUSH NOTIFICATION LOG INSERTED CMS:' + JSON.stringify(pn));
                        //     }).catch(err=>console.log(err));
                        // }
                }, (err) => {
                    if (err) {
                        console.log(err);
                    }
                    callback();
                })
            })
        }, (err) => {
            if (err) {
                console.log(err);
            }
            console.log(pnStats);
            pnStats.sent_on = Date.now();
            pushNotificationStats.create(pnStats).then(created => {
                console.log('PUSH NOTIFICATION STATS INSERTED:' + JSON.stringify(pnStats));
            }).catch(err => console.log(err));
        });
       
    }).catch(err => {
        console.log(err);
     });
}

module.exports = userHelper;
