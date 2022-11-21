var Channel = require('./config/connection');
var constants = require('./config/constants');
var classNotification = require('./controllers/classNotification');
var teacherNotification = require('./controllers/teacherNotification');
var userNotification = require('./controllers/userNotification');
var  {connect} = require('./config/database');
var  {connect_rmq} = require('./config/database_rmq');
connect().then(res=>console.log("CMS connected sucessfully")).catch(err=>{
  console.log(err);
  connect();
});

connect_rmq().then(res=>console.log("RMQ connected sucessfully")).catch(err=>{
  console.log(err);
  connect();
});


function consume(queue, channel, conn) {
  channel.get(queue, {}, onConsume);
  
  function onConsume(err, msg) {
    if (err) {
      console.warn(err.message);
    }
    else if (msg) {
     
      var data = JSON.parse(msg.content.toString());
      switch (data.type){
        case 'GENERAL':
          userNotification.bulkNotification(data);
        break;
        case 'NEW_USER':
          userNotification.notification(data);
        break;
        case 'UPDATE_APP':
          userNotification.bulkNotification(data);
        break;
        case 'CLASS_PROFILE':
          classNotification.bulkNotification(data);
        break;
        case 'START_CLASS':
          classNotification.bulkNotification(data);
        break;
        case 'CLASS_DELETED':
        break;
        case 'TEACHER_PROFILE':
          teacherNotification.bulkNotification(data);
        break;
        case 'ENTERPRISE_ADDED':
          classNotification.bulkNotification(data);
        break;
        default:
      }


      console.log(queue, 'consuming %j', msg.content.toString());
      setTimeout(function () {
        channel.ack(msg);
        consume(queue, channel, conn);
      }, 1e3);
    }
    else {
      console.log('no message, waiting...');
      setTimeout(function () {
        consume(queue, channel, conn);
      }, 1e3);
    }
  }
}
Channel(constants.emailQueue, function (err, channel, conn) {
  if (err) {
    console.error(err.stack);
  }
  else {
    console.log('channel and queue created');
    consume(constants.emailQueue, channel, conn);
  }
});

Channel(constants.bulkEmailQueue, function (err, channel, conn) {
  if (err) {
    console.error(err.stack);
  } else {
    console.log('channel and queue created');
    consume(constants.bulkEmailQueue, channel, conn);
  }
});

Channel(constants.pushNotificationQueue, function (err, channel, conn) {
  if (err) {
    console.error(err.stack);
  } else {
    console.log('channel and queue created');
    consume(constants.pushNotificationQueue, channel, conn);
  }
});

Channel(constants.bulkPushNotificationQueue, function (err, channel, conn) {
  if (err) {
    console.error(err.stack);
  } else {
    console.log('channel and queue created');
    consume(constants.bulkPushNotificationQueue, channel, conn);
  }
});