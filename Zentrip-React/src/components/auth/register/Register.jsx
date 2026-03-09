import { createUserWithEmailAndPassword, GoogleAuthProvider, sendEmailVerification, signInWithPopup } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirebaseErrorByField } from '../../../utils/firebaseErrorMessages';
import { validateEmail, validatePassword, validatePolicies, validateConfirmPassword } from '../../../utils/validation';

const Register = () => {

    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        policies: false,
    });

    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState(null); // Errores generales de Firebase
    const [success, setSuccess] = useState(false);

    // Función de validación
    const validateField = (name, value, allValues = form) => {
        switch (name) {
            case 'email': {
                const errs = validateEmail(value);
                return errs.length > 0 ? errs[0] : '';
            }
            case 'password': {
                return validatePassword(value, allValues.confirmPassword);
            }
            case 'confirmPassword': {
                return validateConfirmPassword(value, allValues.password);
            }
            case 'policies': {
                const errs = validatePolicies(value);
                return errs.length > 0 ? errs[0] : '';
            }
            default:
                return '';
        }
    };

    // Maneja el cambio de los inputs
    const handleChange = (e) => {
        const { name, type, value, checked } = e.target;
        const fieldValue = type === 'checkbox' ? checked : value;
        const newForm = { ...form, [name]: fieldValue };
        setForm(newForm);

        setErrors({
            email: validateField('email', newForm.email, newForm),
            password: validateField('password', newForm.password, newForm),
            confirmPassword: validateField('confirmPassword', newForm.confirmPassword, newForm),
            policies: validateField('policies', newForm.policies, newForm),
        });
    };

    ///LOGEO CON CORREO Y CONTRASEÑA
    const handleRegister = async (e) => {
        e.preventDefault();
        setGeneralError(null);
        setSuccess(false);

        // Validar todos los campos, incluyendo policies
        const newErrors = {
            email: validateField('email', form.email, form),
            password: validateField('password', form.password, form),
            confirmPassword: validateField('confirmPassword', form.confirmPassword, form),
            policies: validateField('policies', form.policies, form),
        };
        setErrors(newErrors);

        // Si hay error de email, policies, confirmPassword o alguna regla de password no se cumple, no continuar
        if (
            newErrors.email ||
            newErrors.policies ||
            newErrors.confirmPassword ||
            (Array.isArray(newErrors.password) && newErrors.password.some(rule => rule.valid === false))
        ) return;

        try {
            // Crea un nuevo usuario con email y contraseña
            const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
            const user = userCredential.user;
            // Envía el email de verificación
            await sendEmailVerification(user, {
                url: `${window.location.origin}/Auth/Login`
            });

            // Crea el documento vacío en Firestore con solo el email y uid
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

            // Obtener el token de ID después del registro
            const idToken = await user.getIdToken();
            localStorage.setItem('firebaseIdToken', idToken);
            setSuccess(true);
            // Redirigir a la página de verificación de correo con el email en el estado
            navigate('/Auth/VerifyEmail', {
                state: { email: user.email || form.email }
            });

        } catch (err) {
            // Clasifica el error de Firebase por campo
            const { field, message } = getFirebaseErrorByField(err);
            if (field === 'email' || field === 'password') {
                setErrors((prev) => ({ ...prev, [field]: message }));
            } else {
                setGeneralError(message);
            }
        }
    };

    ///LOGEO CON GOOGLE

    const handleGoogleSignUp = async () => {
        const provider = new GoogleAuthProvider();
        try {
            
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Crea el documento en Firestore si es la primera vez
            const [nombre = '', ...resto] = (user.displayName || '').split(' ');
            await setDoc(doc(db, 'usuarios', user.uid), {
                uid: user.uid,
                email: user.email,
                nombre,
                apellidos: resto.join(' '),
                username: '',
                bio: '',
                telefono: '',
                pais: '',
                fotoPerfil: user.photoURL || '',
                idioma: 'Español',
                moneda: 'EUR €',
                viajesSoloGrupo: 'ambos',
                petFriendly: false,
            }, { merge: true }); // merge:true para no sobreescribir si ya existe

            navigate('/perfil/editar');

        } catch (error) {
            console.error('Error al registrarse/iniciar sesión con Google:', error.message);

            const errorCode = error.code;
            const errorMessage = error.message;
            
            if (errorCode === 'auth/popup-closed-by-user') {
                alert('El registro/inicio de sesión con Google fue cancelado.');
            } else {
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
                            <form className="space-y-4" onSubmit={handleRegister} noValidate>
                                <div>
                                    <label className="text-xs text-white/70">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        autoComplete="email"
                                        className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/30"
                                        placeholder="tu@email.com"
                                        value={form.email}
                                        onChange={handleChange}
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-xs text-red-400">{errors.email}</p>
                                    )}
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="text-xs text-white/70">Contraseña</label>
                                        <input
                                            type="password"
                                            name="password"
                                            autoComplete="new-password"
                                            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-orange-400/50 focus:ring-2 focus:ring-orange-400/30"
                                            placeholder="Mínimo 6 caracteres, mayúscula y especial"
                                            value={form.password}
                                            onChange={handleChange}
                                        />
                                        {/* Mostrar reglas de contraseña */}
                                        {Array.isArray(errors.password) && (
                                            <ul className="mt-2 space-y-0">
                                                {errors.password.map((rule, idx) => (
                                                    <li
                                                        key={rule.key}
                                                        className={`flex items-center text-xs font-medium whitespace-nowrap ${rule.valid ? 'text-sky-400' : 'text-red-400'}`}
                                                        style={{ lineHeight: '1.7', marginBottom: 0 }}
                                                    >
                                                        <span className={`inline-block w-4 text-center mr-1 font-bold text-base ${rule.valid ? 'text-sky-400' : 'text-red-400'}`}
                                                            style={{ minWidth: '1.2em' }}>
                                                            {rule.valid ? '✓' : '✗'}
                                                        </span>
                                                        {rule.message}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <label className="text-xs text-white/70">Repetir contraseña</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={form.confirmPassword}
                                            onChange={handleChange}
                                            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-orange-400/50 focus:ring-2 focus:ring-orange-400/30"
                                            placeholder="Confirma tu contraseña"
                                        />
                                        {/* El error de confirmación de contraseña se muestra en la lista de reglas de contraseña */}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            id="policies"
                                            name="policies"
                                            checked={form.policies}
                                            onChange={handleChange}
                                            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-orange-400 focus:ring-orange-400/60"
                                        />
                                        <p className="text-xs text-white/60">
                                            Acepto los{' '}
                                            <button type="button" className="underline underline-offset-2 hover:text-white">
                                                términos de uso
                                            </button>{' '}
                                            y la{' '}
                                            <button type="button" className="underline underline-offset-2 hover:text-white">
                                                política de privacidad
                                            </button>
                                            .
                                        </p>
                                    </div>
                                    {errors.policies && (
                                        <p className="text-xs text-red-400 ml-7">{errors.policies}</p>
                                    )}
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
                            {generalError && <p style={{ color: 'red' }}>Error: {generalError}</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Register