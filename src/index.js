const mqttComponent = require('./mqtt');
const reporterComponent = require('./reporter');

console.log('Starting TeslaMate Reporter...');

// Initialize components
mqttComponent.init();
reporterComponent.init();

console.log('Initialization complete. Waiting for events...');
