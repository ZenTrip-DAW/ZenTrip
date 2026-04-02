export const searchErrorMap = {
	'no-results': {
		field: 'busqueda',
		message: 'No se encontraron usuarios con ese nombre de usuario.',
	},
	'search-failed': {
		field: 'busqueda',
		message: 'No se pudo realizar la búsqueda. Intenta de nuevo más tarde.',
	},
	'no-email-results': {
		field: 'email',
		message: 'No se encontraron coincidencias por correo electrónico.',
	},
	'email-search-failed': {
		field: 'email',
		message: 'No se pudo realizar la búsqueda por correo. Intenta de nuevo más tarde.',
	},
	'network-error': {
		field: 'general',
		message: 'Error de conexión. Verifica tu conexión a internet.',
	},
	'server-error': {
		field: 'general',
		message: 'Error del servidor. Intenta de nuevo más tarde.',
	},
};

const DEFAULT_ERROR = {
	field: 'general',
	message: 'Ocurrió un error desconocido.',
};

export function getSearchError(errorCode) {
	return searchErrorMap[errorCode] || DEFAULT_ERROR;
}

export function getSearchErrorMessage(errorCode) {
	return getSearchError(errorCode).message;
}
