var  {mongoose} = require('../config/database');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
 
const Class_participants = new Schema({
  
    id: ObjectId,
    autoCreatedAt: false,
    autoUpdatedAt: false,
    attributes: {
      class_id: {
        
      },
      class_id_str:{
        type:String
      },
      class_schedule_id:{

      },
      class_schedule_id_str:{
        type:String
      },
      user_id:{

      },
      user_id_str:{
        type:String
      },
      join_option_id:{

      },
      join_option_id_str:{
        type:String
      },
      joined_on: {
        type: Date,
        defaultsTo:new Date()
      },
      status:{
        type:Number,
        defaultsTo:1   // 0 - discard, 1 - joined, 2 - taken, 3 - joined but not taken
      },
      left_on:{
        type:Date
      }
      
    },
  });
  
module.exports = mongoose.model('Class_participants', Class_participants);