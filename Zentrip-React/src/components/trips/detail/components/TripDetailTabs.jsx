import { MessageCircle } from 'lucide-react';

const TABS = [
  { key: 'itinerario',   label: 'Itinerario' },
  { key: 'reservas',     label: 'Reservas' },
  { key: 'invitaciones', label: 'Participantes' },
  { key: 'votaciones',   label: 'Votaciones' },
  { key: 'presupuesto',  label: 'Presupuesto' },
  { key: 'equipaje',     label: 'Equipaje' },
  { key: 'galeria',      label: 'Galería' },
];

export default function TripDetailTabs({ activeTab, onTabChange, badges = {} }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-1 flex items-stretch">
      {/* Tabs scrollables — ocupan todo el espacio disponible */}
      <div className="flex-1 overflow-x-auto scrollbar-hide px-2">
        <div className="flex items-center h-full">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const badge = badges[tab.key];
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
                className={`
                  relative flex items-center gap-1.5 px-3 sm:px-4 py-4 body-3 font-semibold whitespace-nowrap transition-colors shrink-0
                  ${isActive
                    ? 'text-primary-3 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-3 after:rounded-t-full'
                    : 'text-neutral-4 hover:text-neutral-6'}
                `}
              >
                {tab.label}
                {badge != null && badge > 0 && (
                  <span className={`
                    text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4.5 text-center leading-none
                    ${isActive ? 'bg-primary-1 text-primary-3' : 'bg-neutral-1 text-neutral-4'}
                  `}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat — siempre visible, separado del scroll */}
      <div className="flex items-center shrink-0 px-2 border-l border-neutral-1">
        <button
          type="button"
          onClick={() => onTabChange('chat')}
          className={`
            flex items-center gap-1.5 px-3 py-2 rounded-full body-3 font-semibold transition-colors whitespace-nowrap
            ${activeTab === 'chat'
              ? 'bg-secondary-5 text-white'
              : 'bg-secondary-1 text-secondary-5 hover:bg-secondary-2'}
          `}
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Chat</span>
        </button>
      </div>
    </div>
  );
}
