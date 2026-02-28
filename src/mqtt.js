const mqtt = require('mqtt');
const config = require('./config');
const discord = require('./discord');

function init() {
  const client = mqtt.connect(config.mqtt.host, {
    port: config.mqtt.port
  });

  client.on('connect', () => {
    console.log('Connected to MQTT Broker');
    client.subscribe('teslamate/cars/+/update_available');
    client.subscribe('teslamate/cars/+/state');
    client.subscribe('teslamate/cars/+/sentry_mode');
    client.subscribe('teslamate/cars/+/tpms_soft_warning_+');
  });

  client.on('message', (topic, message) => {
    const val = message.toString();
    const parts = topic.split('/');
    if (parts.length < 4) return;
    
    const carId = parts[2];
    const metric = parts[3];

    if (metric === 'update_available' && val === 'true' && config.alerts.softwareUpdate) {
      discord.sendMessage(`🚗 Car ${carId}: A software update is available!`);
    } else if (metric === 'state' && config.alerts.charging) {
      if (val === 'charging') discord.sendMessage(`🔋 Car ${carId}: Charging started.`);
    } else if (metric === 'sentry_mode' && val === 'true' && config.alerts.security) {
      discord.sendMessage(`🚨 Car ${carId}: Sentry mode activated.`);
    } else if (metric.startsWith('tpms_soft_warning') && val === 'true' && config.alerts.security) {
      discord.sendMessage(`⚠️ Car ${carId}: Tire pressure warning detected (${metric}).`);
    }
  });
}

module.exports = { init };
