const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const express = require('express');
const http = require('http');
const https = require('https');
const socketIo = require('socket.io');
const opn = require('opn');

// Function to get the current IPv4 address
function getLocalIPv4Address() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    throw new Error('Unable to determine local IPv4 address.');
}

// Function to create a self-signed certificate
function createSelfSignedCertificate(ipAddress) {
    const keyPath = path.join(__dirname, 'server.key');
    const certPath = path.join(__dirname, 'server.cert');
    const configPath = path.join(__dirname, 'san.cnf');

    // Write OpenSSL config for SAN
    const sanConfig = `
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = req_ext
x509_extensions = v3_req

[dn]
CN = ${ipAddress}

[req_ext]
subjectAltName = @alt_names

[v3_req]
subjectAltName = @alt_names

[alt_names]
IP.1 = 127.0.0.1
IP.2 = ${ipAddress}
`;

    fs.writeFileSync(configPath, sanConfig);

    try {
        // Generate the private key and self-signed certificate
        const command = `openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -config "${configPath}"`;
        // console.log('Running OpenSSL command:', command);
        const output = execSync(command, { stdio: 'inherit' });
        // console.log('OpenSSL output:', output);
    } catch (error) {
        console.error('Error generating the self-signed certificate:', error.message);
        console.error('Error details:', error);
        process.exit(1); // Exit the process with a failure code
    }

    return { keyPath, certPath };
}

// Create the certificate before starting the server
const ipAddress = getLocalIPv4Address();
const { keyPath, certPath } = createSelfSignedCertificate(ipAddress);

const app = express();
const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
};

const server = https.createServer(options, app);
const io = socketIo(server);

// Serve static files
app.use(express.static('public'));
const PORT = 1022;

// Create an HTTP server to redirect to mate over secure HTTPS
http.createServer(function(req,res){
    res.writeHead(301, {
            "Location": "https://" + ipAddress + ":"+ PORT + '/mate.html'
        });
    res.end()
}).listen(80);


// #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #
// #  #  #  #  #  #  #  #  #  #  #  SSL Above This Line  #  #  #  #  #  #  #  #  #  #  #  #
// #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #

let players = {};

// Handle player connection
io.on('connection', (socket) => {
    if (socket.handshake.headers.referer.includes('gui.html')) {
        socket.emit('gui-ip', ipAddress);
        return;
    }
    console.log(socket.handshake.headers.referer);
    console.log('A player connected:', socket.id);

    // Add player to the list with an empty history array
    players[socket.id] = {
        id: socket.id,
        browId: null,
        gyroscopeHistory: [],
        accelerometerHistory: [],
    };

    // Update the GUI only when a new player is added
    io.emit('player-connected', players[socket.id]);

    socket.on('set-brow-id', (browId) => {
        players[socket.id].browId = browId;
        io.emit('player-connected', players[socket.id]);
    });

    // Handle incoming sensor data
    socket.on('sensor-data', (data) => {
        if (players[socket.id]) {
            // Save the data in the player's history array
            players[socket.id].gyroscopeHistory.push(data.gyro);
            players[socket.id].accelerometerHistory.push(data.acel);

            // Update the GUI
            io.emit('new-player-sensor-data', {id: socket.id, data: data});
        }
    });

    // Handle player disconnection
    socket.on('disconnect', () => {
        console.log('A player disconnected:', socket.id);

        // Remove player from the list
        const disconnectedPlayer = players[socket.id];
        delete players[socket.id];

        // Update the GUI only when a player is removed
        io.emit('player-disconnected', disconnectedPlayer);
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Open the GUI in the default browser
    opn(`https://localhost:${PORT}/gui.html`);
});
