const mqtt = require('mqtt')
const uuid = require('uuid/v4');
var net = require('net');

const STATE = {
    NOT_CONNECTED: 'not_connected',
    CONNECTED: 'connected',
    DC_WAITING_TO_CONNECT: 'disconnected_waiting_to_connect',
    STOPPED: 'stopped',
    DISCONNECTED: 'disconnected',
  };

let stats = {
    msgCount :0,
    clientCount :0,
    reconnect :0,
    closeCount :0,
    errorCount :0,
    offlineCount :0,
    disconnectedCount :0,
};



class Client {

    constructor(host,port,keepAlive, deviceId = null) { 
        this.clientId = uuid();
        this.masterHost = host;
        this.masterPort = port;
        this.keepAlive = keepAlive;
        this.deviceId = deviceId;
        this.client = null;
        this.currentState = STATE.NOT_CONNECTED;
    }

    setStats(stats)
    {
        this.stats = stats; 
    }

    setLogger(logger)
    {
        this.logger = logger;
    }

    start() { 
        console.info('Starting at ', this.masterHost, this.masterPort);
        //this.client  = mqtt.Client('mqtt://'+this.masterHost+":"+this.masterPort,;
        this.client  = mqtt.Client(
            function () {
                return net.connect({host: this.masterHost, port: this.masterPort});
            },{
                reconnectPeriod: 100 * 1000,
                keepalive: this.keepAlive,
                clientId: this.clientId,
             });
        this.client.on('connect', this.on_connect);
        this.client.on('disconnect', this.on_disconnect);
        this.client.on('message', this.on_message); 
        this.client.on('reconnect', this.on_reconnect);
        this.client.on('offline', this.on_offline);
        this.client.on('end', this.on_end);
        this.client.on('error', this.on_error);
        this.client.on('close', this.on_close);
    }

    publish(topic, message)
    {
        this.client.publish(topic, message);
    }

    disconnect() {
    if (this.client) {
        return new Promise(resolve => {
        this.client.end(false, resolve);
        this.client = null;
        });
    }
    //i need recreate my mqtt client;
    }

    
    on_connect()
    {
        console.log("on_connect");
        stats.clientCount++;
        //console.log("New client connected, total connected: ", clientCount)
    }
     
    on_disconnect() 
    {
        //Emitted after receiving disconnect packet from broker. MQTT 5.0 feature.
        console.log("on_disconnect");
        stats.disconnectedCount++;
    }
    
    on_message(topic, message)
    {
        stats.msgCount++;
    }
    
    
    on_reconnect()
    {
        console.log("on_reconnect");
        stats.reconnectedCount++;
        stats.clientCount++;
    }
    
    // As @mcollina (from mqtt.js) said: there is the 'close' event, which is emitted when the user requests a disconnection via end(). The 'offline' event is instead used when the connection to the server is closed (for whatever reason) and the client reconnects.
    on_offline()
    {
        console.log("on_offline");
        stats.offlineCount++;
          // so here we ask to disconnected (end and destroy the connection;
                // wait 20 seconds;
                // create again the mqqt client and try to reconnect;
    }
    
    
    on_end()
    {
        console.log("on_end");
        stats.closeCount++;
        stats.clientCount--;
    }
    
    on_close()
    {
        console.log("close");
        stats.closeCount++;
        stats.clientCount--;
    }
    
    
    on_error ()
    {
        stats.errorCount++;
        console.log(err);
    }


}


setInterval(function () {
    console.log('MQTT Connected:' + stats.clientCount + ', ReConnect:' + stats.reconnectedCount +  ', Disconnected:' + stats.disconnectedCount + ', Close:' + stats.closeCount + ', ERROR:' + stats.errorCount + ',Received:' + stats.msgCount + '.');
}, 2000);


module.exports = { Client };
