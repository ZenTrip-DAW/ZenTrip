import { useState, useEffect } from 'react';
import {
  X, AlertCircle, Info, BedDouble, Plane, UtensilsCrossed,
  Sparkles, Package, ShoppingCart, ShoppingBag, Heart, Tag, RefreshCw,
} from 'lucide-react';
import { DIVISAS } from '../../../../../utils/divisas';
import { fetchExchangeRate } from '../../../../../utils/exchangeRate';

export const CATEGORIES = [
  { key: 'alojamiento',  label: 'Alojamiento',  Icon: BedDouble       },
  { key: 'transporte',   label: 'Transporte',   Icon: Plane           },
  { key: 'comida',       label: 'Comida',       Icon: UtensilsCrossed },
  { key: 'actividades',  label: 'Actividades',  Icon: Sparkles        },
  { key: 'supermercado', label: 'Supermercado', Icon: ShoppingCart    },
  { key: 'compras',      label: 'Compras',      Icon: ShoppingBag     },
  { key: 'salud',        label: 'Salud',        Icon: Heart           },
  { key: 'otros',        label: 'Otros',        Icon: Package         },
  { key: 'personalizada',label: 'Personalizada',Icon: Tag             },
];


function buildEqualPct(uids) {
  if (!uids.length) return {};
  const base = Math.floor(100 / uids.length);
  const rem  = 100 - base * uids.length;
  return Object.fromEntries(uids.map((u, i) => [u, i === 0 ? base + rem : base]));
}

function buildEqualAmounts(uids, total) {
  if (!uids.length) return {};
  const each  = Math.floor((total / uids.length) * 100) / 100;
  const first = Math.round((total - each * (uids.length - 1)) * 100) / 100;
  return Object.fromEntries(uids.map((u, i) => [u, i === 0 ? first : each]));
}

