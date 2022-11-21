const Mongoose = require('mongoose').Mongoose;
const constant = require('./constants');
mongoose_rmq = new Mongoose()
mongoose_rmq.Promise = global.Promise;
const connect = () => mongoose_rmq.connect(process.env.DATABASE_URL_RMQ,{useNewUrlParser: true,reconnectTries: Number.MAX_VALUE,reconnectInterval: 500});
module.exports.connect_rmq = connect;
module.exports.mongoose_rmq = mongoose_rmq;