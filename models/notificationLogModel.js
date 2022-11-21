var  {mongoose_rmq} = require('../config/database_rmq');
const Schema = mongoose_rmq.Schema;
const ObjectId = Schema.ObjectId;
const notificationLog = new Schema({
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
  module.exports = mongoose_rmq.model('notificationLog', notificationLog, 'push_notification_logs');