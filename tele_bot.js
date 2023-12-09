const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');

// Replace 'YOUR_BOT_TOKEN' with your bot's token
const token = '6838753278:AAFmV3guZ5UKJS-rPx5j-DJh42_nfQJVH3k';

// Replace '4028539622' with your group ID
const groupId = -4028539622;

// Create a new bot instance
const bot = new TelegramBot(token, { polling: true });

// Handle incoming messages
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;

  // Send "hallo" message to the specified group
  bot.sendMessage(groupId, 'Hallo from the bot!');
  
  // Send a confirmation message to the user who triggered the command
  bot.sendMessage(chatId, 'Message sent to the group.');
});
bot.onText(/\/startwa/, (msg) => {
    const chatId = msg.chat.id;
  
    // Send "Bot Starting" message to the specified group
    bot.sendMessage(groupId, 'Bot Starting!');
  
    // Start the PM2 process
    exec('pm2 start production-wa.js --name my-production-wa', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error starting the PM2 process: ${error}`);
        bot.sendMessage(chatId, 'Error starting the bot.');
        return;
      }
      console.log(`PM2 process started: ${stdout}`);
      bot.sendMessage(chatId, 'Bot started successfully.');
    });
  });
  
  // Handling the /stopwa command
  bot.onText(/\/stopwa/, (msg) => {
    const chatId = msg.chat.id;
  
    // Send "Stopping Bot" message to the specified group
    bot.sendMessage(groupId, 'Stopping Bot...');
  
    // Stop the PM2 process
    exec('pm2 stop my-production-wa', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error stopping the PM2 process: ${error}`);
        bot.sendMessage(chatId, 'Error stopping the bot.');
        return;
      }
      console.log(`PM2 process stopped: ${stdout}`);
      bot.sendMessage(chatId, 'Bot stopped successfully.');
    });
  });