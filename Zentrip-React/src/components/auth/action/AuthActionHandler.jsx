import { useEffect, useMemo, useState } from 'react';
import {
	applyActionCode,
	confirmPasswordReset,
	verifyPasswordResetCode,
} from 'firebase/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
			return 'El enlace no es valido o ya fue utilizado.';
		case 'auth/expired-action-code':
			return 'El enlace ha expirado. Solicita uno nuevo.';
		case 'auth/user-disabled':
			return 'Esta cuenta esta deshabilitada.';
		case 'auth/user-not-found':
			return 'No se encontro una cuenta asociada a este enlace.';
		case 'auth/weak-password':
			return 'La nueva contrasena no cumple los requisitos de seguridad.';
		default:
			return 'No pudimos completar la accion. Intentalo de nuevo.';
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
				title: 'Contrasena actualizada',
				message: 'Tu contrasena se cambio correctamente. Ya puedes iniciar sesion.',
			});
		} catch (error) {
			setResetError(mapActionError(error?.code));
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
			<div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
				<h1 className="title-h2-desktop text-secondary-5 mb-3">{view.title}</h1>
				<p className="body-2 text-neutral-4 mb-6">{view.message}</p>

				{view.status === 'loading' && (
					<p className="body-3 text-neutral-4">Validando enlace...</p>
				)}

				{view.status === 'reset-form' && (
					<form className="space-y-4" onSubmit={handleResetSubmit}>
						<p className="body-3 text-neutral-5">
							Cuenta: <span className="text-secondary-5">{email}</span>
						</p>

						<div>
							<label htmlFor="newPassword" className="body-3 text-secondary-5 mb-1 block">
								Nueva contraseña
							</label>
							<input
								id="newPassword"
								type="password"
								value={newPassword}
								onChange={(event) => setNewPassword(event.target.value)}
								className="w-full rounded-lg border border-neutral-2 px-3 py-2 body-3 focus:outline-none focus:ring-2 focus:ring-secondary-3"
								placeholder="Escribe tu nueva contraseña"
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
						</div>

						<div>
							<label htmlFor="confirmPassword" className="body-3 text-secondary-5 mb-1 block">
								Confirmar contraseña
							</label>
							<input
								id="confirmPassword"
								type="password"
								value={confirmPassword}
								onChange={(event) => setConfirmPassword(event.target.value)}
								className="w-full rounded-lg border border-neutral-2 px-3 py-2 body-3 focus:outline-none focus:ring-2 focus:ring-secondary-3"
								placeholder="Repite la nueva contraseña"
							/>
						</div>

						{resetError && <p className="body-3 text-primary-3">{resetError}</p>}

						<button
							type="submit"
							disabled={isSubmitting}
							className="w-full rounded-lg bg-primary-3 text-white py-2.5 body-bold hover:bg-primary-4 transition disabled:opacity-60"
						>
							{isSubmitting ? 'Guardando...' : 'Guardar nueva contraseña'}
						</button>
					</form>
				)}

				{(view.status === 'verify-success' || view.status === 'reset-success' || view.status === 'error') && (
					<button
						type="button"
						onClick={() => navigate(ROUTES.AUTH.LOGIN)}
						className="w-full rounded-lg bg-secondary-5 text-white py-2.5 body-bold hover:bg-secondary-6 transition"
					>
						Ir a iniciar sesion
					</button>
				)}
			</div>
		</div>
	);
}
