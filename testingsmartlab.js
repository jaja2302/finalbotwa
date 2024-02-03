const qrcode = require('qrcode-terminal');
const express = require('express')
const { Client, LocalAuth,MessageMedia  } = require('whatsapp-web.js');
const app = express();
const cron = require('node-cron');
const axios = require('axios');

const client = new Client({
    puppeteer:{
        headless:true,
    },
    authStrategy: new LocalAuth({
        clientId: "nomoras",
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
        const response = await axios.get('http://localhost:52914/data');
        const numberData = response.data;

        if (!numberData || !Array.isArray(numberData)) {
            console.error('Invalid or empty data.');
            return;
        }

        console.log(response);

        for (const data of numberData) {
            const phoneNumber = `${data.penerima}@c.us`; // Adjust to match your JSON structure

            // Adjust message formatting
            const message = `
            Yth. Pelanggan Setia Lab CBI,
            
            Sampel anda telah kami terima dg no surat *${data.nomor_surat}* progress saat ini *${data.progress}*.
            Progress anda dapat dilihat di website https://smartlab.srs-ssms.com/tracking_sampel dengan kode tracking sample : *${data.kodesample}*
            
            Terima kasih telah mempercayakan sampel anda untuk dianalisa di Lab kami.
            `;
            
            const idmsg = `${data.id}`; 

            const contact = await client.getContactById(phoneNumber);
            if (contact) {
                const chat = await contact.getChat();
                if (chat) {
                    await sendMessageWithDelay(chat, message, phoneNumber, idmsg);
                } else {
                    console.log(`Chat not found for ${phoneNumber}`);
                }
            } else {
                console.log(`Contact not found for ${phoneNumber}`);
            }
        }
    } catch (error) {
        console.error('Error fetching data or sending messages:', error);
    }
}

async function sendMessageWithDelay(chat, message, phoneNumber, idmsg) {
    await new Promise((resolve) => {
        setTimeout(async () => {
            await chat.sendMessage(message);
            console.log(`Message "${message}" sent to ${phoneNumber}`);

            // After sending the message, proceed to delete the message ID
            await deletemsg(idmsg);
            resolve();
        }, 10000); // 10 seconds delay
    });
}

async function deletemsg(idmsg) {
    try {
        await axios.post('http://localhost:52914/deletedata', { id: idmsg });
        console.log(`Message ID '${idmsg}' deleted successfully.`);
    } catch (error) {
        console.error(`Error deleting message ID '${idmsg}':`, error);
    }
}


client.on('ready', async () => { 
    console.log('Client is ready!');
    await sendMessagesBasedOnData(); // Uncomment this line to send messages when the client is ready
});


cron.schedule('*/1 * * * *', async () => {
    console.log('Running message sending task...');
    await sendMessagesBasedOnData();
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone according to your location
});


client.initialize();

// sending message smartlabs json from online server
// Start the server on a dynamically assigned port
const server = app.listen(0, () => {
    const { port } = server.address();
    console.log(`Server running on port ${port}`);
  });
  