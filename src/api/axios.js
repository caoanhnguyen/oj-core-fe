import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Biến để quản lý việc refresh token
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Response interceptor xử lý auto refresh token và error message
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const apiResponse = error.response?.data
    const message = apiResponse?.message

    // Nếu lỗi 401 (token hết hạn) và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Chỉ refresh nếu message là 'Token expired'
      if (message === 'Token expired') {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          })
            .then(() => axiosInstance(originalRequest))
            .catch(err => Promise.reject(err))
        }
        originalRequest._retry = true
        isRefreshing = true
        try {
          await axiosInstance.post('/auth/refresh')
          processQueue(null)
          isRefreshing = false
          return axiosInstance(originalRequest)
        } catch (refreshError) {
          processQueue(refreshError, null)
          isRefreshing = false
          localStorage.removeItem('user')
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      } else {
        // Nếu không phải lỗi Token expired thì logout luôn
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
