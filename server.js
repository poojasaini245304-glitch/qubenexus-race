const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static('public'));

let players = {};
let chatMessages = [];

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    socket.on('joinGame', (data) => {
        players[socket.id] = {
            id: socket.id,
            name: data.name,
            x: 0,
            y: 0,
            rotation: 0,
            carType: data.carType || 'f1',
            lap: 0
        };
        io.emit('updatePlayers', players);
        socket.emit('chatHistory', chatMessages);
    });

    socket.on('playerMove', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].rotation = data.rotation;
            players[socket.id].lap = data.lap;
            io.emit('updatePlayers', players);
        }
    });

    socket.on('chatMessage', (data) => {
        chatMessages.push(data);
        if (chatMessages.length > 50) chatMessages.shift();
        io.emit('chatMessage', data);
    });

    socket.on('honk', (name) => {
        io.emit('honk', name);
    });

    // VOICE CHAT
    socket.on('startVoice', (name) => {
        socket.broadcast.emit('startVoice', name);
    });

    socket.on('stopVoice', (name) => {
        socket.broadcast.emit('stopVoice', name);
    });

    socket.on('speaking', (data) => {
        socket.broadcast.emit('speaking', data);
    });

    socket.on('offer', (data) => {
        socket.to(data.to).emit('offer', { from: socket.id, offer: data.offer });
    });

    socket.on('answer', (data) => {
        socket.to(data.to).emit('answer', { from: socket.id, answer: data.answer });
    });

    socket.on('ice-candidate', (data) => {
        socket.to(data.to).emit('ice-candidate', { from: socket.id, candidate: data.candidate });
    });

    socket.on('raceWon', (name) => {
        io.emit('chatMessage', { name: 'SYSTEM', message: 🏆 ${name} WON THE RACE! 🏆 });
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        delete players[socket.id];
        io.emit('updatePlayers', players);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(Server running on port ${PORT});
});
