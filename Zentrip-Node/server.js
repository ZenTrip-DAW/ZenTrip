require('dotenv').config();
require('./src/config/firebase');

const express = require('express');
const cors = require('cors');
const userRouters = require('./src/routes/userRouters');
const authRouters = require('./src/routes/authRouters');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CORS_ORIGIN
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Servidor ZenTrip funcionando.');
});

app.use('/api', userRouters);
app.use('/api/auth', authRouters);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
