var  {mongoose} = require('../config/database');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
 
const ZoomAccount = new Schema({
   // autoCreatedAt: true,
    //autoUpdatedAt: true,
    attributes: {
        user_id: { type: String },
        email_id: { type: String },
        first_name: { type: String },
        last_name: { type: String },
        status: {type: 'boolean'},
        type: { type: Number },
        password: { type: String }
    },

});
module.exports = mongoose.model('ZoomAccount', ZoomAccount);