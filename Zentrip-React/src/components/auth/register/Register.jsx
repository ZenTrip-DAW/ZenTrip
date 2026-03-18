import { useNavigate } from 'react-router-dom';
import LoginLeftPanel from '../login/components/LoginLeftPanel';
import RegisterForm from './components/RegisterForm';
import { useRegisterController } from './hooks/useRegisterController';

const heroImg = '/img/background/register/full-shot-silhouettes-people-jumping-sunset.jpg';
const logoImg = '/img/logo/logo-sin-texto-png.png';
import { ROUTES } from '../../../config/routes';

const REGISTER_OVERLAY_COLOR = 'rgba(87, 32, 0, 0.75)';

export default function Register() {
    const navigate = useNavigate();
    const {
        form,
        errors,
        generalError,
        success,
        successMessage,
        hasRegisterMessage,
        handleFieldChange,
        handleRegister,
        handleGoogleSignUp,
    } = useRegisterController(navigate);

    return (
        <div className={`h-dvh md:min-h-screen flex items-center justify-center bg-brand-white px-4 md:px-8 lg:px-16 ${hasRegisterMessage ? 'overflow-y-auto' : 'overflow-hidden'} md:overflow-y-auto`}>
            <div className="w-full max-w-5xl grid md:grid-cols-2 md:rounded-2xl md:shadow-[0_0_18px_rgba(15,23,42,0.30)] md:overflow-hidden">
                <LoginLeftPanel
                    heroImg={heroImg}
                    logoImg={logoImg}
                    overlayColor={REGISTER_OVERLAY_COLOR}
                    onGoBack={() => navigate('/')}
                />

                <RegisterForm
                    logoImg={logoImg}
                    form={form}
                    errors={errors}
                    generalError={generalError}
                    success={success}
                    successMessage={successMessage}
                    onFieldChange={handleFieldChange}
                    onSubmit={handleRegister}
                    onGoogleSignUp={handleGoogleSignUp}
                    onGoToLogin={() => navigate(ROUTES.AUTH.LOGIN)}
                />
            </div>
        </div>
    );
}
