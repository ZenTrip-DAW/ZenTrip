import { useNavigate } from 'react-router-dom';
import { useLoginController } from './hooks/useLoginController';

const heroImg = '/img/background/login/happy-young-people-taking-selfie-near-red-car.jpg';
const logoImg = '/img/logo/logo-sin-texto-png.png';
import LoginLeftPanel from './components/LoginLeftPanel';
import LoginForm from './components/LoginForm';

export default function Login() {
  const navigate = useNavigate();
  const {
    email,
    password,
    error,
    info,
    canResendVerification,
    isSendingAgain,
    secondsToResend,
    isLoading,
    isGoogleLoading,
    setEmail,
    setPassword,
    handleLogin,
    handleForgotPassword,
    handleResendVerification,
    handleGoogleLogin,
  } = useLoginController(navigate);

  const hasLoginMessage = Boolean(error || info);

  
  return (
    <div className={`h-dvh md:min-h-screen flex items-center justify-center bg-brand-white px-4 md:px-8 lg:px-16 ${hasLoginMessage ? 'overflow-y-auto' : 'overflow-hidden'} md:overflow-y-auto`}>
      <div className="w-full max-w-5xl grid md:grid-cols-2 md:rounded-2xl md:shadow-[0_0_18px_rgba(15,23,42,0.30)] md:overflow-hidden">
        <LoginLeftPanel heroImg={heroImg} logoImg={logoImg} onGoBack={() => navigate('/')} />
        <LoginForm
          logoImg={logoImg}
          email={email}
          password={password}
          error={error}
          info={info}
          canResendVerification={canResendVerification}
          isSendingAgain={isSendingAgain}
          secondsToResend={secondsToResend}
          isLoading={isLoading}
          isGoogleLoading={isGoogleLoading}
          onEmailChange={(event) => setEmail(event.target.value)}
          onPasswordChange={(event) => setPassword(event.target.value)}
          onSubmit={handleLogin}
          onForgotPassword={handleForgotPassword}
          onResendVerification={handleResendVerification}
          onGoogleLogin={handleGoogleLogin}
          onGoToRegister={() => navigate('/Auth/Register')}
        />
      </div>
    </div>
  );
}