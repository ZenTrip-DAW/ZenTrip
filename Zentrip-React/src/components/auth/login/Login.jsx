import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { sendEmailVerification, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../register/firebaseConfig';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
{/*Si el correo no está verificado, muestra un mensaje de error y ofrece la opción de reenviar el correo de verificación. */}
export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [canResendVerification, setCanResendVerification] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setCanResendVerification(false);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setError('Tu correo aún no está verificado. Revisa tu bandeja de entrada.');
        setCanResendVerification(true);
        await signOut(auth);
        return;
      }

      const idToken = await user.getIdToken();
      localStorage.setItem('firebaseIdToken', idToken);
      navigate('/perfil/editar');
    } catch (loginError) {
      setCanResendVerification(false);
      setError('No se pudo iniciar sesión. Revisa email y contraseña.');
      console.error('Error al iniciar sesión:', loginError.message);
    }
  };

  const handleResendVerification = async () => {
    setError('');
    setInfo('');

    if (!email || !password) {
      setError('Para reenviar la verificación, introduce email y contraseña.');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user.emailVerified) {
        setInfo('Tu correo ya está verificado. Ya puedes iniciar sesión.');
        setCanResendVerification(false);
        await signOut(auth);
        return;
      }

      await sendEmailVerification(user, {
        url: `${window.location.origin}/Auth/Login`
      });
      setInfo('Correo de verificación reenviado. Revisa también spam/promociones.');
      setCanResendVerification(true);
      await signOut(auth);
    } catch (resendError) {
      setError('No fue posible reenviar el correo de verificación.');
      console.error('Error al reenviar verificación:', resendError.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      
      <div className="w-full max-w-5xl mx-4 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden grid md:grid-cols-2">
        
        {/* Branding Side */}
        <div className="hidden md:flex flex-col justify-center items-center text-white p-12 bg-gradient-to-br from-blue-800/80 to-slate-900/80">
          <h1 className="text-4xl font-bold tracking-tight">✈️ ZenTrip</h1>
          <p className="text-lg text-blue-200 mt-4">Plan. Pack. Go.</p>
          <p className="mt-6 text-sm text-blue-300 text-center max-w-xs">
            Organiza tu itinerario, presupuesto, equipaje y decisiones en grupo en un solo lugar.
          </p>
        </div>

        {/* Form Side */}
        <div className="bg-white p-10">
          <h2 className="text-2xl font-semibold text-slate-800 mb-2">
            Bienvenido de nuevo
          </h2>
          <p className="text-slate-500 mb-6 text-sm">
            Accede para continuar planificando tu aventura
          </p>
          {/* El formulario de inicio de sesión */}
          <form className="space-y-4" onSubmit={handleLogin}>

            <Input
              label="Email"
              variant="light"
              type="email"
              placeholder="ejemplo@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Contraseña"
              variant="light"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input type="checkbox" className="accent-orange-500" />
                Recordarme
              </label>
              <a href="#" className="text-blue-700 hover:text-blue-900 font-medium">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <Button variant="orange" type="submit">
              Iniciar sesión
            </Button>
            {/* Mostrar el botón de reenviar verificación solo si el correo no está verificado */}
            {canResendVerification && (
              <Button variant="ghost" type="button" onClick={handleResendVerification}>
                Reenviar correo de verificación
              </Button>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
            {info && <p className="text-sm text-green-600">{info}</p>}
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            ¿No tienes cuenta?{" "}
            <button type="button" className="text-blue-700 font-medium hover:underline" onClick={() => navigate('/Auth/Register')}>
              Crear cuenta
            </button>
          </div>

          <div className="mt-6">
            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-slate-300"></div>
              <span className="mx-4 text-slate-400 text-sm">o continúa con</span>
              <div className="flex-grow border-t border-slate-300"></div>
            </div>

            <Button variant="ghost" type="button">
              Continuar con Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}