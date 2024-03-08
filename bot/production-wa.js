const qrcode = require('qrcode-terminal');
const express = require('express')
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const app = express();
const fs = require('fs');
const cron = require('node-cron');
const axios = require('axios');
const schedule = require('node-schedule');
const moment = require('moment-timezone');

// const generatemaps = require('./openBrowser.js');
const { Generatedmaps, GenerateTaksasi,GenDefaultTaksasi,Generatedmapsest } = require('./openBrowser'); // Note: Remove the '.js' extension

const path = require('path');


const server = app.listen(0, () => {
    const { port } = server.address();
    console.log(`Server running on port ${port}`);
});




const client = new Client({
    puppeteer: {
        headless: 'new',
        executablePath: '../chrome-win/chrome.exe',
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
        clientId: "teting",
    })
});


client.on('qr', qrCode => {
    qrcode.generate(qrCode, { small: true });
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
        // local 
        // const response = await axios.get('http://localhost:52914/data'); 
        // online 
        const response = await axios.get('https://srs-ssms.com/whatsapp_bot/getmsgsmartlab.php'); 
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


async function isValidWhatsAppNumber(phoneNumber) {
    try {
        const contact = await client.getContactById(phoneNumber);
        return !!contact;
    } catch (error) {
        console.log('Error checking WhatsApp number:', error);
        return false;
    }
}



async function sendMessageWithDelay(chat, message, phoneNumber, idmsg) {
    try {
        await new Promise((resolve) => {
            setTimeout(async () => {
                await chat.sendMessage(message);
                console.log(`Message "${message}" sent to ${phoneNumber}`);
                await deletemsg(idmsg);
                resolve();
            }, 10000);
        });
    } catch (error) {
        console.log('Error sending message with delay:', error);
    }
}

async function deletemsg(idmsg) {
    try {
        // await axios.post('http://localhost:52914/deletedata', { id: idmsg });
        await axios.post('https://srs-ssms.com/whatsapp_bot/getmsgsmartlab.php', { id: idmsg });
     
        console.log(`Message ID '${idmsg}' deleted successfully.`);
    } catch (error) {
        console.log(`Error deleting message ID '${idmsg}':`, error);
    }
}





// Call the function when the client is ready

cron.schedule('*/1 * * * *', async () => {
    // console.log('Running message sending task...');
    await sendMessagesBasedOnData();
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone according to your location
});

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
                    // logError(error);
                }
            }
        };

        await sendPdfToGroup(folder, groupID);
        const logFilePath = './bot-da-out.log'; // Main log file path
        const errorLogFilePath = './bot-da-error.log'; // Error log file path

        // Clear main log file
        fs.writeFileSync(logFilePath, '');

        // Clear error log file
        fs.writeFileSync(errorLogFilePath, '');

    } catch (error) {
        console.error('Error fetching or sending PDF files:', error);
        try {
            const groupChat = await client.getChatById('120363205553012899@g.us');
            if (groupChat) {
                const errorMessage = 'There was an error sending the PDF files.\nError Details:\n' + error.stack;
                await groupChat.sendMessage(errorMessage);
                console.error('Notification sent to the group about the error.');
            } else {
                console.log('Group not found!');
                logError(error);
            }
        } catch (sendMessageError) {
            console.log('Error sending message:', sendMessageError);
            // logError(error);
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
        console.log(`Error checking or deleting file '${filename}' in folder '${folder}':`, error.message);
        // logError(error);
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
        console.log('Error checking and deleting files:', error);
        // logError(error);
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
            case 'SCE':
                folder = 'Wilayah_6';
                break;
            case 'PKE':
            case 'BDE':
            case 'KTE':
            case 'MKE':
           
                folder = 'Wilayah_7';
                break;

            case 'BHE':

                folder = 'Wilayah_8';
                break;
        
            case 'TBE':
            case 'KTE4':
            case 'SJE':
            folder = 'Inti';
            break;
            case 'LME1':
            folder = 'Plasma';
                break;
            default:
                // Handle cases where est doesn't match any defined folders
                console.log('Invalid est value provided.');
                return;
        }

    
        // await Generatedmapsest(est);
        await checkAndDeleteFiles(); 
     
        await Generatedmapsest(est)
        await GenDefaultTaksasi(est)

        console.log(`Files generated successfully for '${est}' in folder '${folder}'.`);

        // testing 
        if (folder === 'Wilayah_1') {
            await sendPdfToGroups(folder, '120363025737216061@g.us');
        } else if (folder === 'Wilayah_2') {
            await sendPdfToGroups(folder, '120363047670143778@g.us');
        } else if (folder === 'Wilayah_3') {
            await sendPdfToGroups(folder, '120363048442215265@g.us');
            // send to testing 
            // await sendPdfToGroups(folder, '120363204285862734@g.us');
        }  else if (folder === 'Wilayah_4') {
            if (est === 'SPE') {
                await sendPdfToGroups(folder, '120363220419839708@g.us');
            }else if (est === 'NKE'){
                await sendPdfToGroups(folder, '120363217152686034@g.us');
            }  else if (est === 'PDE'){
                await sendPdfToGroups(folder, '120363217291038671@g.us');
            }else if (est === 'MRE'){
                await sendPdfToGroups(folder, '120363217205685424@g.us');
            }
        }else if (folder === 'Wilayah_5') {
            if (est === 'SBE') {
                await sendPdfToGroups(folder, '120363220146576654@g.us');
            } else if (est === 'BTE') {
                await sendPdfToGroups(folder, '120363226513991710@g.us');
            }  else if (est === 'NNE') {
                await sendPdfToGroups(folder, '120363231670115838@g.us');
            } 
        } else if (folder === 'Wilayah_6') {
            if (est === 'SCE') {
                await sendPdfToGroups(folder, '120363232871713646@g.us');
            } else if (est === 'MLE'){
                await sendPdfToGroups(folder, '120363213054175770@g.us');
            }
        } else if (folder === 'Wilayah_7') {
            if (est === 'KTE') {
                await sendPdfToGroups(folder, '120363170524329595@g.us');
                // send ke testin 
                // await sendPdfToGroups(folder, '120363158376501304@g.us');
            } else if (est === 'BDE') {
                await sendPdfToGroups(folder, '120363166668733371@g.us');
            }

            // testing 
            // grup asli = 120363166668733371@g.us
            // grup testing = 120363205553012899@g.us

        } else if (folder === 'Wilayah_8') {
            if (est === 'BHE') {
                await sendPdfToGroups(folder, '120363149785590346@g.us');
            }
        }else if (folder === 'Inti') {
            if (est === 'SJE') {
                await sendPdfToGroups(folder, '120363207525577365@g.us');
            } else if (est === 'KTE4'){
                await sendPdfToGroups(folder, '120363210871038595@g.us');
            }
            else {
                await sendPdfToGroups(folder, '120363193125275627@g.us');
            }
           
        }else if (folder === 'Plasma') {
            await sendPdfToGroups(folder, '120363208984887370@g.us');
        }



    } catch (error) {
        console.log(`Error fetching files:`, error);
        // logError(error);
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
        await Generatedmaps(); 
        await checkAndDeleteFiles(); 

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
        // await checkAndDeleteFiles();
    } catch (error) {
        console.error(`Error fetching files:`, error);
        // logError(error);
    }
}



