const qrcode = require('qrcode-terminal');
const express = require('express')
const { Client, LocalAuth,MessageMedia  } = require('whatsapp-web.js');
const app = express();
const fs = require('fs');
const cron = require('node-cron');
const axios = require('axios');
// const generatemaps = require('./openBrowser.js');
const {  Generatedmaps, GetYoutubeurl , GenerateTaksasi } = require('./openBrowser'); // Note: Remove the '.js' extension

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
        clientId: "botda",
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


// Schedule the task to run every 5 minutes
// cron.schedule('*/10 * * * *', async () => {
//     console.log('Running message sending task...');
//     await sendMessagesBasedOnData();
// }, {
//     scheduled: true,
//     timezone: 'Asia/Jakarta' // Set the timezone according to your location
// });

// ... (other parts of your code)
// kodingan taksasi 


// fungsi send pdf ke groups 
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
                    logError(error);
                }
            }
        };

        await sendPdfToGroup(folder, groupID);
    
       
    } catch (error) {
        console.error('Error fetching or sending PDF files:', error);
        try {
            const groupChat = await client.getChatById('120363158376501304@g.us');
            if (groupChat) {
                const errorMessage = 'There was an error sending the PDF files.\nError Details:\n' + error.stack;
                await groupChat.sendMessage(errorMessage);
                console.log('Notification sent to the group about the error.');
            } else {
                console.log('Group not found!');
                logError(error);
            }
        } catch (sendMessageError) {
            console.error('Error sending message:', sendMessageError);
            logError(error);
        }
    }
    
}
// fungsi delete file pdf di group 
async function deleteFile(filename, folder) {
    try {
        const response = await axios.head(`https://srs-ssms.com/whatsapp_bot/deletebot.php?filename=${filename}&path=${folder}`);
        
        if (response.status === 200) {
            await axios.get(`https://srs-ssms.com/whatsapp_bot/deletebot.php?filename=${filename}&path=${folder}`);
            console.log(`File '${filename}' in folder '${folder}' deleted successfully.`);
        } else if (response.status === 404) {
            console.log(`File '${filename}' in folder '${folder}' doesn't exist. Skipping deletion.`);
        } else {
            console.log(`Unexpected status code ${response.status} received. Skipping deletion.`);
        }
    } catch (error) {
        console.error(`Error checking or deleting file '${filename}' in folder '${folder}':`, error.message);
        logError(error);
    }
}

async function checkAndDeleteFiles() {
    try {
        const getStatus = await axios.get('https://srs-ssms.com/whatsapp_bot/checkfolderstatus.php');
        const { data: folderStatus } = getStatus;

        if (Array.isArray(folderStatus) && folderStatus.length > 0) {
            const filesToDelete = folderStatus.filter((file) => file.hasOwnProperty('wilayah') && file.hasOwnProperty('filename'));

            for (const file of filesToDelete) {
                const { wilayah, filename } = file;
                await deleteFile(filename, wilayah);
            }
        } else {
            console.log('No files found or empty folder. Nothing to delete.');
            // logError is called here, consider removing this line as 'error' isn't defined in this scope
        }
    } catch (error) {
        console.error('Error checking and deleting files:', error);
        logError(error);
    }
}


// fungsi send taksasi per estate pdf ke group 
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
                    console.error('Error fetching or sending PDF files:', error);
                    try {
                        const groupChat = await client.getChatById('120363158376501304@g.us');
                        if (groupChat) {
                            const errorMessage = 'There was an error sending the PDF files.\nError Details:\n' + error.stack;
                            await groupChat.sendMessage(errorMessage);
                            console.log('Notification sent to the group about the error.');
                        } else {
                            console.log('Group not found!');
                            logError(error);
                        }
                    } catch (sendMessageError) {
                        console.error('Error sending message:', sendMessageError);
                        logError(error);
                    }
                }
            }
        };

        // testing 
        if (folder === 'Wilayah_1') {
            await sendPdfToGroup(folder, '120363025737216061@g.us');
        } else if (folder === 'Wilayah_2') {
          
                await sendPdfToGroup(folder, '120363047670143778@g.us');
            
          
        } else if (folder === 'Wilayah_3') {
            await sendPdfToGroup(folder, '120363048442215265@g.us');    
        // send to testing 
            // await sendPdfToGroup(folder, '120363204285862734@g.us');
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
                await sendPdfToGroup(folder, '120363166668733371@g.us');
            }
        } else if (folder === 'Wilayah_8') {
            if (est === 'BHE') {
                await sendPdfToGroup(folder, '120363149785590346@g.us');
            } 
        }
    } catch (error) {
        console.error(`Error fetching files:`, error);
        logError(error);
    }
}

