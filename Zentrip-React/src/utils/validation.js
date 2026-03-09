// src/utils/validation.js

// Validaciones reutilizables para formularios

import { validationMessages } from './validationMessages';

export function validateEmail(value) {
  const errors = [];
  if (!value) {
    errors.push(validationMessages.requiredEmail);
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      errors.push(validationMessages.invalidEmail);
    }
  }
  return errors;
}

export function validatePassword(password, confirmPassword) {
  const rules = [
    {
      key: 'shortPassword',
      valid: password && password.length >= 6,
      message: validationMessages.shortPassword,
    },
    {
      key: 'passwordUppercase',
      valid: /[A-Z]/.test(password || ''),
      message: validationMessages.passwordUppercase,
    },
    {
      key: 'passwordSpecial',
      valid: /[^A-Za-z0-9]/.test(password || ''),
      message: validationMessages.passwordSpecial,
    },
  ];
  if (!password) {
    return [{ key: 'requiredPassword', valid: false, message: validationMessages.requiredPassword }];
  }
  if (typeof confirmPassword === 'string') {
    rules.push({
      key: 'confirmPasswordMismatch',
      valid: password === confirmPassword,
      message: validationMessages.confirmPasswordMismatch,
    });
  }
  return rules;
}

export function validateConfirmPassword(confirmPassword, password) {
  if (!confirmPassword) return '';
  if (confirmPassword !== password) return validationMessages.confirmPasswordMismatch;
  return '';
}

export function validatePolicies(value) {
  const errors = [];
  if (!value) {
    errors.push(validationMessages.requiredPolicies);
  }
  return errors;
}
