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
    const driveRes = await client.query(`
      SELECT 
        COUNT(*) as drive_count,
        SUM(distance) as distance_km,
        MAX(speed_max) as max_speed_kmh,
        MAX(distance) as max_distance_km,
        SUM(duration_min) as total_duration_min,
        COUNT(DISTINCT coalesce(end_geofence_id, end_address_id)) as places_visited,
        AVG(outside_temp_avg) as avg_temp_c
      FROM drives
      WHERE start_date > NOW() - INTERVAL '7 days'
      ${config.carId ? `AND car_id = ${parseInt(config.carId)}` : ''};
    `);

    const chargeRes = await client.query(`
      SELECT 
        SUM(case when g.name = $1 then cp.charge_energy_added else 0 end) as home_energy_added,
        SUM(case when g.name = $1 then cp.cost else 0 end) as home_total_cost,
        SUM(case when g.name = $1 then 1 else 0 end) as home_session_count,
        SUM(cp.charge_energy_added) as total_energy_added,
        SUM(cp.charge_energy_used) as total_energy_used,
        SUM(cp.cost) as total_cost,
        SUM(cp.duration_min) as total_duration_min
      FROM charging_processes cp
      LEFT JOIN geofences g ON cp.geofence_id = g.id
      WHERE cp.start_date > NOW() - INTERVAL '7 days'
      ${config.carId ? `AND cp.car_id = ${parseInt(config.carId)}` : ''};
    `, [config.driveCost.homeGeofenceName]);

    const stateRes = await client.query(`
      SELECT state, SUM(EXTRACT(EPOCH FROM (COALESCE(end_date, NOW()) - GREATEST(start_date, NOW() - INTERVAL '7 days')))) / 3600 as hours
      FROM states
      WHERE (end_date IS NULL OR end_date > NOW() - INTERVAL '7 days')
      ${config.carId ? `AND car_id = ${parseInt(config.carId)}` : ''}
      GROUP BY state;
    `);

    const updateRes = await client.query(`
      SELECT version
      FROM updates 
      WHERE start_date > NOW() - INTERVAL '7 days'
      ${config.carId ? `AND car_id = ${parseInt(config.carId)}` : ''}
      ORDER BY start_date DESC LIMIT 1;
    `);

    const driveRow = driveRes.rows[0] || {};
    const chargeRow = chargeRes.rows[0] || {};

    let stateHours = {};
    for (let row of stateRes.rows) {
      stateHours[row.state] = parseFloat(row.hours || 0);
    }

    return {
      drives: parseInt(driveRow.drive_count || 0),
      distanceMi: (driveRow.distance_km || 0) * 0.621371,
      maxSpeedMi: (driveRow.max_speed_kmh || 0) * 0.621371,
      maxDistanceMi: (driveRow.max_distance_km || 0) * 0.621371,
      driveDurationHours: (driveRow.total_duration_min || 0) / 60,
      placesVisited: parseInt(driveRow.places_visited || 0),
      avgTempF: driveRow.avg_temp_c != null ? (driveRow.avg_temp_c * 9 / 5) + 32 : null,

      homeEnergyAdded: parseFloat(chargeRow.home_energy_added || 0),
      homeCost: parseFloat(chargeRow.home_total_cost || 0),
      homeSessions: parseInt(chargeRow.home_session_count || 0),

      totalEnergyAdded: parseFloat(chargeRow.total_energy_added || 0),
      totalEnergyUsed: parseFloat(chargeRow.total_energy_used || 0),
      totalChargeCost: parseFloat(chargeRow.total_cost || 0),
      chargeDurationHours: (chargeRow.total_duration_min || 0) / 60,

      stateHours: stateHours,
      softwareUpdate: updateRes.rows.length > 0 ? updateRes.rows[0].version : null
    };
  } catch (err) {
    console.error('Error fetching weekly stats:', err);
    return null;
  }
}

module.exports = { getWeeklyStats };
