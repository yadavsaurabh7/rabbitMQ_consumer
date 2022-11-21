var Channel = require('../config/connection');
var constants = require('../config/constants')

function consume(queue, channel, conn) {
  channel.get(queue, {}, onConsume);
  function onConsume(err, msg) {
    if (err) {
      console.warn(err.message);
    }
    else if (msg) {
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