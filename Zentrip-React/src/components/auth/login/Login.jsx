import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
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

          <form className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="ejemplo@email.com"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input type="checkbox" className="accent-orange-500" />
                Recordarme
              </label>
              <a href="#" className="text-blue-700 hover:text-blue-900 font-medium">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-semibold transition duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              Iniciar sesión
            </button>
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

            <button className="w-full border border-slate-300 py-2 rounded-lg hover:bg-slate-100 transition">
              Continuar con Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}