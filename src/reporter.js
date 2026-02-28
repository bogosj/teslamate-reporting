const cron = require('node-cron');
const db = require('./db');
const discord = require('./discord');
const config = require('./config');

async function executeReport() {
  console.log('Building weekly report...');
  const stats = await db.getWeeklyStats();
  if (!stats) return;

  const report = `
📊 **Weekly Tesla Report**
- **Drives**: ${stats.drives} trips taken
- **Home Charging**: ${stats.chargeSessions} sessions
- **Home Energy Added**: ${parseFloat(stats.energyAdded).toFixed(2)} kWh
- **Estimated Drive Cost**: $${parseFloat(stats.totalCost).toFixed(2)}
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
