var Channel = require('../config/connection');
var constants = require('../config/constants')
const producer = {};

Channel(constants.emailQueue, function(err, channel, conn) {
  if (err) {
    console.error(err.stack);
  }
  producer.emailChannel = channel;
});

Channel(constants.bulkEmailQueue, function(err, channel, conn) {
  if (err) {
    console.error(err.stack);
  }
  producer.bulkEmailChannel = channel;
});

Channel(constants.pushNotificationQueue, function(err, channel, conn) {
  if (err) {
    console.error(err.stack);
  }
  producer.pushNotificationChannel = channel;
});

Channel(constants.bulkPushNotificationQueue, function(err, channel, conn) {
  if (err) {
    console.error(err.stack);
  }
  producer.bulkPushNotificationChannel = channel;
});


module.exports = producer;