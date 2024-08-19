const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const opn = require('opn');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let players = {};

// Serve static files
app.use(express.static('public'));

// Handle player connection
io.on('connection', (socket) => {
    if (socket.handshake.headers.referer.includes('gui.html')) return;
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
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Open the GUI in the default browser
    opn(`http://localhost:${PORT}/gui.html`);
});
