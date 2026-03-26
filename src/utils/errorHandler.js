import { ElMessage } from 'element-plus'
import { getErrorMessage } from './errorCodes'

/**
 * Xử lý và hiển thị error message từ API response
 * @param {Error} error - Error object từ axios
 * @param {string} defaultMessage - Message mặc định nếu không có từ API
 */
export const handleApiError = (error, defaultMessage = 'Có lỗi xảy ra') => {
  console.error('API Error:', error)

  // Lấy dữ liệu lỗi từ response của backend
  const apiErrorResponse = error.response?.data
  let message = defaultMessage

  if (apiErrorResponse) {
    // Ưu tiên dùng errorCode để hiển thị message tiếng Việt phù hợp
    if (apiErrorResponse.errorCode) {
      message = getErrorMessage(apiErrorResponse.errorCode, apiErrorResponse.message || defaultMessage)
    } else if (apiErrorResponse.message) {
      // Nếu không có errorCode, dùng message từ backend
      message = apiErrorResponse.message
    }
  }

  // Hiển thị message bằng ElMessage
  ElMessage.error({
    message: message,
    duration: 5000,
    showClose: true
  })

  return message
}

/**
 * Xử lý success message từ API response (không dùng errorCode cho success)
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


