var express = require('express');
var router = express.Router();
var constants = require('../config/constants');
const emailNotification = require('../controllers/emailNotification');
const classNotification = require('../controllers/classNotification');
const userNotification = require('../controllers/userNotification');
/*
 * Routes that can be accessed by any one
 */
router.get('/', function (req, res) {
    res.send("Yes we are listening");
});

//router.post('/login', auth.login);

/*
 * Routes that can be accessed only by autheticated users
 */
//Routes for user
// router.get('email/:username', user.searchUserByUsername);

router.get('/email', emailNotification.email);
router.get('/bulkEmail', emailNotification.bulkEmail);
router.post('/notification/class/:type', classNotification.notification);
router.post('/bulkNotification/class/:type', classNotification.bulkNotification);
router.post('/email/class/:type', classNotification.email);
router.post('/bulkEmail/class/:type', classNotification.bulkEmail);
router.post('/notification/user/:type', userNotification.notification);
router.post('/bulkNotification/user/:type', userNotification.bulkNotification);


module.exports = router;