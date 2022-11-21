var pushNotification = require('./pushNotificationHelper')
var Utility = require('./Utility')
//var logger = require('../logger');
var  {mongoose} = require('../config/database');
const moment = require('moment-timezone');
var  User = require('../models/userModel');
var  ClassSchedule = require('../models/classScheduleModel');
var  ClassParticipants = require('../models/classParticipantsModel');
var  MyClass = require('../models/myClassModel');
var  Teacher = require('../models/teacherModel');
var  ResponseService = require('./ResponseService');
var  ZoomAccount = require('../models/zoomAccountModel');
var ObjectID = require('mongodb').ObjectID;
const today = new Date((new Date()).toString('yyyy-mm-dd'));
console.log(today.getTime());
let tomorrow = new Date(today.getTime() + (24 * 60 * 60 * 1000));
tomorrow=tomorrow.toString('yyyy-mm-dd T00:00:00.000Z');
//tomorrow=tomorrow+'T00:00:00.000Z';
console.log(tomorrow);
tomorrow=new Date(tomorrow);
console.log('today:'+today);
console.log('tomorrow:'+tomorrow);
const classHelper =  {};

classHelper.classStartReminder = function(data){

    ClassSchedule.find({
        status:1,
        start_date_time:{$gte:today,$lt:tomorrow}
    }).then(foundSchedules=>{
        console.log('foundSchedules:'+foundSchedules?foundSchedules.length:0);
        for(let i=0;i<foundSchedules.length;i++){
            let event=foundSchedules[i];
            // console.log(event);
            let id = event.id
            event = event.toObject();
            console.log('event id:'+id+' start time:'+ event.start_date_time);
            const diff = new Date(event.start_date_time)-new Date();
            const minutes = Math.floor((diff/1000)/60);
            console.log('minute diff:'+minutes);
            if(minutes<=7 && minutes>=0){
                console.log("send push for:"+id);
                ClassParticipants.find(
                    {
                        status:1,
                        class_schedule_id_str:id
                    }
                ).then(foundParts=>{
                    console.log('found participants:'+foundParts?foundParts.length:0);
                    for(let j=0;j<foundParts.length;j++){
                        User.findOne({
                            id:foundParts[j].user_id_str,
                            status:1
                        }).then(foundUser=>{
                            if(foundUser){
                                MyClass.findOne({id:foundParts[j].class_id_str}).then(foundClass=>{
                                    const token=foundUser.notif_token;
                                    const name=foundUser.name?foundUser.name:" User";
                                    console.log('token:'+token);
                                        if(foundUser.push_notif_status && parseInt(foundUser.push_notif_status)==1){
                                            if(token){
                                                Teacher.findOne({id:event.class_teacher_id}).then(foundTeacher => {
                                                    const teacher = {
                                                        teacher_name: foundTeacher.first_name + ' ' + foundTeacher.last_name,
                                                        teacher_id: foundTeacher.id,
                                                        picture: foundTeacher.profile_pic,
                                                        location: foundTeacher.location,
                                                        rating: foundTeacher.rating
                
                                                    };
                                                    if(foundUser.os_type=='iOS'){
                                                        const classInfo={
                                                            start_date:(foundUser.timezone)?moment.tz(event.start_date_time,foundUser.timezone).format('YYYY-MM-DD'):new Date(event.start_date_time).format('yyyy-mm-dd'),
                                                            start_time:(foundUser.timezone)?moment.tz(event.start_date_time,foundUser.timezone).format('hh:mm a').toUpperCase():new Date(event.start_date_time).format('hh:mm a').toUpperCase(),
                                                            class_schedule_id:foundParts[j].class_schedule_id_str
                                                        };
                                                        const message=foundClass.class_name+' is about to start @ '+classInfo.start_time;
                                                        PushNotificationService.sendAPNS(message, foundParts[j].class_id_str,event.zoom_meeting_id,foundUser.id,foundClass.class_name,teacher,classInfo);
                                                        
                                                    }

                                                    const class_time=moment.tz(event.start_date_time,foundUser.timezone).format('DD MMM, hh:mm a');
                                                    let meetingURL='';
                                                    if(event.join_deep_link && event.join_deep_link!=''){
                                                        meetingURL=event.join_deep_link;
                                                    }else{
                                                        meetingURL='https://zoom.us/j/'+event.zoom_meeting_id;
                                                    }
                                                    Utility.getClassReminderContent(name,foundClass.class_name,teacher.teacher_name,class_time,meetingURL,htmlBody=>{
                                                        const subject = name.toUpperCase()+' We’ll See You in Meditation Class';
                                                        console.log(htmlBody);
                                                        Utility.sendEmail(foundUser.email,subject,htmlBody);
                                                    });   
                                                    
                                                });

                                            }else{
                                                console.log('push token not found for user_id:'+foundUser.id);
                                            }
                                        }else{
                                            console.log('push notification turned off for user_id:'+foundUser.id);
                                        }

                                });
                                
                            }
                            
                        });
                    }
                    
                });

            }else if(minutes<=15 && minutes>=0){
                Teacher.findOne({id:event.class_teacher_id}).then(foundTeacher => {
                    console.log('foundTeacher:'+JSON.stringify(foundTeacher));
                    MyClass.findOne({id:event.class_id_str}).then(foundClass=>{
                        
                        const class_time=moment.tz(event.start_date_time,foundTeacher.timezone).format('DD MMM, hh:mm a');
                        let meetingURL='https://zoom.us/j/'+event.zoom_meeting_id;
                        const teacher_name=foundTeacher.first_name+' '+foundTeacher.last_name;
                        const zoom_link='Join class from here :<a href="'+meetingURL+'">JOIN CLASS</a>';
                        console.log('zoom_link:'+zoom_link);
                        Utility.getClassReminderContentForTnM(teacher_name,foundClass.class_name,"you",class_time,zoom_link,htmlBody=>{
                            const subject = foundClass.class_name+' is about to start';
                            Utility.sendEmail(foundTeacher.work_email,subject,htmlBody);
                        });
                    }).catch(err=>{
                        console.log(err);   
                        
                    });
                }).catch(err=>{
                    console.log(err);
                    
                });
                for(let i=0;i<event.class_moderator_id.length;i++){
                    User.findOne({id:event.class_moderator_id[i]}).then(foundMod => {
                        Teacher.findOne({id:event.class_teacher_id}).then(foundTeacher => {
                            const teacher_name=foundTeacher.first_name+' '+foundTeacher.last_name;
                            MyClass.findOne({id:event.class_id_str}).then(async foundClass=>{
                                const class_time=moment.tz(event.start_date_time,foundMod.timezone).format('DD MMM, hh:mm a');
                                const meetingURL=event.start_url;
                                const mod_name=foundMod.first_name+' '+foundMod.last_name;
                                let zoom_link='Start the class from here :<a href="'+meetingURL+'">START CLASS</a>';
                                if(event.zoom_account_id && event.zoom_account_id!=''){
                                    const zoomAcc=await ZoomAccount.findOne({id:event.zoom_account_id});
                                    zoom_link+='<br>Zoom Meeting ID:'+event.zoom_meeting_id;
                                    zoom_link+='<br>Zoom Account:'+zoomAcc.email;
                                }else{
                                    zoom_link+='<br>Zoom Meeting ID:4740203821';
                                    zoom_link+='<br>Zoom Account:calendar@meditation.live';
                                }
                                
                                Utility.getClassReminderContentForTnM(mod_name,foundClass.class_name,teacher_name,class_time,zoom_link,htmlBody=>{
                                    const subject = foundClass.class_name+' is required to be started';
                                    Utility.sendEmail(foundMod.email,subject,htmlBody);
                                });
                            });
                        });
                        
                    });
                }
                
                
            }
            else if(minutes<=-30 && minutes>=-40){
                //console.log('minutes diff is '+minutes);
                //console.log('checking for push to delete automatically');
                PushNotificationLog.find({
                    'payload.userInfo.data.class.class_id':event.class_id_str,
                    'payload.userInfo.type':'START_CLASS',
                    status:1
                }).then(foundPushLogs=>{
                    //console.log('foundPushLogs:>>>>>>>>>>>>>>>>>>>>>'+JSON.stringify(foundPushLogs));
                    if(foundPushLogs && foundPushLogs.length>0){
                        for(let k=0;k<foundPushLogs.length;k++){
                            PushNotificationLog.update({id:foundPushLogs[k].id},{status:2,deleted_on:new Date()}).then(updated=>{
                                //console.log("updated push:"+updated.id);
                            });
                        }
                    }
                });
            }
        }
    }).catch(err=>{
        console.log("ERROR while sending push================================="+err);
    });
}
classHelper.modifyscheduleclass = function ($data) {
    const timezone = $data.timezone;
    const t = $data;
    console.log('Schedule class modify request:' + JSON.stringify(t));

    let start_url=t.start_url;
    let join_url=t.join_url;
    let zoom_account_id=t.zoom_account_id;
    const meeting_id_global=t.meeting_id;
    if(!t.meetingId_checker || t.meetingId_checker=="false"){
        start_url='https://zoom.us/s/' + t.meeting_id;
        join_url='https://zoom.us/j/' + t.meeting_id;
        zoom_account_id='';
    }

    
   
    MyClass.findOne({id: t.class_id}).then(async foundClass => {

        const branchReqBody1 = {
            "branch_key": process.env.BRANCH_KEY,
            "data": {
                "$deeplink_path": "class-start/" + t.class_id,
                "$og_title": foundClass.class_name,
                "$og_description": foundClass.class_desc,
                "$og_image_url": "https://cdn.branch.io/branch-assets/1544527193013-og_image.png",
                "$desktop_url": join_url
            }
        };

        const branchRequest1 = request('POST', 'https://api.branch.io/v1/url', {json: branchReqBody1});
        const branchResponse1 = JSON.parse(branchRequest1.getBody());
        const join_deep_link=branchResponse1.url; 
        if(t.class_type=='class'){
            if (t.mod_type == '1') {
            
                const class_schedule = {
                    class_id: new ObjectID(t.class_id),
                    class_id_str: t.class_id,
                    //class_name: foundClass.class_name,
                    class_teacher_id: t.class_teacher_id,
                    class_teacher_id_str: t.class_teacher_id,
                    class_moderator_id: t.class_moderator_id,
                    class_moderator_id_str: t.class_moderator_id,
                    start_date: new Date(t.start_date),
                    start_date_str: t.start_date,
                    start_time: t.start_time,
                    class_repetition: t.class_repetition,
                    end_date: new Date(t.end_date),
                    end_date_str: t.end_date,
                    month: new Date(t.start_date).getMonth() + 1,
                    year: new Date(t.start_date).getFullYear(),
                    created_by: req.session.userId,
                    categories_array: foundClass.categories_array,
                    target_audience: foundClass.target_audience,
                    start_date_time: new Date(t.start_date + ' ' + t.start_time),
                    class_for:foundClass.class_for,
                    corporate_entities:foundClass.corporate_entities,
                    join_url: join_url,
                    start_url: start_url,
                    zoom_meeting_id:t.meeting_id,
                    zoom_account_id:zoom_account_id,
                    is_dynamic_meeting:t.meetingId_checker,
                    join_deep_link:join_deep_link,
                    class_license_type:t.class_license_type ? t.class_license_type: ''                        
                };
                

                ClassSchedule.findOne({id: t.event_id}).then(oldEvent => {
                    // if(foundClass.class_type=='course'){
                    //     class_schedule['session_index']=oldEvent.session_index;
                    // }
                    // ClassSchedule.update({id: t.event_id}, class_schedule).then(updatedEvent => {
                        const allEventArray = [];
                        // for (let i = 0; i < updatedEvent.length; i++) {
                        //     const ce = updatedEvent[i];
                        //     const a = moment.tz(new Date(updatedEvent[i].start_date_str).format('yyyy-mm-dd') + ' ' + updatedEvent[i].start_time, timezone);
                        //     const tz_time = a.format('hh:mm a').toUpperCase();
                        //     const tempEvent = {
                        //         start_date_str: ce.start_date_str,
                        //         start_time: ce.start_time,
                        //         id: ce.id,
                        //         class_id: ce.class_id,
                        //         class_name: foundClass.class_name,
                        //         start_time_local: tz_time,
                        //         is_passed: 0,
                        //         class_for:foundClass.class_for
                        //     };

                        //     allEventArray.push(tempEvent);
                        // }

                        if(oldEvent.class_teacher_id_str!=t.class_teacher_id){
                            //send cancel email to teacher
                            Teacher.findOne({id:oldEvent.class_teacher_id_str}).then(foundTeacher=>{

                                const teacherName = foundTeacher.first_name + ' ' + foundTeacher.last_name;
                                const email_data={
                                    teacher_name:teacherName,
                                    class_name:foundClass.class_name,
                                    start_date_time:moment.tz(new Date(t.start_date + ' ' + t.start_time),foundTeacher.timezone).format('DD MMM @ hh:mm a')+(foundTeacher.timezone?' ('+foundTeacher.timezone+')':'')
                                };
                                Utility.getCancelClassEmailContent(email_data,htmlBody=>{
                                    
                                    Utility.sendEmail(foundTeacher.work_email,'Meditation.Live | Class cancelled :'+foundClass.class_name,htmlBody);

                                });
                            });
                        }
                        let mod_changed=false;
                        let removedMods=[];
                        for(let i=0;i<t.class_moderator_id.length;i++){
                            if(oldEvent.class_moderator_id.indexOf(t.class_moderator_id[i])==-1){
                                mod_changed=true;
                                break;
                            }
                        }
                        for(let i=0;i<oldEvent.class_moderator_id.length;i++){
                            if(t.class_moderator_id.indexOf(oldEvent.class_moderator_id[i])==-1){
                                removedMods.push(oldEvent.class_moderator_id[i]);
                            }
                        }
                        if(mod_changed && removedMods.length>0){
                            //send cancel email to removed moderator
                            for(let j=0;j<removedMods.length;j++){
                                User.findOne({id:removedMods[j]}).then(foundMod=>{

                                    const modName = foundMod.first_name + ' ' + foundMod.last_name;
                                    const email_data={
                                        teacher_name:modName,
                                        class_name:foundClass.class_name,
                                        start_date_time:moment.tz(new Date(t.start_date + ' ' + t.start_time),foundMod.timezone?foundMod.timezone:'').format('DD MMM @ hh:mm a')+(foundMod.timezone?' ('+foundMod.timezone+')':'GMT')
                                    };
                                    
                                    Utility.getCancelClassEmailContent(email_data,htmlBody=>{
                                    
                                        
                                        Utility.sendEmail(foundMod.email,'Meditation.Live | Class cancelled :'+foundClass.class_name,htmlBody);
    
                                    });
                                });
                            }
                        }

                        

                            ClassParticipants.find({
                                status: 1,
                                class_schedule_id_str: t.event_id
                            }).then(foundParticipants => {
                                Promise.each(foundParticipants, (p, key) => {
                                    return User.findOne({id: p.user_id_str}).then(foundUser => {
                                        p['notif_token'] = foundUser.notif_token;
                                        p['timezone'] = foundUser.timezone;
                                        p['user_id'] = foundUser.id;
                                        p['user_name'] = foundUser.name;
                                        p['first_name'] = foundUser.first_name;
                                        p['last_name'] = foundUser.last_name;
                                        p['email'] = foundUser.email;
                                    });
                                }).then(pp => {
                                    // console.log('pp:~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                                    //         console.log(JSON.stringify(pp));
                                    //         console.log('pp:~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                                    const uniquePartIds = [];
                                    const uniquePartObj = {};
                                    for (let x = 0; x < pp.length; x++) {
                                        if (uniquePartIds.indexOf(pp[x].user_id) == -1) {
                                            uniquePartIds.push(pp[x].user_id);
                                            uniquePartObj[pp[x].user_id] = pp[x];
                                        }
                                    }
                                    const newPPList = [];
                                    for (let x = 0; x < uniquePartIds.length; x++) {
                                        newPPList.push(uniquePartObj[uniquePartIds[x]]);
                                    }
                                    Promise.each(newPPList, (p, key) => {
                                        const eventTime = moment.tz(class_schedule.start_date_time, p.timezone).format('ddd, MMM D @ hh:mm a').toUpperCase();
                                        const message = foundClass.class_name + ' rescheduled for ' + eventTime;
                                        const payload = {
                                            messageFrom: 'Meditation.live',
                                            userInfo: {
                                                type: 'CLASS_PROFILE',
                                                data: {
                                                    class_id: t.class_id,
                                                    class_name: foundClass.class_name,
                                                    class_schedule_id: t.event_id
                                                }
                                            }


                                        };
                                        PushNotificationService.sendAPNSNew(message, payload, p.user_id);
                                        //Utility.sendAPNSNew(message, p.notif_token, payload, p.user_id);
                                        const userName = (p.name && p.name != '') ? p.name : (p.first_name && p.first_name != "") ? (p.first_name + ' ' + p.last_name) : "Subscriber";
                                        let emailBody = '<p>Dear ' + userName + '</p>';
                                        emailBody += '<br><br>';
                                        emailBody += '<p>' + message + '</p>';
                                        emailBody += '<br><br>';
                                        emailBody += 'Regards,<br>';
                                        emailBody += 'Meditation.Live';
                                        Utility.sendEmail(p.email, message, emailBody);

                                    }).then(processedEntries => {
                                        // console.log('processedEntries:~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                                        // console.log(JSON.stringify(processedEntries));
                                        // console.log('processedEntries:~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                                    });


                                });
                            });

                            

                            Teacher.findOne({id:t.class_teacher_id}).then(foundTeacher=>{

                                const teacherName = foundTeacher.first_name + ' ' + foundTeacher.last_name;
                                const email_data={
                                    teacher_name:teacherName,
                                    class_name:foundClass.class_name,
                                    start_date_time:moment.tz(new Date(t.start_date + ' ' + t.start_time),foundTeacher.timezone).format('DD MMM @ hh:mm a')+(foundTeacher.timezone?' ('+foundTeacher.timezone+')':''),
                                    join_url:join_url,
                                    zoom_meeting_id:meeting_id_global
                                };
                                Utility.getTeacherScheduleNotificationEmailContent(email_data,htmlBody=>{
                                    const event_data={
                                        event_name:foundClass.class_name,
                                        start_time:t.start_date + ' ' + t.start_time,
                                        end_time:new Date(moment(new Date(t.start_date + ' ' + t.start_time)).add(foundClass.duration, 'm').toDate()).format('yyyy-mm-dd hh:MM tt'),
                                        summary:foundClass.class_name,
                                        description:'Join class session from here: <a href="'+join_url+'">JOIN CLASS</a><br>Zoom Meeting ID:'+meeting_id_global,
                                    }
                                    
                                    if(t.class_repetition=='Everyday' || t.class_repetition=='Weekly'){
                                        event_data['repeating']=true;
                                        event_data['until']=new Date(moment(new Date(t.end_date + ' ' + t.start_time)).add(foundClass.duration, 'm').toDate()).format('yyyy-mm-dd hh:MM tt');
                                        let days=[];
                                        days = classHelper.getDaysArr(t.days_of_week);
                                        event_data['days']=days;
                                    }
                                    console.log('event_data sent to email:'+JSON.stringify(event_data));
                                    Utility.sendEmailWithCalendarInvite(foundTeacher.work_email,'Meditation.Live | Class re-scheduled :'+foundClass.class_name,htmlBody,event_data);

                                });
                            });
                            //sending emails to moderators
                            ZoomAccount.findOne({id:zoom_account_id}).then(zoomAcc=>{
                                for(let j=0;j<t.class_moderator_id.length;j++){
                                    User.findOne({id:t.class_moderator_id[j]}).then(foundMod=>{
    
                                        const modName = foundMod.first_name + ' ' + foundMod.last_name;
                                        const email_data={
                                            teacher_name:modName,
                                            class_name:foundClass.class_name,
                                            start_date_time:moment.tz(new Date(t.start_date + ' ' + t.start_time),foundMod.timezone?foundMod.timezone:'').format('DD MMM @ hh:mm a')+(foundMod.timezone?' ('+foundMod.timezone+')':'GMT'),
                                            join_url:start_url,
                                            meeting_id:t.meeting_id
                                        };
                                        if(zoomAcc){
                                            email_data['zoom_email']=zoomAcc.email;
                                        }else{
                                            email_data['zoom_email']='calendar@meditation.live';
                                        }
                                        Utility.getModeratorScheduleNotificationEmailContent(email_data,htmlBody=>{
                                            const event_data={
                                                event_name:foundClass.class_name,
                                                start_time:t.start_date + ' ' + t.start_time,
                                                end_time:new Date(moment(new Date(t.start_date + ' ' + t.start_time)).add(foundClass.duration, 'm').toDate()).format('yyyy-mm-dd hh:MM tt'),
                                                summary:foundClass.class_name,
                                                description:'Start class session from here: <a href="'+start_url+'">START CLASS</a><br>Zoom Meeting ID:'+meeting_id_global+'<br>Zoom Account:'+email_data.zoom_email,
                                            }
                                            
                                            if(t.class_repetition=='Everyday' || t.class_repetition=='Weekly'){
                                                event_data['repeating']=true;
                                                event_data['until']=new Date(moment(new Date(t.end_date + ' ' + t.start_time)).add(foundClass.duration, 'm').toDate()).format('yyyy-mm-dd hh:MM tt');
                                                let days=[];
                                                days = classHelper.getDaysArr(t.days_of_week);
                                                event_data['days']=days;
                                            }
                                            console.log('moderator event_data sent to email:'+JSON.stringify(event_data));
                                            Utility.sendEmailWithCalendarInvite(foundMod.email,'Meditation.Live | Class re-scheduled :'+foundClass.class_name,htmlBody,event_data);
        
                                        });
                                    });
                                }
                            });

                        


                        const resData = {
                            class_data: allEventArray
                        };
                        const response = ResponseService.json('', resData, 'success');
                        res.send(response);
                    // });

                }).catch(e => {
                    if (e.message === 'no available users') {
                        const response = ResponseService.json('There is no available users on this time. Please select another hour or day', {}, 'failure');
                        res.send(response);
                    }
                });


            } else if (t.mod_type == '2' || t.mod_type == '3') {
                // This and following events
                let condition = {};
                const startDateTimeTemp = new Date(t.start_date + ' ' + t.start_time);
                console.log('startDateTimeTemp>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>' + startDateTimeTemp);
                ClassSchedule.findOne({id: t.event_id}).then(foundEvent => {
                    if (t.mod_type == '2') {
                        condition = {
                            class_id: t.class_id, status: 1,
                            start_date_time: {$gte: new Date(foundEvent.start_date_time)}
                        };
                    } else {
                        condition = {class_id: t.class_id, status: 1};
                    }
                    ClassSchedule.find(condition).sort('start_date_time ASC').then(foundSchedules => {
                        let start_date = '';
                        let end_date = '';
                        const id_to_delete = [];
                        for (let i = 0; i < foundSchedules.length; i++) {
                            id_to_delete.push(foundSchedules[i].id);
                            if (i == 0) {
                                start_date = foundSchedules[i].start_date_str;
                            }
                            end_date = foundSchedules[i].start_date_str;

                        }

                        Promise.each(foundSchedules, (sch, index) => {
                            return ClassParticipants.find({class_schedule_id_str: sch.id}).then(foundClassParts => {
                                sch['class_participants'] = foundClassParts;
                                for (let k = 0; k < foundClassParts.length; k++) {
                                    ClassParticipants.destroy({id: foundClassParts[k].id}).then(deletedClassPart => {
                                        console.log('classpart deleted:' + deletedClassPart[0].id);
                                    });
                                }
                            });
                        }).then(processedSchs => {
                            console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~>>processedSchs:' + JSON.stringify(processedSchs));


                            const uniqueParts = {};
                            const uniquePartsIDs = [];
                            for (let i = 0; i < processedSchs.length; i++) {
                                for (let j = 0; j < processedSchs[i].class_participants.length; j++) {
                                    const cp = processedSchs[i].class_participants[j];
                                    uniqueParts[cp.user_id_str] = cp;
                                    if (uniquePartsIDs.indexOf(cp.user_id_str) == -1) {
                                        uniquePartsIDs.push(cp.user_id_str);
                                    }
                                }
                            }


                            for (let i = 0; i < foundSchedules.length; i++) {
                                ClassSchedule.destroy({id: foundSchedules[i].id}).then(deleted => {
                                    console.log('scheduled event deleted:' + JSON.stringify(deleted));
                                });
                            }

                            let startDate = new Date(start_date);
                            if (t.mod_type == '3') {
                                if (t.start_date == t.end_date) {
                                    startDate = new Date(start_date);
                                } else {
                                    startDate = new Date(t.start_date);
                                }
                            }

                            const scheduled_dates = [];

                            let endDate = '';
                            console.log('end_date:' + end_date);
                            if (t.mod_type == '2') {
                                if (t.start_date == t.end_date) {
                                    endDate = new Date(end_date);
                                } else {
                                    endDate = new Date(t.end_date);
                                }
                            } else {
                                if (t.start_date == t.end_date) {
                                    endDate = new Date(end_date);
                                } else {
                                    endDate = new Date(t.end_date);
                                }
                            }

                            console.log('startDate:' + startDate);
                            console.log('endDate:' + endDate);
                            if (t.class_repetition != 'Weekly' && t.class_repetition != 'Everyday') {
                                for (const date1 of datesBetween(startDate, endDate)) {
                                    scheduled_dates.push(new Date(date1).format('yyyy-mm-dd'));
                                }
                            } else {
                                for (const date1 of datesBetween(startDate, endDate)) {
                                    if (t.days_of_week.indexOf('' + new Date(new Date(date1).format('yyyy-mm-dd')).getDay()) > -1) {
                                        scheduled_dates.push(new Date(date1).format('yyyy-mm-dd'));
                                    }
                                }
                            }
                            const classSchedules = [];

                            for (let i = 0; i < scheduled_dates.length; i++) {

                                const class_schedule = {
                                    class_id: t.class_id,
                                    class_id_str: t.class_id,
                                    class_name: foundClass.class_name,
                                    class_teacher_id: t.class_teacher_id,
                                    class_teacher_id_str: t.class_teacher_id,
                                    class_moderator_id: t.class_moderator_id,
                                    class_moderator_id_str: t.class_moderator_id,
                                    start_date: new Date(scheduled_dates[i]),
                                    start_date_str: scheduled_dates[i],
                                    start_time: t.start_time,
                                    class_repetition: t.class_repetition,
                                    end_date: new Date(scheduled_dates[i]),
                                    end_date_str: scheduled_dates[i],
                                    month: new Date(scheduled_dates[i]).getMonth() + 1,
                                    year: new Date(scheduled_dates[i]).getFullYear(),
                                    created_by: req.session.userId,
                                    categories_array: foundClass.categories_array,
                                    target_audience: foundClass.target_audience,
                                    start_date_time: new Date(scheduled_dates[i] + ' ' + t.start_time),
                                    class_for:foundClass.class_for,
                                    corporate_entities:foundClass.corporate_entities,
                                    join_url: join_url,
                                    start_url: start_url,
                                    zoom_meeting_id:t.meeting_id,
                                    zoom_account_id:zoom_account_id,
                                    is_dynamic_meeting:t.meetingId_checker,
                                    join_deep_link:join_deep_link,
                                    class_license_type:t.class_license_type ? t.class_license_type: ''
                                };
                                classSchedules.push(class_schedule);


                            }
                            console.log('classSchedules to create:' + JSON.stringify(classSchedules));


                            ClassSchedule.create(classSchedules).then(createdEvents => {
                                console.log("ALL class schedules created");
                                const allEventArray = [];
                                const classParticipantsNewEntries = [];
                                let eventDateGMT_start;
                                let eventDateGMT_end;
                                for (let i = 0; i < createdEvents.length; i++) {
                                    if (i == 0) {
                                        eventDateGMT_start = createdEvents[i].start_date_time;
                                    }
                                    eventDateGMT_end = createdEvents[i].start_date_time;
                                    const ce = createdEvents[i];
                                    const a = moment.tz(new Date(ce.start_date_str).format('yyyy-mm-dd') + ' ' + ce.start_time, timezone);
                                    const tz_time = a.format('hh:mm a').toUpperCase();
                                    const tempEvent = {
                                        start_date_str: ce.start_date_str,
                                        start_time: ce.start_time,
                                        id: ce.id,
                                        class_id: ce.class_id,
                                        class_name: foundClass.class_name,
                                        start_time_local: tz_time,
                                        is_passed: 0,
                                        class_for:foundClass.class_for
                                    };

                                    allEventArray.push(tempEvent);
                                    for (let x = 0; x < uniquePartsIDs.length; x++) {
                                        const classPart = {
                                            class_id: new ObjectID(ce.class_id_str),
                                            class_id_str: ce.class_id_str,
                                            class_schedule_id: new ObjectID(ce.id),
                                            class_schedule_id_str: ce.id,
                                            user_id: new ObjectID(uniquePartsIDs[x]),
                                            user_id_str: uniquePartsIDs[x],
                                            join_option_id: new ObjectID(uniqueParts[uniquePartsIDs[x]].join_option_id_str),
                                            join_option_id_str: uniqueParts[uniquePartsIDs[x]].join_option_id_str
                                        };
                                        classParticipantsNewEntries.push(classPart);
                                    }


                                }
                                console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~>>classParticipantsNewEntries:' + JSON.stringify(classParticipantsNewEntries));

                                // ClassParticipants.create(classParticipantsNewEntries).then(createdNewEntries => {

                                    Promise.each(uniquePartsIDs, (user_id, index) => {
                                        User.findOne({id: user_id}).then(p => {
                                            const st = moment.tz(eventDateGMT_start, p.timezone).format('MMM DD');
                                            const et = moment.tz(eventDateGMT_end, p.timezone).format('MMM DD @ hh:mm a').toUpperCase();
                                            const message = foundClass.class_name + ' rescheduled for ' + st + ' to ' + et;
                                            const payload = {
                                                messageFrom: 'Meditation.live',
                                                userInfo: {
                                                    type: 'CLASS_PROFILE',
                                                    data: {
                                                        class_id: uniqueParts[user_id].class_id_str,
                                                        class_name: foundClass.class_name,
                                                        class_schedule_id: ''
                                                    }
                                                }


                                            };

                                            PushNotificationService.sendAPNSNew(message, payload, p.user_id);
                                            
                                            const userName = (p.name && p.name != '') ? p.name : (p.first_name && p.first_name != "") ? (p.first_name + ' ' + p.last_name) : "Subscriber";
                                            let emailBody = '<p>Dear ' + userName + '</p>';
                                            emailBody += '<br><br>';
                                            emailBody += '<p>' + message + '</p>';
                                            emailBody += '<br><br>';
                                            emailBody += 'Regards,<br>';
                                            emailBody += 'Meditation.Live';
                                            Utility.sendEmail(p.email, message, emailBody);

                                        });
                                    }).then(ppp => {
                                        console.log('ppp>>>>>>>>>>>>>>>>>>>>>>>>>>>>>' + JSON.stringify(ppp));
                                    });


                                // });

                                Teacher.findOne({id:t.class_teacher_id}).then(foundTeacher=>{

                                    const teacherName = foundTeacher.first_name + ' ' + foundTeacher.last_name;
                                    const email_data={
                                        teacher_name:teacherName,
                                        class_name:foundClass.class_name,
                                        start_date_time:moment.tz(new Date(t.start_date + ' ' + t.start_time),foundTeacher.timezone).format('DD MMM @ hh:mm a')+(foundTeacher.timezone?' ('+foundTeacher.timezone+')':''),
                                        join_url:join_url,
                                        zoom_meeting_id:meeting_id_global
                                    };
                                    Utility.getTeacherScheduleNotificationEmailContent(email_data,htmlBody=>{
                                        const event_data={
                                            event_name:foundClass.class_name,
                                            start_time:t.start_date + ' ' + t.start_time,
                                            end_time:new Date(moment(new Date(t.start_date + ' ' + t.start_time)).add(foundClass.duration, 'm').toDate()).format('yyyy-mm-dd hh:MM tt'),
                                            summary:foundClass.class_name,
                                            description:'Join class session from here: <a href="'+join_url+'">JOIN CLASS</a><br>Zoom Meeting ID:'+meeting_id_global,
                                        }
                                        
                                        if(t.class_repetition=='Everyday' || t.class_repetition=='Weekly'){
                                            event_data['repeating']=true;
                                            event_data['until']=new Date(moment(new Date(t.end_date + ' ' + t.start_time)).add(foundClass.duration, 'm').toDate()).format('yyyy-mm-dd hh:MM tt');
                                            let days=[];
                                            days = classHelper.getDaysArr(t.days_of_week);
                                            event_data['days']=days;
                                        }
                                        console.log('event_data sent to email:'+JSON.stringify(event_data));
                                        Utility.sendEmailWithCalendarInvite(foundTeacher.work_email,'Meditation.Live | Class re-scheduled :'+foundClass.class_name,htmlBody,event_data);
    
                                    });
                                });
                                //sending emails to moderators
                                ZoomAccount.findOne({id:zoom_account_id}).then(zoomAcc=>{
                                    for(let j=0;j<t.class_moderator_id.length;j++){
                                        User.findOne({id:t.class_moderator_id[j]}).then(foundMod=>{
        
                                            const modName = foundMod.first_name + ' ' + foundMod.last_name;
                                            const email_data={
                                                teacher_name:modName,
                                                class_name:foundClass.class_name,
                                                start_date_time:moment.tz(new Date(t.start_date + ' ' + t.start_time),foundMod.timezone?foundMod.timezone:'').format('DD MMM @ hh:mm a')+(foundMod.timezone?' ('+foundMod.timezone+')':'GMT'),
                                                join_url:start_url,
                                                meeting_id:t.meeting_id,
                                            };
                                            if(zoomAcc){
                                                email_data['zoom_email']=zoomAcc.email;
                                            }else{
                                                email_data['zoom_email']='calendar@meditation.live';
                                            }
                                            Utility.getModeratorScheduleNotificationEmailContent(email_data,htmlBody=>{
                                                const event_data={
                                                    event_name:foundClass.class_name,
                                                    start_time:t.start_date + ' ' + t.start_time,
                                                    end_time:new Date(moment(new Date(t.start_date + ' ' + t.start_time)).add(foundClass.duration, 'm').toDate()).format('yyyy-mm-dd hh:MM tt'),
                                                    summary:foundClass.class_name,
                                                    description:'Start class session from here: <a href="'+start_url+'">START CLASS</a><br>Zoom Meeting ID:'+meeting_id_global+'<br>Zoom Account:'+email_data.zoom_email,
                                                }
                                                
                                                if(t.class_repetition=='Everyday' || t.class_repetition=='Weekly'){
                                                    event_data['repeating']=true;
                                                    event_data['until']=new Date(moment(new Date(t.end_date + ' ' + t.start_time)).add(foundClass.duration, 'm').toDate()).format('yyyy-mm-dd hh:MM tt');
                                                    let days=[];
                                                    days = classHelper.getDaysArr(t.days_of_week);
                                                    event_data['days']=days;
                                                }
                                                console.log('moderator event_data sent to email:'+JSON.stringify(event_data));
                                                Utility.sendEmailWithCalendarInvite(foundMod.email,'Meditation.Live | Class re-scheduled :'+foundClass.class_name,htmlBody,event_data);
            
                                            });
                                        });
                                    }
                                });


                                const resData = {
                                    class_data: allEventArray,
                                    id_to_delete: id_to_delete
                                };
                                const response = ResponseService.json('', resData, 'success');
                                res.send(response);

                            }).catch(err => {
                                console.log("Error | ClassSchedule.create(classSchedules) :" + err);
                            });


                        });


                    });


                }).catch(e => {
                    if (e.message === 'no available users') {
                        const response = ResponseService.json('There is no available users on this time. Please select another hour or day', {}, 'failure');
                        res.send(response);
                    }
                });

            } else if (t.mod_type == '3') {

            }
        }else if(t.class_type=='course'){
            const oldEvent=await ClassSchedule.findOne({id: t.event_id});

            const scheduled_dates = [];
            const scheduled_times = [];
            const session_titles = [];
            
            const session_timings=t.session_timings;
            console.log("t.session_timings::::"+JSON.stringify(t.session_timings));
            const course_details=foundClass.course_details;
            for(let i=0;i<course_details.length;i++){
                const session=course_details[i];
                if(session.session_type=='Live'){
                    const timing=session_timings['index_'+i];
                    scheduled_dates.push(timing.date);
                    scheduled_times.push(timing.time);
                    session_titles.push(session.title);
                }
            }
            
            const updatedEvent=[];
            // for(let i=0;i<scheduled_dates.length;i++){
            //     const class_schedule = {
            //         class_teacher_id: t.class_teacher_id,
            //         class_teacher_id_str: t.class_teacher_id,
            //         class_moderator_id: t.class_moderator_id,
            //         class_moderator_id_str: t.class_moderator_id,
            //         start_date: new Date(scheduled_dates[i]),
            //         start_date_str: scheduled_dates[i],
            //         start_time: scheduled_times[i],
            //         class_repetition: 'Once',
            //         end_date: new Date(scheduled_dates[i]),
            //         end_date_str: scheduled_dates[i],
            //         month: new Date(scheduled_dates[i]).getMonth() + 1,
            //         year: new Date(scheduled_dates[i]).getFullYear(),
            //         start_date_time: new Date(scheduled_dates[i] + ' ' + scheduled_times[i]),
            //         join_url: join_url,
            //         start_url: start_url,
            //         zoom_meeting_id:t.meeting_id,
            //         zoom_account_id:zoom_account_id,
            //         is_dynamic_meeting:t.meetingId_checker,
            //         join_deep_link:join_deep_link,
            //         class_license_type:t.class_license_type ? t.class_license_type: ''
            //     };
            //     const updated=await ClassSchedule.update({parent_schedule_id: t.parent_schedule_id,session_index:i}, class_schedule);
            //     updatedEvent.push(updated[0]);
            // }
            const modifiedEvent=await ClassSchedule.findOne({id: t.event_id});
            
            console.log("updatedEvents:"+JSON.stringify(updatedEvent));
            
                    const allEventArray = [];
                    // for (let i = 0; i < updatedEvent.length; i++) {
                    //     const ce = updatedEvent[i];
                    //     console.log('updatedEvent[i].start_date_str:'+updatedEvent[i].start_date_str);
                    //     const a = moment.tz(new Date(updatedEvent[i].start_date_str).format('yyyy-mm-dd') + ' ' + updatedEvent[i].start_time, timezone);
                    //     const tz_time = a.format('hh:mm a').toUpperCase();
                    //     const tempEvent = {
                    //         start_date_str: ce.start_date_str,
                    //         start_time: ce.start_time,
                    //         id: ce.id,
                    //         class_id: ce.class_id,
                    //         class_name: foundClass.class_name,
                    //         start_time_local: tz_time,
                    //         is_passed: 0,
                    //         class_for:foundClass.class_for
                    //     };

                    //     allEventArray.push(tempEvent);
                    // }

                    if(oldEvent.class_teacher_id_str!=t.class_teacher_id){
                        //send cancel email to teacher
                        Teacher.findOne({id:oldEvent.class_teacher_id_str}).then(foundTeacher=>{

                            const teacherName = foundTeacher.first_name + ' ' + foundTeacher.last_name;
                            const email_data={
                                teacher_name:teacherName,
                                class_name:foundClass.class_name,
                                start_date_time:moment.tz(new Date(oldEvent.start_date_str + ' ' + oldEvent.start_time),foundTeacher.timezone).format('DD MMM @ hh:mm a')+(foundTeacher.timezone?' ('+foundTeacher.timezone+')':'')
                            };
                            Utility.getCancelClassEmailContent(email_data,htmlBody=>{
                                
                                Utility.sendEmail(foundTeacher.work_email,'Meditation.Live | Class cancelled :'+foundClass.class_name,htmlBody);

                            });
                        });
                    }
                    let mod_changed=false;
                    let removedMods=[];
                    for(let i=0;i<t.class_moderator_id.length;i++){
                        if(oldEvent.class_moderator_id.indexOf(t.class_moderator_id[i])==-1){
                            mod_changed=true;
                            break;
                        }
                    }
                    for(let i=0;i<oldEvent.class_moderator_id.length;i++){
                        if(t.class_moderator_id.indexOf(oldEvent.class_moderator_id[i])==-1){
                            removedMods.push(oldEvent.class_moderator_id[i]);
                        }
                    }
                    if(mod_changed && removedMods.length>0){
                        //send cancel email to removed moderator
                        for(let j=0;j<removedMods.length;j++){
                            User.findOne({id:removedMods[j]}).then(foundMod=>{

                                const modName = foundMod.first_name + ' ' + foundMod.last_name;
                                const email_data={
                                    teacher_name:modName,
                                    class_name:foundClass.class_name,
                                    start_date_time:moment.tz(new Date(oldEvent.start_date_str + ' ' + oldEvent.start_time),foundMod.timezone?foundMod.timezone:'').format('DD MMM @ hh:mm a')+(foundMod.timezone?' ('+foundMod.timezone+')':'GMT')
                                };
                                
                                Utility.getCancelClassEmailContent(email_data,htmlBody=>{
                                
                                    
                                    Utility.sendEmail(foundMod.email,'Meditation.Live | Class cancelled :'+foundClass.class_name,htmlBody);

                                });
                            });
                        }
                    }

                    

                        ClassParticipants.find({
                            status: 1,
                            class_schedule_id_str: t.event_id
                        }).then(foundParticipants => {
                            Promise.each(foundParticipants, (p, key) => {
                                return User.findOne({id: p.user_id_str}).then(foundUser => {
                                    p['notif_token'] = foundUser.notif_token;
                                    p['timezone'] = foundUser.timezone;
                                    p['user_id'] = foundUser.id;
                                    p['user_name'] = foundUser.name;
                                    p['first_name'] = foundUser.first_name;
                                    p['last_name'] = foundUser.last_name;
                                    p['email'] = foundUser.email;
                                });
                            }).then(pp => {
                                // console.log('pp:~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                                //         console.log(JSON.stringify(pp));
                                //         console.log('pp:~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                                const uniquePartIds = [];
                                const uniquePartObj = {};
                                for (let x = 0; x < pp.length; x++) {
                                    if (uniquePartIds.indexOf(pp[x].user_id) == -1) {
                                        uniquePartIds.push(pp[x].user_id);
                                        uniquePartObj[pp[x].user_id] = pp[x];
                                    }
                                }
                                const newPPList = [];
                                for (let x = 0; x < uniquePartIds.length; x++) {
                                    newPPList.push(uniquePartObj[uniquePartIds[x]]);
                                }
                                Promise.each(newPPList, (p, key) => {
                                    const eventTime = moment.tz(modifiedEvent.start_date_time, p.timezone).format('ddd, MMM D @ hh:mm a').toUpperCase();
                                    const message = foundClass.class_name + ' rescheduled for ' + eventTime;
                                    const payload = {
                                        messageFrom: 'Meditation.live',
                                        userInfo: {
                                            type: 'CLASS_PROFILE',
                                            data: {
                                                class_id: t.class_id,
                                                class_name: foundClass.class_name,
                                                class_schedule_id: t.event_id
                                            }
                                        }


                                    };
                                    PushNotificationService.sendAPNSNew(message, payload, p.user_id);
                                    //Utility.sendAPNSNew(message, p.notif_token, payload, p.user_id);
                                    const userName = (p.name && p.name != '') ? p.name : (p.first_name && p.first_name != "") ? (p.first_name + ' ' + p.last_name) : "Subscriber";
                                    let emailBody = '<p>Dear ' + userName + '</p>';
                                    emailBody += '<br><br>';
                                    emailBody += '<p>' + message + '</p>';
                                    emailBody += '<br><br>';
                                    emailBody += 'Regards,<br>';
                                    emailBody += 'Meditation.Live';
                                    Utility.sendEmail(p.email, message, emailBody);

                                }).then(processedEntries => {
                                    // console.log('processedEntries:~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                                    // console.log(JSON.stringify(processedEntries));
                                    // console.log('processedEntries:~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                                });


                            });
                        });

                        

                        Teacher.findOne({id:t.class_teacher_id}).then(foundTeacher=>{

                            const teacherName = foundTeacher.first_name + ' ' + foundTeacher.last_name;
                            const email_data={
                                teacher_name:teacherName,
                                class_name:foundClass.class_name,
                                start_date_time:moment.tz(new Date(modifiedEvent.start_date_str + ' ' + modifiedEvent.start_time),foundTeacher.timezone).format('DD MMM @ hh:mm a')+(foundTeacher.timezone?' ('+foundTeacher.timezone+')':''),
                                join_url:join_url,
                                zoom_meeting_id:meeting_id_global
                            };
                            Utility.getTeacherScheduleNotificationEmailContent(email_data,htmlBody=>{
                                const event_data={
                                    event_name:foundClass.class_name,
                                    start_time:modifiedEvent.start_date_str + ' ' + modifiedEvent.start_time,
                                    end_time:new Date(moment(new Date(modifiedEvent.start_date_str + ' ' + modifiedEvent.start_time)).add(foundClass.duration, 'm').toDate()).format('yyyy-mm-dd hh:MM tt'),
                                    summary:foundClass.class_name,
                                    description:'Join class session from here: <a href="'+join_url+'">JOIN CLASS</a><br>Zoom Meeting ID:'+meeting_id_global,
                                }
                                
                                
                                console.log('event_data sent to email:'+JSON.stringify(event_data));
                                Utility.sendEmailWithCalendarInvite(foundTeacher.work_email,'Meditation.Live | Class re-scheduled :'+foundClass.class_name,htmlBody,event_data);

                            });
                        });
                        //sending emails to moderators
                        ZoomAccount.findOne({id:zoom_account_id}).then(zoomAcc=>{
                            for(let j=0;j<t.class_moderator_id.length;j++){
                                User.findOne({id:t.class_moderator_id[j]}).then(foundMod=>{

                                    const modName = foundMod.first_name + ' ' + foundMod.last_name;
                                    const email_data={
                                        teacher_name:modName,
                                        class_name:foundClass.class_name,
                                        start_date_time:moment.tz(new Date(modifiedEvent.start_date_str + ' ' + modifiedEvent.start_time),foundMod.timezone?foundMod.timezone:'').format('DD MMM @ hh:mm a')+(foundMod.timezone?' ('+foundMod.timezone+')':'GMT'),
                                        join_url:start_url,
                                        meeting_id:t.meeting_id
                                    };
                                    if(zoomAcc){
                                        email_data['zoom_email']=zoomAcc.email;
                                    }else{
                                        email_data['zoom_email']='calendar@meditation.live';
                                    }
                                    Utility.getModeratorScheduleNotificationEmailContent(email_data,htmlBody=>{
                                        const event_data={
                                            event_name:foundClass.class_name,
                                            start_time:modifiedEvent.start_date_str + ' ' + modifiedEvent.start_time,
                                            end_time:new Date(moment(new Date(modifiedEvent.start_date_str + ' ' + modifiedEvent.start_time)).add(foundClass.duration, 'm').toDate()).format('yyyy-mm-dd hh:MM tt'),
                                            summary:foundClass.class_name,
                                            description:'Start class session from here: <a href="'+start_url+'">START CLASS</a><br>Zoom Meeting ID:'+meeting_id_global+'<br>Zoom Account:'+email_data.zoom_email,
                                        }
                                        
                                        console.log('moderator event_data sent to email:'+JSON.stringify(event_data));
                                        Utility.sendEmailWithCalendarInvite(foundMod.email,'Meditation.Live | Class re-scheduled :'+foundClass.class_name,htmlBody,event_data);
    
                                    });
                                });
                            }
                        });

                    


                    const resData = {
                        //class_data: allEventArray
                    };
                    const response = ResponseService.json('', resData, 'success');
                    res.send(response);
        

            
        }
        
    });

    
}
classHelper.getDaysArr = function(t){
    let days = [];
    for(let i=0;i<t.days_of_week.length;i++){
        if(t.days_of_week[i]==0){
            days.push('su');
        }else if(t.days_of_week[i]==1){
            days.push('mo');
        }else if(t.days_of_week[i]==2){
            days.push('tu');
        }else if(t.days_of_week[i]==3){
            days.push('we');
        }else if(t.days_of_week[i]==4){
            days.push('th');
        }else if(t.days_of_week[i]==5){
            days.push('fr');
        }else if(t.days_of_week[i]==6){
            days.push('sa');
        }
    }
    return days;
}
classHelper.deletescheduleclass = function (data) {
    const t = req.body;
    console.log('delete event request:'+JSON.stringify(t));
    if(t.class_type=='class'){
        if (t.mod_type == '1') {
            ClassSchedule.destroy({id: t.event_id}).then(deleted => {
                console.log("Event deleted:" + t.event_id);
                ClassParticipants.destroy({class_schedule_id_str: t.event_id}).then(deletedParts => {
                    Promise.each(deletedParts, (p, key) => {
                        return User.findOne({id: p.user_id_str}).then(foundUser => {
                            p['notif_token'] = foundUser.notif_token;
                            p['timezone'] = foundUser.timezone;
                            p['user_id'] = foundUser.id;
                            p['user_name'] = foundUser.name;
                            p['first_name'] = foundUser.first_name;
                            p['last_name'] = foundUser.last_name;
                            p['email'] = foundUser.email;
                        });
                    }).then(pp => {


                        
                        //send cancel email to teacher
                        Teacher.findOne({id:deleted[0].class_teacher_id_str}).then(foundTeacher=>{

                            const teacherName = foundTeacher.first_name + ' ' + foundTeacher.last_name;
                            const email_data={
                                teacher_name:teacherName,
                                class_name:deleted[0].class_name,
                                start_date_time:moment.tz(deleted[0].start_date_time,foundTeacher.timezone).format('DD MMM @ hh:mm a')+(foundTeacher.timezone?' ('+foundTeacher.timezone+')':'')
                            };
                            Utility.getCancelClassEmailContent(email_data,htmlBody=>{
                                
                                Utility.sendEmail(foundTeacher.work_email,'Meditation.Live | Class cancelled :'+deleted[0].class_name,htmlBody);

                            });
                        });
                        
                        //send cancel email to removed moderator
                        for(let j=0;j<deleted[0].class_moderator_id.length;j++){
                            User.findOne({id:deleted[0].class_moderator_id[j]}).then(foundMod=>{

                                const modName = foundMod.first_name + ' ' + foundMod.last_name;
                                const email_data={
                                    teacher_name:modName,
                                    class_name:deleted[0].class_name,
                                    start_date_time:moment.tz(deleted[0].start_date_time,foundMod.timezone?foundMod.timezone:'').format('DD MMM @ hh:mm a')+(foundMod.timezone?' ('+foundMod.timezone+')':'GMT')
                                };
                                
                                Utility.getCancelClassEmailContent(email_data,htmlBody=>{
                                
                                    
                                    Utility.sendEmail(foundMod.email,'Meditation.Live | Class cancelled :'+deleted[0].class_name,htmlBody);

                                });
                            });
                        }
                        



                        const uniquePartIds = [];
                        const uniquePartObj = {};
                        for (let x = 0; x < pp.length; x++) {
                            if (uniquePartIds.indexOf(pp[x].user_id) == -1) {
                                uniquePartIds.push(pp[x].user_id);
                                uniquePartObj[pp[x].user_id] = pp[x];
                            }
                        }
                        const newPPList = [];
                        for (let x = 0; x < uniquePartIds.length; x++) {
                            newPPList.push(uniquePartObj[uniquePartIds[x]]);
                        }
                        // console.log('pp:~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                        //         console.log(JSON.stringify(pp));
                        //         console.log('pp:~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');

                        Promise.each(newPPList, (p, key) => {
                            const eventTime = moment.tz(deleted[0].start_date_time, p.timezone).format('ddd, MMM D @ hh:mm a').toUpperCase();
                            const message = deleted[0].class_name + ' scheduled for ' + eventTime + ' is cancelled';
                            const payload = {
                                messageFrom: 'Meditation.live',
                                userInfo: {
                                    type: 'CLASS_DELETED',
                                    data: {
                                        class_id: t.class_id,
                                        class_name: deleted[0].class_name,
                                        class_schedule_id: t.event_id
                                    }
                                }


                            };
                            PushNotificationService.sendAPNSNew(message, payload, p.user_id);
                            //Utility.sendAPNSNew(message, p.notif_token, payload, p.user_id);
                            const userName = (p.name && p.name != '') ? p.name : (p.first_name && p.first_name != "") ? (p.first_name + ' ' + p.last_name) : "Subscriber";
                            let emailBody = '<p>Dear ' + userName + '</p>';
                            emailBody += '<br><br>';
                            emailBody += '<p>' + message + '</p>';
                            emailBody += '<br><br>';
                            emailBody += 'Regards,<br>';
                            emailBody += 'Meditation.Live';
                            Utility.sendEmail(p.email, message, emailBody);

                        }).then(processedEntries => {
                            // console.log('processedEntries:~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                            // console.log(JSON.stringify(processedEntries));
                            // console.log('processedEntries:~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                        });
                    });
                });
                const resData = {
                    id_to_delete: [t.event_id]
                };
                const response = ResponseService.json('', resData, 'success');
                res.send(response);
            })
        } else if (t.mod_type == '2' || t.mod_type == '3') {
            let event;
            ClassSchedule.findOne({id: t.event_id}).then(foundEvent => {
                event = foundEvent;
                return ClassSchedule.find({
                    start_date_time: {$gte: new Date(foundEvent.start_date_time)},
                    class_id_str: foundEvent.class_id
                }).sort('start_date_time ASC').then(schedulesToDelete => {
                    console.log('schedulesToDelete:::::::::::::::::::::::::' + JSON.stringify(schedulesToDelete));
                    Promise.each(schedulesToDelete, (schedule, key) => {
                        return ClassSchedule.destroy({id: schedule.id}).then(deletedSch => {
                            console.log("Event deleted:" + deletedSch[0].id);
                            console.log('deletedSch:::::::::' + JSON.stringify(deletedSch[0]));
                            return ClassParticipants.find({class_schedule_id_str: deletedSch[0].id}).then(foundP => {
                                console.log('foundP:>>>>>>>>>' + JSON.stringify(foundP));
                                schedule['p'] = foundP;
                            });
                        });
                    }).then(deleted => {
                        console.log('events deleted::::::::::::' + JSON.stringify(deleted));
                        const deletedEvents = [];
                        let eventDateGMT_start;
                        let eventDateGMT_end;
                        for (let i = 0; i < deleted.length; i++) {
                            if (i == 0) {
                                eventDateGMT_start = deleted[i].start_date_time;
                            }
                            eventDateGMT_end = deleted[i].start_date_time;
                            deletedEvents.push(deleted[i].id);
                        }
                        const uniqueParts = {};
                        const uniquePartsIDs = [];
                        let class_name = '';
                        for (let i = 0; i < deleted.length; i++) {
                            for (let j = 0; j < deleted[i].p.length; j++) {
                                const cp = deleted[i].p[j];
                                class_name = deleted[i].class_name;
                                uniqueParts[cp.user_id_str] = cp;
                                if (uniquePartsIDs.indexOf(cp.user_id_str) == -1) {
                                    uniquePartsIDs.push(cp.user_id_str);
                                }
                                ClassParticipants.destroy({id: cp.id}).then(delP => {
                                    console.log('class participant entry deleted:' + cp.id);
                                });
                            }
                        }
                        let message='';
                        let st='';
                        let et=''
                        Promise.each(uniquePartsIDs, (user_id, index) => {
                            User.findOne({id: user_id}).then(p => {
                                st = moment.tz(eventDateGMT_start, p.timezone).format("MMM DD");
                                et = moment.tz(eventDateGMT_end, p.timezone).format("MMM DD @ hh:mm a").toUpperCase();
                                message = class_name + ' scheduled for ' + st + ' to ' + et + ' has been cancelled';
                                const payload = {
                                    messageFrom: 'Meditation.live',
                                    userInfo: {
                                        type: 'CLASS_DELETED',
                                        data: {
                                            class_id: uniqueParts[user_id].class_id_str,
                                            class_name: '',
                                            class_schedule_id: ''
                                        }
                                    }


                                };

                                PushNotificationService.sendAPNSNew(message, payload, p.user_id);
                                //Utility.sendAPNSNew(message, p.notif_token, payload, p.id);
                                const userName = (p.name && p.name != '') ? p.name : (p.first_name && p.first_name != "") ? (p.first_name + ' ' + p.last_name) : "Subscriber";
                                let emailBody = '<p>Dear ' + userName + '</p>';
                                emailBody += '<br><br>';
                                emailBody += '<p>' + message + '</p>';
                                emailBody += '<br><br>';
                                emailBody += 'Regards,<br>';
                                emailBody += 'Meditation.Live';
                                Utility.sendEmail(p.email, message, emailBody);

                            });
                        }).then(ppp => {
                            console.log('ppp>>>>>>>>>>>>>>>>>>>>>>>>>>>>>' + JSON.stringify(ppp));
                            //send cancel email to teacher
                            Teacher.findOne({id:deleted[0].class_teacher_id_str}).then(foundTeacher=>{
                                st = moment.tz(eventDateGMT_start, foundTeacher.timezone).format("MMM DD").toUpperCase();
                                et = moment.tz(eventDateGMT_end, foundTeacher.timezone).format("MMM DD @ hh:mm a").toUpperCase();
                                const teacherName = foundTeacher.first_name + ' ' + foundTeacher.last_name;
                                const email_data={
                                    teacher_name:teacherName,
                                    class_name:deleted[0].class_name,
                                    start_date_time:moment.tz(deleted[0].start_date_time,foundTeacher.timezone).format('DD MMM @ hh:mm a')+(foundTeacher.timezone?' ('+foundTeacher.timezone+')':''),
                                    st:st,
                                    et:et
                                };
                                Utility.getCancelClassEmailContent(email_data,htmlBody=>{
                                    
                                    Utility.sendEmail(foundTeacher.work_email,'Meditation.Live | Class cancelled : '+deleted[0].class_name,htmlBody);

                                });
                            });
                            
                            //send cancel email to removed moderator
                            for(let j=0;j<deleted[0].class_moderator_id.length;j++){
                                User.findOne({id:deleted[0].class_moderator_id[j]}).then(foundMod=>{
                                    st = moment.tz(eventDateGMT_start, foundMod.timezone).format("MMM DD").toUpperCase();
                                    et = moment.tz(eventDateGMT_end, foundMod.timezone).format("MMM DD @ hh:mm a").toUpperCase();
                                    const modName = foundMod.first_name + ' ' + foundMod.last_name;
                                    const email_data={
                                        teacher_name:modName,
                                        class_name:deleted[0].class_name,
                                        start_date_time:moment.tz(deleted[0].start_date_time,foundMod.timezone?foundMod.timezone:'').format('DD MMM @ hh:mm a')+(foundMod.timezone?' ('+foundMod.timezone+')':'GMT'),
                                        st:st,
                                        et:et
                                    };
                                    
                                    Utility.getCancelClassEmailContent(email_data,htmlBody=>{
                                    
                                        
                                        Utility.sendEmail(foundMod.email,'Meditation.Live | Class cancelled :'+deleted[0].class_name,htmlBody);

                                    });
                                });
                            }


                        });

                        const resData = {
                            id_to_delete: deletedEvents
                        };

                        const response = ResponseService.json('', resData, 'success');
                        res.send(response);
                    });

                });
            })
        }
    }else{
        ClassSchedule.findOne({id:t.event_id}).then(async foundEvent=>{
            const parentSchId=foundEvent.parent_schedule_id;
            const clz=await MyClass.findOne({id:foundEvent.class_id_str});
            ClassSchedule.destroy({parent_schedule_id: parentSchId}).then(deleted => {
                console.log("Event deleted:" + t.event_id);
                const toDelete=[];
                for(let i=0;i<deleted.length;i++){
                    toDelete.push(deleted[i].id);
                }
                ClassParticipants.destroy({class_schedule_id_str: toDelete}).then(deletedParts => {
                    Promise.each(deletedParts, (p, key) => {
                        return User.findOne({id: p.user_id_str}).then(foundUser => {
                            p['notif_token'] = foundUser.notif_token;
                            p['timezone'] = foundUser.timezone;
                            p['user_id'] = foundUser.id;
                            p['user_name'] = foundUser.name;
                            p['first_name'] = foundUser.first_name;
                            p['last_name'] = foundUser.last_name;
                            p['email'] = foundUser.email;
                        });
                    }).then(pp => {


                        
                        //send cancel email to teacher
                        Teacher.findOne({id:deleted[0].class_teacher_id_str}).then(foundTeacher=>{

                            const teacherName = foundTeacher.first_name + ' ' + foundTeacher.last_name;
                            const email_data={
                                teacher_name:teacherName,
                                class_name:clz.class_name,
                                start_date_time:moment.tz(deleted[0].start_date_time,foundTeacher.timezone).format('DD MMM @ hh:mm a')+(foundTeacher.timezone?' ('+foundTeacher.timezone+')':'')
                            };
                            Utility.getCancelClassEmailContent(email_data,htmlBody=>{
                                
                                Utility.sendEmail(foundTeacher.work_email,'Meditation.Live | Course cancelled : '+clz.class_name,htmlBody);

                            });
                        });
                        
                        //send cancel email to removed moderator
                        for(let j=0;j<deleted[0].class_moderator_id.length;j++){
                            User.findOne({id:deleted[0].class_moderator_id[j]}).then(foundMod=>{

                                const modName = foundMod.first_name + ' ' + foundMod.last_name;
                                const email_data={
                                    teacher_name:modName,
                                    class_name:clz.class_name,
                                    start_date_time:moment.tz(deleted[0].start_date_time,foundMod.timezone?foundMod.timezone:'').format('DD MMM @ hh:mm a')+(foundMod.timezone?' ('+foundMod.timezone+')':'GMT')
                                };
                                
                                Utility.getCancelClassEmailContent(email_data,htmlBody=>{
                                
                                    
                                    Utility.sendEmail(foundMod.email,'Meditation.Live | Course cancelled : '+clz.class_name,htmlBody);

                                });
                            });
                        }
                        



                        const uniquePartIds = [];
                        const uniquePartObj = {};
                        for (let x = 0; x < pp.length; x++) {
                            if (uniquePartIds.indexOf(pp[x].user_id) == -1) {
                                uniquePartIds.push(pp[x].user_id);
                                uniquePartObj[pp[x].user_id] = pp[x];
                            }
                        }
                        const newPPList = [];
                        for (let x = 0; x < uniquePartIds.length; x++) {
                            newPPList.push(uniquePartObj[uniquePartIds[x]]);
                        }
                        // console.log('pp:~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                        //         console.log(JSON.stringify(pp));
                        //         console.log('pp:~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');

                        Promise.each(newPPList, (p, key) => {
                            const eventTime = moment.tz(deleted[0].start_date_time, p.timezone).format('ddd, MMM D @ hh:mm a').toUpperCase();
                            const message = clz.class_name + ' course scheduled for ' + eventTime + ' is cancelled';
                            const payload = {
                                messageFrom: 'Meditation.live',
                                userInfo: {
                                    type: 'CLASS_DELETED',
                                    data: {
                                        class_id: t.class_id,
                                        class_name: deleted[0].class_name,
                                        class_schedule_id: t.event_id
                                    }
                                }


                            };
                            PushNotificationService.sendAPNSNew(message, payload, p.user_id);
                            //Utility.sendAPNSNew(message, p.notif_token, payload, p.user_id);
                            const userName = (p.name && p.name != '') ? p.name : (p.first_name && p.first_name != "") ? (p.first_name + ' ' + p.last_name) : "Subscriber";
                            let emailBody = '<p>Dear ' + userName + '</p>';
                            emailBody += '<br><br>';
                            emailBody += '<p>' + message + '</p>';
                            emailBody += '<br><br>';
                            emailBody += 'Regards,<br>';
                            emailBody += 'Meditation.Live';
                            Utility.sendEmail(p.email, message, emailBody);

                        }).then(processedEntries => {
                            // console.log('processedEntries:~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                            // console.log(JSON.stringify(processedEntries));
                            // console.log('processedEntries:~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                        });
                    });
                });
                const resData = {
                    id_to_delete: toDelete
                };
                const response = ResponseService.json('', resData, 'success');
                res.send(response);
            });
        });
        
    }
}
classHelper.sendScheduleInvite = async (data)=>{
    const r=data.payload;
    let foundClass=await MyClass.findOne({_id:ObjectID(r.class_id)});
    foundClass = foundClass.toObject();
    let sch=await ClassSchedule.findOne({id:r.event_id});
    sch = sch.toObject()
    var ObjectId =  ObjectID(sch.class_teacher_id_str);

    Teacher.findOne({_id:ObjectId}).then(foundTeacher=>{
        
        foundTeacher = foundTeacher.toObject();
        const teacherName = foundTeacher.first_name + ' ' + foundTeacher.last_name;
        let email_data={};
        if(foundClass.class_type=='class'){
            email_data ={
                teacher_name:teacherName,
                class_name:foundClass.class_name,
                start_date_time:moment.tz(sch.start_date_time,foundTeacher.timezone).format('DD MMM @ hh:mm a')+(foundTeacher.timezone?' ('+foundTeacher.timezone+')':''),
                join_url:sch.join_url,
                zoom_meeting_id:sch.zoom_meeting_id
            };
        }else{
            email_data ={
                teacher_name:teacherName,
                class_name:foundClass.class_name,
                start_date_time:moment.tz(sch.start_date_time,foundTeacher.timezone).format('DD MMM @ hh:mm a')+(foundTeacher.timezone?' ('+foundTeacher.timezone+')':''),
                join_url:sch.join_url,
                zoom_meeting_id:sch.zoom_meeting_id
            };
        }
        Utility.getTeacherScheduleNotificationEmailContent(email_data,htmlBody=>{
            
            
                const event_data={
                    event_name:foundClass.class_name,
                    start_time:sch.start_date_str + ' ' + sch.start_time,
                    end_time:new Date(moment(new Date(sch.start_date_str + ' ' + sch.start_time)).add(foundClass.duration, 'm').toDate('yyyy-mm-dd hh:MM tt')),
                    summary:foundClass.class_name,
                    description:'Join class session from here: <a href="'+sch.join_url+'">JOIN CLASS</a><br>Zoom Meeting ID:'+sch.zoom_meeting_id,
                }
                if(sch.class_repetition=='Everyday' || sch.class_repetition=='Weekly'){
                    event_data['repeating']=true;
                    event_data['until']=new Date(moment(new Date(sch.end_date_str + ' ' + sch.start_time)).add(foundClass.duration, 'm').toDate('yyyy-mm-dd hh:MM tt'));
                    let days=[];
                    days = classHelper.getDaysArr(sch.attributes);
                    event_data['days']=days;
                }
               // console.log('event_data sent to email:'+JSON.stringify(event_data));
                // Utility.sendEmailWithCalendarInvite(foundTeacher.work_email,'Meditation.Live | Class scheduled :'+foundClass.class_name,htmlBody,event_data);
                Utility.sendEmailWithCalendarInvite('yadavsaurabh7@gmail.com','Meditation.Live | Class scheduled :'+foundClass.class_name,htmlBody,event_data);
            
            
            
            

        });
    });
    
    //sending emails to moderators
    
    ZoomAccount.findOne({_id:ObjectID(sch.zoom_account_id)}).then(zoomAcc=>{
        console.log(zoomAcc);
        for(let j=0;j<sch.class_moderator_id.length;j++){
            
            User.findOne({_id: ObjectID(sch.class_moderator_id[j])}).then(foundMod=>{

                const modName = foundMod.first_name + ' ' + foundMod.last_name;
                let email_data={};
                if(foundClass.class_type=='class'){
                    email_data={
                        teacher_name:modName,
                        class_name:foundClass.class_name,
                        start_date_time:moment.tz(sch.start_date_time,foundMod.timezone?foundMod.timezone:'').format('DD MMM @ hh:mm a')+(foundMod.timezone?' ('+foundMod.timezone+')':'GMT'),
                        join_url:sch.start_url,
                        meeting_id:sch.zoom_meeting_id,
                    };
                }else{
                    email_data={
                        teacher_name:modName,
                        class_name:foundClass.class_name,
                        start_date_time:moment.tz(sch.start_date_time,foundMod.timezone?foundMod.timezone:'').format('DD MMM @ hh:mm a')+(foundMod.timezone?' ('+foundMod.timezone+')':'GMT'),
                        join_url:sch.start_url,
                        meeting_id:sch.zoom_meeting_id,
                    };
                }
                if(zoomAcc){
                    email_data['zoom_email']=zoomAcc.email;
                }else{
                    email_data['zoom_email']='calendar@meditation.live';
                }
                Utility.getModeratorScheduleNotificationEmailContent(email_data,htmlBody=>{
                    
                        const event_data={
                            event_name:foundClass.class_name,
                            start_time:sch.start_date_str + ' ' + sch.start_time,
                            end_time:new Date(moment(new Date(sch.start_date_str + ' ' + sch.start_time)).add(foundClass.duration, 'm').toDate('yyyy-mm-dd hh:MM tt')),
                            summary:foundClass.class_name,
                            description:'Start class session from here: <a href="'+sch.start_url+'">START CLASS</a><br>Zoom Meeting ID:'+sch.zoom_meeting_id+'<br>Zoom Account:'+email_data.zoom_email,
                        };
                        if(sch.class_repetition=='Everyday' || sch.class_repetition=='Weekly'){
                            event_data['repeating']=true;
                            event_data['until']=new Date(moment(new Date(sch.end_date_str + ' ' + sch.start_time)).add(foundClass.duration, 'm').toDate('yyyy-mm-dd hh:MM tt'));
                            let days=[];
                            days = classHelper.getDaysArr(sch);
                            event_data['days']=days;
                        }
                        console.log('moderator event_data sent to email:'+JSON.stringify(event_data));
                        //Utility.sendEmailWithCalendarInvite(foundMod.email,'Meditation.Live | Class scheduled :'+foundClass.class_name,htmlBody,event_data);
                        Utility.sendEmailWithCalendarInvite('yadavsaurabh7@gmail.com','Meditation.Live | Class scheduled :'+foundClass.class_name,htmlBody,event_data);
                    
                });
            });
        }
    });
    const response = ResponseService.json('', {}, 'success');
    //res.send(response);
};
module.exports = classHelper;