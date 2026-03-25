import { useEffect, useMemo, useState } from 'react';
import {
	applyActionCode,
	confirmPasswordReset,
	verifyPasswordResetCode,
} from 'firebase/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Input from '../../ui/Input';
import { auth } from '../../../config/firebaseConfig';
import { ROUTES } from '../../../config/routes';
import { validatePassword } from '../../../utils/validation/register/rules';

const INITIAL_VIEW = {
	status: 'loading',
	title: 'Procesando enlace...',
	message: 'Espera un momento mientras validamos el enlace.',
};

function mapActionError(code) {
	switch (code) {
		case 'auth/invalid-action-code':
			return 'El enlace no es válido o ya fue utilizado.';
		case 'auth/expired-action-code':
			return 'El enlace ha expirado. Solicita uno nuevo.';
		case 'auth/user-disabled':
			return 'Esta cuenta está deshabilitada.';
		case 'auth/user-not-found':
			return 'No se encontró una cuenta asociada a este enlace.';
		case 'auth/weak-password':
			return 'La nueva contraseña no cumple los requisitos de seguridad.';
		default:
			return 'No pudimos completar la acción. Inténtalo de nuevo.';
	}
}

export default function AuthActionHandler() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	const [view, setView] = useState(INITIAL_VIEW);
	const [email, setEmail] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [resetError, setResetError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [passwordRules, setPasswordRules] = useState([]);

	const mode = useMemo(() => searchParams.get('mode') || '', [searchParams]);
	const oobCode = useMemo(() => searchParams.get('oobCode') || '', [searchParams]);

	useEffect(() => {
		let mounted = true;

		async function processLink() {
			if (!mode || !oobCode) {
				if (!mounted) return;
				setView({
					status: 'error',
					title: 'Enlace incompleto',
					message: 'Faltan datos del enlace. Revisa el correo e intentalo de nuevo.',
				});
				return;
			}

			try {
				if (mode === 'verifyEmail') {
					await applyActionCode(auth, oobCode);
					if (!mounted) return;
					setView({
						status: 'verify-success',
						title: 'Correo verificado',
						message: 'Tu correo se verifico correctamente. Ya puedes iniciar sesion.',
					});
					return;
				}

				if (mode === 'resetPassword') {
					const accountEmail = await verifyPasswordResetCode(auth, oobCode);
					if (!mounted) return;
					setEmail(accountEmail);
					setView({
						status: 'reset-form',
						title: 'Crear nueva contrasena',
						message: 'Escribe una nueva contrasena para continuar.',
					});
					return;
				}

				if (!mounted) return;
				setView({
					status: 'error',
					title: 'Accion no soportada',
					message: 'Este enlace no corresponde a una accion compatible en la app.',
				});
			} catch (error) {
				if (!mounted) return;
				setView({
					status: 'error',
					title: 'No se pudo procesar el enlace',
					message: mapActionError(error?.code),
				});
			}
		}

		processLink();

		return () => {
			mounted = false;
		};
	}, [mode, oobCode]);

	useEffect(() => {
		if (newPassword) {
			setPasswordRules(validatePassword(newPassword, confirmPassword));
		} else {
			setPasswordRules([]);
		}
	}, [newPassword, confirmPassword]);

	const handleResetSubmit = async (event) => {
		event.preventDefault();
		setResetError('');

		const passwordRules = validatePassword(newPassword, confirmPassword);
		const firstInvalidRule = passwordRules.find((rule) => rule.valid === false);

		if (firstInvalidRule) {
			setResetError(firstInvalidRule.message);
			return;
		}

		setIsSubmitting(true);
		try {
			await confirmPasswordReset(auth, oobCode, newPassword);
			setView({
				status: 'reset-success',
				title: 'Contraseña actualizada',
				message: 'Tu contraseña se cambió correctamente. Ya puedes iniciar sesión.',
			});
		} catch (error) {
			setResetError(mapActionError(error?.code));
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 md:px-8">
			<div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-[0_0_18px_rgba(15,23,42,0.30)]">
				<h1 className="title-h2-desktop text-secondary-5 mb-2">{view.title}</h1>
				<p className="body-2 text-neutral-4 mb-6">{view.message}</p>

				{view.status === 'loading' && (
					<p className="body-3 text-neutral-4">Validando enlace...</p>
				)}

				{view.status === 'reset-form' && (
					<form className="space-y-4" onSubmit={handleResetSubmit}>
						<p className="body-3 text-neutral-5">
							Cuenta: <span className="text-secondary-5">{email}</span>
						</p>

					<Input
						label="Nueva contraseña"
						variant="light"
						size="md"
						labelClass="text-secondary-5"
						type="password"
						name="newPassword"
						autoComplete="new-password"
						placeholder="Escribe tu nueva contraseña"
						value={newPassword}
						onChange={(event) => setNewPassword(event.target.value)}
					/>

					{passwordRules.length > 0 && (
						<ul className="mt-2 space-y-1">
							{passwordRules.map((rule) => (
								<li
									key={rule.key}
									className={`body-3 flex items-center gap-2 whitespace-nowrap ${
										rule.valid ? 'text-secondary-3' : 'text-primary-3'
									}`}
								>
									<span aria-hidden="true" className={`shrink-0 ${rule.valid ? 'text-secondary-3' : 'text-primary-3'}`}>{rule.valid ? '✓' : '✕'}</span>
									<span>{rule.message}</span>
								</li>
							))}
						</ul>
					)}

					<Input
						label="Confirmar contraseña"
						variant="light"
						size="md"
						labelClass="text-secondary-5"
						type="password"
						name="confirmPassword"
						autoComplete="new-password"
						placeholder="Repite la nueva contraseña"
						value={confirmPassword}
						onChange={(event) => setConfirmPassword(event.target.value)}
					/>

					{resetError && <p className="body-3 text-primary-3 flex items-center gap-2"><span aria-hidden="true">✕</span><span>{resetError}</span></p>}

					<button
						type="submit"
						disabled={isSubmitting}
						className="w-full rounded-full bg-primary-3 text-white py-2.5 body-bold hover:bg-primary-4 transition disabled:opacity-60"
					>
						{isSubmitting ? 'Guardando...' : 'Guardar nueva contraseña'}
					</button>
				</form>
			)}

				{(view.status === 'verify-success' || view.status === 'reset-success' || view.status === 'error') && (
					<button
						type="button"
						onClick={() => navigate(ROUTES.AUTH.LOGIN)}
						className="w-full rounded-full bg-secondary-5 text-white py-2.5 body-bold hover:bg-secondary-6 transition"
					>
						Ir a iniciar sesión
					</button>
				)}
			</div>
		</div>
	);
}
