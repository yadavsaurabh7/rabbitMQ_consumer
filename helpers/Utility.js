const querystring = require('querystring');
const https = require('http');
const ObjectID = require('mongodb').ObjectID;
const nodemailer = require('nodemailer');
const amqp = require('amqplib/callback_api');
const apn = require('apn');
const createCsvWriter = require('csv-writer').createArrayCsvWriter;
const datesBetween = require('dates-between');


const admin = require("firebase-admin");
const ical = require('ical-generator');
const moment = require('moment-timezone');
var home_dir = require('os').homedir();
// const serviceAccount = require(sails.config.appPath + "/meditation-test-66b71-firebase-adminsdk-nqiar-b865e4ea95");  //test
//const serviceAccount = require(sails.config.appPath + "/mlfirebaseproject-62c9c-firebase-adminsdk-dqttc-a687408bb3");  //prod
// let serviceAccount;
// if (process.env.NODE_ENV == 'production') {
//      serviceAccount = require(sails.config.appPath + "/meditationlive-1538995686096-firebase-adminsdk-d6248-e3faea2f9a");  //prod
// } else {
//     serviceAccount = require(sails.config.appPath + "/mlfirebaseproject-62c9c-firebase-adminsdk-dqttc-a687408bb3");  //dev
// }
// const serviceAccount = require(home_dir + "/meditationlive-1538995686096-firebase-adminsdk-d6248-e3faea2f9a");  //prod

// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: "https://meditation-test-66b71.firebaseio.com"
// });


