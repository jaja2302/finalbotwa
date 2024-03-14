const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');
const cron = require('node-cron');
const fs = require('fs');
// Replace 'YOUR_BOT_TOKEN' with your bot's token
const token = '6838753278:AAFmV3guZ5UKJS-rPx5j-DJh42_nfQJVH3k';
// const token = '6910089990:AAFsGO__Z2wUXr4iItwdJB6SESnifQ6h5PA';
// https://api.telegram.org/bot6910089990:AAFsGO__Z2wUXr4iItwdJB6SESnifQ6h5PA

const sendToId = '6910089990'; 

const bot = new TelegramBot(token, { polling: true });

function sendMsg(message) {
  bot.sendMessage(sendToId, message).then(() => {
    console.log('Message sent successfully.');
  }).catch((error) => {
    console.error('Error sending message:', error);
  });
}
// Schedule sending message every 1 second
