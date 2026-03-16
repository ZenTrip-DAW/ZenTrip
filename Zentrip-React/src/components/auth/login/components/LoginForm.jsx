import Input from '../../../ui/Input';
import Button from '../../../ui/Button';
import GoogleIcon from '../../../ui/GoogleIcon';
import AlertMessage from '../../../ui/AlertMessage';

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

        <AlertMessage message={error} variant="error" />
        <AlertMessage message={info} variant="success" />

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
          className="body-bold text-primary-3 hover:text-orange-400 transition cursor-pointer"
          onClick={onGoToRegister}
        >
          Crear cuenta
        </a>
      </p>
    </div>
  );
}
