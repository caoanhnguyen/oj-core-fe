import axios from 'axios'
import { useAuthStore } from '../stores/auth' // 🌟 Nhớ chỉnh lại đường dẫn này cho đúng với file store của bro

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8088/api/v1',
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
    // Trường hợp server sập hoặc mất mạng
    if (!error.response) {
      return Promise.reject(error)
    }

    const originalRequest = error.config
    const status = error.response.status

    // 🌟 CHỈ XỬ LÝ KHI GẶP LỖI 401 UNAUTHORIZED
    if (status === 401 && !originalRequest._retry) {

      // 🚨 CHỐT CHẶN 0: Đang ở trang login thì cấm tuyệt đối mọi hành vi redirect hay refresh
      // (Để bẻ gãy vòng lặp Router)
      if (window.location.pathname.includes('/login')) {
        return Promise.reject(error)
      }

      const authStore = useAuthStore()

      // 🚨 CHỐT CHẶN 1: Nếu chính API refresh hoặc login bị lỗi 401 -> Dọn dẹp và văng ra Login
      if (originalRequest.url.includes('/auth/refresh') || originalRequest.url.includes('/auth/login')) {
        authStore.user = null // Dọn sạch Pinia Store
        window.location.href = '/login'
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
        // 🌟 Gọi API xin token mới
        await axiosInstance.post('/auth/refresh')

        isRefreshing = false
        processQueue(null)

        // Gọi lại cái request ban đầu vừa bị lỗi
        return axiosInstance(originalRequest)

      } catch (refreshError) {
        // 🚨 CHỐT CHẶN 2: Xin token mới thất bại (Do bị Postman cướp phiên hoặc hết hạn thật)
        isRefreshing = false
        processQueue(refreshError, null)

        // 🌟 Dọn dẹp Store sạch sẽ để Router không bị nhầm lẫn
        authStore.user = null

        // Đá văng về trang Login
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    // Các lỗi khác (400, 403, 404, 500) trả về như bình thường để Component tự xử lý
    return Promise.reject(error)
  }
)

export default axiosInstance