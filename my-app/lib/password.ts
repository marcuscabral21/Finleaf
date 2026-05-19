export type PasswordLanguage = 'pt' | 'en'

export const PASSWORD_REQUIREMENTS: Record<PasswordLanguage, string> = {
  pt: 'Use pelo menos 12 caracteres, com maiúscula, minúscula, número e símbolo.',
  en: 'Use at least 12 characters, with uppercase, lowercase, number and symbol.',
}

export function getPasswordRequirements(language: PasswordLanguage) {
  return PASSWORD_REQUIREMENTS[language]
}

export function getPasswordStrengthError(password: string, language: PasswordLanguage = 'pt') {
  const requirements = getPasswordRequirements(language)

  if (password.length < 12) {
    return requirements
  }

  if (/\s/.test(password)) {
    return language === 'pt' ? 'A password não deve conter espaços.' : 'The password must not contain spaces.'
  }

  if (!/[a-z]/.test(password)) {
    return requirements
  }

  if (!/[A-Z]/.test(password)) {
    return requirements
  }

  if (!/\d/.test(password)) {
    return requirements
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return requirements
  }

  return null
}
