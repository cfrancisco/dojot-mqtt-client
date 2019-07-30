const config = require('./config');
const dojotLogger = require("@dojot/dojot-module-logger");
const MQTTClient = require('./mqttClient');

const logger = dojotLogger.logger;
const logLevel = config.log_level;
logger.setLevel(logLevel);


// 20 ms to create each device (rps: 50 user per second)
const nClients = 30000;
const intervalTime = 20; 

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
            let connectedCounter = 0, notConnectedCounter = 0;
            Clients.forEach(el => {
            const clnt = el.client;
            console.log(clnt);
            if (clnt.connected)
               connectedCounter++;
            else
                notConnectedCounter++;        
        });
        logger.info("Clients connected: "+connectedCounter);
        logger.info("Clients not connected: "+notConnectedCounter);
    }, 4000);
}


setInterval(function () {
    console.log('MQTT Connected:' + stats.clientCount + ', ReConnect:' + stats.reconnectedCount +  ', Disconnected:' + stats.disconnectedCount + ', Close:' + stats.closeCount + ', ERROR:' + stats.errorCount + ',Received:' + stats.msgCount + '.');
}, 2000);


ConnectionChecker();