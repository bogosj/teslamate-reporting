const reporter = require('./reporter');

console.log('Triggering manual report...');

(async () => {
  await reporter.executeReport();
  console.log('Done.');
  process.exit(0);
})();
