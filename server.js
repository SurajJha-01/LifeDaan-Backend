const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.set('socketio', io);

io.on('connection', (socket) => {
  console.log('🟢 Naya Live Connection Juda: ', socket.id);

  socket.on('disconnect', () => {
    console.log('🔴 Connection Toot Gaya: ', socket.id);
  });
});

// Middlewares
app.use(cors()); 
app.use(express.json()); 

// MongoDB Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🔥 MongoDB Successfully Connected!'))
  .catch((err) => console.log('❌ MongoDB Connection Error: ', err));

// Default Test Route
app.get('/', (req, res) => {
  res.send('LifeDaan Backend is Running...');
});

// 🚀 ----- API ROUTES ----- 🚀
// 1. Authentication (Login/Register)
const authRoutes = require('./routes/authRoutes'); 
app.use('/api/auth', authRoutes);

// 2. Inventory Management
const inventoryRoutes = require('./routes/InventoryRoutes');
app.use('/api/inventory', inventoryRoutes);

// 3. Urgent Blood Requests
const requestRoutes = require('./routes/requestRoutes');
app.use('/api/requests', requestRoutes);

// 4. Hospitals List
const hospitalRoutes = require('./routes/hospitalRoutes');
app.use('/api/hospitals', hospitalRoutes);

// 5. Donation Camps
const campRoutes = require('./routes/campRoutes'); 
app.use('/api/camps', campRoutes);


// 🟢 Server Start
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});