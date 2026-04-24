import { useState } from 'react';
import { Trash2, UserCircle, Users } from 'lucide-react';
import { TYPE_CONFIG, STATUS_CONFIG } from './dayActivitiesUtils';

export default function ActivityCard({ activity, members = [], onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const typeCfg = TYPE_CONFIG[activity.type] || TYPE_CONFIG.actividad;
  const statusCfg = activity.status ? STATUS_CONFIG[activity.status] : null;
  const isDeletable = activity.source === 'manual';

  return (
    <div className="flex gap-2 min-w-0">
      {/* Hora */}
      <div className="flex flex-col items-end shrink-0 w-11 pt-1">
        <span className="body-3 text-neutral-5 font-semibold leading-tight">{activity.startTime || '—'}</span>
        {activity.endTime && (
          <span className="body-3 text-neutral-3 mt-auto leading-tight">{activity.endTime}</span>
        )}
      </div>

      {/* Línea de tiempo */}
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-3 h-3 rounded-full shrink-0 mt-1.5 ${typeCfg.dotClass}`} />
        <div className="w-px flex-1 bg-neutral-1 mt-1" />
      </div>

      {/* Tarjeta */}
      <div className={`flex-1 min-w-0 rounded-2xl border p-3 sm:p-4 mb-3 ${activity.status === 'reservado' ? 'bg-auxiliary-green-1 border-auxiliary-green-3' : 'bg-white border-neutral-1'}`}>
        {confirmDelete ? (
          <div className="flex flex-col gap-2">
            <p className="body-3 text-neutral-5 font-semibold">¿Eliminar esta actividad?</p>
            <p className="body-3 text-neutral-4">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="border border-neutral-2 rounded-full px-5 py-2 body-2 font-semibold text-neutral-4 hover:bg-neutral-1 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => onDelete(activity.id)}
                className="bg-feedback-error-solid hover:opacity-90 text-white rounded-full px-5 py-2 body-2 font-semibold transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <div className="flex items-center flex-wrap gap-1.5 justify-end">
                <span className="body-3 px-2 py-0.5 rounded-full font-semibold bg-primary-1 text-primary-3 whitespace-nowrap">
                  {typeCfg.label}
                </span>
                {statusCfg && (
                  <span className={`body-3 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${statusCfg.className}`}>
                    {statusCfg.label}
                  </span>
                )}
                {isDeletable && (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="p-1 rounded-full text-neutral-3 hover:text-feedback-error hover:bg-feedback-error-bg transition-colors shrink-0"
                    title="Eliminar actividad"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <h4 className="body-bold text-secondary-5 wrap-break-word">{activity.name}</h4>
            </div>
            {activity.notes && (
              <p className="body-3 text-neutral-4 mt-1 wrap-break-word">{activity.notes}</p>
            )}
            {activity.createdBy?.name && (
              <div className="flex items-center gap-1 mt-1.5 body-3 text-neutral-3 min-w-0">
                <UserCircle className="w-3 h-3 shrink-0" />
                <span className="truncate">{activity.createdBy.name}</span>
              </div>
            )}
            {activity.type === 'vuelo' && activity.passengers && (
              <div className="flex items-center gap-1 mt-1.5 body-3 text-neutral-4 min-w-0">
                <Users className="w-3 h-3 shrink-0" />
                <span className="wrap-break-word min-w-0">
                  {activity.passengers === 'all'
                    ? 'Todos'
                    : Array.isArray(activity.passengers)
                      ? activity.passengers.map((uid) => members.find((m) => m.uid === uid)).filter(Boolean).map((m) => m.name || m.username || 'Miembro').join(', ') || `${activity.passengers.length} pasajero${activity.passengers.length !== 1 ? 's' : ''}`
                      : activity.passengers}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