// Usage:



// cronjob generate maps 


// Function to generate maps and send messages
const generateAndSendMessage = async (time) => {
    console.log(`Generate Maps at ${time}..`);
    try {
        const groupChat = await client.getChatById('120363205553012899@g.us');
        if (groupChat) {
            await groupChat.sendMessage(`Generate Maps Jam ${time}`);
            console.log(`Message sent to the group successfully at ${time}!`);
        } else {
            console.log(`Group not found!`);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        // logError(error);
    }

    await Generatedmaps();

    
    // await Generatedmapsest(est);
    await checkAndDeleteFiles();
};

// Define cron job times
const cronTimes = ['13:57','14:57','11:57','10:57','08:57','16:57','15:57'];

// Create cron jobs dynamically using a loop
cronTimes.forEach(time => {
    const [hours, minutes] = time.split(':');
    const job = schedule.scheduleJob(`${minutes} ${hours} * * *`, async () => {
        await generateAndSendMessage(time);
    });
});





// cronjob taksasi 


const tasks = [
    { 
        time: '00 17 * * *', 
        message: 'Kirim Taksasi Umpang Wil 3 Jam 17:00', 
        regions: ['Wilayah_3'], 
        groupId: '120363048442215265@g.us',
        // test  
        // groupId: '120363205553012899@g.us',
        generate: 'UPE',
        versi: '2'
    },
    { 
        time: '00 09 * * *', 
        message: 'Kirim Taksasi Wil 7 BDE  Jam 09:00', 
        regions: ['Wilayah_7'], 
        groupId: '120363166668733371@g.us',

        // tes 
        // groupId: '120363205553012899@g.us',
        generate: 'BDE',
        versi: '2'
    },
    { 
        time: '00 11 * * *', 
        message: 'Kirim Taksasi NKE Wil 4  Jam 11:05', 
        regions: ['Wilayah_4'], 
        groupId: '120363217152686034@g.us',
        // groupId: '120363205553012899@g.us',

        // testgrup
        // groupId: '120363205553012899@g.us',
        generate: 'NKE',
        versi: '2'
    },
    { 
        time: '00 12 * * *', 
        message: 'Kirim Taksasi KTE Wil 7  Jam 12:00', 
        regions: ['Wilayah_7'], 
        groupId: '120363170524329595@g.us',

        // testgrup
        // groupId: '120363205553012899@g.us',
        generate: 'KTE',
        versi: '2'
    },
    { 
        time: '02 12 * * *', 
        message: 'Kirim Taksasi SPE Wil 4  Jam 12:03', 
        regions: ['Wilayah_4'], 
        groupId: '120363220419839708@g.us',

        // testgrup
        // groupId: '120363205553012899@g.us',
        generate: 'SPE',
        versi: '2'
    },
    { 
        time: '04 12 * * *', 
        message: 'Kirim Taksasi LME1  Jam 12:03', 
        regions: ['Plasma'], 
        groupId: '120363208984887370@g.us',
        // testgrup
        // groupId: '120363205553012899@g.us',
        generate: 'LME1',
        versi: '2'
    },
    { 
        time: '06 12 * * *', 
        message: 'Kirim Taksasi PDE  Jam 12:04', 
        regions: ['Wilayah_4'], 
        groupId: '120363217291038671@g.us',
        // testgrup
        // groupId: '120363205553012899@g.us',
        generate: 'PDE',
        versi: '1'
    },
    { 
        time: '08 12 * * *', 
        message: 'Kirim Taksasi SBE  Jam 12:04', 
        regions: ['Wilayah_5'], 
        groupId: '120363220146576654@g.us',
        // testgrup
        // groupId: '120363205553012899@g.us',
        generate: 'SBE',
        versi: '1'
    },
    { 
        time: '10 12 * * *', 
        message: 'Kirim Taksasi BTE  Jam 12:10', 
        regions: ['Wilayah_5'], 
        groupId: '120363226513991710@g.us',
      
        generate: 'BTE',
        versi: '1'
    },

    { 
        time: '12 12 * * *', 
        message: 'Kirim Taksasi MLE  Jam 12:12', 
        regions: ['Wilayah_6'], 
        groupId: '120363213054175770@g.us',
      
        generate: 'MLE',
        versi: '1'
    },
    { 
        time: '14 12 * * *', 
        message: 'Kirim Taksasi MRE  Jam 12:14', 
        regions: ['Wilayah_4'], 
        groupId: '120363217205685424@g.us',
      
        generate: 'MRE',
        versi: '1'
    },
    { 
        time: '00 10 * * *', 
        message: 'Kirim Taksasi NNE  Jam 00:10', 
        regions: ['Wilayah_5'], 
        groupId: '120363231670115838@g.us',
        generate: 'NNE',
        versi: '1'
    },
    { 
        time: '00 15 * * *', 
        message: 'Kirim Taksasi BHE Jam 15:00', 
        regions: ['Wilayah_8'], 
        groupId: '120363149785590346@g.us',
        // testgrup
        // groupId: '120363205553012899@g.us',
        generate: 'BHE',
        versi: '2'
    },
    { 
        time: '03 15 * * *', 
        message: 'Kirim Taksasi SJE Jam 15:00', 
        regions: ['Inti'], 
        groupId: '120363207525577365@g.us',
        generate: 'SJE',
        versi: '2'
    },
    { 
        time: '05 15 * * *', 
        message: 'Kirim Taksasi KTE4 Jam 15:05', 
        regions: ['Inti'], 
        groupId: '120363210871038595@g.us',
        // testgrup
        // groupId: '120363205553012899@g.us',
        generate: 'KTE4',
        versi: '2'
    },
    { 
        time: '00 14 * * *', 
        message: 'Kirim Taksasi SCE  Jam 14:00', 
        regions: ['Wilayah_6'], 
        groupId: '120363232871713646@g.us',
        // testgrup
        // groupId: '120363205553012899@g.us',
        generate: 'SCE',
        versi: '2'
    },
    { 
        time: '03 14 * * *', 
        message: 'Kirim Taksasi TBE  Jam 12:03', 
        regions: ['Inti'], 
        groupId: '120363193125275627@g.us',
        // testgrup
        // groupId: '120363205553012899@g.us',
        generate: 'TBE',
        versi: '2'
    },  
    // { 
    //     time: '15 09 * * *', 
    //     message: 'Testing bot', 
    //     regions: ['Wilayah_7'], 
    //     groupId: '120363205553012899@g.us',
    //     // testgrup
    //     // groupId: '120363205553012899@g.us',
    //     generate: 'BDE',
    //     versi: '2'
    // },    
];
tasks.forEach(task => {
    cron.schedule(task.time, async () => {
        console.log(`Sending files at ${task.time} (WIB)...`);
        try {
            const groupChat = await client.getChatById('120363205553012899@g.us');
            if (groupChat) {
                await groupChat.sendMessage(task.message);
                console.log(`Message sent to the group successfully!`);
            } else {
                console.log(`Group not found!`);
            }
        } catch (error) {
            console.error('Error Cronjob Kirim taksasi Harian Nich:');
            // logError(error);
        }
       
        try {
            // await Generatedmaps();
        
            await checkAndDeleteFiles(); 
            await Generatedmapsest(task.generate);
            await GenDefaultTaksasi(task.generate);
          
            for (const region of task.regions) {
                await sendPdfToGroups(region, task.groupId); // Use task.groupId for all regions
            }
        } catch (error) {
            console.error('Error Cronjob Kirim taksasi Harian Nich:');
            // logError(error);
        }
    }, {
        scheduled: true,
        timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
    });
});



cron.schedule('04 16 * * *', async () => {
    console.log('Sending files to groups wil 1 2 3 at 16:05 (WIB)...');
    try {
        const groupChat = await client.getChatById('120363205553012899@g.us');
        if (groupChat) {
            await groupChat.sendMessage('Kirim Taksasi Wil 1 ,2,3 Jam 16:02');
            console.log(`Message sent to the group successfully!`);
        } else {
            console.log(`Group not found!`);
        }
    } catch (error) {
        console.error('Kirim Taksasi Wil 1 2 3 error say');
        // logError(error);
    }
 
    try {
        await checkAndDeleteFiles(); // Ensure files are checked and deleted first
    
        // Wait for 10 seconds after checkAndDeleteFiles
        await GenerateTaksasi();
        // await GenerateTakestEST('NBE');
    

        await sendPdfToGroups('Wilayah_1', '120363025737216061@g.us');
        await sendPdfToGroups('Wilayah_2', '120363047670143778@g.us');
        await sendPdfToGroups('Wilayah_3', '120363048442215265@g.us');
    } catch (error) {
        console.error('Kirim Taksasi Wil 1 2 3 error say');
        // logError(error);
    }


    // await sendPdfToGroups('Wilayah_1', '120363025737216061@g.us');
    // await sendPdfToGroups('Wilayah_2', '120363047670143778@g.us');
    // await sendPdfToGroups('Wilayah_3', '120363048442215265@g.us');
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
});

let listeningForEstateInput = false;
let listengtaksasi = false;
let listen2 = false;
let listen3 = false;
let listen4 = false;
let listen5 = false;
let listen6 = false;

const allowedNumber = '120363205553012899@g.us'; 
const adminNumber = '6281349807050@c.us'; 
const errorLogPath = './bot-da-error.log';

// Function to send the error log to the group
async function sendErrorLogToGroup() {
    try {
    const errorLog = fs.readFileSync(errorLogPath, 'utf8');
    await client.sendMessage(allowedNumber, errorLog);
    console.log('Error log sent to the group.');
    } catch (error) {
    console.error(`Error reading or sending error log: ${error}`);
    }
}

// Watch for changes in the error.log file
fs.watchFile(errorLogPath, (curr, prev) => {
    if (curr.size > prev.size) {
    // If the current size is greater than the previous size, indicating an update
    console.log('Detected change in error.log. Sending to group...');
    sendErrorLogToGroup();
    }
});

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
    
                    msg.reply('Mohon Tunggu Maps sedang di proses...');
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

    else if (msg.body === '!status' && !listen2) {
        let chat = await msg.getChat();
        if (chat.isGroup) {
            msg.reply('Bot is running.');
        } else {
            msg.reply('This command can only be used in a group!');
        }
    }
  

    else if (msg.body === '!getlog' && !listen4) {
        try {
            const logFilePath = './bot-da-out.log'; // Main log file path
            const errorLogFilePath = './bot-da-error.log'; // Error log file path

            // Create MessageMedia for main log file
            const logMedia = MessageMedia.fromFilePath(logFilePath);

            // Create MessageMedia for error log file
            const errorLogMedia = MessageMedia.fromFilePath(errorLogFilePath);

            // Send the main log file as a document
            await client.sendMessage(msg.from, logMedia, { sendMediaAsDocument: true });

            // Send the error log file as a document
            await client.sendMessage(msg.from, errorLogMedia, { sendMediaAsDocument: true });

            // Respond to confirm sending both log files
            await client.sendMessage(msg.from, 'Log files sent successfully!');
        } catch (error) {
            // Handle errors, such as file not found or other issues
            console.error('Error sending log files:', error);
            await client.sendMessage(msg.from, 'Error sending log files. Please try again later.');
        }
    } else if (msg.body === '!clearlog' && !listen4) {
        try {
            const logFilePath = './bot-da-out.log'; // Main log file path
            const errorLogFilePath = './bot-da-error.log'; // Error log file path

            // Clear main log file
            fs.writeFileSync(logFilePath, '');

            // Clear error log file
            fs.writeFileSync(errorLogFilePath, '');

            // Respond to confirm clearing both log files
            await client.sendMessage(msg.from, 'Log files cleared successfully!');
        } catch (error) {
            // Handle errors, such as file not found or other issues
            console.error('Error clearing log files:', error);
            await client.sendMessage(msg.from, 'Error clearing log files. Please try again later.');
        }
    }

    
    else if (msg.body.toLowerCase() === '/getgroup') {
        try {
            // Get common groups
            const commonGroups = await client.getCommonGroups(msg.from);
    
            if (commonGroups.length > 0) {
                // Fetch group details for each common group
                const groupDetails = await Promise.all(
                    commonGroups.map(async (groupId) => {
                        try {
                            const groupInfo = await client.getChatById(groupId._serialized);
                            return {
                                id: groupId._serialized,
                                name: groupInfo.name || 'Unnamed Group',
                            };
                        } catch (error) {
                            console.error(`Error fetching group details for ${groupId._serialized}:`, error);
                            return null;
                        }
                    })
                );
    
                // Filter out null values (failed fetches)
                const validGroupDetails = groupDetails.filter((group) => group !== null);
    
                // Format the list of common groups with names
                const formattedGroups = validGroupDetails.map((group) => `${group.name} - ${group.id}`).join('\n');
    
                // Send the list of common groups with names back to the sender
                await client.sendMessage(msg.from, `Common Groups:\n${formattedGroups}`);
            } else {
                // Respond if there are no common groups
                await client.sendMessage(msg.from, 'You don\'t have any common groups with the bot.');
            }
        } catch (error) {
            // Handle errors, such as failed API requests
            console.error('Error retrieving common groups:', error);
            await client.sendMessage(msg.from, 'Error retrieving common groups. Please try again later.');
        }
    }
    

    else if (msg.body === '!generatemaps' && !listen5) {
        try {
            await Generatedmaps()
            // Respond to confirm clearing both log files
            await client.sendMessage(msg.from, 'Generate succes');
        } catch (error) {
            // Handle errors, such as file not found or other issues
            console.error('Error clearing log files:', error);
            await client.sendMessage(msg.from, 'Error clearing log files. Please try again later.');
        }
    }

    else if (msg.body === '!aws' && !listen6) {
        try {
            await statusAWS()
            // Respond to confirm clearing both log files
            await client.sendMessage(msg.from, 'check aws');
        } catch (error) {
            // Handle errors, such as file not found or other issues
            console.error('Error clearing log files:', error);
            await client.sendMessage(msg.from, 'Error clearing log files. Please try again later.');
        }
    }

    
    
});
   



