const qrcode = require('qrcode-terminal');
const express = require('express')
const { Client, LocalAuth,MessageMedia  } = require('whatsapp-web.js');
const app = express();
const port = 3000;
const cron = require('node-cron');
const axios = require('axios');
const path = require('path');
const generatemaps = require('./openBrowser.js');

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
async function sendMessagesBasedOnData() {
    try {
        // Fetch data from the PHP endpoint
        const response = await axios.get('https://srs-ssms.com/whatsapp_bot/getmsgsmartlab.php');
        const numberData = response.data;

        if (!numberData || !Array.isArray(numberData)) {
            console.error('Invalid or empty data.');
            return;
        }

        for (const data of numberData) {
            const phoneNumber = `${data.penerima}@c.us`; // Adjust to match your JSON structure
            const message = `${data.pesan} ${data.kodesample}`; // Adjust to match your JSON structure
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
        await axios.post('https://srs-ssms.com/whatsapp_bot/getmsgsmartlab.php', { id: idmsg });
        console.log(`Message ID '${idmsg}' deleted successfully.`);
    } catch (error) {
        console.error(`Error deleting message ID '${idmsg}':`, error);
    }
}


// Call the function when the client is ready
client.on('ready', async () => { 
    console.log('Client is ready!');
    // await sendMessagesBasedOnData();
});

// // Schedule the task to run every 5 minutes
// cron.schedule('*/1 * * * *', async () => {
//     console.log('Running message sending task...');
//     await sendMessagesBasedOnData();
// }, {
//     scheduled: true,
//     timezone: 'Asia/Jakarta' // Set the timezone according to your location
// });

// ... (other parts of your code)
async function sendPdfToGroups(folder, groupID) {
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

        await sendPdfToGroup(folder, groupID);
    
       
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
    console.log('Sending files to groups wil 1 2 3 at 16:05 (WIB)...');
        await sendPdfToGroups('Wilayah_1', '120363025737216061@g.us');
        await sendPdfToGroups('Wilayah_2', '120363047670143778@g.us');
        await sendPdfToGroups('Wilayah_3', '120363048442215265@g.us');
        await sendPdfToGroups('Wilayah_6', '120363152744155925@g.us');
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});
cron.schedule('05 09 * * *', async () => {
    console.log('Sending files to groups Taksasi Wil - VII at 14:05 (WIB)...');
    // BDE 
    await sendPdfToGroups('Wilayah_7', '120363166668733371@g.us');
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});

cron.schedule('05 12 * * *', async () => {
    console.log('Sending files to groups Taksasi KTE at 12:05 (WIB)...');
    // KTE 
    await sendPdfToGroups('Wilayah_7', '120363170524329595@g.us');
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});

cron.schedule('05 15 * * *', async () => {
    console.log('Sending files to groups BHE at 09:05 (WIB)...');
    // BHE 
    await sendPdfToGroups('Wilayah_8', '120363149785590346@g.us');
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});
cron.schedule('02 14 * * *', async () => {
    console.log('Sending files to groups SCE at 09:05 (WIB)...');
    // SCE 
    await sendPdfToGroups('Wilayah_6', '120363152744155925@g.us');
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});



async function sendtaksasiest(est, groupID) {
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
                         
                                folder = 'Wilayah_6';
                                break;  
                                    case 'PKE':
                                    case 'BDE':
                                    case 'KTE':
                                    case 'MKE':  
                                    case 'SCE':
                                                      
                                            folder = 'Wilayah_7';
                                            break; 
                                 
                                    case 'BHE':
                                  
                                            folder = 'Wilayah_8';
                                            break;  
            default:
                // Handle cases where est doesn't match any defined folders
                console.log('Invalid est value provided.');
                return;
        }
     
        // Hit the URL to regenerate and save PDFs in the corresponding folder
        if (est === 'BHE') {
            await axios.get(`https://srs-ssms.com/rekap_pdf/pdf_taksasi_folder_bhe.php`);
        } else if (est === 'KTE') {
            await axios.get(`https://srs-ssms.com/rekap_pdf/pdf_taksasi_folder_kte.php`);
        } else if (est === 'BDE') {
            await axios.get(`https://srs-ssms.com/rekap_pdf/pdf_taksasi_folder_bde.php`);
        } else if (est === 'SCE') {
            await axios.get(`https://srs-ssms.com/rekap_pdf/pdf_taksasi_folder_sce.php`);
        }else if (est === 'UPE') {
            await axios.get(`https://srs-ssms.com/rekap_pdf/pdf_taksasi_folder_upe.php`);
        }else{
            await axios.get(`https://srs-ssms.com/rekap_pdf/pdf_taksasi_folder.php?est=${est}`);
        }
    
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

        // testing 
        if (folder === 'Wilayah_1') {
            await sendPdfToGroup(folder, '120363025737216061@g.us');
        } else if (folder === 'Wilayah_2') {
            if (est === 'UPE') {
                await sendPdfToGroup(folder, '120363047670143778@g.us');
            }else{
                await sendPdfToGroup(folder, '120363047670143778@g.us');
            }
          
        } else if (folder === 'Wilayah_3') {
            await sendPdfToGroup(folder, '120363048442215265@g.us');
        } else if (folder === 'Wilayah_6') {
            if (est === 'SCE') {
                await sendPdfToGroup(folder, '120363152744155925@g.us');
            }else{
                await sendPdfToGroup(folder, '120363152744155925@g.us');
            }
        } else if (folder === 'Wilayah_7') {
             if (est === 'KTE') {
                await sendPdfToGroup(folder, '120363170524329595@g.us');

                // send ke testin 
                // await sendPdfToGroup(folder, '120363158376501304@g.us');
            } else if (est === 'BDE') {
                await sendPdfToGroup(folder, '120363204285862734@g.us');
            }
        } else if (folder === 'Wilayah_8') {
            if (est === 'BHE') {
                await sendPdfToGroup(folder, '120363149785590346@g.us');
            } 
        }
    } catch (error) {
        console.error(`Error fetching files:`, error);
    }
}


let listeningForEstateInput = false;

client.on('message', async msg => {
  if (msg.body === '!tarik' && !listeningForEstateInput) {
    let chat = await msg.getChat();
    if (chat.isGroup) {
      listeningForEstateInput = true;
      msg.reply('Masukan Estate Nach (Harap huruf Kapital Lah kena Error):');
            
      const listener = async (message) => {
        if (message.from === msg.from) {
          const estate = message.body;
                    
          generatemaps.Generatedmaps().then(() => {
            msg.reply('Sesabar lagi meolah maps nah...');
            setTimeout(() => {
              sendtaksasiest(estate, chat.id);
              listeningForEstateInput = false;
              client.removeListener('message', listener);
            }, 10000);
          });
        }
      };

      client.on('message', listener);
    } else {
      msg.reply('This command can only be used in a group!');
    }
  }
});

client.initialize();
