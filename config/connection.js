var amqp = require('amqplib/callback_api');

// if the connection is closed or fails to be established at all, we will reconnect

function start(queue, cb) {
  amqp.connect(process.env.AMQP_URL || 'amqp://guest:guest@localhost:5672?heartbeat=60', function(err, conn) {
    if (err) {
      console.error("[AMQP]", err.message);
      return setTimeout(start, 1000);
    }
    conn.on("error", function(err) {
      if (err.message !== "Connection closing") {
        console.error("[AMQP] conn error", err.message);
      }
    });
    conn.on("close", function() {
      console.error("[AMQP] reconnecting");
      return setTimeout(start, 1000);
    });

    console.log("[AMQP] connected");

   conn.createChannel(onceChannelCreated);
   function onceChannelCreated(err, channel) {
    if (err) {
      cb(err);
    }
    else {
      channel.assertQueue(queue, { durable: true }, onceQueueCreated);
    }
    function onceQueueCreated(err) {
      if (err) {
        cb(err);
      }
      else {
        cb(null, channel, conn);
      }
    }
  }
  });
}

module.exports = start;




