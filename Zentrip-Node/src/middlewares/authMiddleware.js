
// Intercepta las peticiones antes de que lleguen al controlador. Lee la cabecera Authorization, extrae el token Bearer y le pregunta a Firebase si es válido. Si lo es, añade los datos del usuario a req.user y deja pasar la petición. Si no, devuelve un 401.

const admin = require('../config/firebase');
const { AppError } = require('../errors');

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Token no proporcionado o formato incorrecto', 401, 'UNAUTHORIZED'));
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    return next();
  } catch (error) {
    console.error('Error al verificar el token de Firebase:', error);
    return next(new AppError('Token inválido o expirado', 401, 'UNAUTHORIZED'));
  }
};

module.exports = { verifyFirebaseToken };
