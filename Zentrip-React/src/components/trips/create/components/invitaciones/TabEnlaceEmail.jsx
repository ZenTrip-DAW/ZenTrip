import Button from '../../../../ui/Button';

export default function TabEnlaceEmail({ enlaceInvitacion = '' }) {
  return (
    <div>
      {/* Invitar por correo electrónico */}
      <div className="mb-5">
        <h3 className="body-bold text-secondary-5 mb-1">Invitar por correo electrónico</h3>
        <p className="body-2 text-neutral-3 mb-3">Escribe el email y pulsa Enter o el botón</p>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="Ej. amigo@email.com"
            className="flex-1 border border-neutral-2 rounded-lg px-4 py-2 body-2 text-neutral-6 placeholder:text-neutral-3 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent"
          />
          <Button variant="orange" type="button" className="w-auto! px-5 shrink-0">
            Invitar
          </Button>
        </div>
      </div>

      {/* Separador */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-neutral-1" />
        <span className="body-3 text-neutral-3">o comparte el enlace</span>
        <div className="flex-1 h-px bg-neutral-1" />
      </div>

      {/* Enlace de invitación */}
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
            className="flex items-center gap-2 bg-neutral-1 border border-neutral-2 rounded-lg px-4 py-2 body-2-semibold text-neutral-5 hover:bg-neutral-2 transition shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 1 2-2v-8a2 2 0 0 1-2-2h-8a2 2 0 0 1-2 2v8a2 2 0 0 1 2 2z" />
            </svg>
            Copiar
          </button>
        </div>
      </div>
    </div>
  );
}
