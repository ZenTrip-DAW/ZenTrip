import { useNavigate } from 'react-router-dom';
import { useLoginController } from './hooks/useLoginController';
import heroImg from '../../../../public/img/background/login/happy-young-people-taking-selfie-near-red-car.jpg';
import logoImg from '../../../../public/img/logo/logo-sin-texto-png.png';
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-blanco px-4">
      <div className="w-full max-w-5xl rounded-2xl shadow-[0_0_18px_rgba(15,23,42,0.30)] overflow-hidden grid md:grid-cols-2">
        <LoginLeftPanel heroImg={heroImg} logoImg={logoImg} />
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