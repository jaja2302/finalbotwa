const qrcode = require('qrcode-terminal');
const express = require('express')
const { Client, LocalAuth,MessageMedia  } = require('whatsapp-web.js');
const app = express();
const port = 3000;
const groupData = require('./getgroupdata.json'); // Assuming your JSON file is named getgroupdata.json
const cron = require('node-cron');
const axios = require('axios');
const path = require('path');

app.listen(port, () => {
    console.log('Server berjalan di port :: ${port}')
})

const allSessionsObject = {};



const client = new Client({
    puppeteer:{
        headless:true,
    },
    authStrategy: new LocalAuth({
        clientId: "jojok",
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


// sending message smartlabs json 
async function fetchSmartLabsJSON() {
    try {
        const response = await axios.get('https://srs-ssms.com/whatsapp_bot/smartlabs/SmartlabsNumber.json');
        return response.data;
    } catch (error) {
        console.error('Error fetching smartlabsnumber.json:', error);
        return null;
    }
}

// Function to send messages based on smartlabsnumber.json data
async function sendMessages(numberData) {
    if (!numberData) {
        console.error('No smartlabsnumber.json data available.');
        return;
    }

    for (const data of numberData) {
        const phoneNumber = `${data.number}@c.us`;
        const message = data.Message;

        const contact = await client.getContactById(phoneNumber);
        if (contact) {
            const chat = await contact.getChat();
            if (chat) {
                await chat.sendMessage(message);
                console.log(`Message "${message}" sent to ${phoneNumber}`);
            } else {
                console.log(`Chat not found for ${phoneNumber}`);
            }
        } else {
            console.log(`Contact not found for ${phoneNumber}`);
        }
    }
}

// Schedule the task to run every 5 minutes
cron.schedule('*/1 * * * *', async () => {
    console.log('Running message sending task...');

    const smartLabsData = await fetchSmartLabsJSON();
    if (smartLabsData) {
        await sendMessages(smartLabsData);
    }
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone according to your location
});

// ... (other parts of your code)

async function sendPdfToGroups() {
    try {
        // Function to fetch PDF files from a given folder and return file names
        const fetchPdfFiles = async (folder) => {
            const response = await axios.get(`https://srs-ssms.com/whatsapp_bot/taksasiScan.php?folder=${folder}`);
            return Object.values(response.data);
        };

        const sendPdfToGroup = async (folder, groupID) => {
            const files = await fetchPdfFiles(folder);

            for (const fileName of files) {
                const response = await axios.get(`https://srs-ssms.com/whatsapp_bot/taksasi/${folder}/${fileName}`, {
                    responseType: 'arraybuffer',
                });

                const base64Data = Buffer.from(response.data).toString('base64');
                const media = new MessageMedia('application/pdf', base64Data, fileName);

                const groupChat = await client.getChatById(groupID);
                if (groupChat) {
                    await groupChat.sendMessage(media, { sendMediaAsDocument: true });
                    console.log(`File "${fileName}" sent to the group ${groupID} as a document!`);
                } else {
                    console.log(`Group ${groupID} not found!`);
                }
            }
        };

        // Send PDF files from wil1 to group 1
        await sendPdfToGroup('wil1', '120363205553012899@g.us');

        // Send PDF files from wil2 to group 2
        await sendPdfToGroup('wil2', '120363204285862734@g.us');
    } catch (error) {
        console.error('Error fetching or sending PDF files:', error);
    }
}

// Schedule the task to run at a specified time
cron.schedule('56 11 * * *', async () => {
    console.log('Sending files to groups at 16:30 (WIB)...');
    await sendPdfToGroups();
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});


client.on('ready', async () => { 
    console.log('Client is ready!');
    sendPdfToGroups();
});

client.on('message', async msg => {
    if (msg.body === '!ping reply') {
        // Send a new message as a reply to the current one
        msg.reply('pong');

    } else if (msg.body === '!ping') {
        // Send a new message to the same chat
        client.sendMessage(msg.from, 'pong');

    }  else if (msg.body === '!groupinfo') {
        let chat = await msg.getChat();
        if (chat.isGroup) {
            msg.reply(`
                *Group Details*
                Name: ${chat.name}
                Description: ${chat.description}
                Created At: ${chat.createdAt.toString()}
                Created By: ${chat.owner.user}
                Participant count: ${chat.participants.length}
            `);
        } else {
            msg.reply('This command can only be used in a group!');
        }
    }
});

client.initialize();
