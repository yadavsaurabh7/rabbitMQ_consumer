const mongoose = require('mongoose');
const constant = require('./constants');

mongoose.Promise = global.Promise;
const connect = () => mongoose.connect(process.env.DATABASE_URL_CMS,{useNewUrlParser: true,reconnectTries: Number.MAX_VALUE,reconnectInterval: 500});
module.exports.connect = connect;
module.exports.mongoose = mongoose;

