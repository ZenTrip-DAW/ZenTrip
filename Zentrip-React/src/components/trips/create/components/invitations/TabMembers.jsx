import { useMemo, useState } from 'react';
import UserAvatar from '../../../../ui/UserAvatar';
import Button from '../../../../ui/Button';
import AlertMessage from '../../../../ui/AlertMessage';
import { useAuth } from '../../../../../context/AuthContext';
import { searchUsersByUsername } from '../../../../../services/userService';
import { getSearchErrorMessage } from '../../../../../utils/errors/searchErrors';

export default function TabMiembros({ recientes = [], participantes = [], onAgregarMiembro }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const isEmailSearch = query.includes('@');

  const participantesSet = useMemo(
    () => new Set(participantes.map((item) => item.uid)),
    [participantes],
  );

  const handleBuscar = async () => {
    const term = query.trim();
    if (!term) {
      setResultados([]);
      setFieldErrors({});
      return;
    }

    setBuscando(true);
    setFieldErrors({});

    try {
      const users = await searchUsersByUsername(term);
      const filtered = users.filter((item) => item.uid !== user?.uid);

      setResultados(filtered);
      if (filtered.length === 0) {
        setFieldErrors({ busqueda: getSearchErrorMessage('no-results') });
      }
    } catch (error) {
      setResultados([]);
      setFieldErrors({ busqueda: getSearchErrorMessage('search-failed') });
    } finally {
      setBuscando(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBuscar();
    }
  };

  return (
    <div>
      {/* Buscador */}
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar por nombre de usuario o correo..."
            className="w-full border border-neutral-2 rounded-lg px-4 py-2 pr-9 body-2 md:body-semibold text-neutral-6 placeholder:text-neutral-3 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent"
          />
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-neutral-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </div>
        </div>
        <div className="shrink-0">
          <Button variant="orange" type="button" className="w-auto! px-5" onClick={handleBuscar}>
            Buscar
          </Button>
        </div>
      </div>

      {buscando && <p className="body-3 text-neutral-4 mb-4">Buscando usuarios...</p>}
      {fieldErrors.busqueda && <AlertMessage message={fieldErrors.busqueda} variant="error" className="mb-4" />}

      {resultados.length > 0 && (
        <div className="mb-5 rounded-xl border border-neutral-1 divide-y divide-neutral-1 overflow-hidden">
          {resultados.map((member) => {
            const yaInvitado = participantesSet.has(member.uid);

            return (
              <div key={member.uid} className="flex items-center justify-between gap-3 p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar
                    src={member.avatar}
                    fullName={member.nombre}
                    sizeClass="w-10 h-10"
                    backgroundClass="bg-secondary-1"
                  />

                  <div className="min-w-0">
                    <p className="body-2-semibold text-neutral-6 truncate">{member.nombre}</p>
                    <p className="body-3 text-neutral-4 truncate">
                      {isEmailSearch ? (member.email || `@${member.username}`) : `@${member.username}`}
                    </p>
                  </div>
                </div>

                {yaInvitado ? (
                  <span className="w-auto px-4 py-1.5 text-sm shrink-0 rounded-full bg-neutral-1 text-neutral-4 border border-neutral-2 select-none">
                    Añadido
                  </span>
                ) : (
                  <Button
                    variant="orange"
                    type="button"
                    className="w-auto! px-4 py-1.5 text-sm shrink-0"
                    onClick={() => onAgregarMiembro?.(member)}
                  >
                    Invitar
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Recientes */}
      {recientes.length > 0 && (
        <>
          <p className="body-bold text-neutral-5 mb-3">Recientes</p>
          <div className="flex flex-wrap gap-x-4 gap-y-3">
            {recientes.map((user) => (
              <button
                key={user.id}
                type="button"
                className="flex flex-col items-center gap-1 hover:opacity-80 transition"
              >
                <UserAvatar
                  src={user.avatar}
                  fullName={user.nombre}
                  sizeClass="w-12 h-12"
                  backgroundClass="bg-secondary-1"
                  initialsClass="body-3 text-secondary-5 font-bold"
                />
                <span className="body-3 text-neutral-5 text-center w-16 leading-tight">
                  {user.nombre}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
