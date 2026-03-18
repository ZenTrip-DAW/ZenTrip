import Input from '../../../ui/Input';
import Button from '../../../ui/Button';
import GoogleIcon from '../../../ui/GoogleIcon';
import AlertMessage from '../../../ui/AlertMessage';
import PasswordVisibilityToggle from '../../../ui/PasswordVisibilityToggle';
import { usePasswordVisibility } from '../../../../hooks/usePasswordVisibility';

export default function RegisterForm({
    logoImg,
    form,
    errors,
    generalError,
    success,
    successMessage,
    onFieldChange,
    onSubmit,
    onGoogleSignUp,
    onGoToLogin,
}) {
    const passwordVisibility = usePasswordVisibility();
    const confirmPasswordVisibility = usePasswordVisibility();

    const validationErrors = [
        errors.email,
        Array.isArray(errors.password)
            ? errors.password
                .filter((rule) => rule.valid === false)
                .map((rule) => rule.message)
            : [],
        errors.confirmPassword,
        errors.policies,
    ]
        .flat()
        .filter(Boolean);

    const errorMessage = [...new Set([generalError, ...validationErrors].filter(Boolean))].join(' ');

    return (
        <div className="bg-brand-white flex flex-col justify-center px-6 py-6 md:px-10 md:py-12 w-full md:max-w-none max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-4 md:hidden">
                <img src={logoImg} alt="ZenTrip" className="w-16 h-16" />
                <span className="title-h3-mobile text-secondary-5 mt-2">
                    Zen<span className="text-primary-3">Trip</span>
                </span>
            </div>

            <h2 className="title-h2-desktop text-secondary-5">Crear cuenta</h2>
            <p className="body-2 text-neutral-4 mb-4 md:mb-6">
                Empieza a planificar tu próximo viaje en minutos.
            </p>

            <Button
                variant="ghost"
                type="button"
                onClick={onGoogleSignUp}
                className="w-full flex items-center justify-center gap-3 mb-4 md:mb-5"
            >
                <GoogleIcon />
                <span className="body-bold text-secondary-5">Continuar con Google</span>
            </Button>

            <div className="flex items-center gap-3 mb-4 md:mb-5">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="body-3 text-slate-400">o con email</span>
                <div className="flex-1 h-px bg-slate-200" />
            </div>

            <form className="space-y-4" onSubmit={onSubmit} noValidate>
                <Input
                    label={(
                        <>
                            Email <span className="text-feedback-error">*</span>
                        </>
                    )}
                    variant="light"
                    size="md"
                    labelClass="text-secondary-5"
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="ejemplo@email.com"
                    value={form.email}
                    onChange={onFieldChange}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <Input
                            label={(
                                <>
                                    Contraseña <span className="text-feedback-error">*</span>
                                </>
                            )}
                            variant="light"
                            size="md"
                            labelClass="text-secondary-5"
                            type={passwordVisibility.inputType}
                            name="password"
                            autoComplete="new-password"
                            placeholder="Introduce tu contraseña"
                            value={form.password}
                            onChange={onFieldChange}
                            rightElement={(
                                <PasswordVisibilityToggle
                                    isVisible={passwordVisibility.isVisible}
                                    onToggle={passwordVisibility.toggleVisibility}
                                />
                            )}
                        />
                    </div>

                    <Input
                        label={(
                            <>
                                Repetir Contraseña <span className="text-feedback-error">*</span>
                            </>
                        )}
                        variant="light"
                        size="md"
                        labelClass="text-secondary-5"
                        type={confirmPasswordVisibility.inputType}
                        name="confirmPassword"
                        placeholder="Confirma tu contraseña"
                        value={form.confirmPassword}
                        onChange={onFieldChange}
                        rightElement={(
                            <PasswordVisibilityToggle
                                isVisible={confirmPasswordVisibility.isVisible}
                                onToggle={confirmPasswordVisibility.toggleVisibility}
                                showLabel="Mostrar confirmación de contraseña"
                                hideLabel="Ocultar confirmación de contraseña"
                            />
                        )}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <div className="flex items-start gap-2">
                        <input
                            type="checkbox"
                            id="policies"
                            name="policies"
                            checked={form.policies}
                            onChange={onFieldChange}
                            className="mt-0.5 h-4 w-4 rounded border-neutral-2 text-primary-3 focus:ring-primary-3 cursor-pointer"
                        />
                        <label htmlFor="policies" className="body-3 text-neutral-4 cursor-pointer">
                            <span className="text-feedback-error mr-1">*</span>
                            Acepto los{' '}
                            <button type="button" className="body-3 underline underline-offset-2 text-neutral-5 hover:text-neutral-6">términos de uso</button>{' '}
                            y la{' '}
                            <button type="button" className="body-3 underline underline-offset-2 text-neutral-5 hover:text-neutral-6">política de privacidad</button>.
                        </label>
                    </div>
                </div>

                <AlertMessage message={errorMessage} variant="error" />
                <AlertMessage message={success ? successMessage : null} variant="success" />

                <Button variant="orange" type="submit" className="w-full">
                    Crear Cuenta
                </Button>
            </form>

            <p className="body-bold text-center text-neutral-3 mt-6">
                ¿Ya tienes cuenta?{' '}
                <a
                    className="body-bold text-primary-3 hover:text-orange-400 transition cursor-pointer"
                    onClick={onGoToLogin}
                >
                    Inicia sesión
                </a>
            </p>
        </div>
    );
}
