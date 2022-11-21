const constants = require('../config/constants');
// var userHelper = require('./userHelper');
// var userModel = require('../models/userModel');
const uuidv1 = require('uuid/v1');
// var axios = require('axios');
var commonHelper = {};

commonHelper.googleGeocodeApi = function (latitude, longitude, cb) {
  gmtTime = Math.floor(Date.now() / 1000)
  var city;
  var country;
  axios.get('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + latitude + ',' + longitude + '&timestamp=' + gmtTime + '&key=' + constants.GOOGLE_KEY)
    .then(function (response) {

      response.data.results.forEach(function (value, index) {
        if (value.types.indexOf('locality') >= 0 && value.types.indexOf('political') >= 0) {
          value.address_components.forEach(function (address, key) {
            if (address.types.indexOf('locality') >= 0) {
              city = address.long_name;
            }
            if (address.types.indexOf('country') >= 0) {
              country = address.short_name;
            }
          })
        }
      });

      cb(city, country);
    })
    .catch(function (error) {
      console.log(error);
    });

}
commonHelper.googleTimeZoneApi = function (latitude, longitude, cb) {
  gmtTime = Math.floor(Date.now() / 1000)
  axios.get('https://maps.googleapis.com/maps/api/timezone/json?location=' + latitude + ',' + longitude + '&timestamp=' + gmtTime + '&key=' + constants.GOOGLE_KEY)
    .then(function (response) {
      cb(response);
    }).catch(function (error) {
      console.log(error);
    });

}
commonHelper.googleTimeZoneApi1 = function (latitude, longitude, cb) {
  return Promise(function (resolve, reject) {
    gmtTime = Math.floor(Date.now() / 1000)
    axios.get('https://maps.googleapis.com/maps/api/timezone/json?location=' + latitude + ',' + longitude + '&timestamp=' + gmtTime + '&key=' + constants.GOOGLE_KEY)
      .then(function (response) {
        resolve(response);
      }).catch(function (error) {
        console.log(error);
      });
  });
}
commonHelper.timeToDuration = function (time) {
  timeDiff = Math.floor(Date.now() / 1000) - time;
  if (timeDiff <= 60) {
    retTime = Math.floor(timeDiff) + 's';
  } else if (timeDiff <= 3600) {
    timeDiff /= 60;
    retTime = Math.floor(timeDiff) + 'm';
  } else if (timeDiff <= 3600 * 24) {
    timeDiff /= 3600;
    retTime = Math.floor(timeDiff) + 'h';
  } else if (timeDiff <= 3600 * 24 * 7) {
    timeDiff /= (3600 * 24);
    retTime = Math.floor(timeDiff) + 'd';
  } else {
    timeDiff /= (3600 * 24 * 7);
    retTime = Math.floor(timeDiff) + 'w';
  }

  return retTime;
}
// commonHelper.getTaggedUserList = function(str,taggedUsers){
//  return new Promise((resolve, reject)=>{
   
//    if(str){
//     var strCopy = str;
//     var strList = strCopy.split(' ');
//     var newarr = [];
//     var getUserByUserName = [];
//     strList = strList.filter(val=>val.startsWith('@'));
//     strList.forEach((val,key)=>
//       newarr.push(val.replace('@',''))
//     );
//     if(typeof newarr !== 'undefined' && newarr.length > 0){
//       strList = newarr.filter((element)=>!(taggedUsers.some(taggedUser=>taggedUser.userName==element)))
//       strList.forEach((val,key)=>{
//         getUserByUserName.push(userModel.getArrOfData(userHelper.getUserByUserNameModel(val,'userName,userId')))
//       })
      
//       Promise.all(getUserByUserName).then(values => { 
//         resolve(values)
//       })
//       .catch(error => { 
//         reject(error.message);
//       });
//     }else{
//       resolve([]);
//     }
//   }else{
//     resolve([]);
//   }
//   });
  
// }
commonHelper.encode = function (doc) {  
  return new Buffer(JSON.stringify(doc));
}
module.exports = commonHelper;