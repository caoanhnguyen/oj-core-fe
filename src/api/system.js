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
    }
}
