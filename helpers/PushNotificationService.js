const ObjectId = require('mongodb').ObjectId;
module.exports = {
    sendAPNS: function (message, class_id, meeting_id, user_id, class_name, teacherInfo, classInfo) {
        getNotificationTokens(user_id)
            .then(deviceObjs => {
                deviceObjs.forEach(deviceObj => {
                    if (deviceObj._id && deviceObj.app_type === "iOS") {
                        Utility.sendAPNSToIOS(message, deviceObj._id, class_id, meeting_id, user_id, class_name, teacherInfo, classInfo);
                    }
                    if (deviceObj._id && deviceObj.app_type === "Android") {
                        Utility.sendAPNSANDROID(message, deviceObj._id, class_id, meeting_id, user_id, class_name, teacherInfo, classInfo);
                    }
                });
            })
            .catch(error => {
                console.log('Error fatching notification Tokens:', error);
            });
    },

    sendAPNSForDev: function (message, class_id, meeting_id, user_id, class_name, teacherInfo, classInfo) {//sendAPNSForDev: function (message, token, class_id, meeting_id, user_id, class_name, teacherInfo, classInfo) {
        getNotificationTokens(user_id)
            .then(deviceObjs => {
                console.log("deviceObjsdeviceObjsdeviceObjsdeviceObjsdeviceObjs>>>>>>");
                console.log.log(JSON.stringify(deviceObjs));
                console.log("deviceObjsdeviceObjsdeviceObjsdeviceObjsdeviceObjs<<<<<<");
                deviceObjs.forEach(deviceObj => {
                    if (deviceObj._id && deviceObj.app_type === "iOS") {
                        Utility.sendAPNSForDevToIOS(message, deviceObj._id, class_id, meeting_id, user_id, class_name, teacherInfo, classInfo);
                    }
                    if (deviceObj._id && deviceObj.app_type === "Android") {
                        Utility.sendAPNSForDevANDROID(message, deviceObj._id, class_id, meeting_id, user_id, class_name, teacherInfo, classInfo);
                    }
                });
            })
            .catch(error => {
                console.log('Error fatching notification Tokens:', error);
            });
    },

    sendAPNSNew: function (message, payload, user_id) {//sendAPNSNew: function (message, token, payload, user_id) {
        console.log('cert path:' + sails.config.appPath + '/cert/Key.pem');
        getNotificationTokens(user_id)
            .then(deviceObjs => {
                deviceObjs.forEach(deviceObj => {
                    if (deviceObj._id && deviceObj.app_type === "iOS") {
                        Utility.sendNewToIOS(message, deviceObj._id, payload, user_id);
                    }
                    if (deviceObj._id && deviceObj.app_type === "Android") {
                        Utility.sendNewToANDROID(message, deviceObj._id, payload, user_id);
                    }
                });
            })
            .catch(error => {
                console.log('Error fatching notification Tokens:', error);
            });
    }
};

async function getNotificationTokens(user_id) {
    const devicesSet = new Set();
    let devicesObjs = [];

    await getSesionAppType(user_id)
        .then(devicesArr => {
            devicesObjs = checkForDublication(devicesArr, devicesObjs, devicesSet);
            return getSessionOsType(user_id)
        }).then(devicesArr => {
            devicesObjs = checkForDublication(devicesArr, devicesObjs, devicesSet);
            return getUserOsType(user_id)
        }).then(devicesArr => {
             devicesObjs = checkForDublication(devicesArr, devicesObjs, devicesSet);
        });
    return devicesObjs
}

function getSesionAppType(user_id) {
    return new Promise((resolve, reject) => {
        UserSession.native((err, collection) => {
            if (err) reject(err);

            collection.aggregate([
                {$match: {user_id: user_id, is_logged_in: true, app_type: {$ne: null}}},
                {$group: {_id: "$notif_token", app_type: {$first: "$app_type"}}}
            ]).toArray((err, results) => {
                if (err) reject(err);
                resolve(results)
            })
        })
    })
}

function getSessionOsType(user_id) {
    return new Promise((resolve, reject) => {
        UserSession.native((err, collection) => {
            if (err) reject(err);

            collection.aggregate([
                {$match: {user_id: user_id, is_logged_in: true, os_type: {$ne: null}}},
                {$group: {_id: "$notif_token", app_type: {$first: "$os_type"}}}
            ]).toArray((err, results) => {
                if (err) reject(err);
                resolve(results)
            })
        })
    });
}

function getUserOsType(user_id) {
    return new Promise((resolve, reject) => {
        User.native((err, collection) => {
            if (err) reject(err);

            collection.aggregate([
                {$match: {_id: ObjectId(user_id), os_type: {$ne: null}}},
                {$group: {_id: "$notif_token", app_type: {$first: "$os_type"}}}
            ]).toArray((err, results) => {
                if (err) reject(err);
                resolve(results)
            })
        })
    });
}

function checkForDublication(devicesArr, devicesObjs, devicesSet) {
    devicesArr.forEach(device => {
        if (!devicesSet.has(device._id)) {
            devicesSet.add(device._id);
            devicesObjs.push(device)
        }
    });
    return devicesObjs;
}