import { useState } from 'react';
import { Users, UserCheck, UserMinus } from 'lucide-react';

// members: [{ uid, name, username, avatar, invitationStatus }]
// value: 'all' | uid[]   (UIDs de los que SÍ van)
// onChange('all' | uid[])
export default function PassengerSelector({ members = [], value = 'all', onChange, label = '¿Para quién es el vuelo?' }) {
  const accepted = members.filter((m) => m.invitationStatus === 'accepted');
  const count = accepted.length;

  const [mode, setMode] = useState(() => {
    if (value === 'all') return 'all';
    if (Array.isArray(value) && value.length < count) return 'some';
    return 'all';
  });

  // En modo 'some': selectedUids = quiénes SÍ van (empezamos vacíos, el user añade)
  // En modo 'allExcept': excludedUids = quiénes NO van (empezamos vacíos, el user quita)
  const [excludedUids, setExcludedUids] = useState([]);

  const includedUids = Array.isArray(value) ? value : accepted.map((m) => m.uid);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setExcludedUids([]);
    if (newMode === 'all') {
      onChange('all');
    } else if (newMode === 'some') {
      onChange([]);
    } else if (newMode === 'allExcept') {
      // Todos incluidos inicialmente, nadie excluido
      onChange('all');
    }
  };

  const toggleSome = (uid) => {
    const next = includedUids.includes(uid)
      ? includedUids.filter((u) => u !== uid)
      : [...includedUids, uid];
    onChange(next.length === count ? 'all' : next);
  };

  const toggleExclude = (uid) => {
    const nextExcluded = excludedUids.includes(uid)
      ? excludedUids.filter((u) => u !== uid)
      : [...excludedUids, uid];
    setExcludedUids(nextExcluded);
    const included = accepted.filter((m) => !nextExcluded.includes(m.uid)).map((m) => m.uid);
    onChange(included.length === count ? 'all' : included);
  };

  const modeOptions = [
    { key: 'all',       Icon: Users,      label: `Todos (${count})` },
    { key: 'some',      Icon: UserCheck,  label: 'Elegir personas' },
    { key: 'allExcept', Icon: UserMinus,  label: 'Todos menos…' },
  ];

  return (
    <div className="flex flex-col gap-3">
      <p className="body-3 font-bold text-neutral-5 uppercase tracking-wider flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5 text-secondary-3" />
        {label}
      </p>

      {/* Selector de modo */}
      <div className="grid grid-cols-3 gap-2">
        {modeOptions.map(({ key, Icon, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => handleModeChange(key)}
            className={`flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl border body-3 font-semibold transition
              ${mode === key
                ? 'border-secondary-3 bg-secondary-1 text-secondary-4'
                : 'border-neutral-2 bg-white text-neutral-5 hover:border-neutral-3'}`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-center text-[11px] leading-tight">{label}</span>
          </button>
        ))}
      </div>

      {/* Modo: elegir personas (SÍ van) */}
      {mode === 'some' && (
        <div className="flex flex-col gap-1.5">
          {accepted.length === 0 && (
            <p className="body-3 text-neutral-3 italic">No hay miembros aceptados aún.</p>
          )}
          {accepted.map((m) => {
            const isIn = includedUids.includes(m.uid);
            return (
              <button
                key={m.uid}
                type="button"
                onClick={() => toggleSome(m.uid)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition
                  ${isIn ? 'border-auxiliary-green-3 bg-auxiliary-green-1' : 'border-neutral-1 bg-white hover:border-neutral-2'}`}
              >
                <MemberAvatar member={m} />
                <div className="flex-1 text-left min-w-0">
                  <p className="body-3 font-semibold text-neutral-7 truncate">{m.name || m.username}</p>
                  {m.username && m.name && <p className="body-3 text-neutral-3 truncate">@{m.username}</p>}
                </div>
                <Checkbox checked={isIn} />
              </button>
            );
          })}
          {includedUids.length === 0 && (
            <p className="body-3 text-feedback-error text-center py-1">Selecciona al menos una persona</p>
          )}
        </div>
      )}

      {/* Modo: todos menos (seleccionar excluidos) */}
      {mode === 'allExcept' && (
        <div className="flex flex-col gap-1.5">
          <p className="body-3 text-neutral-4 mb-1">
            Marca a quien <span className="font-semibold text-neutral-6">no</span> va en este vuelo:
          </p>
          {accepted.length === 0 && (
            <p className="body-3 text-neutral-3 italic">No hay miembros aceptados aún.</p>
          )}
          {accepted.map((m) => {
            const isExcluded = excludedUids.includes(m.uid);
            return (
              <button
                key={m.uid}
                type="button"
                onClick={() => toggleExclude(m.uid)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition
                  ${isExcluded
                    ? 'border-feedback-error/40 bg-red-50'
                    : 'border-auxiliary-green-3 bg-auxiliary-green-1'}`}
              >
                <MemberAvatar member={m} />
                <div className="flex-1 text-left min-w-0">
                  <p className={`body-3 font-semibold truncate ${isExcluded ? 'text-neutral-4 line-through' : 'text-neutral-7'}`}>
                    {m.name || m.username}
                  </p>
                  {m.username && m.name && <p className="body-3 text-neutral-3 truncate">@{m.username}</p>}
                </div>
                {isExcluded
                  ? <span className="body-3 text-feedback-error font-semibold shrink-0">No va</span>
                  : <span className="body-3 text-auxiliary-green-5 font-semibold shrink-0">Va ✓</span>}
              </button>
            );
          })}
          {excludedUids.length > 0 && (
            <p className="body-3 text-neutral-4 text-center pt-1">
              Van {count - excludedUids.length} de {count} miembros
            </p>
          )}
        </div>
      )}

      {/* Resumen modo 'all' */}
      {mode === 'all' && count > 0 && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-auxiliary-green-1 border border-auxiliary-green-3 rounded-xl">
          <Users className="w-4 h-4 text-auxiliary-green-5 shrink-0" />
          <p className="body-3 text-auxiliary-green-5 font-semibold">
            Todos los miembros del viaje ({count})
          </p>
        </div>
      )}
    </div>
  );
}

function MemberAvatar({ member: m }) {
  return m.avatar
    ? <img src={m.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
    : <div className="w-8 h-8 rounded-full bg-primary-2 flex items-center justify-center text-white body-3 font-bold shrink-0">
        {(m.name || m.username || '?')[0].toUpperCase()}
      </div>;
}

function Checkbox({ checked }) {
  return (
    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition
      ${checked ? 'border-auxiliary-green-4 bg-auxiliary-green-4' : 'border-neutral-2'}`}>
      {checked && <span className="text-white text-[10px] font-bold">✓</span>}
    </div>
  );
}
