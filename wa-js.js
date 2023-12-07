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
        clientId: "nomorxl",
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

// // Schedule the task to run every 5 minutes
// cron.schedule('*/1 * * * *', async () => {
//     console.log('Running message sending task...');

//     const smartLabsData = await fetchSmartLabsJSON();
//     if (smartLabsData) {
//         await sendMessages(smartLabsData);
//     }
// }, {
//     scheduled: true,
//     timezone: 'Asia/Jakarta' // Set the timezone according to your location
// });

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

                    // Delete the file after sending
                    await deleteFile(fileName, folder);
                } else {
                    console.log(`Group ${groupID} not found!`);
                }
            }
        };
        // takasasi 2 - 120363204285862734@g.us
        // Tes taksasi - 120363205553012899@g.us


        // testing 
        // await sendPdfToGroup('Wilayah_1', '120363204285862734@g.us');
        // await sendPdfToGroup('Wilayah_2', '120363205553012899@g.us');
        // await sendPdfToGroup('Wilayah_3', '120363204285862734@g.us');


        // real grup taksasi wil1 - 3 
        // Send PDF files from different folders to respective groups
        await sendPdfToGroup('Wilayah_1', '120363025737216061@g.us');
        await sendPdfToGroup('Wilayah_2', '120363047670143778@g.us');
        await sendPdfToGroup('Wilayah_3', '120363048442215265@g.us');
        await sendPdfToGroup('Wilayah_6', '120363152744155925@g.us');
        await sendPdfToGroup('Wilayah_7', '120363149785590346@g.us');
        await sendPdfToGroup('Wilayah_7', '120363170524329595@g.us');
        await sendPdfToGroup('Wilayah_7', '120363166668733371@g.us');
    } catch (error) {
        console.error('Error fetching or sending PDF files:', error);
    }
}

async function deleteFile(filename, folder) {
    try {
        await axios.get(`https://srs-ssms.com/whatsapp_bot/deletebot.php?filename=${filename}&path=${folder}`);
        console.log(`File '${filename}' in folder '${folder}' deleted successfully.`);
    } catch (error) {
        console.error(`Error deleting file '${filename}' in folder '${folder}':`, error);
    }
}

// Schedule the task to run at a specified time
cron.schedule('05 16 * * *', async () => {
    console.log('Sending files to groups at 16:30 (WIB)...');
    await sendPdfToGroups();
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});
cron.schedule('05 14 * * *', async () => {
    console.log('Sending files to groups at 16:30 (WIB)...');
    await sendPdfToGroups();
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});

cron.schedule('05 12 * * *', async () => {
    console.log('Sending files to groups at 16:30 (WIB)...');
    await sendPdfToGroups();
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});

cron.schedule('05 09 * * *', async () => {
    console.log('Sending files to groups at 16:30 (WIB)...');
    await sendPdfToGroups();
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});


client.on('ready', async () => { 
    console.log('Client is ready!');
    // sendPdfToGroups();

    
});async function sendtaksasiest(est, groupID) {
    try {
        let folder;
        // Mapping the est value to the corresponding folder
        switch (est) {
            case 'PLE':
            case 'KNE':
            case 'RDE':
            case 'SLE':
                folder = 'Wilayah_1';
                break;
            case 'KDE':
            case 'BKE':
            case 'RGE':
            case 'SGE':
                folder = 'Wilayah_2';
                break;
            case 'SYE':
            case 'BGE':
            case 'NBE':
            case 'UPE':
                folder = 'Wilayah_3';
                break;
                case 'MRE':
                    case 'NKE':
                    case 'PDE':
                    case 'SPE':
                        folder = 'Wilayah_4';
                        break;
                        case 'BTE':
                        case 'NNE':
                        case 'SBE':
                                folder = 'Wilayah_5';
                                break; 
                                case 'MLE':
                            case 'SCE':
                      
                                folder = 'Wilayah_6';
                                break;  
                                case 'PKE':
                                    case 'BDE':
                                    case 'KTE':
                                    case 'MKE':
                                    case 'BHE':
                                  
                                            folder = 'Wilayah_7';
                                            break;  
            default:
                // Handle cases where est doesn't match any defined folders
                console.log('Invalid est value provided.');
                return;
        }

        // Hit the URL to regenerate and save PDFs in the corresponding folder
        await axios.get(`https://srs-ssms.com/rekap_pdf/pdf_taksasi_folder.php?est=${est}`);
        console.log(`Files generated successfully for '${est}' in folder '${folder}'.`);

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

                const groupChat = await client.getChatById(groupID); // Use the passed groupID
                if (groupChat) {
                    await groupChat.sendMessage(media, { sendMediaAsDocument: true });
                    console.log(`File "${fileName}" sent to the group ${groupID} as a document!`);

                    // Delete the file after sending
                    await deleteFile(fileName, folder);
                } else {
                    console.log(`Group ${groupID} not found!`);
                }
            }
        };
    
        // Use the provided groupID according to the folder
        if (folder === 'Wilayah_1') {
            await sendPdfToGroup(folder, '120363025737216061@g.us');
        } else if (folder === 'Wilayah_2') {
            await sendPdfToGroup(folder, '120363047670143778@g.us');
        } else if (folder === 'Wilayah_3') {
            await sendPdfToGroup(folder, '120363048442215265@g.us');
        } else if (folder === 'Wilayah_6') {
            await sendPdfToGroup(folder, '120363152744155925@g.us');
        } else if (folder === 'Wilayah_7' && est ==='BHE') {
            await sendPdfToGroup(folder, '120363149785590346@g.us');
        }else if (folder === 'Wilayah_7' && est ==='KTE') {
            await sendPdfToGroup(folder, '120363170524329595@g.us');
        }else if (folder === 'Wilayah_7' && est ==='BWE') {
            await sendPdfToGroup(folder, '120363166668733371@g.us');
        }
    } catch (error) {
        console.error(`Error fetching files:`, error);
    }
}


client.on('message', async msg => {
    if (msg.body === '!tarik') {
        let chat = await msg.getChat();
        if (chat.isGroup) {
            msg.reply('Masukan Estate (harap semua hurup Kapital):');
            client.on('message', async message => {
                if (message.from === msg.from) {
                    const estate = message.body;
                    sendtaksasiest(estate, chat.id); // Pass the estate and group ID
                }
            });
        } else {
            msg.reply('This command can only be used in a group!');
        }
    }
});

client.initialize();
