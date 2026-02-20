import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { useState } from 'react';

const Register = () => {

    // const [formulario, setFormulario] = useState([]);
    // const [error, setError] = useState(false);
    // const [success, setSuccess] = useState(false);

    // const OnChangeHandler = (e) => {
    //     setFormulario({ ...formulario, [e.target.name]: e.target.value })
    // }

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(null); // Limpiar errores previos
        setSuccess(false); // Limpiar éxito previo

        try {
            // Crea un nuevo usuario con email y contraseña
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log("Usuario registrado:", userCredential.user);

            // Opcional: Obtener el token de ID después del registro
            const idToken = await userCredential.user.getIdToken();
            console.log("Token de ID:", idToken);

            setSuccess(true);
            // Aquí podrías redirigir al usuario o actualizar el estado de la aplicación
            // Por ejemplo, almacenar el token en localStorage o un contexto global
            localStorage.setItem('firebaseIdToken', idToken);

        } catch (err) {
            console.error("Error al registrarse:", err.message);
            setError(err.message);
        }
    };



    return (
        <div>
            <div className="min-h-dvh bg-gradient-to-br from-sky-950 via-slate-950 to-orange-950">
                <div className="mx-auto flex min-h-dvh max-w-5xl items-center justify-center px-4 py-10">
                    <div className="grid w-full grid-cols-1 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur md:grid-cols-[1.1fr_1fr]">
                        {/* Lado brand + logo */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/25 via-slate-900/10 to-orange-500/25" />
                            <div className="relative flex h-full flex-col justify-between p-8 sm:p-10">
                                {/* Logo + nombre */}
                                <div className="flex items-center gap-4">
                                    {/* Aquí va tu logo con fondo transparente */}
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

                                <div className="mt-8 max-w-md">
                                    <p className="text-sm sm:text-base leading-7 text-white/75">
                                        Organiza itinerario, presupuesto, equipaje colaborativo, viajes pet-friendly
                                        y decisiones en grupo desde una única plataforma.
                                    </p>
                                </div>

                                <div className="mt-8 space-y-3 text-xs sm:text-sm text-white/80">
                                    <div className="flex items-start gap-3">
                                        <span className="mt-1 h-6 w-6 shrink-0 rounded-full bg-sky-500/25 text-center text-[11px] font-semibold leading-6 text-sky-100">
                                            ✔
                                        </span>
                                        <p>Centraliza todo el viaje: actividades, gastos y chat.</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="mt-1 h-6 w-6 shrink-0 rounded-full bg-orange-500/25 text-center text-[11px] font-semibold leading-6 text-orange-100">
                                            ✔
                                        </span>
                                        <p>Votaciones rápidas para decidir en grupo sin dramas.</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="mt-1 h-6 w-6 shrink-0 rounded-full bg-emerald-500/25 text-center text-[11px] font-semibold leading-6 text-emerald-100">
                                            ✔
                                        </span>
                                        <p>Viajes pet-friendly con filtros y costes claros.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Lado formulario */}
                        <div className="p-6 sm:p-8">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-semibold text-white">Crear cuenta</h2>
                                    <p className="mt-1 text-xs text-white/60">
                                        Empieza a planificar tu próximo viaje en minutos.
                                    </p>
                                </div>
                            </div>

                            {/* Botón Google */}
                            <button
                                type="button"
                                className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                            >
                                <span className="grid h-5 w-5 place-items-center rounded bg-white text-slate-900 text-[10px] font-bold">
                                    G
                                </span>
                                Continuar con Google
                            </button>

                            {/* Separador */}
                            <div className="my-6 flex items-center gap-3">
                                <div className="h-px flex-1 bg-white/10" />
                                <span className="text-xs text-white/50">o con email</span>
                                <div className="h-px flex-1 bg-white/10" />
                            </div>

                            {/* Formulario email/contraseña (sin nombre) */}
                            <form className="space-y-4" onSubmit={handleRegister}>
                                <div>
                                    <label className="text-xs text-white/70">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        autoComplete="email"
                                        className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/30"
                                        placeholder="tu@email.com"
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="text-xs text-white/70">Contraseña</label>
                                        <input
                                            type="password"
                                            name="password"
                                            autoComplete="new-password"
                                            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-orange-400/50 focus:ring-2 focus:ring-orange-400/30"
                                            placeholder="Mínimo 6 caracteres"
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                    {/* <div>
                                        <label className="text-xs text-white/70">Repetir contraseña</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-orange-400/50 focus:ring-2 focus:ring-orange-400/30"
                                            placeholder="Confirma tu contraseña"
                                        />
                                    </div> */}
                                </div>

                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-orange-400 focus:ring-orange-400/60"
                                    />
                                    <p className="text-xs text-white/60">
                                        Acepto los{" "}
                                        <button type="button" className="underline underline-offset-2 hover:text-white">
                                            términos de uso
                                        </button>{" "}
                                        y la{" "}
                                        <button type="button" className="underline underline-offset-2 hover:text-white">
                                            política de privacidad
                                        </button>
                                        .
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-orange-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/25 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-orange-300/60"
                                >
                                    Crear cuenta
                                </button>

                                <p className="pt-1 text-center text-xs text-white/55">
                                    ¿Ya tienes cuenta?{" "}
                                    <button type="button" className="font-medium text-sky-300 hover:text-sky-200">
                                        Inicia sesión
                                    </button>
                                </p>
                            </form>
                            {success && <p style={{ color: 'green' }}>¡Registro exitoso!</p>}
                            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Register