import axiosInstance from './axios'

export const systemAPI = {
    /**
     * Get list of supported languages from backend
     * @returns {Promise<Array>} List of languages
     */
    getLanguages: async () => {
        // Backend mapping is /api/v1/system, so if Axios baseUrl is /api, we use /v1/system/languages
        const response = await axiosInstance.get('/system/languages')
        return response.data.data
    },

    /**
     * Get admin dashboard statistics
     * @param {number} days - Number of days for trend stats (default: 7)
     * @returns {Promise<Object>} Dashboard statistics
     */
    getDashboardStats: async (days = 7) => {
        const response = await axiosInstance.get('/system/dashboard-stats', {
            params: { days }
        })
        return response.data.data
    }
}
