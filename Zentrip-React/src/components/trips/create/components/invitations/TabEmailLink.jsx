import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../../../context/AuthContext';
import Button from '../../../../ui/Button';
import AlertMessage from '../../../../ui/AlertMessage';
import { searchUsersByEmail } from '../../../../../services/userService';
import { getSearchErrorMessage } from '../../../../../utils/errors/searchErrors';
import { validateEmail } from '../../../../../utils/validation/register/rules';

export default function TabEnlaceEmail({ enlaceInvitacion = '', invitados = [], onAgregarInvitadoEmail, disabled = false }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [copyMessage, setCopyMessage] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);
  const currentUserUid = user?.uid || '';
  const currentUserEmail = (user?.email || '').trim().toLowerCase();

  const invitadosSet = useMemo(
    () => new Set(invitados.map((item) => (item.email || item.uid || '').toLowerCase())),
    [invitados],
  );

  const buscarEmails = async (rawQuery = query) => {
    if (disabled) return;

    const term = rawQuery.trim();
    if (!term) {
      setResultados([]);
      setFieldErrors({});
      setSeleccionado(null);
      return;
    }

    setBuscando(true);
    setFieldErrors({});

    try {
      const users = await searchUsersByEmail(term, 5);
      const filtered = users.filter((item) => {
        const memberEmail = (item.email || '').trim().toLowerCase();

        return (
          item.email
          && item.email !== ''
          && (item.uid || '') !== currentUserUid
          && memberEmail !== currentUserEmail
        );
      });

      setResultados(filtered);
    } catch {
      setResultados([]);
      setFieldErrors({ email: getSearchErrorMessage('email-search-failed') });
    } finally {
      setBuscando(false);
    }
  };

  useEffect(() => {
    if (disabled) {
      setResultados([]);
      setBuscando(false);
      return undefined;
    }

    const term = query.trim();
    if (!term) {
      setResultados([]);
      setFieldErrors({});
      setSeleccionado(null);
      return undefined;
    }

    // No buscar si ya hay algo seleccionado (evita búsqueda al rellenar el input)
    if (seleccionado) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      buscarEmails(term);
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [query, seleccionado]);

  const handleSeleccionar = (user) => {
    if (disabled) return;

    setSeleccionado(user);
    setQuery(user.email || '');
    setResultados([]);
    setFieldErrors({});
  };

  const handleInvitar = () => {
    if (disabled) return;

    const email = (seleccionado?.email || query).trim().toLowerCase();
    if (!email) return;

    if (email === currentUserEmail) {
      setFieldErrors({ email: 'No puedes invitarte a ti mismo.' });
      return;
    }

    const match = resultados.find((item) => (item.email || '').toLowerCase() === email) || seleccionado;
    const isRegistered = Boolean(match?.uid);

    if (!isRegistered) {
      const emailErrors = validateEmail(email);
      if (emailErrors.length > 0) {
        setFieldErrors({ email: emailErrors[0] });
        return;
      }
    }

    onAgregarInvitadoEmail?.({
      email: match?.email || email,
      name: match?.name || match?.firstName || email,
      avatar: match?.avatar || '',
      uid: match?.uid || null,
      type: isRegistered ? 'member' : 'email',
    });

    setQuery('');
    setResultados([]);
    setSeleccionado(null);
    setFieldErrors({});
  };

  const handleCopiarEnlace = async () => {
    if (!enlaceInvitacion) return;

    try {
      await navigator.clipboard.writeText(enlaceInvitacion);
      setCopyMessage('Enlace copiado al portapapeles.');
      setTimeout(() => setCopyMessage(''), 1800);
    } catch {
      setCopyMessage('No se pudo copiar automáticamente.');
    }
  };

  return (
    <div>
      <div className="mb-5">
        <h3 className="body-bold text-secondary-5 mb-1">Invitar por correo electrónico</h3>
        <p className="body-2 text-neutral-3 mb-3">Escribe un correo para invitar. Si ya tiene cuenta en ZenTrip, se gestionará como miembro.</p>
        <div className="flex gap-2 items-start">
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              placeholder="Ej. amigo@email.com"
              value={query}
              onChange={(e) => {
                if (disabled) return;
                setQuery(e.target.value);
                setSeleccionado(null);
                if (fieldErrors.email) {
                  setFieldErrors({});
                }
              }}
              inputMode="email"
              disabled={disabled}
              className="w-full border border-neutral-2 rounded-lg px-4 py-2 body-2 text-neutral-6 placeholder:text-neutral-3 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent"
            />
          </div>

          <Button variant="orange" type="button" className="w-auto! px-5 shrink-0" onClick={handleInvitar} disabled={disabled}>
            Invitar
          </Button>
        </div>

        {buscando && <p className="mt-1 body-3 text-neutral-4">Buscando correos...</p>}
        {fieldErrors.email && <AlertMessage message={fieldErrors.email} variant="error" className="mt-2" />}

        {resultados.length > 0 && (
          <div className="mt-3 rounded-xl border border-neutral-1 divide-y divide-neutral-1 overflow-hidden max-h-56 overflow-y-auto bg-white">
            {resultados.map((user) => {
              const email = (user.email || '').toLowerCase();
              const yaInvitado = invitadosSet.has(email) || invitadosSet.has(user.uid);

              return (
                <button
                  key={user.uid || user.email}
                  type="button"
                  className="w-full flex items-center justify-between gap-3 p-3 text-left hover:bg-neutral-1 transition"
                  onClick={() => handleSeleccionar(user)}
                >
                  <div className="min-w-0">
                    <p className="body-2-semibold text-neutral-6 truncate">{user.firstName || user.name}</p>
                    <p className="body-3 text-neutral-4 truncate">{user.email}</p>
                  </div>
                  <span className={`body-3 ${yaInvitado ? 'text-neutral-3' : 'text-primary-3'}`}>
                    {yaInvitado ? 'Añadido' : 'Elegir'}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {query.trim() && resultados.length === 0 && !buscando && !fieldErrors.email && !seleccionado && (
          <p className="mt-2 body-3 text-neutral-4">
            Si no está en ZenTrip, se invitará por correo si tiene un formato válido.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-neutral-1" />
        <span className="body-3 text-neutral-3">o comparte el enlace</span>
        <div className="flex-1 h-px bg-neutral-1" />
      </div>

      <div>
        <h3 className="body-bold text-secondary-5 mb-2">Enlace de invitación</h3>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={enlaceInvitacion}
            placeholder="https://zentrip.com/join/..."
            className="flex-1 bg-neutral-1 border border-neutral-1 rounded-lg px-4 py-2 body-2 text-neutral-3 cursor-default focus:outline-none"
          />
          <button
            type="button"
            onClick={handleCopiarEnlace}
            disabled={!enlaceInvitacion}
            className="flex items-center gap-2 bg-neutral-1 border border-neutral-2 rounded-lg px-4 py-2 body-2-semibold text-neutral-5 hover:bg-neutral-2 transition shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 1 2-2v-8a2 2 0 0 1-2-2h-8a2 2 0 0 1-2 2v8a2 2 0 0 1 2 2z" />
            </svg>
            Copiar
          </button>
        </div>
        {copyMessage && <p className="mt-2 body-3 text-secondary-5">{copyMessage}</p>}
      </div>
    </div>
  );
}
