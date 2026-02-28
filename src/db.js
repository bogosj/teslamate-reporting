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
      SELECT 
        COUNT(*) as drive_count,
        SUM(distance) as distance_km
      FROM drives
      WHERE start_date > NOW() - INTERVAL '7 days'
      ${config.carId ? `AND car_id = ${parseInt(config.carId)}` : ''};
    `);

    const chargeRes = await client.query(`
      SELECT 
        SUM(charge_energy_added) as energy_added,
        SUM(cost) as total_cost,
        COUNT(*) as session_count
      FROM charging_processes cp
      LEFT JOIN geofences g ON cp.geofence_id = g.id
      WHERE cp.start_date > NOW() - INTERVAL '7 days'
      AND g.name = $1
      ${config.carId ? `AND cp.car_id = ${parseInt(config.carId)}` : ''};
    `, [config.driveCost.homeGeofenceName]);
    
    const distanceMi = (res.rows[0].distance_km || 0) * 0.621371;

    return {
      drives: res.rows[0].drive_count,
      distanceMi: distanceMi,
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
