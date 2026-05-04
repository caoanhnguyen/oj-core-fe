import axios from 'axios'
import { useAuthStore } from '../stores/auth' // 🌟 Nhớ chỉnh lại đường dẫn này cho đúng với file store của bro

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8088/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})




// Create a separate instance for refresh to avoid interceptor loops
const refreshInstance = axios.create({
  baseURL: 'http://localhost:8088/api/v1',
  withCredentials: true
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

import { useContestSessionStore } from '../stores/contestSession'

// Response interceptor xử lý auto refresh token và error message
axiosInstance.interceptors.response.use(
  (response) => {
    // 🌟 Stealth Time Sync: Lấy serverTime từ mọi API trả về để đồng bộ lại Store
    if (response.data && response.data.serverTime) {
      const sessionStore = useContestSessionStore()
      sessionStore.syncTime(response.data.serverTime)
    }
    
    // 🌟 Kiểm tra nếu backend trả về 200 nhưng body lại chứa "errorCode"
    if (response.data && response.data.errorCode) {
      const error = new Error(response.data.message || 'API Error')
      error.response = response
      error.config = response.config
      return Promise.reject(error)
    }
    return response
  },
  async (error) => {
    // Trường hợp server sập hoặc mất mạng
    if (!error.response) {
      return Promise.reject(error)
    }

    const originalRequest = error.config
    const status = error.response.status

    // 🌟 CHỈ XỬ LÝ KHI GẶP LỖI 401 UNAUTHORIZED
    if (status === 401 && !originalRequest._retry) {

      // 🚨 CHỐT CHẶN 0: Đang ở trang login hoặc oauth callback thì cấm tuyệt đối mọi hành vi redirect hay refresh tự động
      if (window.location.pathname.includes('/login') || window.location.pathname.includes('/oauth/callback')) {
        return Promise.reject(error)
      }

      const authStore = useAuthStore()

      // 🚨 CHỐT CHẶN 0.5: Nếu user chưa login (guest) thì bỏ qua hoàn toàn, KHÔNG refresh, KHÔNG redirect
      // Đây là trường hợp guest gọi API public nhưng server trả về 401 vì lý do nào đó
      if (!authStore.user) {
        return Promise.reject(error)
      }

      // 🚨 CHỐT CHẶN 1: Nếu chính API refresh hoặc login bị lỗi 401 -> Dọn dẹp và văng ra Login
      // Kiểm tra kỹ hơn URL
      const isAuthRequest = originalRequest.url.includes('/auth/refresh') || originalRequest.url.includes('/auth/login')

      if (isAuthRequest) {
        authStore.user = null // Dọn sạch Pinia Store
        // Chỉ redirect nếu không phải đang ở sẵn login / oauth callback
        const isOnAuthPage = window.location.pathname.includes('/login') || window.location.pathname.includes('/oauth/callback')
        if (!isOnAuthPage) {
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }

      // 🌟 Hàng đợi cho các request đến cùng lúc khi đang refresh token
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
        // 🌟 Gọi API xin token mới bằng instance riêng biệt (tránh loops)
        await refreshInstance.post('/auth/refresh')

        isRefreshing = false
        processQueue(null)

        // Gọi lại cái request ban đầu vừa bị lỗi
        return axiosInstance(originalRequest)

      } catch (refreshError) {
        // 🚨 CHỐT CHẶN 2: Xin token mới thất bại
        isRefreshing = false
        processQueue(refreshError, null)

        // 🌟 Dọn dẹp Store và Token sạch sẽ
        authStore.user = null
        localStorage.removeItem('token')

        // Chỉ điều hướng về Login nếu không phải đang ở các trang Auth (tránh làm mất query param lỗi)
        const isOnAuthPage = window.location.pathname.includes('/login') || window.location.pathname.includes('/oauth/callback')
        if (!isOnAuthPage) {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    // 🌟 XỬ LÝ LỖI 403 FORBIDDEN (Thiếu quyền truy cập)
    if (status === 403) {
      console.warn("Truy cập bị từ chối: Bạn không có quyền thực hiện hành động này.")
      // Có thể emit một event hoặc gọi một toast nào đó ở đây nếu cần
    }

    // Các lỗi khác (400, 404, 500) trả về như bình thường để Component tự xử lý
    return Promise.reject(error)
  }
)

export default axiosInstance