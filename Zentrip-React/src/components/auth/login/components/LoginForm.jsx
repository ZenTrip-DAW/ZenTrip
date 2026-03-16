import Input from '../../../ui/Input';
import Button from '../../../ui/Button';

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function LoginForm({
  logoImg,
  email,
  password,
  error,
  info,
  canResendVerification,
  isSendingAgain,
  secondsToResend,
  isLoading,
  isGoogleLoading,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onForgotPassword,
  onResendVerification,
  onGoogleLogin,
  onGoToRegister,
}) {
  return (
    <div className="bg-white flex flex-col justify-center px-6 py-6 md:px-10 md:py-12 w-full md:max-w-none max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-4 md:mb-6 md:hidden">
        <img src={logoImg} alt="ZenTrip" className="w-16 h-16" />
        <span className="title-h3-mobile text-secondary-5 mt-2">
          Zen<span className="text-primary-3">Trip</span>
        </span>
      </div>

      <h2 className="title-h2-desktop text-secondary-5">Bienvenido</h2>
      <p className="body-2 text-slate-500 mb-4 md:mb-6">
        Accede para continuar planificando tu aventura
      </p>

      <Button
        variant="ghost"
        type="button"
        onClick={onGoogleLogin}
        disabled={isGoogleLoading}
        className="w-full flex items-center justify-center gap-3 mb-4 md:mb-5"
      >
        <GoogleIcon />
        <span className="body-bold text-secondary-5">
          {isGoogleLoading ? 'Conectando con Google...' : 'Continuar con Google'}
        </span>
      </Button>

      <div className="flex items-center gap-3 mb-4 md:mb-5">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="body-3 text-slate-400">o con email</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <Input
          label="Email"
          variant="light"
          size="md"
          labelClass="text-secondary-5"
          type="email"
          placeholder="ejemplo@email.com"
          value={email}
          onChange={onEmailChange}
        />

        <div>
          <Input
            label="Contraseña"
            variant="light"
            size="md"
            labelClass="text-secondary-5"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={onPasswordChange}
          />
          <div className="text-right mt-4">
            <a onClick={onForgotPassword} className="body-bold text-orange-500 hover:text-orange-400 font-medium cursor-pointer">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>

        {error && (
          <p className="body-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
            {error}
          </p>
        )}
        {info && (
          <p className="body-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
            {info}
          </p>
        )}

        <Button variant="orange" type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </Button>

        {canResendVerification && (
          <Button
            variant="ghost"
            type="button"
            onClick={onResendVerification}
            disabled={isSendingAgain || secondsToResend > 0}
            className="w-full"
          >
            {isSendingAgain
              ? 'Reenviando...'
              : secondsToResend > 0
                ? `Reenviar disponible en ${secondsToResend}s`
                : 'Reenviar correo de verificación'}
          </Button>
        )}
      </form>

      <p className="body-bold text-center text-neutral-3 mt-6">
        ¿No tienes cuenta?{' '}
        <a
          type="button"
          className="body-bold text-primary-3 hover:text-orange-400 transition cursor-pointer"
          onClick={onGoToRegister}
        >
          Crear cuenta
        </a>
      </p>
    </div>
  );
}
