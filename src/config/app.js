const trimTrailingSlash = (value) => value?.replace(/\/+$/, '') || ''

const resolveOrigin = (value) => {
  if (!value) {
    return typeof window !== 'undefined' ? window.location.origin : ''
  }

  if (/^https?:\/\//i.test(value)) {
    return new URL(value).origin
  }

  if (typeof window !== 'undefined') {
    return new URL(value, window.location.origin).origin
  }

  return ''
}

export const API_BASE_URL = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || '/api/v1')
export const BACKEND_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_BACKEND_BASE_URL || resolveOrigin(API_BASE_URL)
)

export const buildBackendUrl = (path) =>
  `${BACKEND_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
