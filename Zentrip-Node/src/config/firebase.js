
//Inicializa Firebase Admin SDK con las credenciales del serviceAccountKey.json. Se ejecuta una sola vez al arrancar el servidor y exporta el objeto admin para que otros archivos puedan usarlo.

const admin = require('firebase-admin');

const serviceAccount = require('../../path/to/your/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
