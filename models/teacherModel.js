var  {mongoose} = require('../config/database');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
 
const Teacher = new Schema({
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
        emails: {},
        work_email: {
            type: 'string'
        },
        mobile: {
            type: 'string'
        },
        whatsapp: {
            type: 'string'
        },
        instagram: {
            type: 'string'
        },
        facebook: {
            type: 'string'
        },
        twitter: {
            type: 'string'
        },
        linkedin: {
            type: 'string'
        },
        website: {
            type: 'string'
        },
        timezone: {
            type: 'string'
        },
        location: {
            type: 'string'
        },
        experience: {
            type: 'string'
        },
        certifications: {},
        created_on: {
            type: 'Date',
            defaultsTo: new Date()
        },
        status: {
            type: 'Number',
            defaultsTo: 1
        },
        is_moderated: {
            type: 'Number',
            defaultsTo: 0
        },
        email_status: {
            type: 'Number',
            defaultsTo: 0
        },
        categories: {},
        teacher_profile_slug: {
            type: 'string'
        },
        categories_array: {
            type: 'array'
        },
        rating: {
            type: 'Number'
        },
        sharing_url: {
            type: 'string'
        }
    }
});




module.exports = mongoose.model('Teacher',Teacher, "teacher");