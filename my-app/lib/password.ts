export const PASSWORD_REQUIREMENTS =
  'Use pelo menos 12 caracteres, com maiuscula, minuscula, numero e simbolo.'

export function getPasswordStrengthError(password: string) {
  if (password.length < 12) {
    return PASSWORD_REQUIREMENTS
  }

  if (/\s/.test(password)) {
    return 'A password nao deve conter espacos.'
  }

  if (!/[a-z]/.test(password)) {
    return PASSWORD_REQUIREMENTS
  }

  if (!/[A-Z]/.test(password)) {
    return PASSWORD_REQUIREMENTS
  }

  if (!/\d/.test(password)) {
    return PASSWORD_REQUIREMENTS
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return PASSWORD_REQUIREMENTS
  }

  return null
}