// fungsi check folder ada isinya atau tidak 

// fungsi send berdasarakan wikayah
async function sendperwil(wilayah, groupID) {
    try {
        let folder;
        // Mapping the est value to the corresponding folder
        switch (wilayah) {
            case '1':
            case 'Satu':
            case 'satu':
                folder = 'Wilayah_1';
                break;
            case '2':
            case 'Dua':
            case 'dua':
                folder = 'Wilayah_2';
                break;
            case '3':
            case 'Tiga':
            case 'tiga':
                folder = 'Wilayah_3';
                break;
            case 'Harian':
            case 'hariantest':
            case 'testing':
                folder = 'Wilayah_9';
                break;  
            default:
                // Handle cases where est doesn't match any defined folders
                console.log('Invalid est value provided.');
                return;
        }

        // Perform operations sequentially
        await checkAndDeleteFiles(); // Ensure files are checked and deleted first

        // Generate maps
        await GenerateTaksasi();

        // Send PDFs based on folder
        if (folder === 'Wilayah_1') {
            await sendPdfToGroups(folder, '120363025737216061@g.us');
        } else if (folder === 'Wilayah_2') { 
            await sendPdfToGroups(folder, '120363047670143778@g.us');
        } else if (folder === 'Wilayah_3') {
            await sendPdfToGroups(folder, '120363048442215265@g.us');    
        } else if (folder === 'Wilayah_9') {
            await sendPdfToGroups(folder, '120363205553012899@g.us');    
        } 

        // Check and delete files again
        await checkAndDeleteFiles();
    } catch (error) {
        console.error(`Error fetching files:`, error);
        logError(error);
    }
}



// Usage:



