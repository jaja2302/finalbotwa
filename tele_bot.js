const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');
const cron = require('node-cron');
const fs = require('fs');
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

  bot.onText(/\/getlog/, async (msg) => {
    const chatId = msg.chat.id;
  
    try {
      // Read the error.log file from the 'error' folder
      const errorLog = fs.readFileSync('./error/error.log', 'utf8');
  
      // Send the error log to the specified group
      await bot.sendMessage(groupId, errorLog);
      bot.sendMessage(chatId, 'Error log sent to the group.');
    } catch (error) {
      console.error(`Error reading or sending error log: ${error}`);
      bot.sendMessage(chatId, 'Error fetching the error log.');
    }
  });


  const errorLogPath = './error/error.log'; // Replace with the correct path

  // Function to send the error log to the group
  async function sendErrorLogToGroup() {
    try {
      const errorLog = fs.readFileSync(errorLogPath, 'utf8');
      await bot.sendMessage(groupId, errorLog);
      console.log('Error log sent to the group.');
    } catch (error) {
      console.error(`Error reading or sending error log: ${error}`);
    }
  }
  
  // Watch for changes in the error.log file
  fs.watchFile(errorLogPath, (curr, prev) => {
    if (curr.size > prev.size) {
      // If the current size is greater than the previous size, indicating an update
      console.log('Detected change in error.log. Sending to group...');
      sendErrorLogToGroup();
    }
  });

// cron.schedule('50 08 * * *', async () => {
//     console.log('Menyalakan Bot WA');
//     // SCE 
//     exec('pm2 start production-wa.js --name my-production-wa', (error, stdout, stderr) => {
//       if (error) {
//         console.error(`Error starting the PM2 process: ${error}`);
//         bot.sendMessage(groupId, 'Error!');
//         return;
//       }
//       console.log(`PM2 process started: ${stdout}`);
//       bot.sendMessage(groupId, 'Bot menyala otomatis jam 08:50!');
//     });
  
// }, {
//     scheduled: true,
//     timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
// });

// cron.schedule('05 09 * * *', async () => {
//   console.log('Mematikan Bot WA');
//   // SCE 
//   exec('pm2 stop my-production-wa', (error, stdout, stderr) => {
//     if (error) {
//       console.error(`Error stopping the PM2 process: ${error}`);
//       bot.sendMessage(groupId, 'Bot Mati otomatis jam 09:05!');
//       return;
//     }
//     console.log(`PM2 process stopped: ${stdout}`);
//     bot.sendMessage(groupId, 'Bot Mati otomatis jam 09:05!');
//   });
// }, {
//   scheduled: true,
//   timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
// });

// cron.schedule('50 11 * * *', async () => {
//   console.log('Menyalakan Bot WA');
//   // SCE 
//   exec('pm2 start production-wa.js --name my-production-wa', (error, stdout, stderr) => {
//     if (error) {
//       console.error(`Error starting the PM2 process: ${error}`);
//       bot.sendMessage(groupId, 'Error!');
//       return;
//     }
//     console.log(`PM2 process started: ${stdout}`);
//     bot.sendMessage(groupId, 'Bot menyala otomatis jam 11:50!');
//   });

// }, {
//   scheduled: true,
//   timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
// });

// cron.schedule('05 12 * * *', async () => {
// console.log('Mematikan Bot WA');
// // SCE 
// exec('pm2 stop my-production-wa', (error, stdout, stderr) => {
//   if (error) {
//     console.error(`Error stopping the PM2 process: ${error}`);
//     bot.sendMessage(groupId, 'Bot Mati otomatis jam 09:05!');
//     return;
//   }
//   console.log(`PM2 process stopped: ${stdout}`);
//   bot.sendMessage(groupId, 'Bot Mati otomatis jam 12:05!');
// });
// }, {
// scheduled: true,
// timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
// });


// cron.schedule('50 13 * * *', async () => {
//   console.log('Menyalakan Bot WA');
//   // SCE 
//   exec('pm2 start production-wa.js --name my-production-wa', (error, stdout, stderr) => {
//     if (error) {
//       console.error(`Error starting the PM2 process: ${error}`);
//       bot.sendMessage(groupId, 'Error!');
//       return;
//     }
//     console.log(`PM2 process started: ${stdout}`);
//     bot.sendMessage(groupId, 'Bot menyala otomatis jam 11:50!');
//   });

// }, {
//   scheduled: true,
//   timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
// });

// cron.schedule('05 14 * * *', async () => {
// console.log('Mematikan Bot WA');
// // SCE 
// exec('pm2 stop my-production-wa', (error, stdout, stderr) => {
//   if (error) {
//     console.error(`Error stopping the PM2 process: ${error}`);
//     bot.sendMessage(groupId, 'Bot Mati otomatis jam 09:05!');
//     return;
//   }
//   console.log(`PM2 process stopped: ${stdout}`);
//   bot.sendMessage(groupId, 'Bot Mati otomatis jam 12:05!');
// });
// }, {
// scheduled: true,
// timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
// });

// cron.schedule('50 14 * * *', async () => {
//   console.log('Menyalakan Bot WA');
//   // SCE 
//   exec('pm2 start production-wa.js --name my-production-wa', (error, stdout, stderr) => {
//     if (error) {
//       console.error(`Error starting the PM2 process: ${error}`);
//       bot.sendMessage(groupId, 'Error!');
//       return;
//     }
//     console.log(`PM2 process started: ${stdout}`);
//     bot.sendMessage(groupId, 'Bot menyala otomatis jam 14:50!');
//   });

// }, {
//   scheduled: true,
//   timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
// });

// cron.schedule('00 19 * * *', async () => {
//   console.log('Mematikan Bot WA');
//   // SCE 
//   exec('pm2 stop my-production-wa', (error, stdout, stderr) => {
//     if (error) {
//       console.error(`Error stopping the PM2 process: ${error}`);
//       bot.sendMessage(groupId, 'Bot Mati otomatis jam 09:05!');
//       return;
//     }
//     console.log(`PM2 process stopped: ${stdout}`);
//     bot.sendMessage(groupId, 'Bot Mati otomatis jam 19:05!');
//   });
//   }, {
//   scheduled: true,
//   timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
// });

// jgn lupa uncomment yang mematikan pc 

cron.schedule('05 19 * * *', async () => {
  console.log('Mematikan PC ');
  // SCE 
  bot.sendMessage(groupId, 'pcmati! jam 19:05');

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


