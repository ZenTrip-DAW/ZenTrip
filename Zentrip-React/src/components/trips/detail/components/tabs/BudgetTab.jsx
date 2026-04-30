import { useState, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, Lock, TrendingUp, ChevronDown, ChevronUp,
  ArrowRight, BedDouble, Plane, UtensilsCrossed, Sparkles, Package,
  ShoppingCart, ShoppingBag, Heart, Tag, AlertCircle, Users, Wallet,
  CheckCircle2,
} from 'lucide-react';
import { useBudget, computeSettlement, computeCategoryTotals, getExpenseShare } from '../budget/useBudget';
import { addExpense, updateExpense, deleteExpense, setPersonalBudget, addPayment } from '../../../../../services/budgetService';
import AddExpenseModal, { CATEGORIES } from '../budget/AddExpenseModal';
import { DIVISAS } from '../../../../../utils/divisas';
import ConfirmModal from '../../../../ui/ConfirmModal';

// ─── Metadatos de categorías ──────────────────────────────────────────────────

const CATEGORY_META = {
  alojamiento:  { Icon: BedDouble,       bar: 'bg-secondary-3',        badge: 'bg-secondary-1 text-secondary-5 border-secondary-2'          },
  transporte:   { Icon: Plane,           bar: 'bg-primary-3',          badge: 'bg-primary-1 text-primary-4 border-primary-2'                },
  comida:       { Icon: UtensilsCrossed, bar: 'bg-auxiliary-green-4',  badge: 'bg-auxiliary-green-2 text-auxiliary-green-5 border-auxiliary-green-3' },
  actividades:  { Icon: Sparkles,        bar: 'bg-violet-400',         badge: 'bg-violet-50 text-violet-600 border-violet-200'              },
  supermercado: { Icon: ShoppingCart,    bar: 'bg-emerald-400',        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200'           },
  compras:      { Icon: ShoppingBag,     bar: 'bg-pink-400',           badge: 'bg-pink-50 text-pink-600 border-pink-200'                   },
  salud:        { Icon: Heart,           bar: 'bg-red-400',            badge: 'bg-red-50 text-red-600 border-red-200'                      },
  otros:        { Icon: Package,         bar: 'bg-neutral-3',          badge: 'bg-neutral-1 text-neutral-5 border-neutral-2'               },
  personalizada:{ Icon: Tag,             bar: 'bg-amber-400',          badge: 'bg-amber-50 text-amber-700 border-amber-200'                },
};

function getCatMeta(key) { return CATEGORY_META[key] ?? CATEGORY_META.otros; }
function getCatLabel(exp) {
  if (exp.category === 'personalizada' && exp.categoryLabel) return exp.categoryLabel;
  return CATEGORIES.find((c) => c.key === exp.category)?.label ?? exp.category;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(amount, currency = 'EUR') {
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency', currency: currency || 'EUR',
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(amount ?? 0);
  } catch {
    const sym = DIVISAS.find((d) => d.code === currency)?.symbol ?? currency;
    return `${(amount ?? 0).toFixed(2)} ${sym}`;
  }
}

function fmtDateLabel(dateStr) {
  if (!dateStr) return 'Sin fecha';
  try {
    const d    = new Date(dateStr + 'T00:00:00');
    const now  = new Date(); now.setHours(0, 0, 0, 0);
    const diff = Math.round((now - d) / 86400000);
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Ayer';
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  } catch { return dateStr; }
}

function Avatar({ member, size = 'sm' }) {
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  if (member?.avatar) {
    return <img src={member.avatar} alt={member?.name} className={`${dim} rounded-full object-cover shrink-0`} />;
  }
  const color    = member?.avatarColor ?? '#FE6B01';
  const initials = (member?.name ?? '?').slice(0, 1).toUpperCase();
  return (
    <div className={`${dim} rounded-full flex items-center justify-center font-semibold text-white shrink-0`}
      style={{ backgroundColor: color }}>
      {initials}
    </div>
  );
}

function ProgressBar({ value, max, colorClass = 'bg-primary-3', warn = false }) {
  const pct      = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const barColor = warn ? 'bg-feedback-error' : colorClass;
  return (
    <div className="w-full h-2 bg-neutral-1 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Tarjeta de gasto ─────────────────────────────────────────────────────────

function ExpenseCard({ expense, members, currentUid, tripCurrency, onEdit, onDelete, highlightShare = false }) {
  const [open, setOpen] = useState(false);
  const meta     = getCatMeta(expense.category);
  const { Icon } = meta;
  const payer    = members.find((m) => m.uid === expense.paidBy);
  const myShare  = getExpenseShare(expense, currentUid); // siempre en moneda del viaje
  const splitNames = (expense.splitAmong ?? [])
    .map((uid) => members.find((m) => m.uid === uid)?.name ?? uid)
    .join(', ');
  const tc   = tripCurrency || expense.currency;
  const diff = expense.tripAmount != null && expense.currency !== tc;

  return (
    <div className="bg-white border border-neutral-1 rounded-2xl overflow-hidden">
      <button type="button" onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-1/40 transition-colors">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${meta.badge}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="body-2 font-semibold text-neutral-7 truncate">{expense.description}</p>
          <p className="body-3 text-neutral-4">
            {fmtDateLabel(expense.date)} · Pagó {payer?.name ?? expense.paidByName ?? '?'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {highlightShare && myShare > 0 ? (
            <div className="text-right">
              <p className="body-2 font-semibold text-primary-3">{fmt(myShare, tc)}</p>
              <p className="body-3 text-neutral-4">tu parte</p>
            </div>
          ) : (
            <div className="text-right">
              <p className="body-2 font-semibold text-neutral-7">{fmt(expense.amount, expense.currency)}</p>
              {diff && <p className="body-3 text-neutral-4">≈ {fmt(expense.tripAmount, tc)}</p>}
            </div>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-neutral-4" /> : <ChevronDown className="w-4 h-4 text-neutral-4" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-neutral-1 pt-3 flex flex-col gap-2">
          <DetailRow label="Categoría">
            <span className={`px-2 py-0.5 rounded-full body-3 font-medium border ${meta.badge}`}>
              {getCatLabel(expense)}
            </span>
          </DetailRow>
          {highlightShare && (
            <DetailRow label="Total del gasto">
              <span className="body-3 font-semibold text-neutral-7">
                {fmt(expense.amount, expense.currency)}
                {diff && <span className="ml-1 text-neutral-4 font-normal">(≈ {fmt(expense.tripAmount, tc)})</span>}
              </span>
            </DetailRow>
          )}
          <DetailRow label="Entre">
            <span className="body-3 text-neutral-6 text-right max-w-45">{splitNames || '—'}</span>
          </DetailRow>
          <DetailRow label={`División (${expense.splitAmong?.length ?? 1} personas)`}>
            <span className="body-3 text-neutral-6">
              {expense.splitType === 'equal' && (() => {
                const base = expense.tripAmount ?? expense.amount;
                const cur  = diff ? tc : expense.currency;
                return `${fmt(base / (expense.splitAmong?.length || 1), cur)} c/u`;
              })()}
              {expense.splitType === 'percentage' && 'Por porcentaje'}
              {expense.splitType === 'amounts'    && 'Por importes'}
            </span>
          </DetailRow>
          {currentUid && expense.splitAmong?.includes(currentUid) && (
            <DetailRow label="Tu parte">
              <span className="body-3 font-semibold text-primary-3">
                {fmt(myShare, tc)}
                {diff && myShare > 0 && (
                  <span className="ml-1 body-3 font-normal text-neutral-4">
                    (≈ {fmt(myShare / (expense.exchangeRate ?? 1), expense.currency)})
                  </span>
                )}
              </span>
            </DetailRow>
          )}
          {expense.notes && (
            <DetailRow label="Notas">
              <span className="body-3 text-neutral-5 text-right max-w-45">{expense.notes}</span>
            </DetailRow>
          )}
          <div className="flex gap-2 mt-1">
            <button type="button" onClick={() => onEdit(expense)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-2 body-3 text-neutral-5 hover:bg-neutral-1 transition-colors">
              <Pencil className="w-3.5 h-3.5" />Editar
            </button>
            <button type="button" onClick={() => onDelete(expense)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-feedback-error body-3 text-feedback-error hover:bg-feedback-error-bg transition-colors">
              <Trash2 className="w-3.5 h-3.5" />Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="body-3 text-neutral-4 shrink-0">{label}</span>
      {children}
    </div>
  );
}

// ─── Lista de gastos agrupada por fecha ───────────────────────────────────────

function ExpenseList({ expenses, members, currentUid, tripCurrency, onEdit, onDelete, highlightShare = false, emptyText }) {
  const grouped = useMemo(() => {
    const map = {};
    expenses.forEach((exp) => {
      const k = exp.date ?? '';
      if (!map[k]) map[k] = [];
      map[k].push(exp);
    });
    return Object.entries(map)
      .sort(([a], [b]) => (b > a ? 1 : -1))
      .map(([date, items]) => ({ date, items }));
  }, [expenses]);

  if (grouped.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-neutral-1 flex items-center justify-center">
          <Wallet className="w-6 h-6 text-neutral-3" />
        </div>
        <p className="body-2 text-neutral-4">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {grouped.map(({ date, items }) => (
        <div key={date}>
          <p className="body-3 text-neutral-4 font-semibold uppercase tracking-wide px-1 mb-2">
            {fmtDateLabel(date)}
          </p>
          <div className="flex flex-col gap-2">
            {items.map((exp) => (
              <ExpenseCard
                key={exp.id}
                expense={exp}
                members={members}
                currentUid={currentUid}
                tripCurrency={tripCurrency}
                onEdit={onEdit}
                onDelete={onDelete}
                highlightShare={highlightShare}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Panel de liquidaciones ───────────────────────────────────────────────────

function SettlementPanel({ debts, members, tripId, currency, currentUid, showAll = true }) {
  const [marking,     setMarking]     = useState(null);
  const [confirmDebt, setConfirmDebt] = useState(null);

  const handleMarkPaid = async () => {
    if (!confirmDebt) return;
    const key = `${confirmDebt.from}-${confirmDebt.to}`;
    setMarking(key);
    setConfirmDebt(null);
    try {
      await addPayment(tripId, {
        from:   confirmDebt.from,
        to:     confirmDebt.to,
        amount: confirmDebt.amount,
        date:   new Date().toISOString().split('T')[0],
      });
    } catch (err) {
      console.error('[SettlementPanel] Error al marcar como pagado:', err);
    } finally {
      setMarking(null);
    }
  };

  const visibleDebts = showAll ? debts : debts.filter((d) => d.from === currentUid || d.to === currentUid);

  if (visibleDebts.length === 0) {
    return (
      <div className="flex items-center gap-2 bg-auxiliary-green-1 rounded-xl px-3 py-3">
        <CheckCircle2 className="w-4 h-4 text-auxiliary-green-5 shrink-0" />
        <p className="body-3 text-auxiliary-green-5 font-medium">Todo está al día, no hay pagos pendientes.</p>
      </div>
    );
  }

  return (
    <>
      {confirmDebt && (() => {
        const fromName = members.find((m) => m.uid === confirmDebt.from)?.name ?? '?';
        const toName   = members.find((m) => m.uid === confirmDebt.to)?.name   ?? '?';
        return (
          <ConfirmModal
            title="Confirmar pago"
            message={`¿Confirmas que ${fromName} ha pagado ${fmt(confirmDebt.amount, currency)} a ${toName}? Este pago se eliminará de los pendientes.`}
            confirmLabel="Marcar como pagado"
            cancelLabel="Cancelar"
            onConfirm={handleMarkPaid}
            onCancel={() => setConfirmDebt(null)}
          />
        );
      })()}
      <div className="flex flex-col gap-2">
        {visibleDebts.map((d, i) => {
          const from = members.find((m) => m.uid === d.from);
          const to   = members.find((m) => m.uid === d.to);
          const isMe = d.from === currentUid;
          const key  = `${d.from}-${d.to}`;
          const busy = marking === key;

          return (
            <div key={i} className={`flex items-center gap-2 rounded-xl px-3 py-3 border ${
              isMe ? 'bg-feedback-error-bg border-feedback-error' : 'bg-neutral-1/60 border-neutral-1'
            }`}>
              <div className="flex items-center gap-1.5 flex-1 min-w-0 flex-wrap">
                <Avatar member={from} size="sm" />
                <span className="body-3 font-semibold text-neutral-7 shrink-0">{from?.name ?? '?'}</span>
                <span className="body-3 text-neutral-5 shrink-0">debe pagar a</span>
                <Avatar member={to} size="sm" />
                <span className="body-3 font-semibold text-neutral-7 shrink-0">{to?.name ?? '?'}</span>
              </div>
              <span className={`body-3 font-semibold shrink-0 ${isMe ? 'text-feedback-error' : 'text-neutral-7'}`}>
                {fmt(d.amount, currency)}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmDebt(d)}
                className="ml-1 flex items-center gap-1 px-3 py-1.5 rounded-full body-3 font-medium border border-auxiliary-green-3 text-auxiliary-green-5 hover:bg-auxiliary-green-1 transition-colors disabled:opacity-50 shrink-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {busy ? '...' : 'Marcar como pagado'}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Vista Grupo ──────────────────────────────────────────────────────────────

function GroupView({ trip, members, expenses, payments, currency, currentUid, tripId, onAddExpense, onEditExpense, onDeleteExpense }) {
  const [filterCat, setFilterCat]       = useState('all');
  const [filterMember, setFilterMember] = useState('all');

  const totalBudget = Number(trip?.budget) || 0;
  const totalSpent  = expenses.reduce((s, e) => s + (e.tripAmount ?? e.amount ?? 0), 0);
  const overBudget  = totalBudget > 0 && totalSpent > totalBudget;

  const categoryTotals = useMemo(() => computeCategoryTotals(expenses), [expenses]);
  const { balances, debts } = useMemo(() => computeSettlement(expenses, members, payments), [expenses, members, payments]);

  const maxCat = Math.max(...Object.values(categoryTotals), 1);

  const filtered = useMemo(() => {
    let list = [...expenses];
    if (filterCat    !== 'all') list = list.filter((e) => e.category === filterCat);
    if (filterMember !== 'all') list = list.filter((e) => e.splitAmong?.includes(filterMember) || e.paidBy === filterMember);
    return list;
  }, [expenses, filterCat, filterMember]);

  const activeCategories = CATEGORIES.filter(({ key }) => (categoryTotals[key] ?? 0) > 0);

  return (
    <div className="flex flex-col gap-4">

      {/* Resumen presupuesto */}
      <div className="bg-white border border-neutral-1 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="body-3 text-neutral-4 font-medium uppercase tracking-wide">Presupuesto del grupo</p>
          <TrendingUp className="w-4 h-4 text-neutral-3" />
        </div>
        <p className="title-h2-desktop text-neutral-7">
          {totalBudget > 0 ? fmt(totalBudget, currency) : <span className="body text-neutral-3">Sin definir en el viaje</span>}
        </p>
        {totalBudget > 0 && (
          <>
            <ProgressBar value={totalSpent} max={totalBudget} warn={overBudget} />
            <p className="body-3 text-neutral-4">
              Gastado: <span className={`font-semibold ${overBudget ? 'text-feedback-error' : 'text-neutral-7'}`}>{fmt(totalSpent, currency)}</span>
              {' '}({Math.round((totalSpent / totalBudget) * 100)} %)
              {overBudget && <span className="ml-2 text-feedback-error font-medium">— Presupuesto superado</span>}
            </p>
          </>
        )}
        {totalBudget === 0 && (
          <p className="body-3 text-neutral-4">Total gastado: <span className="font-semibold text-neutral-7">{fmt(totalSpent, currency)}</span></p>
        )}
      </div>

      {/* Botón añadir gasto */}
      <div className="flex justify-end">
        <button type="button" onClick={onAddExpense}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary-3 text-white body-2 font-semibold hover:bg-primary-4 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />Añadir gasto
        </button>
      </div>

      {/* Balance de miembros + Categorías (dos columnas) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* Balance de miembros */}
        <div className="bg-white border border-neutral-1 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="body-3 text-neutral-4 font-medium uppercase tracking-wide">Balance de miembros</p>
              <p className="body-3 text-neutral-3 mt-0.5">Verde: le deben · Rojo: debe dinero</p>
            </div>
            <Users className="w-4 h-4 text-neutral-3" />
          </div>
          {members.length === 0 ? (
            <p className="body-3 text-neutral-4">Sin miembros</p>
          ) : (
            <div className="flex flex-col gap-2">
              {members.map((m) => {
                const bal = balances[m.uid] ?? 0;
                const pos = bal > 0.005;
                const neg = bal < -0.005;
                return (
                  <div key={m.uid} className="flex items-center gap-2">
                    <Avatar member={m} size="sm" />
                    <span className="body-3 text-neutral-6 flex-1 truncate">{m.name}</span>
                    <span className={`body-3 font-semibold ${pos ? 'text-auxiliary-green-5' : neg ? 'text-feedback-error' : 'text-neutral-4'}`}>
                      {pos ? '+' : ''}{fmt(bal, currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gastos por categoría */}
        <div className="bg-white border border-neutral-1 rounded-2xl p-4 flex flex-col gap-3">
          <p className="body-3 text-neutral-4 font-medium uppercase tracking-wide">Gastos por categoría</p>
          {activeCategories.length === 0 ? (
            <p className="body-3 text-neutral-4">Aún no hay gastos registrados.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {activeCategories.map(({ key, label }) => {
                const meta   = getCatMeta(key);
                const { Icon } = meta;
                const amount = categoryTotals[key] ?? 0;
                const pct    = totalSpent > 0 ? ((amount / totalSpent) * 100).toFixed(0) : 0;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${meta.badge}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1">
                        <span className="body-3 text-neutral-6">{label}</span>
                        <span className="body-3 font-semibold text-neutral-7">{fmt(amount, currency)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-1 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${Math.max((amount / maxCat) * 100, 2)}%` }} />
                      </div>
                    </div>
                    <span className="body-3 text-neutral-4 w-8 text-right shrink-0">{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pagos pendientes */}
      <div className="bg-white border border-neutral-1 rounded-2xl p-4 flex flex-col gap-3">
        <div>
          <p className="body-3 text-neutral-4 font-medium uppercase tracking-wide">Pagos pendientes</p>
          <p className="body-3 text-neutral-3 mt-0.5">Cómo saldar las deudas del grupo con el mínimo de transferencias</p>
        </div>
        <SettlementPanel
          debts={debts}
          members={members}
          tripId={tripId}
          currency={currency}
          currentUid={currentUid}
          showAll
        />
      </div>

      {/* Filtros + lista de gastos */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <p className="body-3 text-neutral-4 font-medium uppercase tracking-wide mr-1">Filtrar</p>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
            className="border border-neutral-2 rounded-full px-3 py-1 body-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary-3">
            <option value="all">Todas las categorías</option>
            {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <select value={filterMember} onChange={(e) => setFilterMember(e.target.value)}
            className="border border-neutral-2 rounded-full px-3 py-1 body-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary-3">
            <option value="all">Todos los miembros</option>
            {members.map((m) => <option key={m.uid} value={m.uid}>{m.name}</option>)}
          </select>
          {(filterCat !== 'all' || filterMember !== 'all') && (
            <button type="button" onClick={() => { setFilterCat('all'); setFilterMember('all'); }}
              className="px-3 py-1 rounded-full body-3 text-primary-3 border border-primary-2 hover:bg-primary-1 transition-colors">
              Limpiar filtros
            </button>
          )}
        </div>

        <ExpenseList
          expenses={filtered}
          members={members}
          currentUid={currentUid}
          tripCurrency={currency}
          onEdit={onEditExpense}
          onDelete={onDeleteExpense}
          highlightShare={false}
          emptyText={expenses.length === 0 ? 'Aún no hay gastos registrados.' : 'No hay gastos con esos filtros.'}
        />
      </div>
    </div>
  );
}

// ─── Vista Personal ───────────────────────────────────────────────────────────

function PersonalView({ trip, members, expenses, payments, myPersonalBudget, currency, currentUid, tripId, onAddPersonalExpense, onEditExpense, onDeleteExpense }) {
  const [budgetInput,   setBudgetInput]   = useState('');
  const [budgetSaving,  setBudgetSaving]  = useState(false);
  const [budgetMsg,     setBudgetMsg]     = useState(null);
  const [editingBudget, setEditingBudget] = useState(false);
  const [filterCat,     setFilterCat]     = useState('all');

  const myExpenses = useMemo(
    () => expenses.filter((e) => e.splitAmong?.includes(currentUid)),
    [expenses, currentUid],
  );

  const myTotal = useMemo(
    () => myExpenses.reduce((s, e) => s + getExpenseShare(e, currentUid), 0),
    [myExpenses, currentUid],
  );

  const overPersonal = myPersonalBudget > 0 && myTotal > myPersonalBudget;

  const { debts } = useMemo(() => computeSettlement(expenses, members, payments), [expenses, members, payments]);
  const myDebts   = debts.filter((d) => d.from === currentUid);
  const owedToMe  = debts.filter((d) => d.to   === currentUid);

  const filtered = filterCat === 'all' ? myExpenses : myExpenses.filter((e) => e.category === filterCat);

  const handleSaveBudget = async () => {
    const val = Number(budgetInput);
    if (isNaN(val) || val < 0) {
      setBudgetMsg({ type: 'error', text: 'Introduce un valor válido (0 o mayor).' });
      return;
    }
    setBudgetSaving(true);
    setBudgetMsg(null);
    try {
      await setPersonalBudget(trip.id, currentUid, val);
      setBudgetMsg({ type: 'ok', text: 'Presupuesto guardado.' });
      setEditingBudget(false);
    } catch {
      setBudgetMsg({ type: 'error', text: 'No se pudo guardar. Inténtalo de nuevo.' });
    } finally {
      setBudgetSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">

      {/* Mi presupuesto personal */}
      <div className="bg-white border border-neutral-1 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="body-3 text-neutral-4 font-medium uppercase tracking-wide">Mi presupuesto personal</p>
          <Wallet className="w-4 h-4 text-neutral-3" />
        </div>

        {editingBudget || myPersonalBudget === 0 ? (
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <input type="number" min="0" step="10"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder={myPersonalBudget > 0 ? String(myPersonalBudget) : '0'}
                className="w-full border border-neutral-2 rounded-xl px-3 py-2 pr-12 body-2 focus:outline-none focus:ring-2 focus:ring-primary-3 transition" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 body-3 text-neutral-4 pointer-events-none">{currency}</span>
            </div>
            <button type="button" onClick={handleSaveBudget} disabled={budgetSaving}
              className="px-4 py-2 rounded-xl bg-primary-3 text-white body-3 font-semibold hover:bg-primary-4 transition-colors disabled:opacity-60">
              {budgetSaving ? '...' : 'Guardar'}
            </button>
            {myPersonalBudget > 0 && (
              <button type="button" onClick={() => setEditingBudget(false)}
                className="px-3 py-2 rounded-xl border border-neutral-2 body-3 text-neutral-5 hover:bg-neutral-1 transition-colors">
                Cancelar
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="title-h2-desktop text-neutral-7">{fmt(myPersonalBudget, currency)}</p>
            <button type="button" onClick={() => { setBudgetInput(String(myPersonalBudget)); setEditingBudget(true); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-neutral-2 body-3 text-neutral-5 hover:bg-neutral-1 transition-colors">
              <Pencil className="w-3 h-3" />Editar
            </button>
          </div>
        )}

        {budgetMsg && (
          <p className={`body-3 flex items-center gap-1 ${budgetMsg.type === 'ok' ? 'text-auxiliary-green-5' : 'text-feedback-error'}`}>
            <AlertCircle className="w-3 h-3 shrink-0" />{budgetMsg.text}
          </p>
        )}

        {myPersonalBudget > 0 && (
          <>
            <ProgressBar value={myTotal} max={myPersonalBudget} warn={overPersonal} />
            <p className="body-3 text-neutral-4">
              Tu parte acumulada:{' '}
              <span className={`font-semibold ${overPersonal ? 'text-feedback-error' : 'text-neutral-7'}`}>
                {fmt(myTotal, currency)}
              </span>
              {' '}/ {fmt(myPersonalBudget, currency)}
              {overPersonal && <span className="ml-2 text-feedback-error font-medium">— Presupuesto superado</span>}
            </p>
          </>
        )}
        {myPersonalBudget === 0 && myTotal > 0 && (
          <p className="body-3 text-neutral-4">Tu parte acumulada: <span className="font-semibold text-neutral-7">{fmt(myTotal, currency)}</span></p>
        )}
      </div>

      {/* Mis liquidaciones (privado) */}
      <div className="bg-white border border-neutral-1 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-neutral-3" />
          <div className="flex-1">
            <p className="body-3 text-neutral-4 font-medium uppercase tracking-wide">Mis pagos pendientes</p>
            <p className="body-3 text-neutral-3 mt-0.5">Solo tú puedes ver esto</p>
          </div>
        </div>

        {myDebts.length === 0 && owedToMe.length === 0 ? (
          <div className="flex items-center gap-2 bg-auxiliary-green-1 rounded-xl px-3 py-2">
            <CheckCircle2 className="w-4 h-4 text-auxiliary-green-5 shrink-0" />
            <p className="body-3 text-auxiliary-green-5 font-medium">Estás al día, no debes nada ni te deben.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {myDebts.map((d, i) => {
              const to = members.find((m) => m.uid === d.to);
              return (
                <div key={`d-${i}`} className="flex items-center gap-2 bg-feedback-error-bg border border-feedback-error rounded-xl px-3 py-2.5">
                  <ArrowRight className="w-4 h-4 text-feedback-error shrink-0" />
                  <span className="body-3 text-neutral-7 flex-1">
                    Debes pagar <span className="font-semibold text-feedback-error">{fmt(d.amount, currency)}</span> a <span className="font-semibold">{to?.name ?? '?'}</span>
                  </span>
                  <Avatar member={to} size="sm" />
                </div>
              );
            })}
            {owedToMe.map((d, i) => {
              const from = members.find((m) => m.uid === d.from);
              return (
                <div key={`o-${i}`} className="flex items-center gap-2 bg-auxiliary-green-1 border border-auxiliary-green-3 rounded-xl px-3 py-2.5">
                  <ArrowRight className="w-4 h-4 text-auxiliary-green-5 shrink-0 rotate-180" />
                  <span className="body-3 text-neutral-7 flex-1">
                    <span className="font-semibold">{from?.name ?? '?'}</span> te debe <span className="font-semibold text-auxiliary-green-5">{fmt(d.amount, currency)}</span>
                  </span>
                  <Avatar member={from} size="sm" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Botón añadir mi gasto */}
      <div className="flex justify-end">
        <button type="button" onClick={onAddPersonalExpense}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary-3 text-white body-2 font-semibold hover:bg-primary-4 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />Añadir mi gasto
        </button>
      </div>

      {/* Mis gastos */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <p className="body-3 text-neutral-4 font-medium uppercase tracking-wide flex-1">Mis gastos</p>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
            className="border border-neutral-2 rounded-full px-3 py-1 body-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary-3">
            <option value="all">Todas las categorías</option>
            {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>

        <ExpenseList
          expenses={filtered}
          members={members}
          currentUid={currentUid}
          tripCurrency={currency}
          onEdit={onEditExpense}
          onDelete={onDeleteExpense}
          highlightShare
          emptyText={myExpenses.length === 0 ? 'No participas en ningún gasto todavía.' : 'No hay gastos con esa categoría.'}
        />
      </div>
    </div>
  );
}

// ─── Tab principal ────────────────────────────────────────────────────────────

export default function BudgetTab({ tripId, trip, members = [], currentUser }) {
  const currentUid = currentUser?.uid;
  const { expenses, payments, myPersonalBudget, loading, error } = useBudget(tripId, currentUid);

  const [view,         setView]         = useState('group');
  const [expenseModal, setExpenseModal] = useState(null); // { mode: 'add'|'edit', expense?, personal: bool }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError,  setDeleteError]  = useState(null);

  const currency = trip?.currency || 'EUR';

  const handleSaveExpense = async (data) => {
    if (expenseModal?.mode === 'edit') {
      await updateExpense(tripId, expenseModal.expense.id, data);
    } else {
      await addExpense(tripId, { ...data, createdBy: currentUid });
    }
    setExpenseModal(null);
  };

  const handleConfirmDelete = async () => {
    setDeleteError(null);
    try {
      await deleteExpense(tripId, deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      setDeleteError('No se pudo eliminar el gasto. Inténtalo de nuevo.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-primary-3 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 bg-feedback-error-bg border border-feedback-error rounded-2xl px-4 py-3">
        <AlertCircle className="w-5 h-5 text-feedback-error shrink-0" />
        <p className="body-3 text-feedback-error">No se pudo cargar el presupuesto: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Modales */}
      {expenseModal && (
        <AddExpenseModal
          members={members}
          currentUser={currentUser}
          tripCurrency={currency}
          initialExpense={expenseModal.mode === 'edit' ? expenseModal.expense : null}
          personalMode={expenseModal.personal === true}
          onSave={handleSaveExpense}
          onClose={() => setExpenseModal(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Eliminar gasto"
          message={`¿Seguro que quieres eliminar "${deleteTarget.description}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          cancelLabel="Cancelar"
          confirmVariant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => { setDeleteTarget(null); setDeleteError(null); }}
        />
      )}

      {deleteError && (
        <div className="flex items-center gap-2 bg-feedback-error-bg border border-feedback-error rounded-xl px-3 py-2">
          <AlertCircle className="w-4 h-4 text-feedback-error shrink-0" />
          <p className="body-3 text-feedback-error">{deleteError}</p>
        </div>
      )}

      {/* Toggle Grupo / Personal */}
      <div className="bg-white border border-neutral-1 rounded-2xl flex p-1 gap-1">
        {[
          { key: 'group',    label: 'Grupo',    Icon: Users  },
          { key: 'personal', label: 'Personal', Icon: Wallet },
        ].map(({ key, label, Icon }) => (
          <button key={key} type="button" onClick={() => setView(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl body-3 font-semibold transition-colors ${
              view === key ? 'bg-primary-3 text-white shadow-sm' : 'text-neutral-4 hover:text-neutral-6 hover:bg-neutral-1'
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {view === 'group' ? (
        <GroupView
          trip={trip}
          members={members}
          expenses={expenses}
          payments={payments}
          currency={currency}
          currentUid={currentUid}
          tripId={tripId}
          onAddExpense={() => setExpenseModal({ mode: 'add', personal: false })}
          onEditExpense={(exp) => setExpenseModal({ mode: 'edit', expense: exp, personal: false })}
          onDeleteExpense={setDeleteTarget}
        />
      ) : (
        <PersonalView
          trip={trip}
          members={members}
          expenses={expenses}
          payments={payments}
          myPersonalBudget={myPersonalBudget}
          currency={currency}
          currentUid={currentUid}
          tripId={tripId}
          onAddPersonalExpense={() => setExpenseModal({ mode: 'add', personal: true })}
          onEditExpense={(exp) => setExpenseModal({ mode: 'edit', expense: exp, personal: false })}
          onDeleteExpense={setDeleteTarget}
        />
      )}
    </div>
  );
}
