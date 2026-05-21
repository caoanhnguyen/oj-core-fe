import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import { useContestSessionStore } from '../stores/contestSession'
import { API_BASE_URL } from '@/config/app'
import { isAuthRoutePath } from '@/utils/authFlow'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

const refreshInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((entry) => {
    if (error) {
      entry.reject(error)
    } else {
      entry.resolve(token)
    }
  })
  failedQueue = []
}

axiosInstance.interceptors.response.use(
  (response) => {
    if (response.data?.serverTime) {
      const sessionStore = useContestSessionStore()
      sessionStore.syncTime(response.data.serverTime)
    }

    if (response.data?.errorCode) {
      const error = new Error(response.data.message || 'API error')
      error.response = response
      error.config = response.config
      return Promise.reject(error)
    }

    return response
  },
  async (error) => {
    if (!error.response) {
      return Promise.reject(error)
    }

    const originalRequest = error.config
    const status = error.response.status

    if (status === 401 && !originalRequest._retry) {
      if (isAuthRoutePath(window.location.pathname)) {
        return Promise.reject(error)
      }

      const authStore = useAuthStore()
      const isAuthRequest =
        originalRequest.url.includes('/auth/refresh') ||
        originalRequest.url.includes('/auth/login') ||
        originalRequest.url.includes('/auth/register')

      if (isAuthRequest) {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => axiosInstance(originalRequest))
          .catch((queueError) => Promise.reject(queueError))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await refreshInstance.post('/auth/refresh')
        await authStore.getCurrentUser()

        isRefreshing = false
        processQueue(null)

        return axiosInstance(originalRequest)
      } catch (refreshError) {
        isRefreshing = false
        processQueue(refreshError, null)
        authStore.clearAuthState()

        if (!isAuthRoutePath(window.location.pathname)) {
          window.location.href = '/login'
        }

        return Promise.reject(refreshError)
      }
    }

    if (status === 403) {
      console.warn('Access denied for current request.')
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
