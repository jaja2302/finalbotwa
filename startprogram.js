const axios = require('axios');
const { exec } = require('child_process');
const cron = require('node-cron');
const fs = require('fs');
const ping = require('ping');


let isFirstRun = true;
let isInternetAvailable = true; // Flag to track internet availability


async function activeBot() {
    exec('pm2 list', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error checking PM2 status: ${error}`);
            return;
        }
  
        const processes = stdout.split('\n');
        let botStatus = 'offline';
  
        processes.forEach((process) => {
            if (process.includes('bot_da') && process.includes('online')) {
                botStatus = 'online';
            }
        });
  
        if (botStatus === 'online') {
            console.log('Bot already online');
        } else {
            // Bot is offline, start it
            exec('pm2 start production-wa.js --name bot_da -o bot-da-out.log -e bot-da-error.log', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error starting the PM2 process: ${error}`);
                    return;
                }
                console.log(`PM2 process started: ${stdout}`);
            });
        }
    });
}

async function offBot() {
    exec('pm2 list', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error checking PM2 status: ${error}`);
            return;
        }
  
        const processes = stdout.split('\n');
        let botStatus = 'offline';
  
        processes.forEach((process) => {
            if (process.includes('bot_da') && process.includes('online')) {
                botStatus = 'online';
            }
        });
  
        if (botStatus === 'offline') {
            console.error('Bot offline');
        } else {
            // Bot is online, stop it
            exec('pm2 stop bot_da', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error stopping the PM2 process: ${error}`);
                    return;
                }
                console.log(`PM2 process stopped: ${stdout}`);
            });
        }
    });
}
// Check if it's the first run before scheduling the ping function
if (isFirstRun) {
    activeBot(); // Start the bot on the first run
    isFirstRun = false; // Update the flag after the first run
}

// Function to check internet connection
async function checkInternetConnection() {
    const host = 'www.whatsapp.com';
    ping.sys.probe(host, (isAlive) => {
        if (isAlive && !isInternetAvailable) {
            console.log(`Internet is available`);
            isInternetAvailable = true;
            activeBot(); // Restart the bot when internet becomes available
        } else if (!isAlive && isInternetAvailable) {
            console.log(`Internet is unavailable`);
            isInternetAvailable = false;
            offBot(); // Stop the bot when the internet becomes unavailable
        }
    }, { timeout: 10 });
}

// Check internet connection status initially
checkInternetConnection();

setInterval(checkInternetConnection, 600000); // 600,000 milliseconds = 10 minutes
