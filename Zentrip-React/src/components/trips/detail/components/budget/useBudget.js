import { useEffect, useState } from 'react';
import {
  subscribeToExpenses,
  subscribeToAllPersonalBudgets,
  subscribeToPayments,
} from '../../../../../services/budgetService';

// ─── Parte de cada persona en un gasto ───────────────────────────────────────

export function getExpenseShare(expense, uid) {
  if (!expense.splitAmong?.includes(uid)) return 0;
  // tripAmount: importe ya convertido a la moneda del viaje (guardado al crear)
  const base = expense.tripAmount ?? expense.amount;
  const rate = expense.exchangeRate ?? 1;
  if (expense.splitType === 'percentage') {
    return ((expense.percentages?.[uid] ?? 0) / 100) * base;
  }
  if (expense.splitType === 'amounts') {
    // customAmounts están en la moneda original del gasto → convertir
    return (expense.customAmounts?.[uid] ?? 0) * rate;
  }
  const n = expense.splitAmong.length || 1;
  const each = Math.floor((base / n) * 100) / 100;
  const remainder = Math.round((base - each * n) * 100);
  if (remainder === 0) return each;
  const seed = expense.id
    ? [...expense.id].reduce((s, c) => s + c.charCodeAt(0), 0)
    : 0;
  const extraIdx = seed % n;
  return expense.splitAmong[extraIdx] === uid ? each + remainder / 100 : each;
}

// ─── Algoritmo de liquidación (greedy, estilo Tricount) ───────────────────────
// Devuelve { balances: {uid: number}, debts: [{from, to, amount}] }
// balance > 0 → otros te deben · balance < 0 → tú debes

export function computeSettlement(expenses, members, payments = []) {
  const balances = {};
  members.forEach((m) => { balances[m.uid] = 0; });

  for (const exp of expenses) {
    if (!exp.amount || !exp.paidBy || !exp.splitAmong?.length) continue;
    const credit = exp.tripAmount ?? exp.amount; // siempre en moneda del viaje
    balances[exp.paidBy] = (balances[exp.paidBy] ?? 0) + credit;
    for (const uid of exp.splitAmong) {
      balances[uid] = (balances[uid] ?? 0) - getExpenseShare(exp, uid);
    }
  }

  // Los pagos ya realizados reducen las deudas
  for (const pay of payments) {
    if (!pay.amount || !pay.from || !pay.to) continue;
    balances[pay.from] = (balances[pay.from] ?? 0) + pay.amount;
    balances[pay.to]   = (balances[pay.to]   ?? 0) - pay.amount;
  }

  for (const uid of Object.keys(balances)) {
    balances[uid] = Math.round(balances[uid] * 100) / 100;
  }

  const creditors = Object.entries(balances)
    .filter(([, b]) => b > 0.005)
    .map(([uid, balance]) => ({ uid, balance }))
    .sort((a, b) => b.balance - a.balance);

  const debtors = Object.entries(balances)
    .filter(([, b]) => b < -0.005)
    .map(([uid, balance]) => ({ uid, balance: -balance }))
    .sort((a, b) => b.balance - a.balance);

  const debts = [];
  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const cred = creditors[ci];
    const debt = debtors[di];
    const amt = Math.min(cred.balance, debt.balance);
    debts.push({ from: debt.uid, to: cred.uid, amount: Math.round(amt * 100) / 100 });
    cred.balance -= amt;
    debt.balance -= amt;
    if (cred.balance < 0.005) ci += 1;
    if (debt.balance < 0.005) di += 1;
  }

  return { balances, debts };
}

// ─── Totales por categoría ────────────────────────────────────────────────────

export function computeCategoryTotals(expenses) {
  const totals = {
    alojamiento: 0, transporte: 0, comida: 0, actividades: 0,
    supermercado: 0, compras: 0, salud: 0, otros: 0, personalizada: 0,
  };
  for (const exp of expenses) {
    const cat = exp.category ?? 'otros';
    totals[cat] = (totals[cat] ?? 0) + (exp.tripAmount ?? exp.amount ?? 0);
  }
  return totals;
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useBudget(tripId, uid) {
  const [expenses,           setExpenses]           = useState([]);
  const [payments,           setPayments]           = useState([]);
  const [allPersonalBudgets, setAllPersonalBudgets] = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState(null);

  useEffect(() => {
    if (!tripId) return;
    setLoading(true);
    setError(null);

    const unsub1 = subscribeToExpenses(
      tripId,
      (data) => { setExpenses(data); setLoading(false); },
      (err) => { setError(err.message); setLoading(false); },
    );
    const unsub2 = subscribeToAllPersonalBudgets(
      tripId,
      (data) => setAllPersonalBudgets(data),
      (err) => console.error('[useBudget] allPersonalBudgets:', err),
    );
    const unsub3 = subscribeToPayments(
      tripId,
      (data) => setPayments(data),
      (err) => console.error('[useBudget] payments:', err),
    );

    return () => { unsub1(); unsub2(); unsub3(); };
  }, [tripId, uid]);

  const myPersonalBudget = allPersonalBudgets.find((b) => b.uid === uid)?.budget ?? 0;

  return { expenses, payments, myPersonalBudget, allPersonalBudgets, loading, error };
}
