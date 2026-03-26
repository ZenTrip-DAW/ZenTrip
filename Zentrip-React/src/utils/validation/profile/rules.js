export const profileValidationMessages = {
  requiredNombre: 'El nombre es obligatorio.',
  requiredApellidos: 'Los apellidos son obligatorios.',
  requiredUsername: 'El nombre de usuario es obligatorio.',
  invalidTelefono: 'El teléfono no tiene un formato válido.',
  invalidFotoPerfil: 'La URL de la foto debe comenzar con http o https.',
};

export function validateProfileForm(form) {
  const errors = {};

  if (!form.nombre.trim()) {
    errors.nombre = profileValidationMessages.requiredNombre;
  }

  if (!form.apellidos.trim()) {
    errors.apellidos = profileValidationMessages.requiredApellidos;
  }

  if (!form.username.trim()) {
    errors.username = profileValidationMessages.requiredUsername;
  }

  if (form.telefono && !/^\+?[\d\s\-().]{7,20}$/.test(form.telefono.trim())) {
    errors.telefono = profileValidationMessages.invalidTelefono;
  }

  if (form.fotoPerfil && !/^https?:\/\/.+/.test(form.fotoPerfil.trim())) {
    errors.fotoPerfil = profileValidationMessages.invalidFotoPerfil;
  }

  return errors;
}
