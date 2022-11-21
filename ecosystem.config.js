module.exports = {
  apps : [
      {
        name: "rabbitMQ_consumer",
        script: "./index.js",
        watch: true,
        env: {
            "PORT": 6001,
            "P8_FILE" : "",
            "KEY": __dirname + '/dev_cert/key.pem',
            "CERT": __dirname + '/dev_cert/Cert.pem',
            "NODE_ENV": "development",
            "AMQP_URL":"amqp://test:test@172.31.11.140:5672?heartbeat=60",
            "DATABASE_URL_CMS" : "",
            "DATABASE_URL_RMQ" : "",
            "FIREBASE_CONFIG": ""
            
        },
        env_production: {
            "PORT": 6000,
            "P8_FILE" : "",
            "KEY" : __dirname + '/dev_cert/key.pem',
            "CERT": __dirname + '/dev_cert/Cert.pem',
            "NODE_ENV": "production",
            "AMQP_URL":"amqp://test:test@172.31.11.140:5672?heartbeat=60",
            "DATABASE_URL_CMS" : "",
            "DATABASE_URL_RMQ" : "",
            "FIREBASE_CONFIG": ""

        },
        log_date_format : "YYYY-MM-DD HH:mm Z"
      }
  ]
}
