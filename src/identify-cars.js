const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read config locally without requiring src/config.js to avoid exit on missing config if they're testing
const configPath = path.join(__dirname, '..', 'config.json');
let config = {};
if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath));
} else {
  console.log('No config.json found. Make sure you have created it from the example.');
  process.exit(1);
}

if (!config.postgres) {
  console.log('Postgres configuration is missing in config.json');
  process.exit(1);
}

const client = new Client({
  host: config.postgres.host,
  port: config.postgres.port,
  user: config.postgres.user,
  password: config.postgres.password,
  database: config.postgres.database
});

async function identifyCars() {
  try {
    await client.connect();
    console.log('Connected to the TeslaMate database.');
    
    const res = await client.query('SELECT id, name, model FROM cars ORDER BY id ASC;');
    
    if (res.rows.length === 0) {
      console.log('No cars found in the database.');
    } else {
      console.log('\\n--- TeslaMate Cars ---');
      res.rows.forEach(car => {
        console.log(`Car ID: ${car.id}`);
        console.log(`  Name:  ${car.name || 'N/A'}`);
        console.log(`  Model: ${car.model || 'N/A'}`);
        console.log('----------------------');
      });
      
      console.log('\\nTo select a specific car for the reports, add the "carId" field to your config.json at the top level.');
      console.log('Example:');
      console.log('{');
      console.log('  "discordToken": "...",');
      console.log('  "discordUserId": "...",');
      console.log(`  "carId": ${res.rows.length > 0 ? res.rows[0].id : 1},`);
      console.log('  "postgres": { ... }');
      console.log('}\\n');
    }
  } catch (err) {
    console.error('Database connection or query error:', err.message);
  } finally {
    await client.end();
  }
}

identifyCars();