module.exports = {
    getDayName: function (day) {
        let dayName = '';
        if (day == '0') {
            dayName = 'SUN';
        } else if (day == '1') {
            dayName = 'MON';
        } else if (day == '2') {
            dayName = 'TUE';
        } else if (day == '3') {
            dayName = 'WED';
        } else if (day == '4') {
            dayName = 'THU';
        } else if (day == '5') {
            dayName = 'FRI';
        } else if (day == '6') {
            dayName = 'SAT';
        }
        return dayName;
    },

    sendEmail: function (toEmail, subject, body) {
        //AWS.config.update({ region: 'us-east-1', accessKeyId: 'AKIAJ2STMAPIWOYWBI4A', secretAccessKey: 'Ar5xCEVko5/ErugDAcr2fs4sz6YIUYXv6ZgMSx4wty+7' });
        const smtpConfig = {
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // use SSL
            auth: {
                user: 12,
                pass: 4
            }
        };

        const transport = nodemailer.createTransport(smtpConfig);
        transport.sendMail({
            from: 'Meditation.LIVE <' + process.env.FROM_EMAIL + '>',
            to: toEmail,
            subject: subject,
            html: body
        }, (error, data) => {

            if (error) {
                console.log(error);
            } else {
                console.log('email sent to:' + toEmail);
            }

        });
    },
    sendEmailWithCalendarInvite: function (toEmail, subject, body, data) {
        let FROM_EMAIL = 'calendar@meditation.live1';
        let FROM_EMAIL_PASSWORD = 'change@cal@181';
        const smtpConfig = {
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // use SSL
            auth: {
                user: FROM_EMAIL,
                pass: FROM_EMAIL_PASSWORD
            }
        };
        const cal = ical({
            domain: 'meditation.live',
            prodId: {company: 'Meditation.Live', product: 'Meeting'},
            name: data.event_name,
            timezone: 'GMT'
        });
         
         
        // create a new event
        const event = cal.createEvent({
            start: moment(data.start_time),
            end: moment(data.end_time),
            timestamp: moment(),
            summary: data.summary,
            description:data.description,
            organizer: 'Meditation.Live <calendar@meditation.live>'
        });
        if(data.repeating){
            event.repeating({
                freq: 'DAILY', // required
                until: new Date(data.until),
                byDay: data.days, // repeat only sunday and monday
                //byMonth: [1, 2], // repeat only in january und february,
                //byMonthDay: [1, 15], // repeat only on the 1st and 15th
                //bySetPos: 3, // repeat every 3rd sunday (will take the first element of the byDay array)
                //exclude: [new Date('Dec 25 2013 00:00:00 UTC')] // exclude these dates
            });
        }
        
        
        // get the iCal string
        const content=cal.toString();
        const transport = nodemailer.createTransport(smtpConfig);
        transport.sendMail({
            from: 'Meditation.LIVE <' + process.env.FROM_EMAIL + '>',
            to: toEmail,
            subject: subject,
            html: body,
            icalEvent: {
                method: 'PUBLISH',
                content: content
            }
        }, (error, data) => {

            // if (error) {
            //     console.log(error);
            // } else {
            //     console.log('email sent to:' + toEmail);
            // }

        });
    },
    sendEmailWithMultipleCalendarInvite: function (toEmail, subject, body, data) {
        const smtpConfig = {
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // use SSL
            auth: {
                user: process.env.FROM_EMAIL,
                pass: process.env.FROM_EMAIL_PASSWORD
            }
        };
        const cal = ical({
            domain: 'meditation.live',
            prodId: {company: 'Meditation.Live', product: 'Meeting'},
            name: data.event_name,
            timezone: 'GMT'
        });
         
         
        // create a new event
        const event = cal.createEvent({
            start: moment(data.events[0].start_time),
            end: moment(data.events[0].end_time),
            timestamp: moment(),
            summary: data.events[0].summary,
            description:data.events[0].description,
            organizer: 'Meditation.Live <calendar@meditation.live>'
        });
        const days=[];
        const eventDates=[];
        const excludeDates=[];
        for(i=0;i<data.events.length;i++){
            const d=new Date(data.events[i].start_time).getDay();
            eventDates.push(new Date(data.events[i].start_time).toString('yyyy-mm-dd'));
            if(d==0){
                days.push('su');
            }else if(d==1){
                days.push('mo');
            }else if(d==2){
                days.push('tu');
            }else if(d==3){
                days.push('we');
            }else if(d==4){
                days.push('th');
            }else if(d==5){
                days.push('fr');
            }else if(d==6){
                days.push('sa');
            }
        }
        console.log('eventDates:'+JSON.stringify(eventDates));
        
        for (const date1 of datesBetween(new Date(data.events[0].start_time), new Date(data.events[data.events.length-1].start_time))) {
            if(eventDates.indexOf(new Date(date1).toString('yyyy-mm-dd'))==-1){
                excludeDates.push(new Date(new Date(date1).toString('yyyy-mm-dd')));
            }
            
        }
        for(let i=0;i<excludeDates.length;i++){
            excludeDates[i]=new Date(excludeDates[i]);
        }
       //console.log('excludeDates:'+JSON.stringify(excludeDates));
        event.repeating({
            freq: 'DAILY', // required
            until: new Date(data.events[data.events.length-1].end_time),
            byDay: days, // repeat only sunday and monday
            //byMonth: [1, 2], // repeat only in january und february,
            //byMonthDay: [1, 15], // repeat only on the 1st and 15th
            //bySetPos: 3, // repeat every 3rd sunday (will take the first element of the byDay array)
            exclude: excludeDates // exclude these dates
        });
        
      
        
        
        
        
        // get the iCal string
        const content=cal.toString();
        const transport = nodemailer.createTransport(smtpConfig);
        transport.sendMail({
            from: 'Meditation.LIVE <' + process.env.FROM_EMAIL + '>',
            to: toEmail,
            subject: subject,
            html: body,
            icalEvent: {
                method: 'PUBLISH',
                content: content
            }
        }, (error, data) => {

            if (error) {
               // console.log(error);
            } else {
                console.log('email sent to:' + toEmail);
            }

        });
    },

    convertToIST: function (datetime) {
        const d = new Date(datetime);
        const localTime = d.getTime();
        const localOffset = d.getTimezoneOffset() * 60000;
        const utc = localTime + localOffset;
        const offset = 5.5;
        const india = utc + (3600000 * offset);
        const nd = new Date(bombay);
        return nd;
    },


    generateVerificationCode: () => {
        const min = 1000,
            max = 10000;
        let result;
        while (!result) {
            const code = Math.floor(Math.random() * (max - min)) + min;
            if (code != process.env.TEST_USER_CODE) {
                result = code;
            }
        }
        return result;
    },

    parseOSType: (userAgent, cl) => {
        try {
            const lowercaseAgent = userAgent.toLowerCase();
            const ios = lowercaseAgent.search('ios');
            const android = lowercaseAgent.search('android');
            let os_type;
            if (ios >= 0) {
                os_type = 'ios';
            }
            if (android >= 0) {
                os_type = 'android';
            }
            if (os_type) {
                cl(null, os_type);
            } else {
                cl('Unrecognized od type.');
            }
        } catch (e) {
            cl(e);
        }
    },

    getPassCodeContent: function (name, passcode, cl) {
        new Promise((resolve, reject) => {
            let html = '';
            html += '<div style="font-size:20px">';
            html += '<div style="width:500px;border:3px solid #eee;padding:20px 30px">';
            html += '<div style="text-align:center;border-bottom:1px solid #eee">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/med-live-logo.png">';
            html += '</div>';
            html += '<h3>Dear ' + name + ',</h3>';
            html += '<p>Please confirm your e-mail to gain access to meditation.live. Enter the code below on the app: </p>';
            html += '<br>';
            html += '<p><b>' + passcode + '</b></p>';
            html += '<br>';
            html += '<p>Namaste!<br>The Team at Meditation.LIVE</p>';
            html += '<div style="padding-top:20px;margin-top:30px;text-align:center;border-top:1px solid #eee">';
            html += '<a style="padding:0 5px" href="https://www.facebook.com/MeditateLive/" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/fb.png" >';
            html += '</a>';
            html += '<a style="padding:0 5px" href="https://www.instagram.com/meditation.live/" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/insta.png" >';
            html += '</a>';

            html += '<a style="padding:0 5px" href="https://twitter.com/LIVE_Meditate" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/twitter.png" >';
            html += '</a>';

            html += '<a style="padding:0 5px" href="https://in.linkedin.com/company/meditation-live" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/linkedin.png" >';
            html += '</a>';
            html += '</div>';
            html += '<div>';
            // html += '<p style="font-size:12px;padding-top:10px;text-align:center">';
            // html += 'We hope you enjoy receiving our reminder emails, but if you would prefer not to receive these emails please click';
            // html += '<a style="color:#000" href="https://meditation.live/unsubscribe/?e=d842ac0e5ad4d2601698eaa58e150b57&amp;k=218&amp;t=be538a2eb38c182cdee14975807ca554" target="_blank">unsubscribe</a>';
            // html += '</p>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
            cl(html);
        });
    },

    getStartUrlContent: function (meetingData, zoom_user, cb) {
        let html = '';
        html += '<div style="font-size:20px">';
        html += '<div style="width:500px;border:3px solid #eee;padding:20px 30px">';
        html += '<div style="text-align:center;border-bottom:1px solid #eee">';
        html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/med-live-logo.png">';
        html += '</div>';
        html += `<p>New meeting <b>${meetingData.class_name}</b> was created</p>`;
        html += '<br>';
        html += `<p>Zoom account email: ${zoom_user.email_id}<p>`;
        html += `<p>Zoom meeting ID: ${meetingData.zoom_id}<p>`;
        html += '<p>For start new meeting <p>';

        html += '<p style="text-align:center;margin:40px">';
        html += '<a href="' + meetingData.start_url + '" style="padding:10px 20px;font-size:20px;line-height:1.5;border-radius:.2rem;color:#fff;background-color:#28a745;border-color:#28a745;text-decoration:none" target="_blank" >';
        html += 'click here';
        html += '</a> <br>';
        html += 'Or use link bellow';
        html += '<a href="' + meetingData.start_url + '" style="font-size: 10px">' + meetingData.start_url + '<a>';
        html += '</p>';

        html += '<p>Namaste!<br>The Team at Meditation.LIVE</p>';
        html += '<div style="padding-top:20px;margin-top:30px;text-align:center;border-top:1px solid #eee">';
        html += '<a style="padding:0 5px" href="https://www.facebook.com/MeditateLive/" target="_blank">';
        html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/fb.png" >';
        html += '</a>';
        html += '<a style="padding:0 5px" href="https://www.instagram.com/meditation.live/" target="_blank">';
        html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/insta.png" >';
        html += '</a>';

        html += '<a style="padding:0 5px" href="https://twitter.com/LIVE_Meditate" target="_blank">';
        html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/twitter.png" >';
        html += '</a>';

        html += '<a style="padding:0 5px" href="https://in.linkedin.com/company/meditation-live" target="_blank">';
        html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/linkedin.png" >';
        html += '</a>';
        html += '</div>';
        html += '<div>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        cb(html);
    },

    getClassReminderContent: function (name, class_name, teacher_name, class_time, meeting_url, cl) {
        new Promise((resolve, reject) => {
            let html = '';
            html += '<div style="font-size:20px">';
            html += '<div style="width:500px;border:3px solid #eee;padding:20px 30px">';
            html += '<div style="text-align:center;border-bottom:1px solid #eee">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/med-live-logo.png">';
            html += '</div>';
            //html += '<h3>Hi ' + name + ',</h3>';
            html += '<p>We are excited to see you in ' + class_name.toUpperCase() + ' by ' + teacher_name.toUpperCase() + ' @ ' + class_time + '</p>';
            html += '<br>';
            html += '<p>Our meditation community is here for you. Our teachers bring you techniques from all over the world to use in your daily life. Take advantage of our LIVE virtual setting and open your mind and heart to our community. At the end of class, share your experience, ask a question or just enjoy the conversation.</p>';
            html += '<br>';
            html += '<p>We’ll see you in class!<p>';
            html += '<p style="text-align:center;margin:40px">';
            html += '<a href="' + meeting_url + '" style="padding:10px 20px;font-size:20px;line-height:1.5;border-radius:.2rem;color:#fff;background-color:#28a745;border-color:#28a745;text-decoration:none" target="_blank" >';
            html += 'ATTEND NOW';
            html += '</a>';
            html += '</p>';
            html += '<p>Namaste!<br>The Team at Meditation.LIVE</p>';
            html += '<div style="padding-top:20px;margin-top:30px;text-align:center;border-top:1px solid #eee">';
            html += '<a style="padding:0 5px" href="https://www.facebook.com/MeditateLive/" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/fb.png" >';
            html += '</a>';
            html += '<a style="padding:0 5px" href="https://www.instagram.com/meditation.live/" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/insta.png" >';
            html += '</a>';

            html += '<a style="padding:0 5px" href="https://twitter.com/LIVE_Meditate" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/twitter.png" >';
            html += '</a>';

            html += '<a style="padding:0 5px" href="https://in.linkedin.com/company/meditation-live" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/linkedin.png" >';
            html += '</a>';
            html += '</div>';
            html += '<div>';
            // html += '<p style="font-size:12px;padding-top:10px;text-align:center">';
            // html += 'We hope you enjoy receiving our reminder emails, but if you would prefer not to receive these emails please click';
            // html += '<a style="color:#000" href="https://meditation.live/unsubscribe/?e=d842ac0e5ad4d2601698eaa58e150b57&amp;k=218&amp;t=be538a2eb38c182cdee14975807ca554" target="_blank">unsubscribe</a>';
            // html += '</p>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
            cl(html);
        });
    },

    getClassReminderContentForTnM: function (name, class_name, teacher_name, class_time, zoom_link, cl) {
        new Promise((resolve, reject) => {
            let html = '';
            html += '<div style="font-size:20px">';
            html += '<div style="width:500px;border:3px solid #eee;padding:20px 30px">';
            html += '<div style="text-align:center;border-bottom:1px solid #eee">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/med-live-logo.png">';
            html += '</div>';
            html += '<h3>Hi ' + name + ',</h3>';
            html += '<p>' + class_name.toUpperCase() + ' by ' + teacher_name.toUpperCase() + ' @ ' + class_time + ' is going to start.</p>';
            html += '<br>';
            html += '<p>'+zoom_link+'</p>';
            html += '<p>We’ll see you in class!<p>';
            html += '<p>Namaste!<br>The Team at Meditation.LIVE</p>';
            html += '<div style="padding-top:20px;margin-top:30px;text-align:center;border-top:1px solid #eee">';
            html += '<a style="padding:0 5px" href="https://www.facebook.com/MeditateLive/" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/fb.png" >';
            html += '</a>';
            html += '<a style="padding:0 5px" href="https://www.instagram.com/meditation.live/" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/insta.png" >';
            html += '</a>';

            html += '<a style="padding:0 5px" href="https://twitter.com/LIVE_Meditate" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/twitter.png" >';
            html += '</a>';

            html += '<a style="padding:0 5px" href="https://in.linkedin.com/company/meditation-live" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/linkedin.png" >';
            html += '</a>';
            html += '</div>';
            html += '<div>';
            // html += '<p style="font-size:12px;padding-top:10px;text-align:center">';
            // html += 'We hope you enjoy receiving our reminder emails, but if you would prefer not to receive these emails please click';
            // html += '<a style="color:#000" href="https://meditation.live/unsubscribe/?e=d842ac0e5ad4d2601698eaa58e150b57&amp;k=218&amp;t=be538a2eb38c182cdee14975807ca554" target="_blank">unsubscribe</a>';
            // html += '</p>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
            cl(html);
        });
    },



    getRegistrationWelcomeContent: function (name, cl) {
        new Promise((resolve, reject) => {
            let html = '';
            html += '<div style="font-size:20px">';
            html += '<div style="width:500px;border:3px solid #eee;padding:20px 30px">';
            html += '<div style="text-align:center;border-bottom:1px solid #eee">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/med-live-logo.png">';
            html += '</div>';
            html += '<h3>Hello ' + name.toUpperCase() + ',</h3>';
            html += '<p>Welcome to the meditation.live community. You’ve already taken the first step to a healthier mind and a happier life. Let us help you the rest of the way…</p>';
            html += '<br>';
            html += '<p>Research tells us that meditation will give you an increase in productivity and a decrease in stress and anxiety. By starting your journey with us, you’re committing to making your mental health a priority in as little as one 30-minute class a day. But don’t take our word for it. Our students can tell you more about their experiences on meditation.live.</p>';
            html += '<br>';
            html += ' teachers and techniques from all over the world, in a LIVE virtual setting.';
            html += '<br>';
            html += '<p>' + 'For many it has become a habit: <a href="https://vimeo.com/300317831/95bd594afd">https://vimeo.com/300317831/95bd594afd</a>' + '</p>';
            html += '<p>' + 'They feel so relaxed: <a href="https://youtu.be/HMywTq1r-8s">https://youtu.be/HMywTq1r-8s</a>' + '</p>';
            html += '<p>' + 'And it’s the perfect way to start their day: <a href="https://vimeo.com/300315705/ffafc34f4f">https://vimeo.com/300315705/ffafc34f4f</a>' + '</p>';
            html += '<p>We can’t wait to see you in class. Our students and teachers are from all over the world and come with their own unique techniques and experience to share with you.</p>';
            html += '<p>If you have any questions during your journey, we’re here to help. Contact us at info@meditation.live</p>';
            html += '<p>Namaste!<br>The Team at Meditation.LIVE</p>';
            html += '<div style="padding-top:20px;margin-top:30px;text-align:center;border-top:1px solid #eee">';
            html += '<a style="padding:0 5px" href="https://www.facebook.com/MeditateLive/" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/fb.png" >';
            html += '</a>';
            html += '<a style="padding:0 5px" href="https://www.instagram.com/meditation.live/" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/insta.png" >';
            html += '</a>';

            html += '<a style="padding:0 5px" href="https://twitter.com/LIVE_Meditate" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/twitter.png" >';
            html += '</a>';

            html += '<a style="padding:0 5px" href="https://in.linkedin.com/company/meditation-live" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/linkedin.png" >';
            html += '</a>';
            html += '</div>';
            html += '<div>';
            // html += '<p style="font-size:12px;padding-top:10px;text-align:center">';
            // html += 'We hope you enjoy receiving our reminder emails, but if you would prefer not to receive these emails please click';
            // html += '<a style="color:#000" href="https://meditation.live/unsubscribe/?e=d842ac0e5ad4d2601698eaa58e150b57&amp;k=218&amp;t=be538a2eb38c182cdee14975807ca554" target="_blank">unsubscribe</a>';
            // html += '</p>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
            cl(html);
        });
    },

    getClassJoinWelcomeContent: function (name, class_name, teacher_name, class_time, cl) {
        new Promise((resolve, reject) => {
            let html = '';
            html += '<div style="font-size:20px">';
            html += '<div style="width:500px;border:3px solid #eee;padding:20px 30px">';
            html += '<div style="text-align:center;border-bottom:1px solid #eee">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/med-live-logo.png">';
            html += '</div>';
            html += '<h3>Hello ' + name.toUpperCase() + ',</h3>';
            html += '<p>Thank you for joining the meditation class '+class_name.toUpperCase()+' By '+teacher_name.toUpperCase()+ ' @ '+class_time.toUpperCase()+'. You’ve already taken the first step to a healthier mind and a happier life. Let us help you the rest of the way…</p>';
            html += '<br>';
            html += '<p>We can’t wait to see you in class. Our students and teachers are from all over the world and come with their own unique techniques and experience to share with you.</p>';
            html += '<p>If you have any questions during your journey, we’re here to help. Contact us at info@meditation.live</p>';
            html += '<p>Namaste!<br>The Team at Meditation.LIVE</p>';
            html += '<div style="padding-top:20px;margin-top:30px;text-align:center;border-top:1px solid #eee">';
            html += '<a style="padding:0 5px" href="https://www.facebook.com/MeditateLive/" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/fb.png" >';
            html += '</a>';
            html += '<a style="padding:0 5px" href="https://www.instagram.com/meditation.live/" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/insta.png" >';
            html += '</a>';

            html += '<a style="padding:0 5px" href="https://twitter.com/LIVE_Meditate" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/twitter.png" >';
            html += '</a>';

            html += '<a style="padding:0 5px" href="https://in.linkedin.com/company/meditation-live" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/linkedin.png" >';
            html += '</a>';
            html += '</div>';
            html += '<div>';
            // html += '<p style="font-size:12px;padding-top:10px;text-align:center">';
            // html += 'We hope you enjoy receiving our reminder emails, but if you would prefer not to receive these emails please click';
            // html += '<a style="color:#000" href="https://meditation.live/unsubscribe/?e=d842ac0e5ad4d2601698eaa58e150b57&amp;k=218&amp;t=be538a2eb38c182cdee14975807ca554" target="_blank">unsubscribe</a>';
            // html += '</p>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
            cl(html);
        });
    },

    getMeetindLaunchContent: function (name, meetingData, cb) {
        let html = '';
        html += '<div style="font-size:20px">';
        html += '<div style="width:500px;border:3px solid #eee;padding:20px 30px">';
        html += '<div style="text-align:center;border-bottom:1px solid #eee">';
        html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/med-live-logo.png">';
        html += '</div>';
        html += '<h3>Hi ' + name + ',</h3>';
        html += `<p>We have launched a new meditation meeting, <br> <b>${meetingData.class_name}</b>. <br>`;
        html += 'We look forward to seeing you in.</p>';
        html += '<p>For join the meeting</p>';

        html += `<a href="${meetingData.join_url}" style="padding:10px 20px;font-size:20px;line-height:1.5;border-radius:.2rem;color:#fff;background-color:#28a745;border-color:#28a745;text-decoration:none">click here</a>`;
        html += '<p>Namaste!<br>The Team at Meditation.LIVE</p>';
        html += '<div style="padding-top:20px;margin-top:30px;text-align:center;border-top:1px solid #eee">';
        html += '<a style="padding:0 5px" href="https://www.facebook.com/MeditateLive/" target="_blank">';
        html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/fb.png" >';
        html += '</a>';
        html += '<a style="padding:0 5px" href="https://www.instagram.com/meditation.live/" target="_blank">';
        html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/insta.png" >';
        html += '</a>';

        html += '<a style="padding:0 5px" href="https://twitter.com/LIVE_Meditate" target="_blank">';
        html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/twitter.png" >';
        html += '</a>';

        html += '<a style="padding:0 5px" href="https://in.linkedin.com/company/meditation-live" target="_blank">';
        html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/linkedin.png" >';
        html += '</a>';
        html += '</div>';
        html += '<div>';
        // html += '<p style="font-size:12px;padding-top:10px;text-align:center">';
        // html += 'We hope you enjoy receiving our reminder emails, but if you would prefer not to receive these emails please click';
        // html += '<a style="color:#000" href="https://meditation.live/unsubscribe/?e=d842ac0e5ad4d2601698eaa58e150b57&amp;k=218&amp;t=be538a2eb38c182cdee14975807ca554" target="_blank">unsubscribe</a>';
        // html += '</p>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        cb(html);
    },

    getClassLaunchContent: function (name, class_name, teacher_name, class_time, cl) {
        new Promise((resolve, reject) => {
            let html = '';
            html += '<div style="font-size:20px">';
            html += '<div style="width:500px;border:3px solid #eee;padding:20px 30px">';
            html += '<div style="text-align:center;border-bottom:1px solid #eee">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/med-live-logo.png">';
            html += '</div>';
            html += '<h3>Hi ' + name + ',</h3>';
            html += '<p>We have lanunched a new meditation class, ';
            html += class_name + ' by ' + teacher_name + ' @ ' + class_time;
            html += ' We look forward to seeing you in. ';

            html += '</p>';
            html += '<p>Namaste!<br>The Team at Meditation.LIVE</p>';
            html += '<div style="padding-top:20px;margin-top:30px;text-align:center;border-top:1px solid #eee">';
            html += '<a style="padding:0 5px" href="https://www.facebook.com/MeditateLive/" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/fb.png" >';
            html += '</a>';
            html += '<a style="padding:0 5px" href="https://www.instagram.com/meditation.live/" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/insta.png" >';
            html += '</a>';

            html += '<a style="padding:0 5px" href="https://twitter.com/LIVE_Meditate" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/twitter.png" >';
            html += '</a>';

            html += '<a style="padding:0 5px" href="https://in.linkedin.com/company/meditation-live" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/linkedin.png" >';
            html += '</a>';
            html += '</div>';
            html += '<div>';
            // html += '<p style="font-size:12px;padding-top:10px;text-align:center">';
            // html += 'We hope you enjoy receiving our reminder emails, but if you would prefer not to receive these emails please click';
            // html += '<a style="color:#000" href="https://meditation.live/unsubscribe/?e=d842ac0e5ad4d2601698eaa58e150b57&amp;k=218&amp;t=be538a2eb38c182cdee14975807ca554" target="_blank">unsubscribe</a>';
            // html += '</p>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
            cl(html);
        });
    },

    getCorporateAddContentForAccountManager: function (data, cl) {
        new Promise((resolve, reject) => {
            let html = '';
            html += '<div style="font-size:20px">';
            html += '<div style="width:500px;border:3px solid #eee;padding:20px 30px">';
            html += '<div style="text-align:center;border-bottom:1px solid #eee">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/med-live-logo.png">';
            html += '</div>';
            html += '<h3>Hi ' + data.account_manager_name + ',</h3>';
            html += '<p>' + data.entity_name + ' is on board with Meditation.Live';
            html += '</p>';
            html += '<p>The App download link is : ' + data.referral_url;
            html += '</p>';
            html += '<p>Contact person : ' + data.contact_person_name;
            html += '</p>';
            html += '<p>Contact Email : ' + data.contact_email;
            html += '</p>';
            html += '<p>Contact Mobile : ' + data.contact_mobile;
            html += '</p>';
            html += '<p>Namaste!<br>The Team at Meditation.LIVE</p>';
            html += '<div style="padding-top:20px;margin-top:30px;text-align:center;border-top:1px solid #eee">';
            html += '<a style="padding:0 5px" href="https://www.facebook.com/MeditateLive/" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/fb.png" >';
            html += '</a>';
            html += '<a style="padding:0 5px" href="https://www.instagram.com/meditation.live/" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/insta.png" >';
            html += '</a>';

            html += '<a style="padding:0 5px" href="https://twitter.com/LIVE_Meditate" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/twitter.png" >';
            html += '</a>';

            html += '<a style="padding:0 5px" href="https://in.linkedin.com/company/meditation-live" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/linkedin.png" >';
            html += '</a>';
            html += '</div>';
            html += '<div>';
            // html += '<p style="font-size:12px;padding-top:10px;text-align:center">';
            // html += 'We hope you enjoy receiving our reminder emails, but if you would prefer not to receive these emails please click';
            // html += '<a style="color:#000" href="https://meditation.live/unsubscribe/?e=d842ac0e5ad4d2601698eaa58e150b57&amp;k=218&amp;t=be538a2eb38c182cdee14975807ca554" target="_blank">unsubscribe</a>';
            // html += '</p>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
            cl(html);
        });
    },

    getTeacherScheduleNotificationEmailContent: function (data, cl) {
        new Promise((resolve, reject) => {
            let html = '';
            html += '<div style="font-size:20px">';
            html += '<div style="width:500px;border:3px solid #eee;padding:20px 30px">';
            html += '<div style="text-align:center;border-bottom:1px solid #eee">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/med-live-logo.png">';
            html += '</div>';
            html += '<h3>Hi ' + data.teacher_name + ',</h3>';
            html += '<p>' + data.class_name + ' is scheduled for '+data.start_date_time;
            html += '</p>';
            html += '<p>Zoom Meeting ID:'+data.zoom_meeting_id;
            html += '</p>';
            
            html += '<p>You can join via clicking on this link: <a href="' + data.join_url+'">Join Class</a>';
            html += '</p>';
            
            html += '<p>Namaste!<br>The Team at Meditation.LIVE</p>';
            html += '<div style="padding-top:20px;margin-top:30px;text-align:center;border-top:1px solid #eee">';
            html += '<a style="padding:0 5px" href="https://www.facebook.com/MeditateLive/" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/fb.png" >';
            html += '</a>';
            html += '<a style="padding:0 5px" href="https://www.instagram.com/meditation.live/" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/insta.png" >';
            html += '</a>';

            html += '<a style="padding:0 5px" href="https://twitter.com/LIVE_Meditate" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/twitter.png" >';
            html += '</a>';

            html += '<a style="padding:0 5px" href="https://in.linkedin.com/company/meditation-live" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/linkedin.png" >';
            html += '</a>';
            html += '</div>';
            html += '<div>';
            // html += '<p style="font-size:12px;padding-top:10px;text-align:center">';
            // html += 'We hope you enjoy receiving our reminder emails, but if you would prefer not to receive these emails please click';
            // html += '<a style="color:#000" href="https://meditation.live/unsubscribe/?e=d842ac0e5ad4d2601698eaa58e150b57&amp;k=218&amp;t=be538a2eb38c182cdee14975807ca554" target="_blank">unsubscribe</a>';
            // html += '</p>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
            cl(html);
        });
    },

    getCancelClassEmailContent: function (data, cl) {
        new Promise((resolve, reject) => {
            let html = '';
            html += '<div style="font-size:20px">';
            html += '<div style="width:500px;border:3px solid #eee;padding:20px 30px">';
            html += '<div style="text-align:center;border-bottom:1px solid #eee">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/med-live-logo.png">';
            html += '</div>';
            html += '<h3>Hi ' + data.teacher_name + ',</h3>';
            if(data.st){
                html += '<p>' + data.class_name + ' scheduled from  '+data.st+' to '+ data.et +' is cancelled';
            }else{
                html += '<p>' + data.class_name + ' scheduled for '+data.start_date_time+' is cancelled';
            }
            
            html += '</p>';
           
            
            html += '<p>Namaste!<br>The Team at Meditation.LIVE</p>';
            html += '<div style="padding-top:20px;margin-top:30px;text-align:center;border-top:1px solid #eee">';
            html += '<a style="padding:0 5px" href="https://www.facebook.com/MeditateLive/" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/fb.png" >';
            html += '</a>';
            html += '<a style="padding:0 5px" href="https://www.instagram.com/meditation.live/" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/insta.png" >';
            html += '</a>';

            html += '<a style="padding:0 5px" href="https://twitter.com/LIVE_Meditate" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/twitter.png" >';
            html += '</a>';

            html += '<a style="padding:0 5px" href="https://in.linkedin.com/company/meditation-live" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/linkedin.png" >';
            html += '</a>';
            html += '</div>';
            html += '<div>';
            // html += '<p style="font-size:12px;padding-top:10px;text-align:center">';
            // html += 'We hope you enjoy receiving our reminder emails, but if you would prefer not to receive these emails please click';
            // html += '<a style="color:#000" href="https://meditation.live/unsubscribe/?e=d842ac0e5ad4d2601698eaa58e150b57&amp;k=218&amp;t=be538a2eb38c182cdee14975807ca554" target="_blank">unsubscribe</a>';
            // html += '</p>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
            cl(html);
        });
    },

    getModeratorScheduleNotificationEmailContent: function (data, cl) {
        new Promise((resolve, reject) => {
            let html = '';
            html += '<div style="font-size:20px">';
            html += '<div style="width:500px;border:3px solid #eee;padding:20px 30px">';
            html += '<div style="text-align:center;border-bottom:1px solid #eee">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/med-live-logo.png">';
            html += '</div>';
            html += '<h3>Hi ' + data.teacher_name + ',</h3>';
            html += '<p>' + data.class_name + ' is scheduled for '+data.start_date_time;
            html += '</p>';
            html += '<p>Meeting ID : '+data.meeting_id;
            html += '</p>';
            html += '<p>Zoom Account : '+data.zoom_email;
            html += '</p>';
            html += '<p>You can start the class via clicking on this link: <a href="' + data.join_url+'">Start Class</a>';
            html += '</p>';
            
            html += '<p>Namaste!<br>The Team at Meditation.LIVE</p>';
            html += '<div style="padding-top:20px;margin-top:30px;text-align:center;border-top:1px solid #eee">';
            html += '<a style="padding:0 5px" href="https://www.facebook.com/MeditateLive/" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/fb.png" >';
            html += '</a>';
            html += '<a style="padding:0 5px" href="https://www.instagram.com/meditation.live/" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/insta.png" >';
            html += '</a>';

            html += '<a style="padding:0 5px" href="https://twitter.com/LIVE_Meditate" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/twitter.png" >';
            html += '</a>';

            html += '<a style="padding:0 5px" href="https://in.linkedin.com/company/meditation-live" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/linkedin.png" >';
            html += '</a>';
            html += '</div>';
            html += '<div>';
            // html += '<p style="font-size:12px;padding-top:10px;text-align:center">';
            // html += 'We hope you enjoy receiving our reminder emails, but if you would prefer not to receive these emails please click';
            // html += '<a style="color:#000" href="https://meditation.live/unsubscribe/?e=d842ac0e5ad4d2601698eaa58e150b57&amp;k=218&amp;t=be538a2eb38c182cdee14975807ca554" target="_blank">unsubscribe</a>';
            // html += '</p>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
            cl(html);
        });
    },

    getCreateUserContent: function (name, user) {
        return new Promise((resolve, reject) => {
            let html = '';
            html += '<div style="font-size:20px">';
            html += '<div style="width:500px;border:3px solid #eee;padding:20px 30px">';
            html += '<div style="text-align:center;border-bottom:1px solid #eee">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/med-live-logo.png">';
            html += '</div>';
            html += '<h3>Dear ' + name + ',</h3>';
            html += '<p>For join to our team please follow the link below. <br>';
            html += 'You can sign in using this credentials:</p>';
            html += '<p>Email: <b style="cursor: text">' + user.email + '</b></p>';
            html += '<p>Password: <b style="cursor: text">' + user.password + '<b></p>';
            html += '<br>';
            html += '<p><b>https://cms.meditation.live/login' + '</b></p>';
            html += '<br>';
            html += '<p>Namaste!<br>The Team at Meditation.LIVE</p>';
            html += '<div style="padding-top:20px;margin-top:30px;text-align:center;border-top:1px solid #eee">';
            html += '<a style="padding:0 5px" href="https://www.facebook.com/MeditateLive/" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/fb.png" >';
            html += '</a>';
            html += '<a style="padding:0 5px" href="https://www.instagram.com/meditation.live/" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/insta.png" >';
            html += '</a>';

            html += '<a style="padding:0 5px" href="https://twitter.com/LIVE_Meditate" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/twitter.png" >';
            html += '</a>';

            html += '<a style="padding:0 5px" href="https://in.linkedin.com/company/meditation-live" target="_blank">';
            html += '<img src="https://s3.ap-south-1.amazonaws.com/' + process.env.AWS_BUCKET + '/emailers/linkedin.png" >';
            html += '</a>';
            html += '</div>';
            html += '<div>';
            // html += '<p style="font-size:12px;padding-top:10px;text-align:center">';
            // html += 'We hope you enjoy receiving our reminder emails, but if you would prefer not to receive these emails please click';
            // html += '<a style="color:#000" href="https://meditation.live/unsubscribe/?e=d842ac0e5ad4d2601698eaa58e150b57&amp;k=218&amp;t=be538a2eb38c182cdee14975807ca554" target="_blank">unsubscribe</a>';
            // html += '</p>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
            resolve(html);
        });
    },

    convertToSlug: (str) => {
        return $.trim(str)
            .replace(/[^a-z0-9-]/gi, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .toLowerCase();
    },


    sendNewToIOS: (message, token, payload, user_id) => {

        const options = {
            key: sails.config.appPath + '/cert/prod/key.pem',
            cert: sails.config.appPath + '/cert/prod/Cert.pem',
            debug: true,
            production: true,
            teamId: "B553YLN78C"
        };

        const apnProvider = new apn.Provider(options);

        // Replace deviceToken with your particular token:
        const deviceToken = token;

        // Prepare the notifications
        const notification = new apn.Notification();

        notification.alert = message;

        notification.payload = payload;
        // Replace this with your app bundle ID:
        notification.topic = "www.meditation.live";

        // Send the actual notification
        apnProvider.send(notification, deviceToken).then(result => {
            // Show the result of the send operation:
            console.log('APNS RESULT:' + JSON.stringify(result));
            const pn = {
                user_id: new ObjectID(user_id),
                user_id_str: user_id,
                token: token,
                payload: payload,
                response: result,
                message: message,
                sent_on: new Date(),
                os_type: 'iOS'
            };
            PushNotificationLog.create(pn).then(created => {
                console.log('PUSH NOTIFICATION LOG INSERTED:' + JSON.stringify(pn));
            });
        });

        // Close the server
        apnProvider.shutdown();
    },

    sendNewToANDROID: (message, token, payload, user_id) => {
        payload['message'] = message;
        const dataForSend = {
            data: { data: JSON.stringify(payload) },
            token: token
        };

        admin.messaging().send(dataForSend)
            .then(response => {
                // Response is a message ID string.
                console.log('Successfully sent message:', response);
                const pn = {
                    user_id: new ObjectID(user_id),
                    user_id_str: user_id,
                    token: token,
                    payload: payload,
                    response: response,
                    message: message,
                    sent_on: new Date(),
                    os_type: 'Android'
                };
                PushNotificationLog.create(pn).then(created => {
                    console.log('PUSH NOTIFICATION LOG INSERTED:' + JSON.stringify(pn));
                });
            })
            .catch(error => {
                console.log('Error sending message:', error);
            });
    },

    sendAPNSForDevToIOS: (message, token, class_id, meeting_id, user_id, class_name, teacherInfo, classInfo) => {

        console.log('cert path:' + sails.config.appPath + '/cert/Key.pem');
        const options = {
            key: sails.config.appPath + '/cert/key.pem',
            cert: sails.config.appPath + '/cert/Cert.pem',
            debug: true,
            production: false,
            teamId: "B553YLN78C"
        };

        const apnProvider = new apn.Provider(options);

        // Replace deviceToken with your particular token:
        const deviceToken = token;

        // Prepare the notifications
        const notification = new apn.Notification();

        notification.alert = message;
        const payload = {

            messageFrom: 'Meditation.live',
            userInfo: {
                type: 'START_CLASS',
                data: {
                    class: {
                        class_id: class_id,
                        meeting_id: meeting_id,
                        class_name: class_name,
                        start_date: classInfo.start_date,
                        start_time: classInfo.start_time
                    },
                    teacher: teacherInfo
                }
            }
        };
        notification.payload = payload;
        // Replace this with your app bundle ID:
        notification.topic = "www.meditation.live";

        // Send the actual notification
        apnProvider.send(notification, deviceToken).then(result => {
            // Show the result of the send operation:
            console.log('APNS RESULT:' + JSON.stringify(result));
            const pn = {
                user_id: new ObjectID(user_id),
                user_id_str: user_id,
                token: token,
                payload: payload,
                response: result,
                message: message,
                sent_on: new Date(),
                os_type: 'iOS'
            };
            PushNotificationLog.create(pn).then(created => {
                console.log('PUSH NOTIFICATION LOG INSERTED:' + JSON.stringify(pn));
            });
        });
        // Close the server
        apnProvider.shutdown();
    },

    sendAPNSForDevANDROID: (message, token, class_id, meeting_id, user_id, class_name, teacherInfo, classInfo) => {
        // token = "fu5rxxKb7kY:APA91bHabcHCio-dcsr82Uf7xv1pyjqPj2ehUcbMW4a6a7uh79q64JpcFDFQwSOgY0AKs91lvc46BsKIlJp3FaezyBdSdD9uDY0Vj0TsNRn4JtnZXR6YXL06lLpC9Ku3a-ADGNynXYCe";

        const payload = {
            messageFrom: 'Meditation.live',
            userInfo: {
                type: 'START_CLASS',
                data: {
                    class: {
                        class_id: class_id,
                        meeting_id: meeting_id,
                        class_name: class_name,
                        start_date: classInfo.start_date,
                        start_time: classInfo.start_time
                    },
                    teacher: teacherInfo
                }
            }
        };

        const dataForSend = {
            notification: {
                body: message
            },
            data: { payload: JSON.stringify(payload) },
            token: token
        };

        admin.messaging().send(dataForSend)
            .then(response => {
                // Show the result of the send operation:
                console.log('APNS RESULT:' + JSON.stringify(response));
                const pn = {
                    user_id: new ObjectID(user_id),
                    user_id_str: user_id,
                    token: token,
                    payload: payload,
                    response: response,
                    message: message,
                    sent_on: new Date(),
                    os_type: 'Android'
                };
                PushNotificationLog.create(pn).then(created => {
                    console.log('PUSH NOTIFICATION LOG INSERTED:' + JSON.stringify(pn));
                });
            })
            .catch(error => {
                console.log('Error sending message:', error);
            });
    },

    sendTestMessageToAndroid: (message, payload, token) => {
        // token = "fu5rxxKb7kY:APA91bHabcHCio-dcsr82Uf7xv1pyjqPj2ehUcbMW4a6a7uh79q64JpcFDFQwSOgY0AKs91lvc46BsKIlJp3FaezyBdSdD9uDY0Vj0TsNRn4JtnZXR6YXL06lLpC9Ku3a-ADGNynXYCe";
        // if(!token){
        //    token="flCnLqxWoJY:APA91bFVtF74BgBWEA7qwXNlgffT9nsbHV_E73ba6_39fFZFQKrLf17UMvSN6E7mLx894h4Ka3GOC5jWe8y1D2tvbkN08Me5LcAopwERyHLmga-0XQSxVscvic0CB_w5h9bVcmtiQKJq"
        // }

        const dataForSend = {
            notification: {
                body: message
            },
            data: { payload: JSON.stringify(payload) },
            token: token,
            // topic:"www.meditation.live"
        };

        console.log('dataForSend', dataForSend)

        admin.messaging().send(dataForSend)
            .then(response => {
                // Show the result of the send operation:
                console.log('FIREBASE RESULT:' + JSON.stringify(response));
            })
            .catch(error => {
                console.log('Error sending message:', error);
            });
    },

    sendAPNSToIOS: (message, token, class_id, meeting_id, user_id, class_name, teacherInfo, classInfo) => {
        console.log('cert path:' + sails.config.appPath + '/cert/Key.pem');
        const options = {
            key: sails.config.appPath + '/cert/prod/key.pem',
            cert: sails.config.appPath + '/cert/prod/Cert.pem',
            debug: true,
            production: true,
            teamId: "B553YLN78C"
        };


        const apnProvider = new apn.Provider(options);

        // Replace deviceToken with your particular token:
        const deviceToken = token;

        // Prepare the notifications
        const notification = new apn.Notification();

        notification.alert = message;
        const payload = {

            messageFrom: 'Meditation.live',
            userInfo: {
                type: 'START_CLASS',
                data: {
                    class: {
                        class_id: class_id,
                        class_schedule_id: classInfo.class_schedule_id,
                        meeting_id: meeting_id,
                        class_name: class_name,
                        start_date: classInfo.start_date,
                        start_time: classInfo.start_time
                    },
                    teacher: teacherInfo
                }
            }
        };
        notification.payload = payload;
        // Replace this with your app bundle ID:
        notification.topic = "www.meditation.live";

        // Send the actual notification
        apnProvider.send(notification, deviceToken).then(result => {
            // Show the result of the send operation:
            console.log('APNS RESULT:' + JSON.stringify(result));
            const pn = {
                user_id: new ObjectID(user_id),
                user_id_str: user_id,
                token: token,
                payload: payload,
                response: result,
                message: message,
                sent_on: new Date(),
                os_type: 'iOS'
            };
            PushNotificationLog.create(pn).then(created => {
                console.log('PUSH NOTIFICATION LOG INSERTED:' + JSON.stringify(pn));
            });
        });
        // Close the server
        apnProvider.shutdown();
    },

    sendAPNSANDROID: (message, token, class_id, meeting_id, user_id, class_name, teacherInfo, classInfo) => {
        //token = "fu5rxxKb7kY:APA91bHabcHCio-dcsr82Uf7xv1pyjqPj2ehUcbMW4a6a7uh79q64JpcFDFQwSOgY0AKs91lvc46BsKIlJp3FaezyBdSdD9uDY0Vj0TsNRn4JtnZXR6YXL06lLpC9Ku3a-ADGNynXYCe";

        const payload = {
            messageFrom: 'Meditation.live',
            userInfo: {
                type: 'START_CLASS',
                data: {
                    class: {
                        class_id: class_id,
                        class_schedule_id: classInfo.class_schedule_id,
                        meeting_id: meeting_id,
                        class_name: class_name,
                        start_date: classInfo.start_date,
                        start_time: classInfo.start_time
                    },
                    teacher: teacherInfo
                }
            },
            message: message
        };

        const dataForSend = {
            data: { data: JSON.stringify(payload) },
            token: token,
        };
        admin.messaging().send(dataForSend)
            .then(response => {
                // Show the result of the send operation:
                console.log('APNS RESULT:' + JSON.stringify(response));
                const pn = {
                    user_id: new ObjectID(user_id),
                    user_id_str: user_id,
                    token: token,
                    payload: payload,
                    response: response,
                    message: message,
                    sent_on: new Date(),
                    os_type: 'Android'
                };
                PushNotificationLog.create(pn).then(created => {
                    console.log('PUSH NOTIFICATION LOG INSERTED:' + JSON.stringify(pn));
                });
            })
            .catch(error => {
                console.log('Error sending message:', error);
            });
    },

    createCsv: (name, headers, body) => {
        const csvWriter = createCsvWriter({
            header: headers,
            path: sails.config.appPath + `/${name}.csv`
        });
        csvWriter.writeRecords(body)       // returns a promise
            .then(() => {
                console.log('...Done');
            });
    },
    hoursConvertToHoursAndMin:(n) => {
        let num = n.toString().split(".");
        let tempHours = Number(num[0]);
        if(num.length > 1){
            let tempMinutes = Number(num[1]);
            let hours = (tempMinutes / 60);
            let rhours = Math.floor(hours);
            let minutes = (hours - rhours) * 60;
            let rminutes = Math.round(minutes);
            let finalHours = rhours + tempHours;
            return `${finalHours} hours ${rminutes} minutes`;
        }   else{
            return `${tempHours} hours 00 minutes`;
        }   
    },
    getRoleAndPrivilegesOfUser:()=>{
        return {
            roles: ['admin', 'user', 'hr', 'super admin'],
            privileges: [   
                { path:'/scheduleclass', name:'Schedule' },
                { path:'/viewactiveteachers', name:'Active Teacher' } 
            ]
        }
    },
    addUserActivitesLog:(user, deviceId) => {
        const dataTime = new Date();
        const userId = user.id ? user.id: null;
        const data = {
            user_id: userId,
            device_id: deviceId,
            last_active_time: dataTime,
            os_type: user.os_type ? user.os_type: null
        }
        if(userId && deviceId) { 
            UserActivityLog.count({user_id: data.user_id, device_id: data.device_id }).then(userActivityLogCount => {
                if(userActivityLogCount == 0) {                
                    UserActivityLog.create(data).then(createdbody=>{
                    });
                } else {
                    UserActivityLog.update({ user_id: data.user_id },data).then(updatedbody=>{
                    });
                }
            })        
        }        
    },
    checkedRequiredParams(event, params) {
        var message = ''
        var apiCredentials = event
        params.forEach(element => {
          if (element in apiCredentials && apiCredentials[element] !== '' && (apiCredentials[element].length !== 0)) {
          } else {
            message = message + element + ', '
          }
        });
        if (message !== '') {
          var validationmsg = message.replace(/,(?=[^,]*$)/, '') + "parameters are required and can not be blank."
          return validationmsg
        } else {
          return true
        }
      }
};

function createIcal(params, uid) {
    start = new Date(params.start);
    end = new Date(params.end);
    ts = new Date();
    //start = new Date(start);
    //end = new Date(end);
    //ts = getTZFormat(ts);
    //uid = replaceAll('-', '', guid());
    main_email = params.email;
    part_email = params.main_email;
    org_name = "Meditation.Live";
    org_email = "calendar@meditation.live";
    subject = params.subject;
    agenda = params.agenda;
    url = 'http://www.bakbak.io/schedule/meeting/parts?users=' + main_email + ',' + part_email;
    escaped_url = ' <' + url + '>';
    return 'BEGIN:VCALENDAR\r\n'
        + 'PRODID:-//Google Inc//Google Calendar 70.9054//EN\r\n'
        + 'VERSION:2.0\r\n'
        + 'CALSCALE:GREGORIAN\r\n'
        + 'METHOD:REQUEST\r\n'
        + 'BEGIN:VEVENT\r\n'
        + 'DTSTAMP:' + ts + '\r\n'
        + 'DTSTART:' + start + '\r\n'
        + 'DTEND:' + end + '\r\n'
        + 'SUMMARY:' + subject + escaped_url + '\r\n'
        + 'UID:' + uid + '\r\n'
        + 'DESCRIPTION:' + agenda + ' \r\n'
        + 'LOCATION: Web Location' + escaped_url + '\r\n'
        + 'ORGANIZER;CN=' + org_name + ':mailto:' + org_email + '\r\n'
        + 'ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=' + part_email + ';X-NUM-GUESTS=0:mailto:' + part_email + '\r\n'
        + 'ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=' + main_email + ';X-NUM-GUESTS=0:mailto:' + main_email + '\r\n'
        + 'SEQUENCE:0\r\n'
        + 'LAST-MODIFIED:' + ts + '\r\n'
        + 'CREATED:' + ts + '\r\n'
        + 'TRANSP:OPAQUE\r\n'
        + 'STATUS:CONFIRMED\r\n'
        + 'END:VEVENT\r\n'
        + 'END:VCALENDAR\r\n';
}