var  {mongoose} = require('../config/database');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const UserDevice = new Schema({
    
    autoCreatedAt: false,
    autoUpdatedAt: false,
    attributes: {
      user_id: {
        type: String
      },
      device_id: {
        type: String
      },
      notif_token:{
          type: String
      },
      app_type:{
          type: String
      },
      created_at: {
        type: Date,
        defaultsTo: new Date()
      },
      status: {
        type: Number,
        defaultsTo: 1
      },
      
    },
  });
  module.exports = mongoose.model('UserDevice', UserDevice, 'user_devices');