const config = require('./config');
const dojotLogger = require("@dojot/dojot-module-logger");
const MQTTClient = require('./mqttClient');

const logger = dojotLogger.logger;
const logLevel = config.log_level;
logger.setLevel(logLevel);


// RPS =  1/intervalTime:  50 user per second
const nClients = 30000;
const intervalTime = 20; // 20 ms to create each device

logger.info("Starting client simulator.");

// key: MQTT client ID
// value: { client: <mosca client>,
//          tenant: <tenant>,
//          deviceId: <deviceId> }
const cache = new Map();

 

let Clients = [];
var deviceId = null;

for (var i = 1; i <= nClients; i++) {

    setTimeout(function () {
        var client = new MQTTClient.Client(config.mqtt_host,config.mqtt_port, 600, deviceId);
        //client.setStats(stats);
        client.setLogger(logger);
        client.start();
        Clients.push(client);
        //cache.set(client.client.id, { client: client, tenant: 'admin', deviceId: null });
        
    }, intervalTime*i);
}


// ConnectionChecker
ConnectionChecker = () => 
{
    setInterval(function () {
        let stateCouter = {
            'instantiated':0,
            'connected':0,
            'connecting':0,
            'disconnected':0,
            'reconnecting':0,
            'removed_and_waiting_to_connect':0 };
        let connectedCounter = 0, notConnectedCounter = 0, notInstatiated = 0, reconnectingCounter = 0;
        Clients.forEach(el => {
            stateCouter[el.currentState]++;
            if (el.client === null) {
                notInstatiated++;
                return;}
            const clnt = el.client;
            if (clnt.connected)
                connectedCounter++;
            else
                notConnectedCounter++;    
                if (clnt.reconnecting)
                reconnectingCounter++;

        });
        logger.info("Clients total: "+Clients.length);
        logger.info("Clients connected: "+connectedCounter);
        logger.info("Clients not connected: "+notConnectedCounter);
        logger.info("Created clients but with MQTT not instatiated: "+notInstatiated);
        logger.info("Clients reconnecting: "+reconnectingCounter);
        console.log(stateCouter);
    }, 4000);
}


ConnectionChecker();