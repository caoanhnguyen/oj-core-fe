/**
 * Error code handler — tra i18n theo mã lỗi từ backend.
 * FE luôn dùng bản dịch i18n tương ứng với mã lỗi, KHÔNG hiển thị raw message từ BE.
 */
import i18n from '@/i18n'

/**
 * Lấy message hiển thị từ errorCode của backend.
 *
 * @param {string} code       - Mã lỗi từ backend (vd: "FIL_007")
 * @param {string} backendMsg - Message kèm theo từ backend (dùng làm fallback nếu code chưa có key i18n)
 * @returns {string}
 */
export const getErrorMessage = (code, backendMsg = '') => {
  const key = `errors.${code}`
  if (i18n.global.te(key)) {
    return i18n.global.t(key)
  }
  // Fallback: dùng message từ BE nếu chưa có key i18n tương ứng
  return backendMsg || i18n.global.t('errors.SYS_001')
}
