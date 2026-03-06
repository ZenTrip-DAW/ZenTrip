// Importaciones de Firebase Auth: función para registrar con email/contraseña, proveedor de Google y función para abrir popup de login
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
// Instancias de Firebase Auth y Firestore configuradas en firebaseConfig.js
import { auth, db } from './firebaseConfig';
// Funciones de Firestore para referenciar un documento y escribir/sobreescribir datos en él
import { doc, setDoc } from 'firebase/firestore';
// Hook de React para manejar estado local del componente
import { useState } from 'react';
// Hook de React Router para navegar entre rutas programáticamente
import { useNavigate } from 'react-router-dom';

const Register = () => {

    // Hook para redirigir al usuario a otras páginas después del registro
    const navigate = useNavigate();

    // Estado del campo email del formulario
    const [email, setEmail] = useState('');
    // Estado del campo contraseña del formulario
    const [password, setPassword] = useState('');
    // Estado para almacenar el mensaje de error si el registro falla
    const [error, setError] = useState(null);
    // Estado para indicar si el registro fue exitoso
    const [success, setSuccess] = useState(false);

    // ─── REGISTRO CON EMAIL Y CONTRASEÑA ───────────────────────────────────────

    // Función que se ejecuta al enviar el formulario de registro
    const handleRegister = async (e) => {
        // Evita que el formulario recargue la página al hacer submit
        e.preventDefault();
        setError(null);   // Limpia cualquier error previo antes de intentar de nuevo
        setSuccess(false); // Limpia el estado de éxito previo

        try {
            // Llama a Firebase Auth para crear un nuevo usuario con email y contraseña
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Extrae el objeto usuario del resultado (contiene uid, email, etc.)
            const user = userCredential.user;
            console.log("Usuario registrado:", user);

            // Crea un documento en la colección 'usuarios' de Firestore usando el uid como ID.
            // Se guardan los campos de perfil con valores por defecto vacíos,
            // que el usuario rellenará después en la pantalla de edición de perfil.
            await setDoc(doc(db, 'usuarios', user.uid), {
                uid: user.uid,
                email: user.email,
                nombre: '',
                apellidos: '',
                username: '',
                bio: '',
                telefono: '',
                pais: '',
                fotoPerfil: '',
                idioma: 'Español',
                moneda: 'EUR €',
                viajesSoloGrupo: 'ambos',
                petFriendly: false,
            });

            // Obtiene el token JWT del usuario recién registrado
            // y lo guarda en localStorage para usarlo en peticiones autenticadas al backend
            const idToken = await user.getIdToken();
            localStorage.setItem('firebaseIdToken', idToken);

            setSuccess(true); // Marca el registro como exitoso
            navigate('/perfil/editar'); // Redirige al usuario a completar su perfil

        } catch (err) {
            // Si Firebase devuelve un error (email ya en uso, contraseña débil, etc.)
            // lo muestra en la interfaz
            console.error("Error al registrarse:", err.message);
            setError(err.message);
        }
    };

    // ─── REGISTRO / LOGIN CON GOOGLE ───────────────────────────────────────────

    // Función que abre el popup de Google para autenticarse
    const handleGoogleSignUp = async () => {
        // Crea una instancia del proveedor de Google
        const provider = new GoogleAuthProvider();
        try {
            // Abre el popup de selección de cuenta de Google y espera el resultado
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Separa el displayName de Google en nombre (primera palabra) y apellidos (el resto)
            const [nombre = '', ...resto] = (user.displayName || '').split(' ');

            // Escribe (o actualiza) el documento del usuario en Firestore.
            // Con { merge: true } solo se actualizan los campos indicados sin borrar
            // los datos existentes si el usuario ya había iniciado sesión antes con Google.
            await setDoc(doc(db, 'usuarios', user.uid), {
                uid: user.uid,
                email: user.email,
                nombre,
                apellidos: resto.join(' '),
                username: '',
                bio: '',
                telefono: '',
                pais: '',
                fotoPerfil: user.photoURL || '', // Usa la foto de perfil de Google si existe
                idioma: 'Español',
                moneda: 'EUR €',
                viajesSoloGrupo: 'ambos',
                petFriendly: false,
            }, { merge: true });

            // Redirige al usuario a completar/editar su perfil
            navigate('/perfil/editar');

        } catch (error) {
            console.error('Error al registrarse/iniciar sesión con Google:', error.message);

            const errorCode = error.code;
            const errorMessage = error.message;

            // Caso especial: el usuario cerró el popup de Google sin seleccionar cuenta
            if (errorCode === 'auth/popup-closed-by-user') {
                alert('El registro/inicio de sesión con Google fue cancelado.');
            } else {
                // Cualquier otro error de Firebase (cuenta bloqueada, red, etc.)
                alert(`Error al registrarse con Google: ${errorMessage}`);
            }
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
                                onClick={handleGoogleSignUp}
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
                                    {/* 
                                    
                                    <div>
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
                                    <button type="button" className="font-medium text-sky-300 hover:text-sky-200" onClick={() => navigate('/Auth/Login')}>
                                        Inicia sesión
                                    </button>
                                </p>
                            </form>
                            {success && <p style={{ color: 'green' }}>¡Registro exitoso!</p>}
                            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
                            {error && <p style={{ color: 'red' }}>Error: {error}</p>} {/*QUITAR ESTO CUANDO ESTÉ HECHO EL REDIRECT*/}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Register