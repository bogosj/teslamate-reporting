const cron = require('node-cron');
const db = require('./db');
const discord = require('./discord');
const config = require('./config');

async function executeReport() {
  console.log('Building weekly report...');
  const stats = await db.getWeeklyStats();
  if (!stats) return;

  const costPerMile = stats.distanceMi > 0 ? (stats.totalChargeCost / stats.distanceMi) : 0;
  const chargeEfficiency = stats.totalEnergyUsed > 0 ? (stats.totalEnergyAdded / stats.totalEnergyUsed) * 100 : 0;

  const sleepHours = stats.stateHours['asleep'] || 0;
  const sleepRatio = (sleepHours / (7 * 24)) * 100;

  let report = `📊 **Weekly Tesla Report**\n\n`;

  // 1. Driving Metrics & Extremes
  report += `🚗 **Driving Metrics**\n`;
  report += `- **Drives**: ${stats.drives} trips taken\n`;
  report += `- **Distance Driven**: ${stats.distanceMi.toFixed(1)} miles\n`;
  if (stats.drives > 0) {
    report += `- **Time Spent Driving**: ${stats.driveDurationHours.toFixed(1)} hours\n`;
    report += `- **Longest Single Drive**: ${stats.maxDistanceMi.toFixed(1)} miles\n`;
    report += `- **Top Speed Reached**: ${stats.maxSpeedMi.toFixed(0)} mph\n`;
    report += `- **Distinct Destinations**: ${stats.placesVisited}\n`;
    if (stats.avgTempF !== null) report += `- **Average Outside Temp**: ${stats.avgTempF.toFixed(1)} °F\n`;
    if (stats.efficiencyPercent !== null) report += `- **Driving Efficiency**: ${stats.efficiencyPercent.toFixed(1)}% of rated range\n`;
    report += `- **Elevation Profile**: 📈 ${stats.ascentFt.toFixed(0)} ft climbed / 📉 ${stats.descentFt.toFixed(0)} ft descended\n`;
    report += `- **Peak Power**: 🏎️ ${stats.maxPowerKw.toFixed(0)} kW max output / 🔋 ${Math.abs(stats.minPowerKw).toFixed(0)} kW max regen\n`;
  }
  report += `\n`;

  // 2. Charging & Efficiency
  report += `⚡ **Charging & Efficiency**\n`;
  report += `- **Home Charging**: ${stats.homeSessions} sessions (${stats.homeEnergyAdded.toFixed(2)} kWh added)\n`;
  if (stats.superchargerSessions > 0) {
    report += `- **Supercharging**: ${stats.superchargerSessions} sessions (${stats.superchargerKwh.toFixed(2)} kWh added, $${stats.superchargerCost.toFixed(2)})\n`;
  }
  report += `- **Total Energy Added**: ${stats.totalEnergyAdded.toFixed(2)} kWh\n`;
  if (stats.totalEnergyUsed > 0) {
    report += `- **Charging Efficiency**: ${chargeEfficiency.toFixed(1)}% (Energy Added vs Used)\n`;
  }
  report += `- **Time Spent Charging**: ${stats.chargeDurationHours.toFixed(1)} hours\n`;
  report += `- **Total Charging Cost**: $${stats.totalChargeCost.toFixed(2)} (Estimated)\n`;
  report += `- **Electricity Cost / Mile**: $${costPerMile.toFixed(3)}\n`;
  report += `\n`;

  // 3. Vehicle State & Lifecycle
  report += `🔋 **Vehicle State**\n`;
  report += `- **Sleep Time**: ${sleepRatio.toFixed(1)}% of the week (${sleepHours.toFixed(1)} hours)\n`;
  if (stats.softwareUpdate) {
    report += `- **Software Update**: Upgraded to [v${stats.softwareUpdate}](https://www.notateslaapp.com/software-updates/version/${stats.softwareUpdate}/release-notes) this week! 🎉\n`;
  } else if (stats.currentVersion) {
    report += `- **Current Software**: [v${stats.currentVersion}](https://www.notateslaapp.com/software-updates/version/${stats.currentVersion}/release-notes)\n`;
  }

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
