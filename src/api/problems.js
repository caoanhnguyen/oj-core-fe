import axiosInstance from './axios'

/**
 * Problems API
 * CRUD operations for coding problems
 */
export const problemsAPI = {
    /**
     * Get list of problems with pagination and filters
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number (0-indexed)
     * @param {number} params.size - Page size
     * @param {'EASY'|'MEDIUM'|'HARD'} [params.difficulty] - Filter by difficulty
     * @param {string} [params.keyword] - Search keyword
     * @returns {Promise<{content: Array, totalElements: number, totalPages: number}>}
     */
    getProblems: async (params = {}) => {
        const response = await axiosInstance.get('/problems', { params })
        return response.data.data
    },

    /**
     * Get problem details by ID
     * @param {string} id - Problem UUID
     * @returns {Promise<Object>} Problem details
     */
    getProblemById: async (id) => {
        const response = await axiosInstance.get(`/problems/${id}`)
        return response.data.data
    },

    /**
     * Get problem details by slug
     * @param {string} slug - Problem slug
     * @returns {Promise<Object>} Problem details
     */
    getProblemBySlug: async (slug) => {
        const response = await axiosInstance.get(`/problems/slug/${slug}`)
        return response.data.data
    },

    /**
     * Create new problem (Admin only)
     * @param {Object} data - Problem data
     * @returns {Promise<Object>} Created problem
     */
    createProblem: async (data) => {
        const response = await axiosInstance.post('/problems', data)
        return response.data.data
    },

    /**
     * Update existing problem (Admin only)
     * @param {string} id - Problem UUID
     * @param {Object} data - Updated problem data
     * @returns {Promise<Object>} Updated problem
     */
    updateProblem: async (id, data) => {
        const response = await axiosInstance.put(`/problems/${id}`, data)
        return response.data.data
    },

    /**
     * Delete problem (Admin only - soft delete)
     * @param {string} id - Problem UUID
     * @returns {Promise<void>}
     */
    deleteProblem: async (id) => {
        const response = await axiosInstance.delete(`/problems/${id}`)
        return response.data
    }
}
