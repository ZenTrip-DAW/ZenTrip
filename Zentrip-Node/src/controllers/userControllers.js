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

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const searchUsers = async (req, res) => {
  const { query, limit = 8, type = 'username' } = req.query;

  if (!query || query.trim() === '') {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const db = admin.firestore();
    const term = normalizeText(query);

    // Obtener todos los documentos de usuarios
    const snapshot = await db.collection('usuarios').get();
    
    // Filtrar en el cliente (como el Frontend hacía)
    const results = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        const nombreCompleto = `${data?.nombre || ''} ${data?.apellidos || ''}`.trim();

        return {
          id: doc.id,
          uid: data?.uid || doc.id,
          email: data?.email || '',
          username: data?.username || '',
          nombre: nombreCompleto || data?.username || 'Usuario',
          avatar: data?.fotoPerfil || '',
        };
      })
      .filter((item) => {
        const email = normalizeText(item.email);
        const username = normalizeText(item.username);
        const nombre = normalizeText(item.nombre);

        if (type === 'email') {
          // Para búsqueda de invitaciones por email: solo email
          return email.includes(term);
        }

        // Para búsqueda de miembros (default): username + email + nombre
        return username.includes(term) || email.includes(term) || nombre.includes(term);
      })
      .slice(0, parseInt(limit, 10));

    res.json(results);
  } catch (error) {
    console.error('Error en searchUsers:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getProtectedData, createUserAdmin, searchUsers };
