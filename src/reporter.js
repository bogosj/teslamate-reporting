const cron = require('node-cron');
const db = require('./db');
const apprise = require('./apprise');
const config = require('./config');

async function executeReport(timeframe = 'Weekly', interval = '7 days') {
  console.log(`Building ${timeframe.toLowerCase()} report...`);
  const stats = await db.getStats(interval);
  const priorStats = await db.getStats(interval, interval);
  if (!stats) return;

  const d = (curr, prior, decimals = 0, currency = false) => {
    if (prior === undefined || prior === null) return '';
    const diff = curr - prior;
    if (Math.abs(diff) < 0.00001) return ' (=)';
    const formatted = decimals > 0 ? Math.abs(diff).toFixed(decimals) : Math.round(Math.abs(diff));
    return ` (${diff > 0 ? '+' : '-'}${currency ? '$' : ''}${formatted})`;
  };

  const costPerMile = stats.distanceMi > 0 ? (stats.totalChargeCost / stats.distanceMi) : 0;
  const chargeEfficiency = stats.totalEnergyUsed > 0 ? (stats.totalEnergyAdded / stats.totalEnergyUsed) * 100 : 0;

  const priorCostPerMile = priorStats && priorStats.distanceMi > 0 ? (priorStats.totalChargeCost / priorStats.distanceMi) : 0;
  const priorChargeEfficiency = priorStats && priorStats.totalEnergyUsed > 0 ? (priorStats.totalEnergyAdded / priorStats.totalEnergyUsed) * 100 : 0;

  const sleepHours = stats.stateHours && stats.stateHours['asleep'] ? stats.stateHours['asleep'] : 0;
  const priorSleepHours = priorStats && priorStats.stateHours && priorStats.stateHours['asleep'] ? priorStats.stateHours['asleep'] : 0;
  const totalHours = interval === '1 month' ? (30 * 24) : (7 * 24);
  const sleepRatio = (sleepHours / totalHours) * 100;
  const priorSleepRatio = (priorSleepHours / totalHours) * 100;

  let report = `📊 **${timeframe} Tesla Report**\n\n`;

  // 1. Driving Metrics & Extremes
  report += `🚗 **Driving Metrics**\n`;
  report += `- **Drives**: ${stats.drives} trips taken${d(stats.drives, priorStats?.drives)}\n`;
  report += `- **Distance Driven**: ${stats.distanceMi.toFixed(1)} miles${d(stats.distanceMi, priorStats?.distanceMi, 1)}\n`;
  if (stats.drives > 0 || (priorStats && priorStats.drives > 0)) {
    report += `- **Time Spent Driving**: ${stats.driveDurationHours.toFixed(1)} hours${d(stats.driveDurationHours, priorStats?.driveDurationHours, 1)}\n`;
    report += `- **Longest Single Drive**: ${stats.maxDistanceMi.toFixed(1)} miles${priorStats && priorStats.drives > 0 ? d(stats.maxDistanceMi, priorStats?.maxDistanceMi, 1) : ''}\n`;
    report += `- **Top Speed Reached**: ${stats.maxSpeedMi.toFixed(0)} mph${priorStats && priorStats.drives > 0 ? d(stats.maxSpeedMi, priorStats?.maxSpeedMi) : ''}\n`;
    report += `- **Distinct Destinations**: ${stats.placesVisited}${d(stats.placesVisited, priorStats?.placesVisited)}\n`;
    if (stats.avgTempF !== null || (priorStats && priorStats.avgTempF !== null)) report += `- **Average Outside Temp**: ${stats.avgTempF ? stats.avgTempF.toFixed(1) : 'N/A'} °F${priorStats && priorStats.avgTempF !== null ? d(stats.avgTempF || 0, priorStats?.avgTempF, 1) : ''}\n`;
    if (stats.efficiencyPercent !== null || (priorStats && priorStats.efficiencyPercent !== null)) report += `- **Driving Efficiency**: ${stats.efficiencyPercent ? stats.efficiencyPercent.toFixed(1) : 'N/A'}% of rated range${priorStats && priorStats.efficiencyPercent !== null ? d(stats.efficiencyPercent || 0, priorStats?.efficiencyPercent, 1) : ''}\n`;
    report += `- **Elevation Profile**: 📈 ${stats.ascentFt.toFixed(0)} ft climbed${d(stats.ascentFt, priorStats?.ascentFt)} / 📉 ${stats.descentFt.toFixed(0)} ft descended${d(stats.descentFt, priorStats?.descentFt)}\n`;
    report += `- **Peak Power**: 🏎️ ${stats.maxPowerKw.toFixed(0)} kW max output${priorStats && priorStats.drives > 0 ? d(stats.maxPowerKw, priorStats?.maxPowerKw) : ''} / 🔋 ${Math.abs(stats.minPowerKw).toFixed(0)} kW max regen${priorStats && priorStats.drives > 0 ? d(Math.abs(stats.minPowerKw), Math.abs(priorStats?.minPowerKw || 0)) : ''}\n`;
  }
  report += `\n`;

  // 2. Charging & Efficiency
  report += `⚡ **Charging & Efficiency**\n`;
  report += `- **Home Charging**: ${stats.homeSessions} sessions${d(stats.homeSessions, priorStats?.homeSessions)} (${stats.homeEnergyAdded.toFixed(2)} kWh added${d(stats.homeEnergyAdded, priorStats?.homeEnergyAdded, 2)})\n`;
  if (stats.superchargerSessions > 0 || (priorStats && priorStats.superchargerSessions > 0)) {
    report += `- **Supercharging**: ${stats.superchargerSessions} sessions${d(stats.superchargerSessions, priorStats?.superchargerSessions)} (${stats.superchargerKwh.toFixed(2)} kWh added${d(stats.superchargerKwh, priorStats?.superchargerKwh, 2)}, $${stats.superchargerCost.toFixed(2)}${d(stats.superchargerCost, priorStats?.superchargerCost, 2, true)})\n`;
  }
  report += `- **Total Energy Added**: ${stats.totalEnergyAdded.toFixed(2)} kWh${d(stats.totalEnergyAdded, priorStats?.totalEnergyAdded, 2)}\n`;
  if (stats.totalEnergyUsed > 0 || priorChargeEfficiency > 0) {
    report += `- **Charging Efficiency**: ${chargeEfficiency.toFixed(1)}% (Energy Added vs Used)${priorChargeEfficiency > 0 ? d(chargeEfficiency, priorChargeEfficiency, 1) : ''}\n`;
  }
  report += `- **Time Spent Charging**: ${stats.chargeDurationHours.toFixed(1)} hours${d(stats.chargeDurationHours, priorStats?.chargeDurationHours, 1)}\n`;
  report += `- **Total Charging Cost**: $${stats.totalChargeCost.toFixed(2)} (Estimated)${d(stats.totalChargeCost, priorStats?.totalChargeCost, 2, true)}\n`;
  report += `- **Electricity Cost / Mile**: $${costPerMile.toFixed(3)}${d(costPerMile, priorCostPerMile, 3, true)}\n`;
  report += `\n`;

  // 3. Vehicle State & Lifecycle
  report += `🔋 **Vehicle State**\n`;
  if (stats.odometer !== null) {
    report += `- **Odometer**: ${Math.round(stats.odometer).toLocaleString()} miles\n`;
  }
  report += `- **Sleep Time**: ${sleepRatio.toFixed(1)}% of the ${timeframe.toLowerCase()}${d(sleepRatio, priorSleepRatio, 1)} (${sleepHours.toFixed(1)} hours${d(sleepHours, priorSleepHours, 1)})\n`;
  if (stats.softwareUpdate) {
    report += `- **Software Update**: Upgraded to [v${stats.softwareUpdate}](<https://www.notateslaapp.com/software-updates/version/${stats.softwareUpdate}/release-notes>) this ${timeframe.toLowerCase()}! 🎉\n`;
  } else if (stats.currentVersion) {
    report += `- **Current Software**: [v${stats.currentVersion}](<https://www.notateslaapp.com/software-updates/version/${stats.currentVersion}/release-notes>)\n`;
  }

  await apprise.sendMessage(report);
  console.log('Report sent.');
}

function init() {
  cron.schedule(config.cadence.weeklyReportCron, async () => {
    console.log('Running scheduled weekly report...');
    await executeReport('Weekly', '7 days');
  });

  if (config.cadence.monthlyReportCron) {
    cron.schedule(config.cadence.monthlyReportCron, async () => {
      console.log('Running scheduled monthly report...');
      await executeReport('Monthly', '1 month');
    });
  }
}

module.exports = { init, executeReport };
