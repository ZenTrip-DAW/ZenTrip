import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

// ─── Gastos ───────────────────────────────────────────────────────────────────

export function subscribeToExpenses(tripId, onData, onErr) {
  const q = query(
    collection(db, 'trips', tripId, 'expenses'),
    orderBy('date', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => { console.error('[budgetService] expenses', err); onErr?.(err); },
  );
}

export async function addExpense(tripId, data) {
  const ref = await addDoc(collection(db, 'trips', tripId, 'expenses'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateExpense(tripId, expenseId, data) {
  const { createdAt, id, ...rest } = data;
  await updateDoc(doc(db, 'trips', tripId, 'expenses', expenseId), {
    ...rest,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteExpense(tripId, expenseId) {
  await deleteDoc(doc(db, 'trips', tripId, 'expenses', expenseId));
}

// ─── Presupuesto personal (un documento por usuario) ─────────────────────────

export function subscribeToMyPersonalBudget(tripId, uid, onData, onErr) {
  if (!uid) { onData(0); return () => {}; }
  return onSnapshot(
    doc(db, 'trips', tripId, 'personalBudgets', uid),
    (snap) => onData(snap.exists() ? (snap.data().budget ?? 0) : 0),
    (err) => { console.error('[budgetService] personalBudget', err); onErr?.(err); },
  );
}

export function subscribeToAllPersonalBudgets(tripId, onData, onErr) {
  return onSnapshot(
    collection(db, 'trips', tripId, 'personalBudgets'),
    (snap) => onData(snap.docs.map((d) => ({ uid: d.id, budget: d.data().budget ?? 0 }))),
    (err) => { console.error('[budgetService] allPersonalBudgets', err); onErr?.(err); },
  );
}

export async function setPersonalBudget(tripId, uid, budget) {
  await setDoc(doc(db, 'trips', tripId, 'personalBudgets', uid), {
    budget: Number(budget),
    updatedAt: serverTimestamp(),
  });
}

// ─── Pagos de liquidación ─────────────────────────────────────────────────────

export function subscribeToPayments(tripId, onData, onErr) {
  return onSnapshot(
    collection(db, 'trips', tripId, 'payments'),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => { console.error('[budgetService] payments', err); onErr?.(err); },
  );
}

export async function addPayment(tripId, data) {
  const ref = await addDoc(collection(db, 'trips', tripId, 'payments'), {
    ...data,
    paidAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deletePayment(tripId, paymentId) {
  await deleteDoc(doc(db, 'trips', tripId, 'payments', paymentId));
}

// ─── Recibos de gastos vinculados a reservas ──────────────────────────────────

export async function updateExpenseReceiptsByBooking(tripId, bookingId, receiptUrls) {
  const snap = await getDocs(
    query(collection(db, 'trips', tripId, 'expenses'), where('linkedBookingId', '==', bookingId))
  );
  await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { receiptUrls })));
}

// ─── Gastos vinculados a actividades manuales ─────────────────────────────────

export async function getExpenseByLinkedActivity(tripId, activityId) {
  const snap = await getDocs(
    query(collection(db, 'trips', tripId, 'expenses'), where('linkedActivityId', '==', activityId))
  );
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function deleteExpensesByLinkedActivity(tripId, activityId) {
  const snap = await getDocs(
    query(collection(db, 'trips', tripId, 'expenses'), where('linkedActivityId', '==', activityId))
  );
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}
