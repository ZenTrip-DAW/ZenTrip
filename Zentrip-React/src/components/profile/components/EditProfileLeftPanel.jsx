import { User, Clock, Lock } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

const NAV_ITEMS = [
  { key: 'datosPersonales', label: 'Datos personales', Icon: User },
  { key: 'preferencias', label: 'Preferencias', Icon: Clock },
  { key: 'seguridad', label: 'Seguridad', Icon: Lock },
];

export default function EditProfileLeftPanel({ heroImg, logoImg, usuario, form }) {
  const initials = `${form.nombre?.[0] || ''}${form.apellidos?.[0] || ''}`.toUpperCase() || '?';

  return (
    <div className="relative hidden md:flex flex-col p-10 pt-8 text-white overflow-hidden min-h-130 gap-6">
      {/* Background */}
      <img
        src={heroImg}
        alt="Fondo de perfil"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
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
        <p className="mt-3 bodytext-white/70 max-w-xs leading-relaxed">
          Personaliza tu experiencia y conecta con otros viajeros que comparten tu espíritu
        </p>
      </div>

      {/* User card */}
      <div className="relative z-10 flex items-center gap-3 rounded-2xl bg-white/10 border border-white/10 px-4 py-3">
        <div className="relative shrink-0">
          <div className="h-11 w-11 rounded-full bg-secondary-5 flex items-center justify-center border-2 border-white/20">
            {form.fotoPerfil ? (
              <img
                src={form.fotoPerfil}
                alt="avatar"
                className="h-full w-full rounded-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <span className="text-sm font-bold text-white select-none">{initials}</span>
            )}
          </div>
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-primario-3 border-2 border-slate-900" />
        </div>
        <div className="min-w-0">
          <p className="body-bold text-white truncate">
            {form.nombre || 'Tu nombre'} {form.apellidos}
          </p>
          <p className="body-3 text-white/60 truncate">{usuario?.email}</p>
        </div>
      </div>

      {/* Google button */}
      <button
        type="button"
        className="relative z-10 w-full flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 bodytext-white transition hover:bg-white/15 cursor-pointer"
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
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bodyfont-medium transition cursor-pointer
              ${key === 'datosPersonales'
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
