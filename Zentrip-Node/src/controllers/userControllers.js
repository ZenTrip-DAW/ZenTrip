const admin = require('../config/firebase');
const { AppError } = require('../errors');
const USER_COLLECTIONS = ['users'];

const getProtectedData = (req, res) => {
  res.json({
    message: '¡Acceso concedido!',
    userEmail: req.user.email,
    userId: req.user.uid
  });
};

const createUserAdmin = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const userRecord = await admin.auth().createUser({ email, password });
    res.status(201).json({ message: 'Usuario creado exitosamente', uid: userRecord.uid });
  } catch (error) {
    return next(error);
  }
};

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function buildUserResponse(uid, data) {
  const firstName = data?.firstName || data?.nombre || '';
  const lastName = data?.lastName || data?.apellidos || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return {
    id: uid,
    uid: data?.uid || uid,
    email: data?.email || '',
    username: data?.username || '',
    name: fullName || '',
    nombre: fullName || '',
    avatar: data?.avatar || data?.profilePhoto || '',
  };
}

function matchesEmailQuery(email, term) {
  if (term.includes('@')) {
    const [localTerm, domainTerm = ''] = term.split('@');
    const [localEmail, domainEmail = ''] = email.split('@');
    return localEmail.includes(localTerm) && domainEmail.includes(domainTerm);
  }
  return email.includes(term);
}

const searchUsers = async (req, res, next) => {
  const { query, limit = 8, type = 'username' } = req.query;

  if (!query || query.trim() === '') {
    return next(new AppError('Query parameter is required', 400, 'VALIDATION_ERROR'));
  }

  try {
    const db = admin.firestore();
    const term = normalizeText(query);

    const snapshots = await Promise.all(
      USER_COLLECTIONS.map((collectionName) => db.collection(collectionName).get())
    );
    const docsByUid = new Map();

    snapshots.forEach((snapshot) => {
      snapshot.docs.forEach((doc) => {
        if (!docsByUid.has(doc.id)) {
          docsByUid.set(doc.id, doc);
        }
      });
    });
    const allDocs = Array.from(docsByUid.values());
    
    // Filtrar en el cliente (como el Frontend hacía)
    const results = allDocs
      .map((doc) => buildUserResponse(doc.id, doc.data()))
      .filter((item) => {
        const email = normalizeText(item.email);
        const username = normalizeText(item.username);
        const name = normalizeText(item.name || item.nombre);

        if (type === 'email') return matchesEmailQuery(email, term);

        return username.includes(term) || matchesEmailQuery(email, term) || name.includes(term);
      })
      .slice(0, parseInt(limit, 10));

    res.json(results);
  } catch (error) {
    console.error('Error en searchUsers:', error);
    return next(error);
  }
};

const getUserByUid = async (req, res, next) => {
  const { uid } = req.params;
  if (!uid) return next(new AppError('uid is required', 400, 'VALIDATION_ERROR'));

  try {
    const db = admin.firestore();
    let userData = null;

    for (const collectionName of USER_COLLECTIONS) {
      const snap = await db.collection(collectionName).doc(uid).get();
      if (snap.exists) {
        userData = snap.data();
        break;
      }
    }

    if (!userData) return res.json(null);

    res.json(buildUserResponse(uid, userData));
  } catch (error) {
    return next(error);
  }
};

module.exports = { getProtectedData, createUserAdmin, searchUsers, getUserByUid };
