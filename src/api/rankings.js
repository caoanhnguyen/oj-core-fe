import axiosInstance from './axios'

export const rankingsAPI = {
    /**
     * Get list of rankings with pagination
     * @param {Object} params - Query parameters
     * @param {'ACM'|'OI'} params.ruleType - Rule type
     * @param {number} [params.page] - Page number (0-indexed)
     * @param {number} [params.size] - Page size
     * @returns {Promise<Object>} Rankings data
     */
    getRankings: async (params = {}) => {
        const response = await axiosInstance.get('/rankings', { params })
        return response.data.data
    }
}
