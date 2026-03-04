const reporter = require('./reporter');

console.log('Triggering manual monthly report...');

(async () => {
  await reporter.executeReport('Monthly', '1 month');
  console.log('Done.');
  process.exit(0);
})();
