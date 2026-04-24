import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '../config/firebaseConfig';

const USER_COLLECTION = 'users';

async function getUserDoc(uid) {
  const ref = doc(db, USER_COLLECTION, uid);
  const snap = await getDoc(ref);
  return snap.exists() ? { ref, data: snap.data() } : null;
}

export async function getUserProfile(uid) {
  const existing = await getUserDoc(uid);
  return existing ? existing.data : null;
}

export async function saveUserProfile(user, form) {
  const payload = {
    email: user.email,
    uid: user.uid,
    username: form.username || '',
    bio: form.bio || '',
    avatarColor: form.avatarColor || '',
    tripGroupType: form.tripGroupType || 'both',
    petFriendly: Boolean(form.petFriendly),
    firstName: form.firstName || '',
    lastName: form.lastName || '',
    phone: form.phone || '',
    country: form.country || '',
    language: form.language || 'Español',
    currency: form.currency || 'EUR €',
    profilePhoto: form.profilePhoto || '',
    isProfileComplete: true,
  };

  await setDoc(doc(db, USER_COLLECTION, user.uid), payload, { merge: true });

  await updateProfile(user, {
    displayName: `${payload.firstName} ${payload.lastName}`.trim(),
    photoURL: payload.profilePhoto?.startsWith('http') ? payload.profilePhoto : null,
  });
}
