var  {mongoose} = require('../config/database');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
 
const Classes = new Schema({
    autoCreatedAt: false,
    autoUpdatedAt: false,
    attributes: {
        class_name: {
            type: String
        },
        class_teacher_name: {
            type: String
        },
        class_teacher_id: {},
        class_teacher_id_str: {
            type: String
        },
        class_moderator_id: {
            type: 'array'
        },
        class_moderator_id_str: {
            type: String
        },
        categories: {},
        categories_array: {
            type: 'array'
        },
        class_desc: {
            type: String
        },
        class_profile_slug: {
            type: String
        },
        class_type: {
            type: String
        },
        meditation_position: {
            type: 'array'
        },
        target_audience: {
            type: 'array'
        },
        start_date: {
            type: Date,
        },
        start_date_str: {
            type: String,
        },
        start_time: {
            type: String
        },
        class_repetition: {
            type: String
        },
        end_date: {
            type: Date
        },
        end_date_str: {
            type: String
        },
        created_on: {
            type: Date,
            defaultsTo: new Date()
        },
        meeting_name: {
            type: String
        },
        no_of_seats: {
            type: Number,
            defaultsTo: 0
        },
        status: {
            type: Number,
            defaultsTo: 1
        },
        is_moderated: {
            type: Number,
            defaultsTo: 0
        },
        days_of_week: {
            type: 'array'
        },
        likes: {
            type: Number,
            defaultsTo: 0
        },
        dislikes: {
            type: Number,
            defaultsTo: 0
        },
        youtube_url: {
            type: String
        },
        video_url: {
            type: String
        },
        short_video_url:{
            type: String
        },
        main_video_url:{
            type: String
        },
        
        main_video_thumb:{
            
        },
        short_video_thumb:{
            
        },
        main_video_id:{
            type: String
        },
        short_video_id:{
            type: String
        },
        is_on_demand_available:{
            type: Number
        },
        on_demand_duration:{
            type: Number
        },
        on_demand_created_on:{
            type: Date,
            defaultsTo:new Date()
        },
        on_demand_updated_on:{
            type: Date
        },
        on_demand_created_by:{
            type: String
        },
        live_archive_type:{
            type: String
        },
        sharing_url: {
            type: String
        },
        class_for:{
            type: String
        },
        corporate_entities:{
            type:'array'
        },
        rating: {
            type: Number
        },
    },
  });
  
module.exports = mongoose.model('Classes', Classes, 'classes');