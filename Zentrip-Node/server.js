require('dotenv').config(); // Para cargar variables de entorno
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000; //queda por configurar

// Inicializa Firebase Admin SDK
// Reemplaza con la ruta a tu archivo JSON de credenciales de cuenta de servicio
// ¡O usa variables de entorno para las credenciales!
const serviceAccount = require('./path/to/your/serviceAccountKey.json'); 
// firebase, inicia la app, con estas credeciales sacadas de la ruta de arriba que son las claves de firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Middleware
app.use(cors({ origin: 'http://localhost:3000' })); // Ajusta el origen de tu frontend
app.use(express.json());

// Middleware para verificar el token de ID de Firebase
const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // si hay bearer ess que no esta autorizado, no hay login
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send('No autorizado: Token no proporcionado o formato incorrecto.');
  }

// solo coge el token, lo divide en dos , se quita el bearer 

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // Agrega el usuario decodificado al objeto de solicitud
    next(); // Continúa con la siguiente función de middleware o ruta
  } catch (error) {
    console.error('Error al verificar el token de Firebase:', error);
    res.status(401).send('No autorizado: Token inválido o expirado.');
  }
};

// Ruta pública (no protegida)
app.get('/', (req, res) => {
  res.send('Servidor Express funcionando. Prueba a registrar un usuario.');
});

// Ruta protegida (requiere autenticación)
app.get('/api/protected-data', verifyFirebaseToken, (req, res) => {
  // Si llegamos aquí, el token fue verificado y req.user contiene la información del usuario
  res.json({
    message: '¡Acceso concedido a datos protegidos!',
    userEmail: req.user.email,
    userId: req.user.uid
  });
});

// Ejemplo de ruta para crear un usuario (aunque esto se hace principalmente en el frontend)
// Podrías usar esto para la administración de usuarios por un admin, no para el registro de usuarios final.
app.post('/api/create-user-admin', async (req, res) => {
    const { email, password } = req.body;
    try {
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
        });
        res.status(201).json({ message: 'Usuario creado exitosamente (admin)', uid: userRecord.uid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
