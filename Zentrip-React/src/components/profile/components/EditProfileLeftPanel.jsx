import { User, Clock, Lock, Paintbrush } from 'lucide-react';
import GoogleIcon from '../../ui/GoogleIcon';

const NAV_ITEMS = [
  { key: 'personal', label: 'Datos personales', Icon: User },
  { key: 'preferences', label: 'Preferencias', Icon: Clock },
  { key: 'security', label: 'Seguridad', Icon: Lock },
];

const AVATAR_COLORS = ['', '#4f6f8f', '#7ea3c9', '#5f8d7a', '#d9a67a', '#c48aa6'];

export default function EditProfileLeftPanel({ heroImg, logoImg, usuario, form, setForm, activeSection, setActiveSection }) {
  const initials = `${form.firstName?.[0] || ''}${form.lastName?.[0] || ''}`.toUpperCase() || '?';
  const avatarBackground = form.avatarColor || '';

  const handleAvatarColorChange = () => {
    const currentIndex = AVATAR_COLORS.indexOf(avatarBackground);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % AVATAR_COLORS.length;
    setForm((prev) => ({ ...prev, avatarColor: AVATAR_COLORS[nextIndex] }));
  };

  return (
    <div className="relative hidden md:flex flex-col p-10 pt-8 text-white overflow-hidden min-h-130 gap-6">
      {/* Background */}
      <img src={heroImg} alt="Fondo de perfil" className="absolute inset-0 w-full h-full object-cover object-center" />
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 44, 81, 0.75)' }} />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <img src={logoImg} alt="ZenTrip" className="w-16 h-16" />
        <div className="flex flex-col">
          <span className="title-h2-desktop text-white tracking-tight leading-tight">
            Zen<span className="text-primary-3">Trip</span>
          </span>
          <span className="title-h3-desktop text-white -mt-1">Plan, Pack &amp; GO</span>
        </div>
      </div>

      {/* Hero text */}
      <div className="relative z-10">
        <h2 className="font-[Montserrat] text-4xl font-bold text-white leading-tight">
          Tu perfil,<br />
          tu <span className="text-primary-3">aventura</span>.
        </h2>
        <p className="mt-3 text-white/70 max-w-xs leading-relaxed text-sm">
          Personaliza tu experiencia y conecta con otros viajeros que comparten tu espíritu
        </p>
      </div>

      {/* User card */}
      <div className="relative z-10 flex items-center gap-3 rounded-2xl bg-white/10 border border-white/10 px-4 py-3">
        <div className="relative shrink-0">
          <div
            className="relative h-11 w-11 rounded-full bg-secondary-5 flex items-center justify-center overflow-hidden"
            style={avatarBackground ? { backgroundColor: avatarBackground } : undefined}
          >
            {form.profilePhoto ? (
              <>
                <img
                  src={form.profilePhoto}
                  alt="avatar"
                  className="h-full w-full rounded-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                {avatarBackground && (
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: avatarBackground, opacity: 0.35 }}
                  />
                )}
              </>
            ) : (
              <span className="text-sm font-bold text-white select-none">{initials}</span>
            )}
          </div>
          <button
            type="button"
            aria-label="Cambiar color del avatar"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-white text-slate-700 border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition"
            onClick={handleAvatarColorChange}
          >
            <Paintbrush size={11} />
          </button>
          {avatarBackground && (
            <span
              className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-slate-900"
              style={{ backgroundColor: avatarBackground }}
            />
          )}
        </div>
        <div className="min-w-0">
          <p className="body-bold text-white truncate">
            {form.firstName || 'Tu nombre'} {form.lastName}
          </p>
          <p className="body-3 text-white/60 truncate">{usuario?.email}</p>
        </div>
      </div>

      {/* Google button */}
      <button
        type="button"
        className="relative z-10 w-full flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-white text-sm transition hover:bg-white/15 cursor-pointer"
      >
        <GoogleIcon />
        Vincular con Google
      </button>

      {/* Navigation */}
      <nav className="relative z-10 space-y-1">
        {NAV_ITEMS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveSection(key)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer
              ${activeSection === key
                ? 'bg-white/15 text-white'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
          >
            <Icon />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
