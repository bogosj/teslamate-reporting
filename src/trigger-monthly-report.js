const reporter = require('./reporter');

console.log('Triggering manual monthly report...');

// We need to wait a few seconds for the discord.js client to finish logging in before sending
setTimeout(async () => {
  await reporter.executeReport('Monthly', '1 month');
  
  // Give Discord another second to dispatch the message before terminating the process
  setTimeout(() => {
    console.log('Done.');
    process.exit(0);
  }, 1000);
}, 3000);
