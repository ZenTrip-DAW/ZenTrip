import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { auth, db } from '../auth/register/firebaseConfig';
import Input from '../ui/Input';
import Button from '../ui/Button';

const IDIOMAS = ['Español', 'English', 'Français', 'Deutsch', 'Italiano', 'Português'];
const MONEDAS = ['EUR €', 'USD $', 'GBP £', 'JPY ¥', 'MXN $'];

const EditProfile = () => {
    const [usuario, setUsuario] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [exito, setExito] = useState(false);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        nombre: '',
        apellidos: '',
        username: '',
        bio: '',
        telefono: '',
        pais: '',
        idioma: 'Español',
        moneda: 'EUR €',
        fotoPerfil: '',
        viajesSoloGrupo: 'ambos',
        petFriendly: false,
    });

    // Carga el usuario autenticado y sus datos de Firestore
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setCargando(false);
                return;
            }
            setUsuario(user);
            try {
                const ref = doc(db, 'usuarios', user.uid);
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    setForm((prev) => ({ ...prev, ...snap.data() }));
                } else {
                    // Rellena con datos de Auth si no existe el doc
                    const [nombre = '', ...resto] = (user.displayName || '').split(' ');
                    setForm((prev) => ({
                        ...prev,
                        nombre,
                        apellidos: resto.join(' '),
                        fotoPerfil: user.photoURL || '',
                    }));
                }
            } catch (err) {
                console.error('Error cargando perfil:', err);
            }
            setCargando(false);
        });
        return () => unsubscribe();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        if (!usuario) return;
        setGuardando(true);
        setError(null);
        setExito(false);
        try {
            const ref = doc(db, 'usuarios', usuario.uid);
            await setDoc(ref, { ...form, email: usuario.email, uid: usuario.uid }, { merge: true });

            // Actualiza displayName en Firebase Auth
            await updateProfile(usuario, {
                displayName: `${form.nombre} ${form.apellidos}`.trim(),
                photoURL: form.fotoPerfil || null,
            });

            setExito(true);
            setTimeout(() => setExito(false), 3000);
        } catch (err) {
            console.error('Error guardando perfil:', err);
            setError('No se pudo guardar el perfil. Inténtalo de nuevo.');
        }
        setGuardando(false);
    };

    if (cargando) {
        return (
            <div className="min-h-dvh bg-gradient-to-br from-sky-950 via-slate-950 to-orange-950 flex items-center justify-center">
                <div className="h-10 w-10 rounded-full border-4 border-sky-400/30 border-t-sky-400 animate-spin" />
            </div>
        );
    }

    if (!usuario) {
        return (
            <div className="min-h-dvh bg-gradient-to-br from-sky-950 via-slate-950 to-orange-950 flex items-center justify-center">
                <p className="text-white/70 text-sm">Debes iniciar sesión para editar tu perfil.</p>
            </div>
        );
    }

    return (
        <div className="min-h-dvh bg-gradient-to-br from-sky-950 via-slate-950 to-orange-950">
            <div className="mx-auto flex min-h-dvh max-w-5xl items-center justify-center px-4 py-10">
                <div className="grid w-full grid-cols-1 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur md:grid-cols-[1.1fr_1fr]">

                    {/* Panel izquierdo: avatar + info fija */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/25 via-slate-900/10 to-orange-500/25" />
                        <div className="relative flex h-full flex-col justify-between p-8 sm:p-10">

                            {/* Logo */}
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-xl bg-white/10 flex items-center justify-center">
                                    <img src="/img/logo/zentrip-logo-white-background.png" alt="Logo ZenTrip" />
                                </div>
                                <div>
                                    <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                                        Zen<span className="text-orange-500">Trip</span>
                                    </h1>
                                    <p className="mt-1 text-xs sm:text-sm font-medium uppercase tracking-[0.18em] text-white/70">
                                        Plan, Pack & Go
                                    </p>
                                </div>
                            </div>

                            {/* Avatar */}
                            <div className="mt-8 flex flex-col items-center gap-4">
                                <div className="relative">
                                    <div className="h-28 w-28 rounded-full border-4 border-white/20 overflow-hidden bg-white/10 flex items-center justify-center">
                                        {form.fotoPerfil ? (
                                            <img
                                                src={form.fotoPerfil}
                                                alt="Foto de perfil"
                                                className="h-full w-full object-cover"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        ) : (
                                            <span className="text-4xl text-white/40 select-none">
                                                {form.nombre ? form.nombre[0].toUpperCase() : '?'}
                                            </span>
                                        )}
                                    </div>
                                    <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-slate-950" />
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-semibold text-white leading-tight">
                                        {form.nombre || 'Tu nombre'}{' '}
                                        <span className="text-white/60">{form.apellidos}</span>
                                    </p>
                                    {form.username && (
                                        <p className="mt-0.5 text-xs text-sky-300">@{form.username}</p>
                                    )}
                                    <p className="mt-1 text-xs text-white/50">{usuario.email}</p>
                                </div>
                            </div>

                            {/* Info de viaje */}
                            <div className="mt-8 space-y-3 text-xs sm:text-sm text-white/75">
                                <div className="flex items-start gap-3">
                                    <span className="mt-1 h-6 w-6 shrink-0 rounded-full bg-sky-500/25 text-center text-[11px] font-semibold leading-6 text-sky-100">✔</span>
                                    <p>Tu perfil es visible para los compañeros de viaje.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="mt-1 h-6 w-6 shrink-0 rounded-full bg-orange-500/25 text-center text-[11px] font-semibold leading-6 text-orange-100">✔</span>
                                    <p>Los datos se guardan en tiempo real en la nube.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="mt-1 h-6 w-6 shrink-0 rounded-full bg-emerald-500/25 text-center text-[11px] font-semibold leading-6 text-emerald-100">✔</span>
                                    <p>Puedes cambiar tu información cuando quieras.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Panel derecho: formulario */}
                    <div className="p-6 sm:p-8 overflow-y-auto max-h-[90vh]">
                        <div>
                            <h2 className="text-lg sm:text-xl font-semibold text-white">Editar perfil</h2>
                            <p className="mt-1 text-xs text-white/60">
                                Actualiza tu información personal y preferencias de viaje.
                            </p>
                        </div>

                        <form className="mt-6 space-y-4" onSubmit={handleGuardar}>

                            {/* Nombre y apellidos */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Input
                                    label="Nombre"
                                    type="text"
                                    name="nombre"
                                    value={form.nombre}
                                    onChange={handleChange}
                                    placeholder="Tu nombre"
                                />
                                <Input
                                    label="Apellidos"
                                    type="text"
                                    name="apellidos"
                                    value={form.apellidos}
                                    onChange={handleChange}
                                    placeholder="Tus apellidos"
                                />
                            </div>

                            {/* Username */}
                            <div>
                                <label className="text-xs text-white/70">Nombre de usuario</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/40">@</span>
                                    <Input
                                        type="text"
                                        name="username"
                                        value={form.username}
                                        onChange={handleChange}
                                        placeholder="usuario123"
                                        className="pl-8"
                                    />
                                </div>
                            </div>

                            {/* Bio */}
                            <div>
                                <label className="text-xs text-white/70">Biografía</label>
                                <textarea
                                    name="bio"
                                    value={form.bio}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Cuéntanos algo sobre ti y cómo viajas..."
                                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/30 resize-none"
                                />
                            </div>

                            {/* URL foto de perfil */}
                            <Input
                                label="URL foto de perfil"
                                type="url"
                                name="fotoPerfil"
                                value={form.fotoPerfil}
                                onChange={handleChange}
                                placeholder="https://..."
                                focusOrange
                            />

                            {/* Teléfono y país */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Input
                                    label="Teléfono"
                                    type="tel"
                                    name="telefono"
                                    value={form.telefono}
                                    onChange={handleChange}
                                    placeholder="+34 600 000 000"
                                />
                                <Input
                                    label="País"
                                    type="text"
                                    name="pais"
                                    value={form.pais}
                                    onChange={handleChange}
                                    placeholder="España"
                                />
                            </div>

                            {/* Separador preferencias */}
                            <div className="flex items-center gap-3 pt-1">
                                <div className="h-px flex-1 bg-white/10" />
                                <span className="text-xs text-white/40">Preferencias de viaje</span>
                                <div className="h-px flex-1 bg-white/10" />
                            </div>

                            {/* Idioma y moneda */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-xs text-white/70">Idioma</label>
                                    <select
                                        name="idioma"
                                        value={form.idioma}
                                        onChange={handleChange}
                                        className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/30"
                                    >
                                        {IDIOMAS.map((i) => <option key={i} value={i}>{i}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-white/70">Moneda preferida</label>
                                    <select
                                        name="moneda"
                                        value={form.moneda}
                                        onChange={handleChange}
                                        className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/30"
                                    >
                                        {MONEDAS.map((m) => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Tipo de viaje */}
                            <div>
                                <label className="text-xs text-white/70">Tipo de viaje preferido</label>
                                <div className="mt-2 flex gap-2">
                                    {['solo', 'grupo', 'ambos'].map((op) => (
                                        <button
                                            key={op}
                                            type="button"
                                            onClick={() => setForm((p) => ({ ...p, viajesSoloGrupo: op }))}
                                            className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-medium capitalize transition
                                                ${form.viajesSoloGrupo === op
                                                    ? 'border-sky-400/50 bg-sky-500/20 text-sky-200'
                                                    : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'}`}
                                        >
                                            {op === 'ambos' ? 'Ambos' : op === 'solo' ? 'Solo' : 'En grupo'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Pet-friendly */}
                            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                                <div>
                                    <p className="text-sm text-white">Viajero pet-friendly</p>
                                    <p className="text-xs text-white/50">Busca alojamientos y actividades con mascotas</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setForm((p) => ({ ...p, petFriendly: !p.petFriendly }))}
                                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none
                                        ${form.petFriendly ? 'bg-emerald-500' : 'bg-white/20'}`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform
                                            ${form.petFriendly ? 'translate-x-5' : 'translate-x-0'}`}
                                    />
                                </button>
                            </div>

                            {/* Feedback */}
                            {error && (
                                <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                                    {error}
                                </p>
                            )}
                            {exito && (
                                <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
                                    ¡Perfil guardado correctamente!
                                </p>
                            )}

                            {/* Botón guardar */}
                            <Button type="submit" disabled={guardando}>
                                {guardando ? 'Guardando...' : 'Guardar cambios'}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditProfile;
