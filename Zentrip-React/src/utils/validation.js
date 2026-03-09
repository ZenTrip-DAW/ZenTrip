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

export function validatePassword(value) {
  const errors = [];
  if (!value) {
    errors.push(validationMessages.requiredPassword);
  } else if (value.length < 6) {
    errors.push(validationMessages.shortPassword);
  }
  return errors;
}

export function validatePolicies(value) {
  const errors = [];
  if (!value) {
    errors.push(validationMessages.requiredPolicies);
  }
  return errors;
}
