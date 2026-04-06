import axiosInstance from './axios'

export const submissionAPI = {
    /**
     * Nộp bài code vào hệ thống (thực sự submit lấy điểm)
     * @param {Object} payload { problemId, languageKey, sourceCode }
     * @returns {Promise<String>} submissionId
     */
    submitCode: async (payload) => {
        const response = await axiosInstance.post('/submissions', payload)
        return response.data.data
    },

    /**
     * Chạy thử code với custom testcases
     * @param {Object} payload { problemId, languageKey, sourceCode, customInputs: [{ rawInput: "..." }] }
     * @returns {Promise<String>} runToken
     */
    runCode: async (payload) => {
        const response = await axiosInstance.post('/submissions/run_code', payload)
        return response.data.data
    },

    /**
     * Lấy kết quả chấm của một submission
     * @param {String} id submissionId
     * @returns {Promise<Object>} SubmissionResult
     */
    getSubmissionResult: async (id) => {
        const response = await axiosInstance.get(`/submissions/${id}`)
        return response.data.data
    },

    /**
     * Lấy kết quả (admin) chấm của một submission
     * @param {String} id submissionId
     * @returns {Promise<Object>} SubmissionResult
     */
    getAdminSubmissionResult: async (id) => {
        const response = await axiosInstance.get(`/admin/submissions/${id}`)
        return response.data.data
    },

    /**
     * Lấy kết quả run code
     * @param {String} token runToken
     * @returns {Promise<Object>} RunCodeResponse
     */
    getRunCodeResult: async (token) => {
        const response = await axiosInstance.get(`/submissions/run_code/result/${token}`)
        return response.data.data
    },

    /**
     * Lấy danh sách submissions của user hiện tại
     * @param {Object} params { problemId, submissionVerdict, page, size }
     * @returns {Promise<Object>} { content, totalElements, ... }
     */
    getSubmissions: async (params) => {
        const response = await axiosInstance.get('/submissions', { params })
        return response.data.data
    },

    /**
     * Lấy danh sách toàn bộ submissions của hệ thống (Admin)
     * @param {Object} params { problemId, userId, submissionVerdict, username, page, size }
     * @returns {Promise<Object>} { content, totalElements, ... } 
     */
    getAllSubmissions: async (params) => {
        const response = await axiosInstance.get('/admin/submissions', { params })
        return response.data.data
    },

    /**
     * Lấy thống kê của một bài toán
     * @param {String} problemId 
     * @returns {Promise<Object>} ProblemStatisticSdo
     */
    getProblemStatistics: async (problemId) => {
        const response = await axiosInstance.get(`/problems/${problemId}/statistics`)
        return response.data.data
    },

    /**
     * Lấy thống kê chi tiết của một bài toán (Admin/Moderator)
     * Bao gồm cả PENDING và SE
     * @param {String} problemId 
     * @returns {Promise<Object>} ProblemStatisticSdo
     */
    getAdminProblemStatistics: async (problemId) => {
        const response = await axiosInstance.get(`/admin/problems/${problemId}/statistics`)
        return response.data.data
    },

    /**
     * Lấy mã nguồn của submission cuối cùng của một bài toán
     * @param {String} problemId 
     * @param {String} languageKey 
     * @returns {Promise<String>} sourceCode
     */
    getLatestSubmissionSourceCode: async (problemId, languageKey) => {
        const response = await axiosInstance.get(`/submissions/latest_source_code/${problemId}/${languageKey}`)
        return response.data.data
    },

    // ==========================================
    // ADMIN APIs
    // ==========================================
    adminRejudge: async (payload) => {
        // payload: { submissionIds, problemId, contestId }
        const response = await axiosInstance.post('/admin/submissions/rejudge', payload)
        return response.data
    },

    adminSoftDelete: async (ids) => {
        const response = await axiosInstance.patch('/admin/submissions/soft-delete', ids)
        return response.data
    },

    adminVoid: async (ids) => {
        const response = await axiosInstance.patch('/admin/submissions/void', ids)
        return response.data
    },

    adminRestore: async (ids) => {
        const response = await axiosInstance.patch('/admin/submissions/restore', ids)
        return response.data
    },

    adminCheckStatuses: async (ids) => {
        const response = await axiosInstance.post('/admin/submissions/status-check', ids)
        return response.data.data
    }
}
