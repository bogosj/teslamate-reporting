const cron = require('node-cron');
const db = require('./db');
const discord = require('./discord');
const config = require('./config');

async function executeReport() {
  console.log('Building weekly report...');
  const stats = await db.getWeeklyStats();
  if (!stats) return;

  const costPerMile = stats.distanceMi > 0 ? (stats.totalCost / stats.distanceMi) : 0;

  const report = `
📊 **Weekly Tesla Report**
- **Drives**: ${stats.drives} trips taken (${stats.distanceMi.toFixed(1)} miles)
- **Home Charging**: ${stats.chargeSessions} sessions
- **Home Energy Added**: ${parseFloat(stats.energyAdded).toFixed(2)} kWh
- **Estimated Drive Cost**: $${parseFloat(stats.totalCost).toFixed(2)}
- **Electricity Cost / Mile**: $${costPerMile.toFixed(3)}
  `;

  await discord.sendMessage(report);
  console.log('Report sent.');
}

function init() {
  cron.schedule(config.cadence.weeklyReportCron, async () => {
    console.log('Running scheduled weekly report...');
    await executeReport();
  });
}

module.exports = { init, executeReport };
