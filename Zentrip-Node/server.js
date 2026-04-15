require('dotenv').config();
require('./src/config/firebase');

const express = require('express');
const cors = require('cors');
const path = require('path');
const userRouters = require('./src/routes/userRouters');
const authRouters = require('./src/routes/authRouters');
const invitationRouters = require('./src/routes/invitationRouters');
const hotelRouters = require('./src/routes/hotelRouters');
const flightRouters = require('./src/routes/flightRouters');
const tripRouters = require('./src/routes/tripRouters');
const errorHandler = require('./src/middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === 'null' || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origen no permitido por CORS: ${origin}`));
  }
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Servidor ZenTrip funcionando.');
});

app.get('/test-hotels', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-hotels.html'));
});

app.get('/test-hotels.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-hotels.html'));
});

app.use('/api', userRouters);
app.use('/api/auth', authRouters);
app.use('/api/invitations', invitationRouters);
app.use('/api/hotels', hotelRouters);
app.use('/api/flights', flightRouters);
app.use('/api/trips', tripRouters);
app.use('/api/flights', flightRouters);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