export default function AddExpenseModal({
  members = [],
  currentUser,
  tripCurrency = 'EUR',
  initialExpense = null,
  personalMode = false,
  onSave,
  onClose,
}) {
  const today   = new Date().toISOString().split('T')[0];
  const allUids = members.map((m) => m.uid);
  const selfUid = currentUser?.uid;
  const defSplit = personalMode ? (selfUid ? [selfUid] : []) : allUids;

  const [form, setForm] = useState(() => ({
    description:   '',
    amount:        '',
    currency:      tripCurrency,
    category:      'otros',
    categoryLabel: '',
    date:          today,
    paidBy:        selfUid ?? '',
    splitAmong:    defSplit,
    splitType:     'equal',
    percentages:   buildEqualPct(defSplit),
    customAmounts: Object.fromEntries(defSplit.map((u) => [u, 0])),
    notes:         '',
  }));

  const [errors, setErrors]         = useState({});
  const [submitting, setSubmitting] = useState(false);
  // tipo de cambio: null | { loading } | { rate } | { error }
  const [rateInfo, setRateInfo]     = useState(null);
  const [manualRate, setManualRate] = useState('');

  useEffect(() => {
    setManualRate('');
    if (form.currency === tripCurrency) { setRateInfo(null); return; }
    let cancelled = false;
    setRateInfo({ loading: true });
    fetchExchangeRate(form.currency, tripCurrency)
      .then((rate) => { if (!cancelled) setRateInfo({ rate }); })
      .catch(() => { if (!cancelled) setRateInfo({ error: true }); });
    return () => { cancelled = true; };
  }, [form.currency, tripCurrency]);

  useEffect(() => {
    if (!initialExpense) return;
    const sa = initialExpense.splitAmong ?? defSplit;
    setForm({
      description:   initialExpense.description   ?? '',
      amount:        String(initialExpense.amount ?? ''),
      currency:      initialExpense.currency      ?? tripCurrency,
      category:      initialExpense.category      ?? 'otros',
      categoryLabel: initialExpense.categoryLabel ?? '',
      date:          initialExpense.date          ?? today,
      paidBy:        initialExpense.paidBy        ?? selfUid ?? '',
      splitAmong:    sa,
      splitType:     initialExpense.splitType     ?? 'equal',
      percentages:   initialExpense.percentages   ?? buildEqualPct(sa),
      customAmounts: initialExpense.customAmounts ?? buildEqualAmounts(sa, Number(initialExpense.amount ?? 0)),
      notes:         initialExpense.notes         ?? '',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const toggleMember = (uid) => {
    setForm((prev) => {
      const next = prev.splitAmong.includes(uid)
        ? prev.splitAmong.filter((u) => u !== uid)
        : [...prev.splitAmong, uid];
      return {
        ...prev,
        splitAmong:    next,
        percentages:   buildEqualPct(next),
        customAmounts: buildEqualAmounts(next, Number(prev.amount) || 0),
      };
    });
  };

  const expAmt      = Number(form.amount) || 0;
  const totalPct    = form.splitAmong.reduce((s, u) => s + (form.percentages[u]   ?? 0), 0);
  const totalCustom = form.splitAmong.reduce((s, u) => s + (form.customAmounts[u] ?? 0), 0);
  const currSymbol  = DIVISAS.find((d) => d.code === form.currency)?.symbol ?? form.currency;

  const validate = () => {
    const e = {};
    if (!form.description.trim())
      e.description = 'La descripción es obligatoria.';
    if (!form.amount || isNaN(expAmt) || expAmt <= 0)
      e.amount = 'Introduce un importe válido mayor que 0.';
    if (!personalMode && !form.paidBy)
      e.paidBy = 'Indica quién pagó.';
    if (!personalMode && form.splitAmong.length === 0)
      e.splitAmong = 'Selecciona al menos una persona.';
    if (form.splitType === 'percentage' && Math.abs(totalPct - 100) > 0.5)
      e.percentages = `Los porcentajes deben sumar 100 % (ahora suman ${totalPct} %).`;
    if (form.splitType === 'amounts' && Math.abs(totalCustom - expAmt) > 0.01)
      e.customAmounts = `Los importes deben sumar ${expAmt.toFixed(2)} ${currSymbol} (ahora suman ${totalCustom.toFixed(2)}).`;
    if (form.category === 'personalizada' && !form.categoryLabel.trim())
      e.categoryLabel = 'Escribe un nombre para la categoría.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      // Conversión a moneda del viaje
      let exchangeRate = 1;
      let tripAmount   = expAmt;
      if (form.currency !== tripCurrency) {
        try {
          exchangeRate = rateInfo?.rate ?? await fetchExchangeRate(form.currency, tripCurrency);
        } catch {
          const manual = parseFloat(manualRate);
          if (!isNaN(manual) && manual > 0) {
            exchangeRate = manual;
          } else {
            setErrors({ submit: 'No se pudo obtener el tipo de cambio. Introdúcelo manualmente.' });
            setSubmitting(false);
            return;
          }
        }
        tripAmount = Math.round(expAmt * exchangeRate * 100) / 100;
      }

      const splitAmong = personalMode ? [selfUid].filter(Boolean) : form.splitAmong;
      await onSave({
        description:   form.description.trim(),
        amount:        expAmt,
        currency:      form.currency,
        tripAmount,
        tripCurrency,
        exchangeRate,
        category:      form.category,
        categoryLabel: form.category === 'personalizada' ? form.categoryLabel.trim() : null,
        date:          form.date,
        paidBy:        personalMode ? selfUid : form.paidBy,
        paidByName:    members.find((m) => m.uid === (personalMode ? selfUid : form.paidBy))?.name ?? '',
        splitAmong,
        splitType:     personalMode ? 'equal' : form.splitType,
        percentages:   (!personalMode && form.splitType === 'percentage') ? { ...form.percentages }   : null,
        customAmounts: (!personalMode && form.splitType === 'amounts')    ? { ...form.customAmounts } : null,
        notes:         form.notes.trim() || null,
        isPersonal:    personalMode,
      });
    } catch (err) {
      setErrors({ submit: err?.message ?? 'Error al guardar el gasto.' });
      setSubmitting(false);
    }
  };

  const memberName = (uid) => members.find((m) => m.uid === uid)?.name ?? uid;

  const fi  = 'w-full border rounded-xl px-3 py-2 body-2 focus:outline-none focus:ring-2 focus:ring-primary-3 transition';
  const ok  = 'border-neutral-2';
  const bad = 'border-feedback-error bg-feedback-error-bg';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-xl">

        {/* Cabecera */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 py-4 border-b border-neutral-1 rounded-t-2xl">
          <h2 className="title-h3-desktop text-neutral-7">
            {initialExpense ? 'Editar gasto' : personalMode ? 'Añadir mi gasto' : 'Añadir gasto del grupo'}
          </h2>
          <button type="button" onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-1 transition-colors">
            <X className="w-5 h-5 text-neutral-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">

          {/* Descripción */}
          <div>
            <label className="block body-2-semibold text-neutral-6 mb-1.5">
              Descripción <span className="text-feedback-error">*</span>
            </label>
            <input
              type="text" maxLength={120}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Ej: Cena en restaurante"
              className={`${fi} ${errors.description ? bad : ok}`}
            />
            {errors.description && <FieldError msg={errors.description} />}
          </div>

          {/* Importe + Moneda */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block body-2-semibold text-neutral-6 mb-1.5">
                Importe <span className="text-feedback-error">*</span>
              </label>
              <div className="relative">
                <input
                  type="number" min="0.01" step="0.01"
                  value={form.amount}
                  onChange={(e) => set('amount', e.target.value)}
                  placeholder="0.00"
                  className={`${fi} pr-10 ${errors.amount ? bad : ok}`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 body-3 text-neutral-4 pointer-events-none">
                  {currSymbol}
                </span>
              </div>
              {errors.amount && <FieldError msg={errors.amount} />}
            </div>

            <div>
              <label className="block body-2-semibold text-neutral-6 mb-1.5">Moneda</label>
              <select
                value={form.currency}
                onChange={(e) => set('currency', e.target.value)}
                className={`${fi} ${ok} bg-white`}
              >
                {DIVISAS.map((d) => (
                  <option key={d.code} value={d.code}>{d.code} ({d.symbol})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview tipo de cambio */}
          {form.currency !== tripCurrency && (
            <div className="bg-secondary-1 border border-secondary-2 rounded-xl px-3 py-2 flex flex-col gap-2">
              {rateInfo?.loading && (
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-secondary-4 shrink-0" />
                  <p className="body-3 text-secondary-5">Obteniendo tipo de cambio...</p>
                </div>
              )}
              {rateInfo?.rate && (
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-secondary-4 shrink-0" />
                  <p className="body-3 text-secondary-5">
                    {expAmt > 0
                      ? <>Se registrará como <span className="font-semibold">≈ {(expAmt * rateInfo.rate).toFixed(2)} {tripCurrency}</span> (al cambio de hoy)</>
                      : <>1 {form.currency} = {rateInfo.rate.toFixed(4)} {tripCurrency}</>
                    }
                  </p>
                </div>
              )}
              {rateInfo?.error && (
                <div className="flex flex-col gap-2">
                  <p className="body-3 text-feedback-error">No se pudo obtener el tipo de cambio automáticamente. Introdúcelo tú:</p>
                  <div className="flex items-center gap-2">
                    <span className="body-3 text-neutral-6 shrink-0">1 {form.currency} =</span>
                    <input
                      type="number" min="0.000001" step="any"
                      value={manualRate}
                      onChange={(e) => setManualRate(e.target.value)}
                      placeholder="0.00000"
                      className="flex-1 border border-neutral-2 rounded-lg px-2 py-1 body-3 focus:outline-none focus:ring-2 focus:ring-primary-3 bg-white"
                    />
                    <span className="body-3 text-neutral-6 shrink-0">{tripCurrency}</span>
                  </div>
                  {expAmt > 0 && parseFloat(manualRate) > 0 && (
                    <p className="body-3 text-secondary-5">
                      ≈ <span className="font-semibold">{(expAmt * parseFloat(manualRate)).toFixed(2)} {tripCurrency}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Categoría */}
          <div>
            <label className="block body-2-semibold text-neutral-6 mb-1.5">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(({ key, label, Icon }) => (
                <button
                  key={key} type="button"
                  onClick={() => set('category', key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full body-3 font-medium border transition-colors ${
                    form.category === key
                      ? 'bg-primary-3 text-white border-primary-3'
                      : 'bg-white text-neutral-5 border-neutral-2 hover:bg-neutral-1'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
            {form.category === 'personalizada' && (
              <div className="mt-2">
                <input
                  type="text" maxLength={40}
                  value={form.categoryLabel}
                  onChange={(e) => set('categoryLabel', e.target.value)}
                  placeholder="Nombre de tu categoría..."
                  className={`${fi} ${errors.categoryLabel ? bad : ok}`}
                />
                {errors.categoryLabel && <FieldError msg={errors.categoryLabel} />}
              </div>
            )}
          </div>

          {/* Fecha + Pagó (no en modo personal) */}
          <div className={`grid gap-3 ${personalMode ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div>
              <label className="block body-2-semibold text-neutral-6 mb-1.5">Fecha</label>
              <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)}
                className={`${fi} ${ok}`} />
            </div>
            {!personalMode && (
              <div>
                <label className="block body-2-semibold text-neutral-6 mb-1.5">
                  Pagó <span className="text-feedback-error">*</span>
                </label>
                <select
                  value={form.paidBy}
                  onChange={(e) => set('paidBy', e.target.value)}
                  className={`${fi} bg-white ${errors.paidBy ? bad : ok}`}
                >
                  <option value="">Seleccionar...</option>
                  {members.map((m) => <option key={m.uid} value={m.uid}>{m.name}</option>)}
                </select>
                {errors.paidBy && <FieldError msg={errors.paidBy} />}
              </div>
            )}
          </div>

          {/* División — solo en modo grupo */}
          {!personalMode && (
            <>
              {/* Dividir entre */}
              <div>
                <label className="block body-2-semibold text-neutral-6 mb-1.5">
                  Dividir entre <span className="text-feedback-error">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {members.map((m) => {
                    const sel = form.splitAmong.includes(m.uid);
                    return (
                      <button key={m.uid} type="button" onClick={() => toggleMember(m.uid)}
                        className={`px-3 py-1.5 rounded-full body-3 font-medium border transition-colors ${
                          sel ? 'bg-primary-3 text-white border-primary-3' : 'bg-white text-neutral-5 border-neutral-2 hover:bg-neutral-1'
                        }`}>
                        {m.name}
                      </button>
                    );
                  })}
                </div>
                {errors.splitAmong && <FieldError msg={errors.splitAmong} />}
              </div>

              {/* Tipo de división */}
              {form.splitAmong.length >= 1 && (
                <div>
                  <label className="block body-2-semibold text-neutral-6 mb-1.5">Tipo de división</label>
                  <div className="flex gap-2">
                    {[
                      { key: 'equal',      label: 'Partes iguales' },
                      { key: 'percentage', label: 'Por porcentaje' },
                      { key: 'amounts',    label: 'Por importes'   },
                    ].map((opt) => (
                      <button key={opt.key} type="button"
                        onClick={() => {
                          set('splitType', opt.key);
                          if (opt.key === 'percentage') set('percentages',   buildEqualPct(form.splitAmong));
                          if (opt.key === 'amounts')    set('customAmounts', buildEqualAmounts(form.splitAmong, expAmt));
                        }}
                        className={`flex-1 py-1.5 rounded-xl body-3 font-medium border transition-colors ${
                          form.splitType === opt.key
                            ? 'bg-primary-1 border-primary-3 text-primary-4'
                            : 'bg-white border-neutral-2 text-neutral-5 hover:bg-neutral-1'
                        }`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview partes iguales */}
              {form.splitType === 'equal' && expAmt > 0 && form.splitAmong.length > 0 && (
                <div className="flex items-center gap-2 bg-secondary-1 rounded-xl px-3 py-2">
                  <Info className="w-4 h-4 text-secondary-4 shrink-0" />
                  <p className="body-3 text-secondary-5">
                    Cada persona paga: <span className="font-semibold">{(expAmt / form.splitAmong.length).toFixed(2)} {currSymbol}</span>
                  </p>
                </div>
              )}

              {/* Porcentajes */}
              {form.splitType === 'percentage' && form.splitAmong.length > 0 && (
                <div>
                  <label className="block body-2-semibold text-neutral-6 mb-1.5">
                    Porcentajes
                    <span className={`ml-2 body-3 font-normal ${Math.abs(totalPct - 100) > 0.5 ? 'text-feedback-error' : 'text-auxiliary-green-5'}`}>
                      (Total: {totalPct} %)
                    </span>
                  </label>
                  <div className="flex flex-col gap-2">
                    {form.splitAmong.map((uid) => (
                      <div key={uid} className="flex items-center gap-3">
                        <span className="body-3 text-neutral-6 w-24 shrink-0 truncate">{memberName(uid)}</span>
                        <div className="relative flex-1">
                          <input type="number" min="0" max="100" step="1"
                            value={form.percentages[uid] ?? 0}
                            onChange={(e) => setForm((p) => ({ ...p, percentages: { ...p.percentages, [uid]: Number(e.target.value) || 0 } }))}
                            className="w-full border border-neutral-2 rounded-xl px-3 py-1.5 pr-8 body-3 focus:outline-none focus:ring-2 focus:ring-primary-3" />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 body-3 text-neutral-4 pointer-events-none">%</span>
                        </div>
                        {expAmt > 0 && (
                          <span className="body-3 text-neutral-4 w-16 text-right shrink-0">
                            {(expAmt * (form.percentages[uid] ?? 0) / 100).toFixed(2)} {currSymbol}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {errors.percentages && <FieldError msg={errors.percentages} />}
                </div>
              )}

              {/* Importes personalizados */}
              {form.splitType === 'amounts' && form.splitAmong.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="body-2-semibold text-neutral-6">
                      Importes
                      <span className={`ml-2 body-3 font-normal ${Math.abs(totalCustom - expAmt) > 0.01 ? 'text-feedback-error' : 'text-auxiliary-green-5'}`}>
                        ({totalCustom.toFixed(2)} / {expAmt.toFixed(2)} {currSymbol})
                      </span>
                    </label>
                    <button type="button"
                      onClick={() => setForm((p) => ({ ...p, customAmounts: buildEqualAmounts(p.splitAmong, expAmt) }))}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg body-3 text-secondary-4 border border-secondary-2 hover:bg-secondary-1 transition-colors">
                      <RefreshCw className="w-3 h-3" />Repartir igual
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {form.splitAmong.map((uid) => (
                      <div key={uid} className="flex items-center gap-3">
                        <span className="body-3 text-neutral-6 w-24 shrink-0 truncate">{memberName(uid)}</span>
                        <div className="relative flex-1">
                          <input type="number" min="0" step="0.01"
                            value={form.customAmounts[uid] ?? 0}
                            onChange={(e) => setForm((p) => ({ ...p, customAmounts: { ...p.customAmounts, [uid]: Number(e.target.value) || 0 } }))}
                            className="w-full border border-neutral-2 rounded-xl px-3 py-1.5 pr-10 body-3 focus:outline-none focus:ring-2 focus:ring-primary-3" />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 body-3 text-neutral-4 pointer-events-none">{currSymbol}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors.customAmounts && <FieldError msg={errors.customAmounts} />}
                </div>
              )}
            </>
          )}

          {/* Notas */}
          <div>
            <label className="block body-2-semibold text-neutral-6 mb-1.5">
              Notas <span className="body-3 font-normal text-neutral-4">(opcional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Comentarios adicionales..."
              rows={2} maxLength={300}
              className={`${fi} ${ok} resize-none`}
            />
          </div>

          {errors.submit && (
            <div className="flex items-center gap-2 bg-feedback-error-bg border border-feedback-error rounded-xl px-3 py-2">
              <AlertCircle className="w-4 h-4 text-feedback-error shrink-0" />
              <p className="body-3 text-feedback-error">{errors.submit}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-full border border-neutral-2 body-2 font-semibold text-neutral-6 hover:bg-neutral-1 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 rounded-full bg-primary-3 text-white body-2 font-semibold hover:bg-primary-4 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting ? 'Guardando...' : initialExpense ? 'Guardar cambios' : personalMode ? 'Añadir mi gasto' : 'Añadir gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FieldError({ msg }) {
  return (
    <p className="body-3 text-feedback-error mt-1 flex items-center gap-1">
      <AlertCircle className="w-3 h-3 shrink-0" />{msg}
    </p>
  );
}
