const mqtt = require('mqtt')
const uuid = require('uuid/v4');

const RECONNECT_TIME = 20000; // 20 s
const STATE = {
    INSTANTIATED:'instantiated',
    NOT_CONNECTED: 'not_connected',
    CONNECTED: 'connected',
    CONNECTING: 'connecting',
    RECONNECTING: 'reconnecting',
    DC_WAITING_TO_CONNECT: 'removed_and_waiting_to_connect',
    DISCONNECTED: 'disconnected',
  };

let stats = {
    msgCount :0,
    connectionCount :0,
    reconnectedCount :0,
    closeCount :0,
    endCount :0,
    errorCount :0,
    offlineCount :0
};



class Client {

    constructor(host,port,keepAlive, deviceId = null) { 
        this.masterHost = host;
        this.masterPort = port;
        this.keepAlive = keepAlive;
        this.deviceId = deviceId;
        this.client = null;
        this.currentState = STATE.INSTANTIATED;
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
        //console.info('Starting at ', this.masterHost, this.masterPort);
        this.currentState = STATE.CONNECTING;
        this.clientId = uuid(); // I need a new ID
        try {
            this.client  = mqtt.connect('mqtt://'+this.masterHost+":"+ this.masterPort,{
                 reconnectPeriod: 100 * 1000,
                 keepalive: this.keepAlive,
                 clientId: this.clientId,
             }); // try connect, if isn't possible, try to reconnect. 
       
             
            this.client.on('connect', (connack) => { return this.on_connect(this,connack);} );
            this.client.on('offline', () => { return this.on_offline(this);} );
            this.client.on('reconnect', () => { return this.on_reconnect(this);} );
            this.client.on('end', () => { return this.on_end(this);} );
            this.client.on('error', (err) => { return this.on_error(err);} ); 

            this.client.on('message', this.on_message); 
            this.client.on('close', this.on_close);
        }
        catch (e) {
            console.log(e);
        }
    }

    publish(topic, message)
    {
        this.client.publish(topic, message);
    }

    disconnect() {
        if (this.client) {
            this.client.end(false);
        }
    }

    
    on_connect(context, connack)
    {
        //console.log("on_connect. Connack: ", connack.returnCode);
        stats.connectionCount++;
        context.currentState = STATE.CONNECTED;
    }
     
    on_message(topic, message)
    {
        stats.msgCount++;
    }
    
    //Emitted when a reconnect starts.
    on_reconnect(context)
    {
        this.currentState = STATE.RECONNECTING;
        console.log("on_reconnect");
        stats.reconnectedCount++;
    }
    
    // As @mcollina (from mqtt.js) said: there is the 'close' event, which is emitted when the user requests a disconnection via end(). The 'offline' event is instead used when the connection to the server is closed (for whatever reason) and the client reconnects.
    on_offline(context)
    {
        console.log("The connection was closed :( ");
        this.currentState = STATE.DISCONNECTED;

        stats.offlineCount++;
        // so here we ask to disconnected (end and destroy the connection;
        context.disconnect();
        this.currentState = STATE.DC_WAITING_TO_CONNECT;

        // wait 20 seconds;
        // create again the mqqt client and try to reconnect;
        const rctime = Math.floor(Math.random() * 60000) + RECONNECT_TIME; // Min time + rands(0,60) segs to next reconnection; 
        setTimeout(() => context.start(), rctime);
    }
    
    
    on_end(context)
    {
        //console.log("on_end");
        stats.endCount++;
        context.client = null;
    }
    
    on_close()
    {
        //console.log("close");
        stats.closeCount++;
    }
    
    on_error (err)
    {
        stats.errorCount++;
        console.log(err);
    }
    
}


setInterval(function () {
    console.log('Connections made:' + stats.connectionCount + ', ReConnect:' + stats.reconnectedCount + ', Close:' + stats.closeCount + ', ERROR:' + stats.errorCount + ',Received:' + stats.msgCount + ', End: '+stats.offlineCount + ', End: '+stats.endCount+'.');
}, 2000);


module.exports = { Client };
