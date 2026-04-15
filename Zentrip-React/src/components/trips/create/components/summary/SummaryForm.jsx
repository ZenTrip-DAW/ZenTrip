import Button from '../../../../ui/Button';
import UserAvatar from '../../../../ui/UserAvatar';

function calcNights(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const nights = Math.round(
    (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24),
  );
  return nights > 0 ? nights : null;
}

function EmptyLine({ colorClass = 'bg-secondary-5' }) {
  return <span className={`block w-20 h-0.5 rounded-full ${colorClass}`} />;
}

function SectionRow({ label, children }) {
  return (
    <div className="mb-4">
      <p className="body-3 text-neutral-3 mb-1">{label}</p>
      {children}
      <hr className="mt-3 border-neutral-1" />
    </div>
  );
}

function ParticipantsPanel({ participants }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-1 p-5 w-full md:w-64 shrink-0">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="title-h3-desktop text-neutral-4">Participantes</h2>
        {participants.length > 0 && (
          <span className="bg-primary-3 text-white body-2-semibold rounded-full w-5 h-5 flex items-center justify-center">
            {participants.length}
          </span>
        )}
      </div>

      {participants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
          <svg width="54" height="36" viewBox="0 0 54 36" fill="currentColor" className="text-primary-3" xmlns="http://www.w3.org/2000/svg">
            <path d="M24.9414 35.4492C23.2878 35.4492 22.1354 35.1953 21.4844 34.6875C20.8333 34.1927 20.5078 33.4831 20.5078 32.5586C20.5078 31.3086 20.8919 29.9935 21.6602 28.6133C22.4284 27.2331 23.5352 25.944 24.9805 24.7461C26.4258 23.5352 28.1641 22.5521 30.1953 21.7969C32.2396 21.0417 34.5247 20.6641 37.0508 20.6641C39.5768 20.6641 41.8555 21.0417 43.8867 21.7969C45.931 22.5521 47.6758 23.5352 49.1211 24.7461C50.5664 25.944 51.6732 27.2331 52.4414 28.6133C53.2096 29.9935 53.5938 31.3086 53.5938 32.5586C53.5938 33.4831 53.2682 34.1927 52.6172 34.6875C51.9661 35.1953 50.8073 35.4492 49.1406 35.4492H24.9414ZM37.0508 17.2266C35.6055 17.2266 34.2839 16.8424 33.0859 16.0742C31.888 15.293 30.9245 14.2513 30.1953 12.9492C29.4792 11.6341 29.1211 10.1628 29.1211 8.53516C29.1211 6.95964 29.4857 5.52734 30.2148 4.23828C30.944 2.9362 31.9076 1.90755 33.1055 1.15234C34.3034 0.384115 35.6185 0 37.0508 0C38.4961 0 39.8177 0.377604 41.0156 1.13281C42.2135 1.88802 43.1706 2.91016 43.8867 4.19922C44.6159 5.47526 44.9805 6.91406 44.9805 8.51562C44.9805 10.1432 44.6159 11.6146 43.8867 12.9297C43.1706 14.2448 42.2135 15.293 41.0156 16.0742C39.8177 16.8424 38.4961 17.2266 37.0508 17.2266ZM3.73047 35.4688C2.36328 35.4688 1.39974 35.1823 0.839844 34.6094C0.279948 34.0495 0 33.2552 0 32.2266C0 30.9245 0.338542 29.5964 1.01562 28.2422C1.70573 26.875 2.68229 25.6185 3.94531 24.4727C5.22135 23.3268 6.73828 22.3958 8.49609 21.6797C10.2669 20.9635 12.2396 20.6055 14.4141 20.6055C16.1328 20.6055 17.6888 20.8333 19.082 21.2891C20.4883 21.7318 21.7188 22.2917 22.7734 22.9688C21.6406 23.8672 20.6706 24.8763 19.8633 25.9961C19.056 27.1159 18.4375 28.2617 18.0078 29.4336C17.5911 30.5924 17.3893 31.6927 17.4023 32.7344C17.4284 33.7891 17.7018 34.7005 18.2227 35.4688H3.73047ZM14.4141 17.6562C13.1641 17.6562 12.0117 17.3242 10.957 16.6602C9.91536 15.9831 9.08203 15.0716 8.45703 13.9258C7.83203 12.7799 7.51953 11.5039 7.51953 10.0977C7.51953 8.71745 7.83203 7.46745 8.45703 6.34766C9.09505 5.21484 9.9349 4.31641 10.9766 3.65234C12.0312 2.98828 13.1771 2.65625 14.4141 2.65625C15.651 2.65625 16.7904 2.98828 17.832 3.65234C18.8867 4.30339 19.7266 5.1888 20.3516 6.30859C20.9896 7.42839 21.3086 8.6849 21.3086 10.0781C21.3086 11.4844 20.9961 12.7669 20.3711 13.9258C19.7461 15.0716 18.9128 15.9831 17.8711 16.6602C16.8294 17.3242 15.6771 17.6562 14.4141 17.6562Z" />
          </svg>
          <p className="body-2 text-neutral-4">Aún no se han añadido participantes</p>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-3 mb-4">
            {participants.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <UserAvatar
                  src={p.avatar}
                  fullName={p.name || p.email}
                  sizeClass="w-9 h-9"
                  backgroundClass="bg-secondary-1"
                />
                <div className="flex-1 min-w-0">
                  <p className="body-2-semibold text-neutral-6 truncate">{p.name || p.email}</p>
                  <p className={`body-3 truncate ${p.role === 'email' ? 'text-primary-3' : 'text-neutral-3'}`}>
                    {p.invitationStatus === 'pending_email' ? 'Invitado por email' : 'Miembro ZenTrip'}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="bg-primary-1 rounded-xl px-3 py-2 flex items-start gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-primary-3 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className="body-3 text-primary-3">Se notificará a todos al crear el viaje.</p>
          </div>
        </>
      )}
    </div>
  );
}

