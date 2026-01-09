import { ElMessage } from 'element-plus'

/**
 * Xử lý và hiển thị error message từ API response
 * @param {Error} error - Error object từ axios
 * @param {string} defaultMessage - Message mặc định nếu không có từ API
 */
export const handleApiError = (error, defaultMessage = 'Có lỗi xảy ra') => {
  console.error('API Error:', error)

  // Lấy message từ ApiResponse của backend
  const apiResponse = error.response?.data
  const message = apiResponse?.message || defaultMessage

  // Hiển thị message
  ElMessage.error(message)

  return message
}

/**
 * Xử lý success message từ API response
 * @param {Object} response - Response object từ axios
 */
export const handleApiSuccess = (response) => {
  const apiResponse = response.data
  const message = apiResponse?.message

  if (message) {
    ElMessage.success(message)
  }

  return apiResponse
}

