// venomBot.js
const venom = require('venom-bot');
const fs = require('fs');
const path = require('path');

let clientInstance; // Variable to store the Venom client instance

function startVenom() {
  return venom
    .create({
      session: 'session-name', // name of session
    })
    .then((client) => {
      clientInstance = client;
      start(client);
    })
    .catch((error) => {
      console.log(error);
    });
}

function start(client) {
  client.onMessage((message) => {
   
  });
}
function sendMessage(number, message) {
  if (clientInstance) {
    const formattedNumber = `${number}@c.us`;
    return clientInstance
      .sendText(formattedNumber, message)
      .catch((error) => {
        console.error('Error sending message:', error);
        return Promise.reject(error);
      });
  } else {
    return Promise.reject('Venom client not initialized');
  }
}

async function sendFilesToGroups(groups) {
  try {
    for (let i = 0; i < groups.length; i++) {
      const { grupNumber, folder, files } = groups[i];
      // const filePath = path.join(__dirname, folder, files);
      const filePath = path.join(__dirname, 'taksasi', 'wil1', 'QC-gudang-041223-PKE-1.pdf');
    
      const formattedNumber = `${grupNumber}@g.us`;
      if (fs.existsSync(filePath)) {
        const base64PDF = fs.readFileSync(filePath, 'base64');
        await clientInstance.sendFile(formattedNumber, `data:application/pdf;base64,${base64PDF}`, files, `Check this PDF file: ${files}`);

        console.log(filePath); // Add this line to log the file path

        console.log(`File ${filePath} sent to group ${grupNumber} successfully!`);
      } else {
        console.error(`File ${files} does not exist in folder ${folder}`);
      } 
    }
  } catch (error) {
    console.error('Error sending files to groups:', error);
  }
}



module.exports = { startVenom, sendMessage,sendFilesToGroups };
