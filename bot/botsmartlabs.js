const qrcode = require('qrcode-terminal');
const express = require('express')
const { Client, LocalAuth,MessageMedia,Buttons , Location, Poll, List,  } = require('whatsapp-web.js');
const app = express();
const cron = require('node-cron');
const axios = require('axios');
const moment = require('moment-timezone'); // Import moment-timezone library

const client = new Client({
    puppeteer:{
        headless:true,
    },
    authStrategy: new LocalAuth({
        clientId: "newasnomor",
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

async function sendMessagesBasedOnData() {
    try {
         // Fetch data from the PHP endpoint
        // local 
        const response = await axios.get('http://localhost:52914/data'); 
        // online 
        // const response = await axios.get('https://srs-ssms.com/whatsapp_bot/getmsgsmartlab.php'); 
        const numberData = response.data;

        if (!Array.isArray(numberData) || numberData.length === 0) {
            console.log('Invalid or empty data.');
            // console.error('Invalid or empty data.');
            return;
        }

        let allDataSentAndDeleted = true; // Flag to track if all data is sent and deleted

        for (const data of numberData) {
            let formattedNumber = data.penerima;
            if (formattedNumber && formattedNumber.startsWith('08')) {
                formattedNumber = `62${formattedNumber.slice(1)}`;
            }

            const phoneNumber = `${formattedNumber}@c.us`;

            try {
                const contact = await client.getContactById(phoneNumber);
                if (!contact) {
                    // console.log(`Contact not found for ${phoneNumber}. Deleting corresponding data...`);
                    await deletemsg(data.id);
                    continue;
                }
            
                const currentTime = moment().tz('Asia/Jakarta');
                const currentHour = currentTime.hours();
                let greeting;
                if (currentHour < 10) {
                    greeting = 'Selamat Pagi';
                } else if (currentHour < 15) {
                    greeting = 'Selamat Siang';
                } else if (currentHour < 19) {
                    greeting = 'Selamat Sore';
                } else {
                    greeting = 'Selamat Malam';
                }
            
                let chatContent; // Declare chatContent outside of the if-else block
                if (data.type === "input") {
                    chatContent = `Yth. Pelanggan Setia Lab CBI,\n\nSampel anda telah kami terima dengan no surat *${data.no_surat}*. \nprogress saat ini: *${data.progres}*. Progress anda dapat dilihat di website https://smartlab.srs-ssms.com/tracking_sampel dengan kode tracking sample : *${data.kodesample}*\nTerima kasih telah mempercayakan sampel anda untuk dianalisa di Lab kami.`;
                } else {
                    chatContent = `Yth. Pelanggan Setia Lab CBI,\n\nProgress Sampel anda telah *Terupdate* dengan no surat *${data.no_surat}*. \nProgress saat ini: *${data.progres}*. Progress anda dapat dilihat di website https://smartlab.srs-ssms.com/tracking_sampel dengan kode tracking sample : *${data.kodesample}*\nTerima kasih telah mempercayakan sampel anda untuk dianalisa di Lab kami.`;
                }
            
                const message = `${greeting}\n${chatContent}`;
            
                const chat = await contact.getChat();
                if (chat) {
                    await sendMessageWithDelay(chat, message, phoneNumber, data.id);
                } else {
                    console.log(`Chat not found for ${phoneNumber}`);
                }
            
                // If any data is sent, set the flag to false
                allDataSentAndDeleted = false;
            } catch (error) {
                // console.error('Error checking WhatsApp number:', error);
                // console.log(`Contact not found for ${phoneNumber}. Deleting corresponding data...`);
                await deletemsg(data.id);
            }
            
        }

        // If all data is sent and deleted, stop the program
        if (allDataSentAndDeleted) {
            console.log('All data sent and deleted. Stopping the program.');
            return;
        }
    } catch (error) {
        // console.error('Error fetching data or sending messages:', error);
    }
}



async function sendMessageWithDelay(chat, message, phoneNumber, idmsg) {
    try {
        await new Promise((resolve) => {
            setTimeout(async () => {
                await chat.sendMessage(message);
                console.log(`Message "${message}" sent to ${phoneNumber}`);
                // await deletemsg(idmsg);
                resolve();
            }, 10000);
        });
    } catch (error) {
        console.log('Error sending message with delay:', error);
    }
}

async function deletemsg(idmsg) {
    try {
        await axios.post('http://localhost:52914/deletedata', { id: idmsg });
        // await axios.post('https://srs-ssms.com/whatsapp_bot/getmsgsmartlab.php', { id: idmsg });
     
        console.log(`Message ID '${idmsg}' deleted successfully.`);
    } catch (error) {
        console.log(`Error deleting message ID '${idmsg}':`, error);
    }
}



client.on('ready', async () => { 
    console.log('Client is ready!');
    // await sendMessagesBasedOnData(); 
});
let listen6 = false;
let listen7 = false;
client.on('message', async msg => {
    console.log('MESSAGE RECEIVED', msg);

    if (msg.body === '!sendwa' && !listen6) {
        try {
            await sendMessagesBasedOnData(); // Corrected
            // Respond to confirm clearing both log files
            // await client.sendMessage(msg.from, 'Text Sending');
        } catch (error) {
            // Handle errors, such as file not found or other issues
            console.log('Error clearing log files:', error);
            await client.sendMessage(msg.from, 'Error clearing log files. Please try again later.');
        }
    } 
    else if (msg.body === '!halo' && !listen7) {
        try {
    
         
            await client.sendMessage(msg.from, 'Hali Juga');
        } catch (error) {
            // Handle errors, such as file not found or other issues
            console.log('Error clearing log files:', error);
            await client.sendMessage(msg.from, 'Error clearing log files. Please try again later.');
        }
    }else if (msg.body === '!jumpto') {
        if (msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            client.interface.openChatWindowAt(quotedMsg.id._serialized);
        }
    } else if (msg.body === '!buttons') {
        let button = new Buttons('Button body', [{ body: 'bt1' }, { body: 'bt2' }, { body: 'bt3' }], 'title', 'footer');
        client.sendMessage(msg.from, button);
    } else if (msg.body === '!list') {
        let sections = [
            { title: 'sectionTitle', rows: [{ title: 'ListItem1', description: 'desc' }, { title: 'ListItem2' }] }
        ];
        let list = new List('List body', 'btnText', sections, 'Title', 'footer');
        client.sendMessage(msg.from, list);
    } else if (msg.body === '!reaction') {
        msg.react('👍');
    } else if (msg.body === '!sendpoll') {
        /** By default the poll is created as a single choice poll: */
        await msg.reply(new Poll('Winter or Summer?', ['Winter', 'Summer']));
        /** If you want to provide a multiple choice poll, add allowMultipleAnswers as true: */
        await msg.reply(new Poll('Cats or Dogs?', ['Cats', 'Dogs'], { allowMultipleAnswers: true }));
        /**
         * You can provide a custom message secret, it can be used as a poll ID:
         * @note It has to be a unique vector with a length of 32
         */
        await msg.reply(
            new Poll('Cats or Dogs?', ['Cats', 'Dogs'], {
                messageSecret: [
                    1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                ]
            })
        );
    } 
});

   

// cron.schedule('*/1 * * * *', async () => {
//     console.log('Running message sending task...');
//     await sendMessagesBasedOnData();
// }, {
//     scheduled: true,
//     timezone: 'Asia/Jakarta' // Set the timezone according to your location
// });


client.initialize();

// sending message smartlabs json from online server
// Start the server on a dynamically assigned port
const server = app.listen(0, () => {
    const { port } = server.address();
    console.log(`Server running on port ${port}`);
  });
  