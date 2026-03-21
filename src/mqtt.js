const mqtt = require('mqtt');
const config = require('./config');
const apprise = require('./apprise');

const carOdometers = {};

function init() {
  const client = mqtt.connect(config.mqtt.host, {
    port: config.mqtt.port
  });

  client.on('connect', () => {
    console.log('Connected to MQTT Broker');
    client.subscribe('teslamate/cars/+/update_available');
    client.subscribe('teslamate/cars/+/state');
    client.subscribe('teslamate/cars/+/tpms_soft_warning_+');
    client.subscribe('teslamate/cars/+/odometer');
  });

  client.on('message', (topic, message) => {
    const val = message.toString();
    const parts = topic.split('/');
    if (parts.length < 4) return;
    
    const carId = parts[2];
    const metric = parts[3];

    if (metric === 'odometer') {
      carOdometers[carId] = parseFloat(val);
    }

    if (metric === 'update_available' && val === 'true' && config.alerts.softwareUpdate) {
      apprise.sendMessage(`🚗 Car ${carId}: A software update is available!`);
    } else if (metric === 'state' && config.alerts.charging) {
      if (val === 'charging') {
        const odoText = carOdometers[carId] ? ` - Odometer: ${Math.round(carOdometers[carId] * 0.621371).toLocaleString()} miles` : '';
        apprise.sendMessage(`🔋 Car ${carId}: Charging started.${odoText}`);
      }
    } else if (metric.startsWith('tpms_soft_warning') && val === 'true' && config.alerts.security) {
      apprise.sendMessage(`⚠️ Car ${carId}: Tire pressure warning detected (${metric}).`);
    }
  });
}

module.exports = { init };
