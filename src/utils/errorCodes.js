/**
 * Hệ thống mã lỗi (ErrorCode) của backend và mapping sang tiếng Việt
 */
export const ERROR_CODES = {
  // 1. SYS - SYSTEM
  SYS_001: 'Lỗi hệ thống không xác định. Vui lòng thử lại sau.',
  SYS_002: 'Dữ liệu không hợp lệ.',
  SYS_003: 'Kiểu dữ liệu tham số không đúng.',
  SYS_004: 'Thiếu tham số bắt buộc.',

  // 2. AUTH - AUTHENTICATION/AUTHORIZATION
  AUTH_001: 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn.',
  AUTH_002: 'Bạn không có quyền thực hiện hành động này.',
  AUTH_003: 'Tài khoản hoặc mật khẩu không chính xác.',
  AUTH_004: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
  AUTH_005: 'Token không hợp lệ hoặc đã bị thu hồi.',
  AUTH_006: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.',
  AUTH_007: 'Email chưa được xác thực.',

  // 3. USR - USER
  USR_001: 'Người dùng không tồn tại.',
  USR_002: 'Tên đăng nhập đã tồn tại.',
  USR_003: 'Email đã được sử dụng.',
  USR_004: 'Bạn không thể tự chỉnh sửa quyền hoặc trạng thái của chính mình.',

  // 4. PRB - PROBLEM & TOPIC
  PRB_001: 'Bài tập không tồn tại.',
  PRB_002: 'Slug bài tập đã tồn tại.',
  TOP_001: 'Chủ đề không tồn tại.',
  TOP_002: 'Tên hoặc slug chủ đề đã tồn tại.',

  // 5. SUB - SUBMISSION
  SUB_001: 'Lượt nộp bài không tồn tại.',
  SUB_002: 'Ngôn ngữ lập trình này không được hỗ trợ cho bài tập này.',
  SUB_003: 'Bạn đã nộp bài quá nhanh. Vui lòng đợi một lát.',
  SUB_004: 'Kết quả đang được xử lý hoặc đã hết hạn.',

  // 6. FIL - FILE/STORAGE
  FIL_001: 'Tải tệp lên thất bại.',
  FIL_002: 'Kích thước tệp vượt quá giới hạn cho phép.',
  FIL_003: 'Định dạng tệp không được hỗ trợ.',
  FIL_004: 'Tệp testcase không tồn tại.',
  FIL_005: 'Tệp tải lên bị trống.',
  FIL_006: 'Tệp không tồn tại trong hệ thống lưu trữ.',
  FIL_007: 'Tệp ZIP không chứa các tệp testcase (.in/.out) hợp lệ.',
  FIL_008: 'Thiếu tệp output tương ứng.',
}

/**
 * Lấy message tiếng Việt từ errorCode
 * @param {string} code - Mã lỗi từ backend
 * @param {string} fallbackMessage - Thông báo mặc định nếu không tìm thấy mã lỗi
 * @returns {string}
 */
export const getErrorMessage = (code, fallbackMessage = 'Có lỗi xảy ra') => {
  return ERROR_CODES[code] || fallbackMessage
}
