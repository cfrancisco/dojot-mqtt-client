const config = require("./config");
const dojotLogger = require("@dojot/dojot-module-logger");
const mqtt = require("mqtt");
const uuid = require("uuid/v4");
const STATE = require("./util");

const logger = dojotLogger.logger;
const logLevel = config.log_level;
logger.setLevel(logLevel);
const RECONNECT_TIME = config.reconnection_time;
const PUBLISH_INTERVAL = config.publish_time;

let publishers = {};

let stats = {
  msgCount: 0,
  connectionCount: 0,
  reconnectedCount: 0,
  closeCount: 0,
  endCount: 0,
  errorCount: 0,
  offlineCount: 0
};

class Client {
  constructor(host, port, deviceId = null) {
    this.masterHost = host;
    this.masterPort = port;
    this.deviceId = deviceId;
    this.client = null;
    this.currentState = STATE.INSTANTIATED;
  }

  setStats(stats) {
    this.stats = stats;
  }

  setLogger(logger) {
    this.logger = logger;
  }

  start() {
    //console.info('Starting at ', this.masterHost, this.masterPort);
    this.currentState = STATE.CONNECTING;
    this.clientId = uuid(); // I need a new ID
    try {
      this.client = mqtt.connect(
        "mqtt://" + this.masterHost + ":" + this.masterPort,
        {
          reconnectPeriod: 0,
          keepalive: 10,
          connectTimeout: 10 * 1000,
          clientId: this.clientId
        }
      ); // try connect, if isn't possible, try to reconnect.
      this.client.on("connect", connack => {
        return this.on_connect(this, connack);
      });
      this.client.on("offline", () => {
        return this.on_offline(this);
      });
      this.client.on("reconnect", () => {
        return this.on_reconnect(this);
      });
      this.client.on("end", () => {
        return this.on_end(this);
      });
      this.client.on("error", err => {
        return this.on_error(err);
      });
      this.client.on("close", () => {
        return this.on_close(this);
      });
    } catch (e) {
      logger.debug(e);
    }
  }

  starting_publish() {
    const topic = "/admin/" + this.deviceId + "/attrs";
    publishers[this.clientId] = setInterval(() => {
      if (!this.client) {
        clearInterval(publishers[this.clientId]);
        return;
      }
      const message = JSON.stringify({
        temperature: Math.random() * 100
      });
      logger.debug("Trying to publish to topic:" + topic);
      this.client.publish(topic, message, null, this.on_publish);
    }, PUBLISH_INTERVAL);
  }

  disconnect() {
    if (this.client) {
      this.client.end(false); // if force=true we could avoid some unexpected behaviors
    }
  }

  on_publish(err) {
    stats.msgCount++;
    if (err) logger.err("Error during publishing: " + err);
  }

  on_connect(context, connack) {
    stats.connectionCount++;
    if (connack.returnCode === 0) {
      logger.debug("Successfully connected.");
      context.currentState = STATE.CONNECTED;
      context.starting_publish();
    } else {
      logger.err("Connecting callback with error: " + connack.returnCode);
    }
  }

  //Emitted when a reconnect starts.
  on_reconnect(context) {
    logger.err("On_reconnect called. :c");
    this.currentState = STATE.RECONNECTING;
    stats.reconnectedCount++;
  }

  // As @mcollina (from mqtt.js) said: there is the 'close' event, which is emitted when the user requests a disconnection via end(). The 'offline' event is instead used when the connection to the server is closed (for whatever reason) and the client reconnects.
  closingClient(context) {
    context.currentState = STATE.DISCONNECTED;

    // kill the publisher
    clearInterval(publishers[context.clientId]);

    context.disconnect();
    context.currentState = STATE.DC_WAITING_TO_CONNECT;

    // create again the mqqt client and try to reconnect
    const rctime = Math.floor(Math.random() * 60000) + RECONNECT_TIME;
    setTimeout(() => context.start(), rctime);
  }

  on_offline(context) {
    if (this.currentState == STATE.DISCONNECTED) return;
    logger.debug("The connection is offline :( ");
    stats.offlineCount++;
    context.closingClient(context);
  }

  on_end(context) {
    logger.debug("On End ");

    stats.endCount++;
    context.client = null;
  }

  on_close(context) {
    if (this.currentState == STATE.DISCONNECTED) return;
    logger.debug("The connection was closed :| ");
    stats.closeCount++;
    context.closingClient(context);
  }

  on_error(err) {
    stats.errorCount++;
    logger.debug(err);
  }
}

setInterval(function() {
  logger.info(
    "Total connections built:" +
      stats.connectionCount +
      ", Reconnections:" +
      stats.reconnectedCount +
      ", Connections closed:" +
      stats.closeCount +
      ", ERROR:" +
      stats.errorCount +
      ",Messages published:" +
      stats.msgCount +
      ", Offline: " +
      stats.offlineCount +
      ", Connections ended: " +
      stats.endCount +
      "."
  );
}, 2000);

module.exports = { Client };
