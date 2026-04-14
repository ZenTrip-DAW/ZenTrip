import { UserPlus } from 'lucide-react';
import UserAvatar from '../../../../ui/UserAvatar';

const ROLE_LABELS = {
  coordinator: 'Organizador',
  member: 'Miembro',
};

export default function ParticipantsCard({ members, onInvite }) {
  const accepted = members.filter((m) => m.invitationStatus === 'accepted');

  return (
    <div className="bg-white rounded-2xl border border-neutral-1 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="body-3 text-neutral-4 font-semibold uppercase tracking-wide">Participantes</p>
        <button
          type="button"
          onClick={onInvite}
          className="flex items-center gap-1 body-3 text-primary-3 font-semibold hover:text-primary-4 transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Invitar
        </button>
      </div>

      {accepted.length === 0 ? (
        <p className="body-3 text-neutral-3 text-center py-3">Sin participantes aún</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {accepted.map((member) => (
            <li key={member.uid || member.id} className="flex items-center gap-3">
              <UserAvatar
                src={member.avatar || member.profilePhoto || ''}
                fullName={member.name || member.username || member.email || ''}
                sizeClass="w-9 h-9"
                backgroundClass="bg-secondary-1"
                backgroundColor={member.avatarColor}
                initialsClass="body-3 text-secondary-5 font-bold"
              />
              <div className="flex flex-col min-w-0">
                <span className="body-3 font-semibold truncate" style={{ color: 'var(--color-secondary-5)' }}>
                  {member.name || member.username || member.email || 'Usuario'}
                </span>
                <span className="body-3 text-neutral-3 text-xs">
                  {ROLE_LABELS[member.role] || 'Miembro'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
