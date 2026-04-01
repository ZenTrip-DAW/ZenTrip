import UserAvatar from '../../../../ui/UserAvatar';
import Button from '../../../../ui/Button';

export default function TabMiembros({ recientes = [] }) {
  return (
    <div>
      {/* Buscador */}
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            placeholder="Buscar usuarios de ZenTrip..."
            className="w-full border border-neutral-2 rounded-lg px-4 py-2 pr-9 body-2 md:body-semibold text-neutral-6 placeholder:text-neutral-3 focus:outline-none focus:ring-2 focus:ring-primary-3 focus:border-transparent"
          />
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-neutral-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </div>
        </div>
        <div className="shrink-0">
          <Button variant="orange" type="button" className="w-auto! px-5">
            Invitar
          </Button>
        </div>
      </div>

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
