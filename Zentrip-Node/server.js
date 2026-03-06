require('dotenv').config();
require('./src/config/firebase');

const express = require('express');
const cors = require('cors');
const userRouters = require('./src/routes/userRouters');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Servidor ZenTrip funcionando.');
});

app.use('/api', userRouters);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
