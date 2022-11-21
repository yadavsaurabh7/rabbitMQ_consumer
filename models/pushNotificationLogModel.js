var  {mongoose} = require('../config/database');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const pushNotificationLog = new Schema({
    //tableName: 'push_notification_logs',
    autoCreatedAt: false,
    autoUpdatedAt: false,

      user_id_str:{
        type: String,
      },
      sent_on: {
        type: Date,
        default: Date.now
      },
      token:{
        type:String
      },
      payload: {
        type: Object
      },
      stats_id: {
        type: String
      },
      device_id: {
        type: String
      },
      response: {
        type: Object
      },
      message:{
        type: String
      },
      status: {
        type: Number,
        default: 1
      },
      os_type: {
        type: String
      },
      is_read:{
        type:Number,
        default:0

    },
    push_notif_status:{
      type:Number,
      default:1
    }
  });
  module.exports = mongoose.model('PushNotificationLog', pushNotificationLog, 'push_notification_logs');