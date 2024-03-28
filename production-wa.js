const qrcode = require('qrcode-terminal');
const express = require('express')
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const app = express();
const fs = require('fs');
const cron = require('node-cron');
const axios = require('axios');
const moment = require('moment-timezone');
const { DateTime } = require('luxon');

// const generatemaps = require('./openBrowser.js');
const { Generatedmaps, GenerateTaksasi,GenDefaultTaksasi,Generatedmapsest } = require('./openBrowser'); // Note: Remove the '.js' extension

const path = require('path');
const today = new Date();

// Format the current date to 'YYYY-MM-DD' format
const datetimeValue = formatDate(today);
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Adding 1 because getMonth() returns zero-based index
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const server = app.listen(0, () => {
    const { port } = server.address();
    console.log(`Server running on port ${port}`);
});




const client = new Client({
    puppeteer: {
        headless: true,
        ignoreHTTPSErrors: true,
        ignoreDefaultArgs: ["--disable-extensions"],
        executablePath: './chrome-win/chrome.exe',
        browserArgs: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--single-process",
        ],
    },
    authStrategy: new LocalAuth({
        clientId: "whatsapp",
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
            // console.log('Invalid or empty data.');
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


// bot aws 
async function sendmsgAws(message, groupid) {
    // Assuming 'client' is your WhatsApp client instance
    const groupChat = groupid; // Use the provided groupid
    const group = await client.getChatById(groupChat);
    await group.sendMessage(message);
}


// Call the function when the client is ready

cron.schedule('*/5 * * * *', async () => {
    // console.log('Running message sending task...');
    const logFilePath = './bot-da-out.log'; // Main log file path
    const errorLogFilePath = './bot-da-error.log'; // Error log file path

    // Clear main log file
    fs.writeFileSync(logFilePath, '');

    // Clear error log file
    fs.writeFileSync(errorLogFilePath, '');
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
        // await sock.sendMessage(idgroup, { text: 'Error checking or deleting file' })
    }
}

async function checkAndDeleteFiles() {
    let attempts = 0;
    const maxAttempts = 5;
    const retryDelay = 3000; // 3 seconds in milliseconds

    while (attempts < maxAttempts) {
        try {
            const getStatus = await axios.get('https://srs-ssms.com/whatsapp_bot/checkfolderstatus.php');
            const { data: folderStatus } = getStatus;

            if (Array.isArray(folderStatus) && folderStatus.length > 0) {
                for (const file of folderStatus) {
                    if (file.hasOwnProperty('wilayah') && file.hasOwnProperty('filename')) {
                        const { wilayah, filename } = file;
                        await deleteFile(filename, wilayah);
                    }
                }
            } else {
                console.log('No files found or empty folder. Nothing to delete.');
            }
            // Break the loop if successful
            break;
        } catch (error) {
            attempts++;
            console.error('Error checking and deleting files:', error);
            if (attempts < maxAttempts) {
                console.log(`Retrying attempt ${attempts} after ${retryDelay / 1000} seconds`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            } else {
                console.error(`Max retry attempts (${maxAttempts}) reached. Exiting retry loop.`);
                throw error; // Throw the error after max attempts are reached
            }
        }
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
            case 'LME2':
            folder = 'Plasma';
                break;
            default:
                // Handle cases where est doesn't match any defined folders
                console.log('Invalid est value provided.');
                await sendmsgAws(`Tidak ada ${est} ini di database`, '120363205553012899@g.us');

                return;
        }

    
        // await Generatedmapsest(est);
        await checkAndDeleteFiles(); 
     
        // await Generatedmapsest(est)
        await GenDefaultTaksasi(est)
        await sendmsgAws(`Generate pdf untuk ${est} sukses`, '120363205553012899@g.us');
        // await client.sendMessage(`Generate pdf untuk ${est} sukses`);
        // console.log(`Files generated successfully for '${est}' in folder '${folder}'.`);

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
            if (est === 'LME1') {
                await sendPdfToGroups(folder, '120363208984887370@g.us');
            } else if (est === 'LME2'){
                await sendPdfToGroups(folder, '120363193243380343@g.us');
            }
        }
        // await sendMessage(`kirim pdf untuk ${est} sukses`);
 
        await sendmsgAws(`kirim pdf untuk ${est} sukses`, '120363205553012899@g.us');

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
                await sendmsgAws(`Data anda masukan Salah`, '120363205553012899@g.us');


                return;
        }

        // Perform operations sequentially
        await Generatedmaps(); 
        await sendmsgAws(`Generate maps sukses`, '120363205553012899@g.us');


        await checkAndDeleteFiles(); 

        // Generate maps
        await GenerateTaksasi();
        await sendmsgAws(`Generate PDF sukses`, '120363205553012899@g.us');

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
        await sendmsgAws(`Pdf dikirim ke grup sukses`, '120363205553012899@g.us');

        // Check and delete files again
        // await checkAndDeleteFiles();
    } catch (error) {
        console.error(`Error fetching files:`, error);
        // logError(error);
        await sendmsgAws(`Pdf dikirim ke grup gagal`, '120363205553012899@g.us');

    }
}


// cronjob taksasi 


async function sendhistorycron(estate) {
    try {
        const apiUrl = 'http://ssms-qc.test/api/recordcronjob';
        
        // Create the form data with variables estate and datetime
        const formData = new FormData();
        formData.append('est', estate); // Set the estate variable

        // Get the current date and time in the Jakarta timezone using Luxon
        const dateTime = DateTime.now().setZone('Asia/Jakarta').toISO(); 

        formData.append('datetime', dateTime); // Set the datetime variable to Jakarta timezone

        // Send the POST request with form data
        const response = await axios.post(apiUrl, formData);

        // Handle the response if needed
        console.log("Response:", response.data);
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}


const tasks = JSON.parse(fs.readFileSync('./data.json', 'utf8'));
tasks.forEach(task => {
         const timeString = task.datetime
         // Split the time string into hours and minutes
         const [hours, minutes] = timeString.split(':');
         // Format the time in cron format (minutes, hours, day of month, month, day of week)
         const cronTime = `${minutes} ${hours} * * *`;
        cron.schedule(cronTime, async () => {
            console.log(`Sending files at ${cronTime} (WIB)...`);
            await sendmsgAws(`Jalankan Cronjob ${task.estate}`, '120363205553012899@g.us');

            // await sock.sendMessage(idgroup, { text: `Cronjob ${cronTime}`})
            try {
                await sendmsgAws(`Checking Cronjob Fail yang Di jalankan Terlebih dahulu`, '120363205553012899@g.us');

                // await sock.sendMessage(idgroup, { text: `Check Cronjob Fail Tidak Terkirim Sebelumnya`})
                await sendfailcronjob();
                await sendmsgAws(`Memulai Cronjob ${task.estate}`, '120363205553012899@g.us');

                await Generatedmapsest(task.estate,datetimeValue);
                await GenDefaultTaksasi(task.estate);
                await sendPdfToGroups(task.wilayah, task.group_id);
                await sendhistorycron(task.estate)
            } catch (error) {
                console.error('Error performing task in cronjob:', error);
            }
        }, {
            scheduled: true,
            timezone: 'Asia/Jakarta' // Set the timezone to Asia/Jakarta for WIB
        });
});


// Function to fetch data from API and save as JSON
async function fetchDataAndSaveAsJSON() {
    try {
        const apiUrl = 'http://ssms-qc.test/api/getdatacron';
        const response = await axios.get(apiUrl);

        // Save response data as JSON
        fs.writeFile('data.json', JSON.stringify(response.data, null, 2), err => {
            if (err) {
                console.error('Error saving data:', err);
            } else {
                console.log('Data saved as data.json');
            }
        });
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}
async function sendfailcronjob() {
    try {
        const apiUrl = 'http://ssms-qc.test/api/checkcronjob';
        const response = await axios.get(apiUrl);

        let data = response.data.cronfail; 

        console.log(data);

        for (const task of data) {
            try {
                // await sock.sendMessage(task.group_test, { text: `Cronjob ${task.estate}`});
                await checkAndDeleteFiles(); 
                await Generatedmapsest(task.estate, task.datetime);
                await GenDefaultTaksasi(task.estate);
                await sendPdfToGroups(task.wilayah, task.group_id);
                await sendhistorycron(task.estate);
            } catch (error) {
                console.error('Error performing task in cronjob:', error);
            }
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}



let listeningForEstateInput = false;
let listengtaksasi = false;
let listen2 = false;
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
    
                    // msg.reply('Mohon Tunggu Maps sedang di proses...');
                    await Generatedmapsest(estate,datetimeValue).then(() => {
                        // msg.reply('Mohon Tunggu Maps sedang di proses...');
                        setTimeout(() => {
                            sendtaksasiest(estate, chat.id);
                            // console.error('Estate ' + estate + ' Pdf Berhasil Di kirim');
                            // msg.reply('Estate ' + estate + ' Pdf Berhasil Di kirim ke group');
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

    
    else if (msg.body.toLowerCase() === '!patchdata') {
        try {
            // Get common groups
            await fetchDataAndSaveAsJSON();
            await client.sendMessage(msg.from, 'Data Json Grup Updated');
        } catch (error) {
            // Handle errors, such as failed API requests
            console.error('Error retrieving common groups:', error);
            await client.sendMessage(msg.from, 'Error error');
        }
    }
    

    else if (msg.body === '!generatemaps' && !listen5) {
        try {
            await Generatedmapsest('NBE')
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





// Schedule the status check and message sending task every one hour
cron.schedule('0 0 * * *', async () => {
    try {
      
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
