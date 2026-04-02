export const searchErrorMap = {
  'no-results': {
    field: 'busqueda',
    message: 'No se encontraron usuarios con ese nombre de usuario.',
  },
  'search-failed': {
    field: 'busqueda',
    message: 'No se pudo realizar la búsqueda. Intenta de nuevo más tarde.',
  },
  'network-error': {
    field: 'busqueda',
    message: 'Error de conexión. Verifica tu conexión a internet.',
  },
  'server-error': {
    field: 'busqueda',
    message: 'Error del servidor. Intenta de nuevo más tarde.',
  },
};

const DEFAULT_ERROR = {
  field: 'busqueda',
  message: 'Ocurrió un error desconocido.',
};

export function getSearchError(errorCode) {
  return searchErrorMap[errorCode] || DEFAULT_ERROR;
}

export function getSearchErrorMessage(errorCode) {
  return getSearchError(errorCode).message;
}
