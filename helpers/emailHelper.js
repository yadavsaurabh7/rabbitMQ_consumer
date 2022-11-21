const nodemailer = require('nodemailer');
const emailHelper = {};

emailHelper.sendEmail = function (toEmail, subject, body) {
    //AWS.config.update({ region: 'us-east-1', accessKeyId: 'AKIAJ2STMAPIWOYWBI4A', secretAccessKey: 'Ar5xCEVko5/ErugDAcr2fs4sz6YIUYXv6ZgMSx4wty+7' });
    const smtpConfig = {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // use SSL
        auth: {
            user: process.env.FROM_EMAIL,
            pass: process.env.FROM_EMAIL_PASSWORD
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
}
emailHelper.sendEmailWithCalendarInvite = function (toEmail, subject, body, data) {
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

        if (error) {
            console.log(error);
        } else {
            console.log('email sent to:' + toEmail);
        }

    });
}
emailHelper.sendEmailWithMultipleCalendarInvite = function (toEmail, subject, body, data) {
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
        eventDates.push(new Date(data.events[i].start_time).format('yyyy-mm-dd'));
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
        if(eventDates.indexOf(new Date(date1).format('yyyy-mm-dd'))==-1){
            excludeDates.push(new Date(new Date(date1).format('yyyy-mm-dd')));
        }
        
    }
    for(let i=0;i<excludeDates.length;i++){
        excludeDates[i]=new Date(excludeDates[i]);
    }
    console.log('excludeDates:'+JSON.stringify(excludeDates));
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
            console.log(error);
        } else {
            console.log('email sent to:' + toEmail);
        }

    });
}

module.exports = emailHelper;