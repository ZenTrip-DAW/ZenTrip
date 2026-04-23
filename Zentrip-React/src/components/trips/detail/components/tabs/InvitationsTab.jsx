import { useState } from 'react';
import UserAvatar from '../../../../ui/UserAvatar';
import ConfirmModal from '../../../../ui/ConfirmModal';
import TabMembers from '../../../create/components/invitations/TabMembers';
import TabEmailLink from '../../../create/components/invitations/TabEmailLink';
import PanelInvitados from '../../../create/components/invitations/InvitadosPanel';
import { useTripInvitations } from '../../hooks/useTripInvitations';

function IconPeople() {
  return (
    <svg width="21" height="14" viewBox="0 0 21 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.35303 13.2935C8.73291 13.2935 8.30078 13.1982 8.05664 13.0078C7.8125 12.8223 7.69043 12.5562 7.69043 12.2095C7.69043 11.7407 7.83447 11.2476 8.12256 10.73C8.41064 10.2124 8.82568 9.729 9.36768 9.27979C9.90967 8.82568 10.5615 8.45703 11.3232 8.17383C12.0898 7.89062 12.9468 7.74902 13.894 7.74902C14.8413 7.74902 15.6958 7.89062 16.4575 8.17383C17.2241 8.45703 17.8784 8.82568 18.4204 9.27979C18.9624 9.729 19.3774 10.2124 19.6655 10.73C19.9536 11.2476 20.0977 11.7407 20.0977 12.2095C20.0977 12.5562 19.9756 12.8223 19.7314 13.0078C19.4873 13.1982 19.0527 13.2935 18.4277 13.2935H9.35303ZM13.894 6.45996C13.3521 6.45996 12.8564 6.31592 12.4072 6.02783C11.958 5.73486 11.5967 5.34424 11.3232 4.85596C11.0547 4.36279 10.9204 3.81104 10.9204 3.20068C10.9204 2.60986 11.0571 2.07275 11.3306 1.58936C11.604 1.10107 11.9653 0.715332 12.4146 0.432129C12.8638 0.144043 13.3569 0 13.894 0C14.436 0 14.9316 0.141602 15.3809 0.424805C15.8301 0.708008 16.189 1.09131 16.4575 1.57471C16.731 2.05322 16.8677 2.59277 16.8677 3.19336C16.8677 3.80371 16.731 4.35547 16.4575 4.84863C16.189 5.3418 15.8301 5.73486 15.3809 6.02783C14.9316 6.31592 14.436 6.45996 13.894 6.45996ZM1.39893 13.3008C0.88623 13.3008 0.524902 13.1934 0.314941 12.9785C0.10498 12.7686 0 12.4707 0 12.085C0 11.5967 0.126953 11.0986 0.380859 10.5908C0.639648 10.0781 1.00586 9.60693 1.47949 9.17725C1.95801 8.74756 2.52686 8.39844 3.18604 8.12988C3.8501 7.86133 4.58984 7.72705 5.40527 7.72705C6.0498 7.72705 6.6333 7.8125 7.15576 7.9834C7.68311 8.14941 8.14453 8.35938 8.54004 8.61328C8.11523 8.9502 7.75146 9.32861 7.44873 9.74854C7.146 10.1685 6.91406 10.5981 6.75293 11.0376C6.59668 11.4722 6.521 11.8848 6.52588 12.2754C6.53564 12.6709 6.63818 13.0127 6.8335 13.3008H1.39893ZM5.40527 6.62109C4.93652 6.62109 4.50439 6.49658 4.10889 6.24756C3.71826 5.99365 3.40576 5.65186 3.17139 5.22217C2.93701 4.79248 2.81982 4.31396 2.81982 3.78662C2.81982 3.26904 2.93701 2.80029 3.17139 2.38037C3.41064 1.95557 3.72559 1.61865 4.11621 1.36963C4.51172 1.12061 4.94141 0.996094 5.40527 0.996094C5.86914 0.996094 6.29639 1.12061 6.68701 1.36963C7.08252 1.61377 7.39746 1.9458 7.63184 2.36572C7.87109 2.78564 7.99072 3.25684 7.99072 3.7793C7.99072 4.30664 7.87354 4.7876 7.63916 5.22217C7.40479 5.65186 7.09229 5.99365 6.70166 6.24756C6.31104 6.49658 5.87891 6.62109 5.40527 6.62109Z" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

const TABS = [
  { id: 'members', label: 'Miembros', icon: <IconPeople /> },
  { id: 'enlace',  label: 'Enlace / Email', icon: <IconLink /> },
];

export default function InvitationsTab({ tripId, tripName, members, isCreator, onLeaveTrip, onMemberRemoved }) {
  const [activeTab, setActiveTab] = useState('members');
  const [memberToRemove, setMemberToRemove] = useState(null);
  const { invitados, inviteLink, recientes, handleAddMember, handleAddEmailGuest, handleRemoveMember } = useTripInvitations(tripId, tripName, members, onMemberRemoved, isCreator);

  if (!isCreator) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-1 p-6 w-full">
        <div className="flex items-center gap-2 mb-5">
          <h2 className="title-h3-desktop text-secondary-5">Participantes</h2>
          {invitados.length > 0 && (
            <span className="bg-primary-3 text-white body-2-semibold rounded-full w-5 h-5 flex items-center justify-center">
              {invitados.length}
            </span>
          )}
        </div>
        {invitados.length === 0 ? (
          <p className="body-2 text-neutral-4 text-center py-8">Sin participantes aún</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {invitados.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-neutral-1">
                <UserAvatar
                  src={p.avatar}
                  fullName={p.name || p.firstName || p.email}
                  sizeClass="w-10 h-10"
                  backgroundClass="bg-secondary-1"
                  initialsClass="body-3 text-secondary-5 font-bold"
                />
                <div className="flex-1 min-w-0">
                  <p className="body-2-semibold text-neutral-6 truncate">{p.name || p.firstName || p.email}</p>
                  <p className={`body-3 truncate ${p.invitationStatus === 'accepted' ? 'text-neutral-3' : 'text-primary-3'}`}>
                    {p.invitationStatus === 'accepted' ? 'Participante' : p.invitationStatus === 'pending_email' ? 'Invitado por email' : 'Pendiente'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        {onLeaveTrip && (
          <div className="mt-6 pt-5 border-t border-neutral-1 flex justify-end">
            <button
              type="button"
              onClick={onLeaveTrip}
              className="body-2-semibold text-red-500 hover:text-red-600 transition-colors"
            >
              Salir del viaje
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-5 md:items-stretch">
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-1 p-6 flex-1 min-w-0 w-full">
        <h2 className="title-h3-desktop text-secondary-5 mb-5">Invitaciones</h2>

        <div className="flex bg-neutral-1 rounded-full p-1 gap-1 mb-5 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full body-2-semibold transition ${
                activeTab === tab.id ? 'bg-secondary-5 text-white' : 'text-secondary-5 hover:bg-neutral-2'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'members' ? (
          <TabMembers
            recientes={recientes}
            invitados={invitados}
            onAgregarMiembro={handleAddMember}
          />
        ) : (
          <TabEmailLink
            enlaceInvitacion={inviteLink}
            invitados={invitados}
            onAgregarInvitadoEmail={handleAddEmailGuest}
          />
        )}
      </div>

      <div className="md:ml-4 w-full md:w-auto">
        <PanelInvitados invitados={invitados} onEliminarInvitado={(id) => setMemberToRemove(id)} />
      </div>

      {memberToRemove && (() => {
        const member = invitados.find((i) => i.id === memberToRemove);
        return (
          <ConfirmModal
            title="Eliminar participante"
            message={`¿Seguro que quieres eliminar a ${member?.name || member?.email || 'este participante'} del viaje?`}
            confirmLabel="Eliminar"
            cancelLabel="Cancelar"
            confirmVariant="danger"
            onConfirm={() => { handleRemoveMember(memberToRemove); setMemberToRemove(null); }}
            onCancel={() => setMemberToRemove(null)}
          />
        );
      })()}
    </div>
  );
}