export default function SummaryForm({
  form,
  onBack,
  onCreateTrip,
  onCancel,
  onSaveDraft,
  isCreatingTrip = false,
  tripCreationLocked = false,
  isEditing = false,
}) {
  const disableCreate = isCreatingTrip || tripCreationLocked;
  const nights = calcNights(form.startDate, form.endDate);
  const hasBudget = form.budget && Number(form.budget) > 0;

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-5 md:items-stretch">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-1 p-6 flex-1 min-w-0 w-full">
          <h2 className="title-h3-desktop text-secondary-5 mb-5">Resumen</h2>

          <SectionRow label="Nombre del viaje">
            <p className="body-bold text-primary-3">{form.name || '—'}</p>
          </SectionRow>

          <SectionRow label="Ruta">
            {(form.origin || form.destination)
              ? <p className="body text-secondary-5">{form.origin && form.destination ? `${form.origin} → ${form.destination}` : form.origin || form.destination}</p>
              : <EmptyLine />}
          </SectionRow>

          <SectionRow label="Fechas">
            {(form.startDate || form.endDate)
              ? <p className="body text-secondary-5">{form.startDate && form.endDate ? `${form.startDate} → ${form.endDate}${nights ? ` (${nights} ${nights === 1 ? 'noche' : 'noches'})` : ''}` : form.startDate || form.endDate}</p>
              : <EmptyLine />}
          </SectionRow>

          <SectionRow label="Presupuesto">
            {hasBudget
              ? <p className="body text-primary-3">{form.budget} {form.currency}</p>
              : <div className="flex items-center gap-2"><EmptyLine colorClass="bg-primary-3" />{form.currency && <span className="body text-primary-3">{form.currency}</span>}</div>}
          </SectionRow>

          <div className="mb-5">
            <p className="body-3 text-neutral-3 mb-1">Viaje con mascotas</p>
            <p className="body text-secondary-5">{form.hasPet ? 'Sí' : 'No'}</p>
          </div>

          <div className="bg-secondary-1 rounded-xl p-4">
            <p className="body-3 text-secondary-5">
              Una vez creado el viaje podrás añadir actividades, gestionar el presupuesto,
              especificar paradas en la ruta, gestionar maleta grupal y acceder al chat del grupo.
            </p>
          </div>
        </div>

        <div className="md:ml-4 w-full md:w-auto">
          <ParticipantsPanel participants={form.members ?? []} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mt-6">
        <div className="flex gap-3">
          <Button variant="ghost" type="button" onClick={onBack} className="w-auto! px-6">
            Atrás
          </Button>
          <Button variant="danger" type="button" onClick={onCancel} className="w-auto! px-6">
            Cancelar
          </Button>
        </div>
        <div className="flex gap-3">
          {!isEditing && (
            <Button variant="ghost" type="button" onClick={onSaveDraft} className="w-auto! px-4 sm:px-6">
              Continuar más tarde
            </Button>
          )}
          <Button
            variant="orange"
            type="button"
            className="w-auto! px-6"
            onClick={onCreateTrip}
            disabled={disableCreate}
          >
            {isCreatingTrip
              ? (isEditing ? 'Guardando...' : 'Creando...')
              : tripCreationLocked
                ? (isEditing ? 'Guardado' : 'Viaje creado')
                : (isEditing ? 'Guardar cambios' : 'Crear viaje')}
          </Button>
        </div>
      </div>
    </div>
  );
}
