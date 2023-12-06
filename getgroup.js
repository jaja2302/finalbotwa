const venom = require('venom-bot');

// Initialize Venom client
venom.create({
  browserArgs: ['--no-sandbox'], // Add browser arguments here if needed
  session: 'nowaxl'
})
  .then((client) => start(client))
  .catch((error) => {
    console.error('Error initializing Venom:', error);
  });

// Function to start Venom and fetch group list
async function start(client) {
  try {
    // Retrieve all chats
    const chats = await client.getAllChats();

    // Filter out only groups
    const groups = chats.filter((chat) => chat.isGroup);

    // Log the list of groups
    console.log('List of groups:');
    groups.forEach((group) => {
      console.log(`${group.name} - ${group.contact.id._serialized}`);
    });

    

    
    // Close the Venom client when done
    await client.close();
  } catch (error) {
    console.error('Error:', error);
  }
}
