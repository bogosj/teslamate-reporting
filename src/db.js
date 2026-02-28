const { Client } = require('pg');
const config = require('./config');

const client = new Client({
  host: config.postgres.host,
  port: config.postgres.port,
  user: config.postgres.user,
  password: config.postgres.password,
  database: config.postgres.database
});

client.connect().catch(err => console.error('DB Connection error', err));

async function getWeeklyStats() {
  try {
    const res = await client.query(`
      SELECT COUNT(*) as drive_count
      FROM drives
      WHERE start_date > NOW() - INTERVAL '7 days';
    `);

    // In a real TeslaMate installation, charging_processes joins with addresses to filter by geofence.
    // Simplifying here to show the requested metric calculation conceptually.
    const chargeRes = await client.query(`
      SELECT 
        SUM(charge_energy_added) as energy_added,
        SUM(cost) as total_cost,
        COUNT(*) as session_count
      FROM charging_processes cp
      LEFT JOIN addresses a ON cp.address_id = a.id
      WHERE cp.start_date > NOW() - INTERVAL '7 days'
      AND a.name = $1;
    `, [config.driveCost.homeGeofenceName]);
    
    return {
      drives: res.rows[0].drive_count,
      energyAdded: chargeRes.rows[0].energy_added || 0,
      chargeSessions: chargeRes.rows[0].session_count,
      totalCost: chargeRes.rows[0].total_cost || 0
    };
  } catch (err) {
    console.error('Error fetching weekly stats:', err);
    return null;
  }
}

module.exports = { getWeeklyStats };
