import { getErrorMessage } from './errorCodes'

export const AUTH_GUEST_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/oauth/callback',
  '/verify-email',
]

export const isAuthRoutePath = (path = '') => AUTH_GUEST_PATHS.includes(path)

export const getPostAuthRedirect = (authStore) =>
  authStore?.canAccessDashboard ? '/dashboard' : '/'

export const getAuthRedirectPayload = (route) => {
  const searchParams = new URLSearchParams(window.location.search)
  return {
    error: searchParams.get('error') || route?.query?.error,
    message:
      searchParams.get('message') ||
      route?.query?.message ||
      searchParams.get('error_code'),
  }
}

export const getAuthRedirectMessage = ({ error, message }, t) => {
  const translated = (key, fallback) => {
    if (typeof t !== 'function') return fallback
    const value = t(key)
    return value && value !== key ? value : fallback
  }

  if (message && String(message) !== 'null') {
    return getErrorMessage(message, String(message))
  }

  if (error === 'invalid_provider' || error === 'access_denied') {
    return translated(
      'auth.oauth_account_conflict',
      'Email \u0111\u00e3 \u0111\u01b0\u1ee3c d\u00f9ng \u0111\u1ec3 \u0111\u0103ng k\u00fd t\u00e0i kho\u1ea3n kh\u00e1c. Vui l\u00f2ng \u0111\u0103ng nh\u1eadp b\u1eb1ng m\u1eadt kh\u1ea9u!'
    )
  }

  if (error) {
    return getErrorMessage(error, String(error))
  }

  return translated(
    'auth.oauth_failed',
    '\u0110\u0103ng nh\u1eadp OAuth kh\u00f4ng th\u00e0nh c\u00f4ng. Vui l\u00f2ng th\u1eed l\u1ea1i!'
  )
}
