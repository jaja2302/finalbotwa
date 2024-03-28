const qrcode = require('qrcode-terminal');
const express = require('express')
const { Client, LocalAuth,MessageMedia , MessageType, MessageOptions } = require('whatsapp-web.js');
const app = express();
const { Generatedmaps, GetYoutubeurl } = require('./openBrowser'); // Note: Remove the '.js' extension


const client = new Client({
    puppeteer:{
        headless:true,
    },
    authStrategy: new LocalAuth({
        clientId: "keluargaberuta",
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


client.on('ready', async () => { 
    console.log('Client is ready!');
    // await GetYoutubeurl();
});


let listeningForImage = false;
let captionForSticker = ''; // Variable to store the caption

client.on('message', async msg => {
    if (msg.body === 'Botstatus') {
        msg.reply('Bot is running.');
    } else if (msg.body.toLowerCase() === 'buatsticker') {
        if (msg.fromMe) return; // Ignore messages sent by the bot itself

        listeningForImage = true;
        msg.reply('Masukan satu foto dan caption jika ada');
    } else if (listeningForImage && msg.hasMedia && msg.type === 'image') {
        try {
            const media = await msg.downloadMedia();
            
            // Check if media was successfully downloaded
            if (media) {
                // Check if there's a caption provided by the user
                if (msg.caption) {
                    captionForSticker = msg.caption; // Store the caption provided by the user
                }

                // Construct a MessageMedia object using the downloaded media
                const imageMedia = new MessageMedia(media.mimetype, media.data, media.filename, media.filesize);

                // Send the image as a sticker with caption in reply
                const chat = await msg.getChat();
                if (chat) {
                    chat.sendMessage(imageMedia, { sendMediaAsSticker: true, caption: captionForSticker });
                } else {
                    console.error('Chat not found.');
                }

                listeningForImage = false; // Reset the flag after processing the image
                captionForSticker = ''; // Reset the caption for future use
            } else {
                console.error('Failed to download media.');
            }
        } catch (error) {
            console.error('Error handling media:', error);
        }
    }
});


client.initialize();

// sending message smartlabs json from online server
// Start the server on a dynamically assigned port
const server = app.listen(0, () => {
    const { port } = server.address();
    console.log(`Server running on port ${port}`);
  });
  