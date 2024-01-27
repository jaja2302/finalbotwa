const venom = require('venom-bot');

// Initialize Venom client
venom.create({
  browserArgs: ['--no-sandbox'],
  session: 'tsel'
})
  .then((client) => start(client))
  .catch((error) => {
    console.error('Error initializing Venom:', error);
  });

// Function to start Venom and listen for commands
async function start(client) {
  // Listen for messages
  client.onMessage(async (message) => {
    if (message.body.toLowerCase() === '!hello') {
      // Retrieve all chats
     
      // Send a response back to the sender
      client.sendText(message.from, 'hai juga');
    }
    // Check if the message contains the '/getgroup' command
    if (message.body.toLowerCase() === '!groupchat') {
      // Retrieve all chats
      const chats = await client.getAllChatsGroups();

      // Filter out only groups
      const groups = chats.filter((chat) => chat.isGroup);

      // Format the list of groups
      const formattedGroups = groups.map((group) => `${group.name} - ${group.contact.id._serialized}`).join('\n');

      // Send the list of groups back to the sender
      client.sendText(message.from, `List of groups:\n${formattedGroups}`);
    }
  });
}
