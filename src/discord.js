const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  console.log(`Discord bot logged in as ${client.user.tag}`);
});

let isReady = false;

client.login(config.discordToken).then(() => {
  isReady = true;
}).catch(err => {
  console.error('Failed to log in to Discord:', err);
});

async function sendMessage(message) {
  if (!isReady) return false;
  try {
    const user = await client.users.fetch(config.discordUserId);
    if (user) {
      await user.send(message);
      return true;
    }
  } catch (error) {
    console.error('Error sending Discord message:', error);
    return false;
  }
}

module.exports = {
  sendMessage,
  client
};
