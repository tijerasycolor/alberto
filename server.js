const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const cors = require('cors'); // Importar el paquete CORS

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configurar CORS para permitir conexiones desde cualquier origen
app.use(cors());

const dataFile = path.join(__dirname, 'data.json');

function saveData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data));
}

function loadData() {
  if (fs.existsSync(dataFile)) {
    return JSON.parse(fs.readFileSync(dataFile));
  }
  return { peluqueros: [], manicure: [] };
}

let workersData = loadData();

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('Un cliente se ha conectado');
  socket.emit('updateList', workersData);

  socket.on('addWorker', (data) => {
    if (!workersData[data.category]) {
      workersData[data.category] = [];
    }
    workersData[data.category].push(data.worker);
    saveData(workersData);
    io.emit('updateList', workersData);
  });

  socket.on('removeWorker', (data) => {
    if (workersData[data.category]) {
      workersData[data.category] = workersData[data.category].filter(worker => worker !== data.worker);
      saveData(workersData);
      io.emit('updateList', workersData);
    }
  });

  socket.on('moveToLast', (data) => {
    if (workersData[data.category]) {
      workersData[data.category] = workersData[data.category].filter(worker => worker !== data.worker);
      workersData[data.category].push(data.worker);
      saveData(workersData);
      io.emit('updateList', workersData);
    }
  });

  socket.on('disconnect', () => {
    console.log('Un cliente se ha desconectado');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
