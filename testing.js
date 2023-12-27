const ping = require('ping');

async function checkWhatsAppAvailability() {
    const host = 'www.whatsapp.com';

    ping.sys.probe(host, (isAlive) => {
        const message = isAlive ? `${host} is reachable` : `${host} is unreachable`;
        console.log(message);
    }, { timeout: 10 }); // Set the timeout (in seconds) for the ping request
}

// Call the function to check WhatsApp availability
checkWhatsAppAvailability();
