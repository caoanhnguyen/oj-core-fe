import axiosInstance from './axios'

export const contestsAPI = {
  // ====================================================
  // ADMIN APIs
  // ====================================================

  /** Admin: Lấy danh sách contest có filter, search, pagination */
  adminSearch: async (params) => {
    const response = await axiosInstance.get('/admin/contests', { params })
    return response.data.data
  },

  /** Admin: Lấy chi tiết 1 contest (đầy đủ) */
  adminGetById: async (id) => {
    const response = await axiosInstance.get(`/admin/contests/${id}`)
    return response.data.data
  },

  /** Admin: Tạo contest mới */
  adminCreate: async (data) => {
    const response = await axiosInstance.post('/admin/contests', data)
    return response.data.data
  },

  /** Admin: Cập nhật contest */
  adminUpdate: async (id, data) => {
    const response = await axiosInstance.put(`/admin/contests/${id}`, data)
    return response.data.data
  },

  /** Admin: Xóa mềm contest */
  adminDelete: async (id) => {
    const response = await axiosInstance.delete(`/admin/contests/${id}`)
    return response.data
  },

  /** Admin: Restore contest về inactive */
  adminRestore: async (id) => {
    const response = await axiosInstance.post(`/admin/contests/${id}/restore`)
    return response.data
  },

  /** Admin: Toggle visibility (PUBLIC <-> PRIVATE) */
  adminToggleVisibility: async (id) => {
    const response = await axiosInstance.patch(`/admin/contests/${id}/visibility`)
    return response.data
  },

  /** Admin: Xem whitelist */
  adminGetWhitelist: async (id) => {
    const response = await axiosInstance.get(`/admin/contests/${id}/whitelist`)
    return response.data.data
  },

  /** Admin: Cập nhật whitelist */
  adminSaveWhitelist: async (id, emails) => {
    const response = await axiosInstance.post(`/admin/contests/${id}/whitelist`, emails)
    return response.data
  },

  // --- Problems Management ---

  /** Admin: Lấy danh sách problems của contest */
  adminGetProblems: async (id) => {
    const response = await axiosInstance.get(`/admin/contests/${id}/problems`)
    return response.data.data
  },

  /** Admin: Thêm bulk problems vào contest */
  adminAddProblems: async (id, problems) => {
    // problems: [{ problemId, displayId, points, sortOrder }]
    const response = await axiosInstance.post(`/admin/contests/${id}/problems/bulk-add`, problems)
    return response.data
  },

  /** Admin: Update bulk problems trong contest */
  adminUpdateProblems: async (id, problems) => {
    // problems: [{ problemId, displayId, points, sortOrder }]
    const response = await axiosInstance.put(`/admin/contests/${id}/problems/bulk-update`, problems)
    return response.data
  },

  /** Admin: Xóa bulk problems khỏi contest */
  adminRemoveProblems: async (id, problemIds) => {
    // problemIds: [UUID, ...]
    const response = await axiosInstance.delete(`/admin/contests/${id}/problems/bulk-remove`, { data: problemIds })
    return response.data
  },

  // --- Participants Management ---

  /** Admin: Tìm kiếm participants */
  adminGetParticipants: async (id, params) => {
    const response = await axiosInstance.get(`/admin/contests/${id}/participants`, { params })
    return response.data.data
  },

  /** Admin: Ban (disqualify) users */
  adminBanUsers: async (id, userIds) => {
    const response = await axiosInstance.post(`/admin/contests/${id}/participants/bulk-ban`, userIds)
    return response.data
  },

  /** Admin: Unban (requalify) users */
  adminUnbanUsers: async (id, userIds) => {
    const response = await axiosInstance.post(`/admin/contests/${id}/participants/bulk-unban`, userIds)
    return response.data
  },

  // --- Admin Submissions ---

  /** Admin: Xem lịch sử nộp bài của contest */
  adminGetSubmissions: async (id, params) => {
    const response = await axiosInstance.get(`/admin/contests/${id}/submissions`, { params })
    return response.data.data
  },

  /** Admin: Xem bảng xếp hạng */
  adminGetLeaderboard: async (id, params) => {
    const response = await axiosInstance.get(`/admin/contests/${id}/leaderboard`, { params })
    return response.data.data
  },

  /** Admin: Xuất bảng xếp hạng ra CSV */
  adminExportLeaderboard: async (id) => {
    const response = await axiosInstance.get(`/admin/contests/${id}/export`, { responseType: 'blob' })
    return response.data
  },

  // ====================================================
  // USER PUBLIC APIs
  // ====================================================

  /** User: Tìm kiếm / danh sách contest */
  getContests: async (params) => {
    const response = await axiosInstance.get('/contests', { params })
    return response.data.data
  },

  /** User: Xem chi tiết contest */
  getContestById: async (contestKey) => {
    const response = await axiosInstance.get(`/contests/${contestKey}`)
    return response.data.data
  },

  /** User: Đăng ký tham gia contest */
  register: async (contestKey, password = null) => {
    const body = password ? { password } : {}
    const response = await axiosInstance.post(`/contests/${contestKey}/register`, body)
    return response.data
  },

  /** User: Xem danh sách problems trong contest (phải là participant và contest đã started) */
  getProblems: async (contestKey) => {
    const response = await axiosInstance.get(`/contests/${contestKey}/problems`)
    return response.data.data
  },

  /**
   * User: Xem chi tiết 1 problem trong context của contest.
   * Hoạt động trong lúc thi (nếu là participant đã start) VÀ sau khi contest kết thúc
   * (nếu resourceVisibility = ALWAYS_VISIBLE), kể cả problem đang INACTIVE.
   * Đây là endpoint theo đúng RESTful URL mà FE đang dùng:
   *   /contests/:contestKey/problems/:slug
   */
  getProblemInContest: async (contestKey, slug) => {
    const response = await axiosInstance.get(`/contests/${contestKey}/problems/${slug}`)
    return response.data.data
  },

  /** User: Xem danh sách người đăng ký (public) */
  getPublicParticipants: async (contestKey, params) => {
    const response = await axiosInstance.get(`/contests/${contestKey}/participants`, { params })
    return response.data.data
  },

  /** User/Admin: Xem bảng xếp hạng */
  getLeaderboard: async (contestKey, params) => {
    const response = await axiosInstance.get(`/contests/${contestKey}/leaderboard`, { params })
    return response.data.data
  },

  /** User: Xem lịch sử nộp bài của bản thân trong contest */
  getMySubmissions: async (contestKey, params) => {
    const response = await axiosInstance.get(`/contests/${contestKey}/submissions/me`, { params })
    return response.data.data
  },
  
  /** User: Bắt đầu tham gia (Personal Session) */
  start: async (contestKey) => {
    const response = await axiosInstance.post(`/contests/${contestKey}/start`)
    return response.data.data
  },

  /** User: Kết thúc tham gia (Personal Session) */
  finish: async (contestKey) => {
    const response = await axiosInstance.post(`/contests/${contestKey}/finish`)
    return response.data
  },

  /** User: Lấy danh sách các contest mà mình đang thi (Active Session) */
  getMyActiveContests: async () => {
    const response = await axiosInstance.get('/contests/my-active')
    return response.data.data
  }
}
