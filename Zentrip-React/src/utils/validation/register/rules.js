import { registerValidationMessages } from './messages';

export function validateEmail(value) {
  const errors = [];
  if (!value) {
    errors.push(registerValidationMessages.requiredEmail);
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      errors.push(registerValidationMessages.invalidEmail);
    }
  }
  return errors;
}

export function validatePassword(password, confirmPassword) {
  const rules = [
    {
      key: 'shortPassword',
      valid: (password || '').length >= 6,
      message: registerValidationMessages.shortPassword,
    },
    {
      key: 'passwordUppercase',
      valid: /[A-Z]/.test(password || ''),
      message: registerValidationMessages.passwordUppercase,
    },
    {
      key: 'passwordSpecial',
      valid: /[^A-Za-z0-9]/.test(password || ''),
      message: registerValidationMessages.passwordSpecial,
    },
    {
      key: 'confirmPasswordMismatch',
      valid: (password || '') !== '' && (confirmPassword || '') !== '' && password === confirmPassword,
      message: registerValidationMessages.confirmPasswordMismatch,
    },
  ];

  if (!password) {
    return [
      { key: 'requiredPassword', valid: false, message: registerValidationMessages.requiredPassword },
      ...rules.map((rule) => ({ ...rule, valid: false })),
    ];
  }

  return rules;
}

export function validateConfirmPassword(confirmPassword, password) {
  if (password && !confirmPassword) return registerValidationMessages.requiredConfirmPassword;
  if (!confirmPassword) return '';
  return '';
}

export function validatePolicies(value) {
  const errors = [];
  if (!value) {
    errors.push(registerValidationMessages.requiredPolicies);
  }
  return errors;
}
