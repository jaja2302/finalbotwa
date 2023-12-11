const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');
const cron = require('node-cron');
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

cron.schedule('50 08 * * *', async () => {
    console.log('Menyalakan Bot WA');
    // SCE 
    exec('pm2 start production-wa.js --name my-production-wa', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error starting the PM2 process: ${error}`);
        bot.sendMessage(groupId, 'Error!');
        return;
      }
      console.log(`PM2 process started: ${stdout}`);
      bot.sendMessage(groupId, 'Bot menyala otomatis jam 08:50!');
    });
  
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});

cron.schedule('05 09 * * *', async () => {
  console.log('Mematikan Bot WA');
  // SCE 
  exec('pm2 stop my-production-wa', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error stopping the PM2 process: ${error}`);
      bot.sendMessage(groupId, 'Bot Mati otomatis jam 09:05!');
      return;
    }
    console.log(`PM2 process stopped: ${stdout}`);
    bot.sendMessage(groupId, 'Bot Mati otomatis jam 09:05!');
  });
}, {
  scheduled: true,
  timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});

cron.schedule('50 11 * * *', async () => {
  console.log('Menyalakan Bot WA');
  // SCE 
  exec('pm2 start production-wa.js --name my-production-wa', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error starting the PM2 process: ${error}`);
      bot.sendMessage(groupId, 'Error!');
      return;
    }
    console.log(`PM2 process started: ${stdout}`);
    bot.sendMessage(groupId, 'Bot menyala otomatis jam 11:50!');
  });

}, {
  scheduled: true,
  timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});

cron.schedule('05 12 * * *', async () => {
console.log('Mematikan Bot WA');
// SCE 
exec('pm2 stop my-production-wa', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error stopping the PM2 process: ${error}`);
    bot.sendMessage(groupId, 'Bot Mati otomatis jam 09:05!');
    return;
  }
  console.log(`PM2 process stopped: ${stdout}`);
  bot.sendMessage(groupId, 'Bot Mati otomatis jam 12:05!');
});
}, {
scheduled: true,
timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});


cron.schedule('50 13 * * *', async () => {
  console.log('Menyalakan Bot WA');
  // SCE 
  exec('pm2 start production-wa.js --name my-production-wa', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error starting the PM2 process: ${error}`);
      bot.sendMessage(groupId, 'Error!');
      return;
    }
    console.log(`PM2 process started: ${stdout}`);
    bot.sendMessage(groupId, 'Bot menyala otomatis jam 11:50!');
  });

}, {
  scheduled: true,
  timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});

cron.schedule('05 14 * * *', async () => {
console.log('Mematikan Bot WA');
// SCE 
exec('pm2 stop my-production-wa', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error stopping the PM2 process: ${error}`);
    bot.sendMessage(groupId, 'Bot Mati otomatis jam 09:05!');
    return;
  }
  console.log(`PM2 process stopped: ${stdout}`);
  bot.sendMessage(groupId, 'Bot Mati otomatis jam 12:05!');
});
}, {
scheduled: true,
timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});

cron.schedule('50 14 * * *', async () => {
  console.log('Menyalakan Bot WA');
  // SCE 
  exec('pm2 start production-wa.js --name my-production-wa', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error starting the PM2 process: ${error}`);
      bot.sendMessage(groupId, 'Error!');
      return;
    }
    console.log(`PM2 process started: ${stdout}`);
    bot.sendMessage(groupId, 'Bot menyala otomatis jam 14:50!');
  });

}, {
  scheduled: true,
  timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});

cron.schedule('00 19 * * *', async () => {
  console.log('Mematikan Bot WA');
  // SCE 
  exec('pm2 stop my-production-wa', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error stopping the PM2 process: ${error}`);
      bot.sendMessage(groupId, 'Bot Mati otomatis jam 09:05!');
      return;
    }
    console.log(`PM2 process stopped: ${stdout}`);
    bot.sendMessage(groupId, 'Bot Mati otomatis jam 12:05!');
  });
  }, {
  scheduled: true,
  timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});

// jgn lupa uncomment yang mematikan pc 

cron.schedule('05 19 * * *', async () => {
  console.log('Mematikan PC ');
  // SCE 
  bot.sendMessage(groupId, 'pcmati!');

  // Execute the batch file and store the running process
  runningProcess = exec('shutdownpc.bat', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing the batch file: ${error}`);
      return;
    }
    console.log(`Batch file output: ${stdout}`);
    console.error(`Batch file errors: ${stderr}`);
  });

  }, {
  scheduled: true,
  timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});


