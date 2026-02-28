const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'config.json');

let config = {};

if (fs.existsSync(configPath)) {
  const rawData = fs.readFileSync(configPath);
  config = JSON.parse(rawData);
} else {
  console.error('config.json not found! Please create it based on the setup guide.');
  process.exit(1);
}

module.exports = config;
