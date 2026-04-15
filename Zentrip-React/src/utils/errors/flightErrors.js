export const flightErrorMap = {
  'VALIDATION_ERROR': {
    field: 'general',
    message: 'Selecciona origen, destino y fechas válidas.',
  },
  'INVALID_DATE': {
    field: 'date',
    message: 'La fecha no es válida.',
  },
  'DATE_IN_PAST': {
    field: 'departDate',
    message: 'La fecha de salida no puede ser anterior a hoy.',
  },
  'RETURN_BEFORE_DEPART': {
    field: 'returnDate',
    message: 'La fecha de regreso debe ser igual o posterior a la de salida.',
  },
  'MISSING_AIRPORTS': {
    field: 'airports',
    message: 'Selecciona el origen y el destino de la lista de sugerencias.',
  },
  'INCOMPLETE_LEGS': {
    field: 'legs',
    message: 'Completa todos los tramos (origen, destino y fecha).',
  },
  'INVALID_LEG_SEQUENCE': {
    field: 'legs',
    message: 'Las fechas de los tramos deben ser consecutivas y en orden.',
  },
  'INSUFFICIENT_LEGS': {
    field: 'legs',
    message: 'Necesitas al menos 2 tramos para una búsqueda multi-destino.',
  },
  'RAPIDAPI_REQUEST_ERROR': {
    field: 'general',
    message: 'No se encuentran vuelos disponibles. Intenta con otras fechas o destinos.',
  },
  'RAPIDAPI_SERVER_ERROR': {
    field: 'general',
    message: 'El servicio de vuelos no está disponible. Intenta de nuevo más tarde.',
  },
  'SEARCH_TIMEOUT': {
    field: 'general',
    message: 'La búsqueda tardó demasiado. Intenta de nuevo.',
  },
  'NO_RESULTS': {
    field: 'general',
    message: 'No hay vuelos disponibles con los criterios seleccionados.',
  },
  'NETWORK_ERROR': {
    field: 'general',
    message: 'Error de conexión. Verifica tu conexión a internet.',
  },
};

const DEFAULT_ERROR = {
  field: 'general',
  message: 'Error al buscar vuelos. Intenta de nuevo más tarde.',
};

export function getFlightError(errorCode) {
  return flightErrorMap[errorCode] || DEFAULT_ERROR;
}

export function getFlightErrorMessage(errorCode) {
  return getFlightError(errorCode).message;
}

export function getFlightErrorField(errorCode) {
  return getFlightError(errorCode).field;
}
