const qrcode = require('qrcode-terminal');
const express = require('express')
const { Client, LocalAuth,MessageMedia  } = require('whatsapp-web.js');
const app = express();
const fs = require('fs');
const cron = require('node-cron');
const axios = require('axios');
// Usage:
const schedule = require('node-schedule');

// const generatemaps = require('./openBrowser.js');
const {  Generatedmaps, GetYoutubeurl , GenerateTaksasi ,GenerateTakest , GenerateTakest2} = require('./openBrowser'); // Note: Remove the '.js' extension

const path = require('path');


const server = app.listen(0, () => {
    const { port } = server.address();
    console.log(`Server running on port ${port}`);
  });
  


const client = new Client({
    puppeteer:{
        headless:'new',
        executablePath: './chrome-win/chrome.exe',
        browserArgs: [
            '--disable-web-security',
            '--no-sandbox',
            '--disable-web-security',
            '--aggressive-cache-discard',
            '--disable-cache',
            '--disable-application-cache',
            '--disable-offline-load-stale-cache',
            '--disk-cache-size=0',
            '--disable-background-networking',
            '--disable-default-apps',
            '--disable-extensions',
            '--disable-sync',
            '--disable-translate',
            '--hide-scrollbars',
            '--metrics-recording-only',
            '--mute-audio',
            '--no-first-run',
            '--safebrowsing-disable-auto-update',
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--ignore-certificate-errors-spki-list',
        ],
    },
    authStrategy: new LocalAuth({
        clientId: "testingtsel",
    })
});


client.on('qr', qrCode => {
    qrcode.generate(qrCode, {small: true});
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});
client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
});
client.on('disconnect', (reason) => {
    logError(new Error(`Disconnected from WhatsApp: ${reason}`));
    // Other handling, like attempting to reconnect
});
process.on('unhandledRejection', (reason, promise) => {
    logError(new Error(`Unhandled Rejection at: ${promise}. Reason: ${reason}`));
    // Other handling, like attempting to recover or gracefully shut down
});


client.on('ready', async () => { 
    console.log('Client is ready!');

    // await sendPdfToGroups('Wilayah_7', '120363170524329595@g.us');
    // checkAndDeleteFiles();

    // await GenerateTaksasi ()

    // checkAndDeleteFiles();
    // await sendPdfToGroups('Wilayah_1', '120363025737216061@g.us');
    // await sendPdfToGroups('Wilayah_2', '120363047670143778@g.us');
    // await sendPdfToGroups('Wilayah_3', '120363048442215265@g.us');

});



client.initialize();