// cronjob generate maps 
cron.schedule('57 08 * * *', async () => {
    console.log('Generate Maps..');
    try {
        const groupChat = await client.getChatById('120363158376501304@g.us');
        if (groupChat) {
            await groupChat.sendMessage('Generate Maps Jam 08:57');
            console.log(`Message sent to the group successfully!`);
        } else {
            console.log(`Group not found!`);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        logError(error);
    }

      await Generatedmaps()
      await  checkAndDeleteFiles();
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});

cron.schedule('57 11 * * *', async () => {
    console.log('Generate Maps..');
    try {
        const groupChat = await client.getChatById('120363158376501304@g.us');
        if (groupChat) {
            await groupChat.sendMessage('Generate Maps Jam 11:57');
            console.log(`Message sent to the group successfully!`);
        } else {
            console.log(`Group not found!`);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        logError(error);
    }

      await Generatedmaps()
      await  checkAndDeleteFiles();
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});

cron.schedule('57 13 * * *', async () => {
    console.log('Generate Maps..');
    try {
        const groupChat = await client.getChatById('120363158376501304@g.us');
        if (groupChat) {
            await groupChat.sendMessage('Generate Maps Jam 13:57');
            console.log(`Message sent to the group successfully!`);
        } else {
            console.log(`Group not found!`);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        logError(error);
    }


      await Generatedmaps()
      await  checkAndDeleteFiles();
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});

cron.schedule('57 14 * * *', async () => {
    console.log('Generate Maps..');
    try {
        const groupChat = await client.getChatById('120363158376501304@g.us');
        if (groupChat) {
            await groupChat.sendMessage('Generate Maps Jam 14:57');
            console.log(`Message sent to the group successfully!`);
        } else {
            console.log(`Group not found!`);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        logError(error);
    }

      await Generatedmaps()
      await  checkAndDeleteFiles();
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});

cron.schedule('57 15 * * *', async () => {
    console.log('Generate Maps..');
    try {
        const groupChat = await client.getChatById('120363158376501304@g.us');
        if (groupChat) {
            await groupChat.sendMessage('Generate Maps Jam 15:57');
            console.log(`Message sent to the group successfully!`);
        } else {
            console.log(`Group not found!`);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        logError(error);
    }

      await Generatedmaps()
      await  checkAndDeleteFiles();
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});

cron.schedule('57 16 * * *', async () => {
    console.log('Generate Maps..');
    try {
        const groupChat = await client.getChatById('120363158376501304@g.us');
        if (groupChat) {
            await groupChat.sendMessage('Generate Maps Jam 16:57');
            console.log(`Message sent to the group successfully!`);
        } else {
            console.log(`Group not found!`);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        logError(error);
    }

      await Generatedmaps()
      await  checkAndDeleteFiles();
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});



// cronjob taksasi 

cron.schedule('02 16 * * *', async () => {
    console.log('Sending files to groups wil 1 2 3 at 16:05 (WIB)...');
        try {
            const groupChat = await client.getChatById('120363158376501304@g.us');
            if (groupChat) {
                await groupChat.sendMessage('Kirim Taksasi Wil 1 ,2,3 Jam 16:02');
                console.log(`Message sent to the group successfully!`);
            } else {
                console.log(`Group not found!`);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            logError(error);
        }

        await sendPdfToGroups('Wilayah_1', '120363025737216061@g.us');
        await sendPdfToGroups('Wilayah_2', '120363047670143778@g.us');
        await sendPdfToGroups('Wilayah_3', '120363048442215265@g.us');
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});


cron.schedule('02 17 * * *', async () => {
    console.log('Sending files to groups wil 1 2 3 at 16:05 (WIB)...');
    try {
        const groupChat = await client.getChatById('120363158376501304@g.us');
        if (groupChat) {
            await groupChat.sendMessage('Kirim Taksasi Umpang Wil 3 Jam 17:02');
            console.log(`Message sent to the group successfully!`);
        } else {
            console.log(`Group not found!`);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        logError(error);
    }

        await sendPdfToGroups('Wilayah_3', '120363048442215265@g.us');
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});

cron.schedule('02 09 * * *', async () => {
    console.log('Sending files to groups Taksasi Wil - VII at 14:05 (WIB)...');
    try {
        const groupChat = await client.getChatById('120363158376501304@g.us');
        if (groupChat) {
            await groupChat.sendMessage('Kirim Taksasi Wil 7  Jam 09:02');
            console.log(`Message sent to the group successfully!`);
        } else {
            console.log(`Group not found!`);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        logError(error);
    }
    // BDE 
    await sendPdfToGroups('Wilayah_7', '120363166668733371@g.us');
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});

cron.schedule('02 12 * * *', async () => {
    console.log('Sending files to groups Taksasi KTE at 12:05 (WIB)...');
    try {
        const groupChat = await client.getChatById('120363158376501304@g.us');
        if (groupChat) {
            await groupChat.sendMessage('Kirim Taksasi KTE Wil 7  Jam 12:02');
            console.log(`Message sent to the group successfully!`);
        } else {
            console.log(`Group not found!`);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        logError(error);
    }
    // KTE 
    await sendPdfToGroups('Wilayah_7', '120363170524329595@g.us');
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});

cron.schedule('02 15 * * *', async () => {
    console.log('Sending files to groups BHE at 09:05 (WIB)...');
    try {
        const groupChat = await client.getChatById('120363158376501304@g.us');
        if (groupChat) {
            await groupChat.sendMessage('Kirim Taksasi BHE Jam 15:02');
            console.log(`Message sent to the group successfully!`);
        } else {
            console.log(`Group not found!`);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        logError(error);
    }
    // BHE 
    await sendPdfToGroups('Wilayah_8', '120363149785590346@g.us');
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});
cron.schedule('02 14 * * *', async () => {
    console.log('Sending files to groups SCE at 09:05 (WIB)...');
    try {
        const groupChat = await client.getChatById('120363158376501304@g.us');
        if (groupChat) {
            await groupChat.sendMessage('Kirim Taksasi SCE  Jam 14:02');
            console.log(`Message sent to the group successfully!`);
        } else {
            console.log(`Group not found!`);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        logError(error);
    }
    // SCE 
    await sendPdfToGroups('Wilayah_6', '120363152744155925@g.us');
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});

// cronjob harian
cron.schedule('10 15 * * *', async () => {
    console.log('Sending Harian Reminder to groups Harian at 15:10 (WIB)...');
    
    try {
        const groupChat = await client.getChatById('120363158376501304@g.us');
        if (groupChat) {
            await groupChat.sendMessage('Harian Guys');
            console.log(`Message sent to the group successfully!`);
        } else {
            console.log(`Group not found!`);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        logError(error);
    }
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta'
});



let listeningForEstateInput = false;
let listengtaksasi = false;

client.on('message', async msg => {
    
if (msg.body === '!tarik' && !listeningForEstateInput) {
        let chat = await msg.getChat();
        if (chat.isGroup) {
          listeningForEstateInput = true;
          msg.reply('Masukan Estate (Harap huruf Kapital!!):');
      
          let inputTimeout = setTimeout(() => {
            if (listeningForEstateInput) {
              msg.reply('Waktu habis. Mohon masukkan Perintah !tarik kembali.');
              listeningForEstateInput = false;
              client.removeListener('message', listener);
            }
          }, 60000); // Set a timeout of 60 seconds
      
          const listener = async (message) => {
            if (message.from === msg.from) {
              const estate = message.body;
      
              clearTimeout(inputTimeout); // Clear the timeout as input is received
      
              await Generatedmaps().then(() => {
                msg.reply('Mohon Tunggu Maps sedang di proses...');
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
  
  
else if (msg.body === '!taksasi' && !listengtaksasi) {
        let chat = await msg.getChat();
        if (chat.isGroup) {
          listengtaksasi = true;
          msg.reply('Masukan wilayah (wil 1 sampai 3, harap hanya satu perwilayah percommand):');
      
          let inputTimeout = setTimeout(() => {
            if (listengtaksasi) {
              msg.reply('Waktu habis. Mohon masukkan wilayah kembali.');
              listengtaksasi = false;
              client.removeListener('message', listener);
            }
          }, 60000); // Set a timeout of 60 seconds
      
          const listener = async (message) => {
            if (message.from === msg.from) {
              const wilayah = message.body;
              msg.reply('Mohon Tunggu Maps sedang di proses...');
      
              clearTimeout(inputTimeout); // Clear the timeout as input is received
      
              await Generatedmaps().then(() => {
                setTimeout(() => {
                  sendperwil(wilayah, chat.id);
                  listengtaksasi = false;
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
      
else if (msg.body === '!status' && !listeningForEstateInput) {
    let chat = await msg.getChat();
    if (chat.isGroup) {
      msg.reply('Bot is running.');
    } else {
      msg.reply('This command can only be used in a group!');
    }
}
  
else if (msg.body === '!info' && !listeningForEstateInput) {
    let chat = await msg.getChat();
    if (chat.isGroup) {
      msg.reply(`Hallo ini adalah Bot DA otomatis Taksasi,user dapat memilih command di bawah ini :
        /tarik = Menarik Taksasi berdasarkan Estate yang di pilih`);
    } else {
      msg.reply('This command can only be used in a group!');
    }
  }
});

client.on('ready', async () => { 
    console.log('Client is ready!');

   
    // checkAndDeleteFiles();

    // await GenerateTaksasi ()

    // checkAndDeleteFiles();
    // await sendPdfToGroups('Wilayah_1', '120363025737216061@g.us');
    // await sendPdfToGroups('Wilayah_2', '120363047670143778@g.us');
    // await sendPdfToGroups('Wilayah_3', '120363048442215265@g.us');

});

function logError(error) {
    const errorFolderPath = path.join(__dirname, 'error');
    const errorLogPath = path.join(errorFolderPath, 'error.log');

    // Create the 'error' folder if it doesn't exist
    if (!fs.existsSync(errorFolderPath)) {
        fs.mkdirSync(errorFolderPath);
    }

    const errorMessage = `${new Date().toISOString()}: ${error.stack}\n`;
    fs.appendFile(errorLogPath, errorMessage, (err) => {
        if (err) throw err;
        console.error('Error logged:', error);
    });
}


client.initialize();
