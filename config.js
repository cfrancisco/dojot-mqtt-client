var config = {};

config.mqtt_host = process.env.MQTT_HOST || "10.50.11.160";
config.mqtt_port = process.env.MQTT_PORT || 30002;

config.allow_unsecured_mode = process.env.ALLOW_UNSECURED_MODE || "true";

config.log_level = process.env.LOG_LEVEL || "info";

config.reconnection_time = 20000; // 20 s
config.publish_time = 10000; // 10 seconds to send each msg: 6/min

module.exports = config;
