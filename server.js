const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;
app.use(express.static('public'));

let players = {};
let obstacles = [];
let coins = [];

io.on('connection', (socket) => {
  console.log('Player joined:', socket.id);
  
  socket.on('joinGame', (playerName) => {
    if(Object.keys(players).length >= 5) {
      socket.emit('roomFull');
      return;
    }
    
    const playerColors = ['#00d4ff','#ff0066','#00ff88','#9d4edd','#ffd700'];
    const playerLanes = [125, 275, 425, 575, 725];
    const playerIndex = Object.keys(players).length;
    
    players[socket.id] = {
      id: socket.id,
      name: playerName || `Player ${playerIndex + 1}`,
      x: playerLanes[playerIndex],
      lane: playerIndex,
      score: 0,
      color: playerColors[playerIndex],
      speed: 2.5
    };
    
    socket.emit('initGame', players[socket.id]);
    io.emit('updatePlayers', players);
    console.log('Players online:', Object.keys(players).length);
  });
  
  socket.on('movePlayer', (data) => {
    if(players[socket.id]) {
      players[socket.id].lane = data.lane;
      players[socket.id].x = data.x;
      players[socket.id].score = data.score;
      players[socket.id].speed = data.speed;
      socket.broadcast.emit('playerMoved', players[socket.id]);
    }
  });
  
  socket.on('spawnObstacle', (obs) => {
    socket.broadcast.emit('newObstacle', obs);
  });
  
  socket.on('spawnCoin', (coin) => {
    socket.broadcast.emit('newCoin', coin);
  });
  
  socket.on('chatMessage', (msg) => {
    io.emit('newChat', { name: players[socket.id]?.name || 'Player', msg: msg });
  });
  
  socket.on('disconnect', () => {
    console.log('Player left:', socket.id);
    delete players[socket.id];
    io.emit('updatePlayers', players);
  });
});

http.listen(PORT, () => {
  console.log(`🏁 Qubenexus Racing Server running on port ${PORT}`);
});