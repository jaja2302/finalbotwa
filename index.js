const express = require('express');
const app = express();
const { startVenom, sendMessage,sendFilesToGroups } = require('./venomBot');
const numbersAndMessages = require('./SmartlabsNumber.json'); 
const numberforTaksasi = require('./TaksasiText.json'); 

let venomReady = false; // Variable to track if Venom bot is ready
// ... (Assuming your sendMessage function is defined correctly as discussed before)

// Function to send messages with a delay (1 minute)
// const sendMessagesWithDelay = async () => {
//   for (let i = 0; i < numbersAndMessages.length; i++) {
//     const { number, Message } = numbersAndMessages[i];
//     try {
//       const result = await sendMessage(number, Message);
//       console.log(`Message sent to ${number} successfully! Result: ${result}`);
//       await new Promise((resolve) => setTimeout(resolve, 60000)); // Delay of 1 minute
//     } catch (error) {
//       console.error(`Error sending message to ${number}:`, error);
//     }
//   }
// };

// Function to send Taksasi group messages with a delay (10 minutes)
const sendTaksasiGrupWithDelay = async () => {
  try {
    await sendFilesToGroups(numberforTaksasi); // Send files to groups based on the provided JSON data
    console.log('Files sent to groups successfully!');
  } catch (error) {
    console.error('Error sending files to groups:', error);
  }
};



// Start the Venom bot and schedule sending messages
startVenom()
  .then(() => {
    venomReady = true; // Set venomReady to true once Venom bot is initialized

    // Send messages immediately upon app start
    // sendMessagesWithDelay();

    // // Schedule sending messages every 1 minute (60000 milliseconds)
    // setInterval(sendMessagesWithDelay, 60000);

    // Send Taksasi group messages immediately upon app start
    sendTaksasiGrupWithDelay();

    // Schedule sending Taksasi group messages every 10 minutes (600000 milliseconds)
    setInterval(sendTaksasiGrupWithDelay, 600000);
  })
  .catch((error) => {
    console.error('Error initializing Venom bot:', error);
  });

// Start the server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`API listening on PORT ${PORT}`);
});

module.exports = app;
