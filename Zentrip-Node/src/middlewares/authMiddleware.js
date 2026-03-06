
// Intercepta las peticiones antes de que lleguen al controlador. Lee la cabecera Authorization, extrae el token Bearer y le pregunta a Firebase si es válido. Si lo es, añade los datos del usuario a req.user y deja pasar la petición. Si no, devuelve un 401.

const admin = require('../config/firebase');

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado o formato incorrecto' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error al verificar el token de Firebase:', error);
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

module.exports = { verifyFirebaseToken };