client.on('ready', async () => {
    console.log('Client is ready!');
    await checkAndDeleteFiles(); // Ensure files are checked and deleted first
    
    const number = '120363205553012899@g.us'; // Replace with the target number
    const message = 'Bot Starting '; // Message to be sent

    const chat = await client.getChatById(number);
    if (chat) {
        await chat.sendMessage(message); // Ensure to use await here for sendMessage
        console.log('Message sent successfully!');
    } else {
        console.log('Chat not found!');
    }
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



// bot aws 
async function sendmsgAws(message, groupid) {
    // Assuming 'client' is your WhatsApp client instance
    const groupChat = groupid; // Use the provided groupid
    const group = await client.getChatById(groupChat);
    await group.sendMessage(message);
}

// Function to check AWS status and send a message to the WhatsApp group if conditions met

async function statusAWS() {
    try {
        const response = await axios.get('https://srs-ssms.com/iot/notif_wa_last_online_device.php');
        console.log(response);
        // Check if response.data is not empty
        if (Array.isArray(response.data) && response.data.length > 0) {
            const jsonArray = response.data; // Use the response directly

            // Iterate through each object in the array
            for (const item of jsonArray) {
                // Check if 'online' is equal to 0 and 'group_id' is not empty
                if (item.online === 0 && item.group_id && item.group_id.trim() !== '') {
                    // Send a message to the specified 'group_id'
                    await sendmsgAws(item.message, item.group_id);
                }
            }
        }
    } catch (error) {
        console.error(`Error fetching files:`, error);
        // Handle the error accordingly
        logError(error);
    }
}


// Schedule the status check and message sending task every 5 seconds
// cron.schedule('*/5 * * * * *', async () => {
//     try {
//         console.log('Running message aws');
//         await statusAWS(); // Call the function to check AWS status and send message
//     } catch (error) {
//         console.error('Error in cron job:', error);
//     }
// }, {
//     scheduled: true,
//     timezone: 'Asia/Jakarta' // Set the timezone according to your location
// });


// Schedule the status check and message sending task every one hour
cron.schedule('0 0 * * *', async () => {
    try {
        const logFilePath = './bot-da-out.log'; // Main log file path
        const errorLogFilePath = './bot-da-error.log'; // Error log file path

        // Clear main log file
        fs.writeFileSync(logFilePath, '');

        // Clear error log file
        fs.writeFileSync(errorLogFilePath, '');
        // console.log('Running message aws');
        await statusAWS(); // Call the function to check AWS status and send message
    } catch (error) {
        console.error('Error in cron job:', error);
    }
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone according to your location
});


function readLatestId() {
    try {
        if (fs.existsSync('latest_id.txt')) {
            const data = fs.readFileSync('latest_id.txt', 'utf8');
            return parseInt(data.trim()); // Parse the ID as an integer
        } else {
            // If the file doesn't exist, set the initial latest_id to 9
            writeLatestId(9);
            return 9;
        }
    } catch (err) {
        console.error('Error reading latest ID:', err);
        return null;
    }
}

// Function to write the latest ID to a file
function writeLatestId(id) {
    try {
        fs.writeFileSync('latest_id.txt', id.toString()); // Write the ID to the file
    } catch (err) {
        console.error('Error writing latest ID:', err);
    }
}
async function statusHistory() {
    try {
        // Get the latest ID from the file
        let latestId = readLatestId();

        // Fetch new data from the API using the latest ID
        const response = await axios.get('https://qc-apps.srs-ssms.com/api/history', {
            params: {
                id: latestId // Change the parameter name to "id"
            }
        });

        // Log the fetched data
        // console.log('Fetched data:', response.data);

        // Update the latest ID with the maximum ID from the response
        if (Array.isArray(response.data) && response.data.length > 0) {
            const maxId = Math.max(...response.data.map(item => item.id));
            writeLatestId(maxId);

            // Process and send the new data as needed
            const groupId = '120363205553012899@g.us'; // Replace with your actual group ID
            const message = 'New History Edit: ' + JSON.stringify(response.data); // Customize the message as needed
            await sendmsgAws(message, groupId);
        } else {
            // console.log('No new data fetched.');
        }

    } catch (error) {
        console.error(`Error fetching data:`, error);
        // Handle the error accordingly
    }
}


// Schedule the cron job setipa 10 menit
cron.schedule('*/10 * * * *', async () => {
    try {
        // console.log('Running message history');
        await statusHistory(); // Call the function to check history and send message
    } catch (error) {
        console.error('Error in cron job:', error);
    }
}, {
    scheduled: true,
    timezone: 'Asia/Jakarta' // Set the timezone according to your location
});



client.initialize();
