# Discord Bot Setup Guide

To use this reporting service, you need to create a Discord application and invite a bot to your server.

## 1. Create a Discord App
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Login with your Discord account.
3. Click the **New Application** button in the top right.
4. Give your application a name (e.g., "TeslaMate Reporter") and agree to the terms.
5. Upload the provided `bot-icon.png` from this folder as the App Icon.

## 2. Set Up the Bot
1. In the left sidebar, click on **Bot**.
2. Click **Reset Token**, confirm, and copy the new **Bot Token**. *Treat this token like a password. You will put it in your `config.json`.*
3. Uncheck the "Public Bot" toggle so only you can invite it to servers.

## 3. Invite the Bot to Your Server
1. In the left sidebar, click on **OAuth2** -> **URL Generator**.
2. Under **Scopes**, select `bot`.
3. Under **Bot Permissions**, select `Send Messages` and `View Channels` (or give it `Administrator` if it's your own private server).
4. Copy the Generated URL at the bottom and open it in a new browser tab.
5. Select the Discord server you want to invite the bot to and Authorize.

## 4. Get Your User ID
To configure where the bot sends its weekly report and alerts, you need your User ID so the bot can DM you directly.
1. Open Discord user settings (gear icon) -> **Advanced**.
2. Enable **Developer Mode**.
3. Right-click your own profile picture (or your name in a server or chat) and click **Copy User ID**.
4. You will put this User ID in your `config.json`.
