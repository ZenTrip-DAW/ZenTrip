const admin = require('../config/firebase');

const getProtectedData = (req, res) => {
  res.json({
    message: '¡Acceso concedido!',
    userEmail: req.user.email,
    userId: req.user.uid
  });
};

const createUserAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRecord = await admin.auth().createUser({ email, password });
    res.status(201).json({ message: 'Usuario creado exitosamente', uid: userRecord.uid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getProtectedData, createUserAdmin };
