'use strict';

var config = {};

//config.mqtt_host = process.env.MQTT_HOST || '10.50.11.160';
//config.mqtt_port = process.env.MQTT_PORT || 30002;
config.mqtt_host = process.env.MQTT_HOST || '10.4.2.28';
config.mqtt_port = process.env.MQTT_PORT || 1883;


config.allow_unsecured_mode = process.env.ALLOW_UNSECURED_MODE || 'true';

config.log_level = process.env.LOG_LEVEL || 'info';

module.exports = config;
