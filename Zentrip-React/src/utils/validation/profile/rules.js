export const profileValidationMessages = {
  requiredFirstName: 'El nombre es obligatorio.',
  requiredLastName: 'Los apellidos son obligatorios.',
  requiredUsername: 'El nombre de usuario es obligatorio.',
  requiredPhone: 'El teléfono es obligatorio.',
  invalidPhone: 'El teléfono no tiene un formato válido.',
  requiredCountry: 'El país es obligatorio.',
  invalidProfilePhoto: 'La URL de la foto debe comenzar con http o https.',
};

export function validateProfileForm(form) {
  const errors = {};

  if (!form.firstName?.trim()) {
    errors.firstName = profileValidationMessages.requiredFirstName;
  }

  if (!form.lastName?.trim()) {
    errors.lastName = profileValidationMessages.requiredLastName;
  }

  if (!form.username?.trim()) {
    errors.username = profileValidationMessages.requiredUsername;
  }

  if (!form.phone?.trim()) {
    errors.phone = profileValidationMessages.requiredPhone;
  } else if (!/^\+?[\d\s\-().]{7,20}$/.test(form.phone.trim())) {
    errors.phone = profileValidationMessages.invalidPhone;
  }

  if (!form.country?.trim()) {
    errors.country = profileValidationMessages.requiredCountry;
  }

  if (form.profilePhoto && !/^https?:\/\/.+/.test(form.profilePhoto.trim())) {
    errors.profilePhoto = profileValidationMessages.invalidProfilePhoto;
  }

  return errors;
}
