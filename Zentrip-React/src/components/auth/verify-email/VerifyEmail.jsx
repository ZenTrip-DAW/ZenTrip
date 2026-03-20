/*  Es una página informativa que se muestra después de que el usuario se registra exitosamente
    y se le envía un email de verificación. Solo muestra un mensaje y un botón para ir a iniciar sesión. */
import { useLocation, useNavigate } from 'react-router-dom';

export default function VerifyEmail() {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="w-full max-w-lg mx-4 bg-white p-10 rounded-2xl shadow-2xl">
                <h1 className="text-2xl font-semibold text-slate-800 mb-3">Verifica tu correo</h1>
                <p className="text-slate-600 mb-6 leading-7">
                    Te hemos enviado un email de verificación{email ? ` a ${email}` : ''}. Abre el enlace de ese correo para activar tu cuenta.
                </p>

                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={() => navigate('/Auth/Login')}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-semibold transition duration-200"
                    >
                        Ir a iniciar sesión
                    </button>

                    <p className="text-sm text-slate-500 text-center">
                        Si no lo ves, revisa spam o promociones.
                    </p>
                </div>
            </div>
        </div>
    );
}
