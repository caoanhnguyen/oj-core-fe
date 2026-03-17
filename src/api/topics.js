import axiosInstance from './axios'

/**
 * Topics API
 */
export const topicsAPI = {
    /**
     * Get list of topics
     * @param {Object} params - Query parameters
     * @param {string} [params.keyword] - Search keyword
     * @param {number} [params.size=100] - Limit the number of returned topics
     * @returns {Promise<Array>} List of topics
     */
    getTopics: async (params = {}) => {
        const response = await axiosInstance.get('/topics', { params })
        // Return .content if paginated, or directly the array if backend returns flat list
        return response.data.data.content || response.data.data
    },

    /**
     * Get topic details with statistics by slug
     * @param {string} slug - Topic slug
     * @returns {Promise<Object>} Topic details and statistics
     */
    getTopicDetails: async (slug) => {
        const response = await axiosInstance.get(`/topics/${slug}/details`)
        return response.data.data
    },

    /**
     * Get list of topics for Admin (with pagination and search)
     * @param {Object} params - Query parameters (page, size, name)
     * @returns {Promise<{content: Array, totalElements: number, totalPages: number}>}
     */
    getAdminTopics: async (params = {}) => {
        const response = await axiosInstance.get('/admin/topics', { params })
        return response.data.data
    },

    /**
     * Get all active topics (for problem creation/update)
     * @returns {Promise<Array>}
     */
    getAllActiveTopics: async (params = {}) => {
        const response = await axiosInstance.get('/admin/topics/active', { params })
        return response.data.data
    },

    /**
     * Get a single topic by ID for Admin
     * @param {string} id - Topic UUID
     */
    getAdminTopicById: async (id) => {
        const response = await axiosInstance.get(`/admin/topics/${id}`)
        return response.data.data
    },

    /**
     * Create new topic (Admin only)
     * @param {Object} data - Topic data {name, slug, description}
     */
    createTopic: async (data) => {
        const response = await axiosInstance.post('/admin/topics', data)
        return response.data.data
    },

    /**
     * Update existing topic (Admin only)
     * @param {string} id - Topic UUID
     * @param {Object} data - Updated topic data
     */
    updateTopic: async (id, data) => {
        const response = await axiosInstance.put(`/admin/topics/${id}`, data)
        return response.data.data
    },

    /**
     * Soft delete topic (Admin only)
     * @param {string} id - Topic UUID
     */
    softDeleteTopic: async (id) => {
        const response = await axiosInstance.delete(`/admin/topics/${id}`)
        return response.data
    },

    /**
     * Restore soft-deleted topic (Admin only)
     * @param {string} id - Topic UUID
     */
    restoreTopic: async (id) => {
        const response = await axiosInstance.patch(`/admin/topics/${id}/restore`)
        return response.data.data
    }
}
