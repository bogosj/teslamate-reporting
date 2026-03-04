const { execFile } = require('child_process');
const config = require('./config');

async function sendMessage(message) {
  if (!config.appriseUrl) {
    console.error('Apprise URL not configured.');
    return false;
  }

  return new Promise((resolve, reject) => {
    execFile('apprise', ['-vv', '-b', message, config.appriseUrl], (error, stdout, stderr) => {
      if (error) {
        console.error('Error sending Apprise message:', error);
        console.error('stderr:', stderr);
        resolve(false);
      } else {
        console.log('Apprise message sent successfully.');
        resolve(true);
      }
    });
  });
}

module.exports = {
  sendMessage
};
