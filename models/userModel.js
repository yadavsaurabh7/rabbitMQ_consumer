var  {mongoose} = require('../config/database');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
 
const User = new Schema({
  
  id: ObjectId,
  autoCreatedAt: false,
  autoUpdatedAt: false,
  attributes: {
      first_name: {
          type: 'string'
      },
      last_name: {
          type: 'string'
      },
      email: {
          type: 'string'
      },
      password: {
          type: 'string'
      },
      user_type: {
          type: 'Number',
          defaultsTo: 0
      },
      roles_privileges_id_str: {
          type: 'string'
      },
      created_by: {
          type: 'Number'
      },
      created_on: {
          type: 'Date',
          defaultsTo: new Date()
      },
      status: {
          type: 'Number',
          defaultsTo: 1
      },
      facebook_id: {
          type: 'string'
      },
      google_id: {
          type: 'string'
      },
      gender: {
          type: 'string'
      },
      location: {
          type: 'string'
      },
      timezone: {
          type: 'string'
      },
      age: {
          type: 'Number'
      },
      existing: {
          type: 'boolean'
      },
      photo_url: {
          type: 'string'
      },
      notif_token: {
          type: 'string'
      },
      $os_type: {
          type: 'string'
      },
      push_notif_status: {
          type: 'Number',
          defaultsTo: 1
      },
      coming_from: {
          type: 'string'
      },
      meditation_hours:{
          type: 'Decimal128'
      },
      coupon_code: {
          type: 'string'
      }
  },

}



);




module.exports = mongoose.model('User', User);