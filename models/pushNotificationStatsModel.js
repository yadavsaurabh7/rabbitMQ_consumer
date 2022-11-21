var  {mongoose_rmq} = require('../config/database_rmq');
const Schema = mongoose_rmq.Schema;
const ObjectId = Schema.ObjectId;
const pushNotificationStats = new Schema({
    
      user_id_str:{
        type: String,
      },
      sent_to:{
        type: Object
      },
      sent_on: {
        type: Date,
        default: Date.now()
      },
      iOS: {
        type: Object
      },
      Android: {
        type: Object
      },
      payload: {
        type: Object
      },
      message:{
        type: String
      }
  });
  module.exports = mongoose_rmq.model('PushNotificationStats', pushNotificationStats, 'push_notification_stats');