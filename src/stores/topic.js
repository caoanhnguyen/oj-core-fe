import { defineStore } from 'pinia'
import { topicsAPI } from '../api/topics'
import { ElMessage } from 'element-plus'
import { handleApiError } from '../utils/errorHandler'

export const useTopicStore = defineStore('topic', {
    state: () => ({
        topics: [], // Public topics for filter
        adminTopics: [], // Full topics for admin list
        loading: false,
        pagination: {
            page: 0,
            size: 10,
            totalElements: 0,
            totalPages: 0
        }
    }),

    actions: {
        /**
         * Fetch topics list for User (Public dropdowns)
         */
        async fetchTopics(keyword = '') {
            try {
                this.loading = true
                const data = await topicsAPI.getTopics({ keyword, size: 100 })
                this.topics = data || []
                return data
            } catch (error) {
                console.error('Failed to fetch topics:', error)
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Get topic details with statistics by slug (Public)
         */
        async getTopicDetails(slug) {
            try {
                this.loading = true
                return await topicsAPI.getTopicDetails(slug)
            } catch (error) {
                console.error('Failed to fetch topic details:', error)
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Fetch topics list for Admin with pagination
         */
        async fetchAdminTopics(params = {}) {
            try {
                this.loading = true
                const data = await topicsAPI.getAdminTopics({
                    page: params.page || 0,
                    size: params.size || 10,
                    name: params.name
                })

                this.adminTopics = data.content || []
                this.pagination = {
                    page: data.number || 0,
                    size: data.size || 10,
                    totalElements: data.totalElements || 0,
                    totalPages: data.totalPages || 0
                }

        return data
      } catch (error) {
        handleApiError(error, 'Không tải được danh sách chủ đề')
        throw error
      } finally {
                this.loading = false
            }
        },

        /**
         * Get full details of a single topic for admin. Used for edit forms.
         */
        async getAdminTopicById(id) {
            try {
                this.loading = true
        const data = await topicsAPI.getAdminTopicById(id)
        return data
      } catch (error) {
        handleApiError(error, 'Không tải được thông tin chủ đề')
        throw error
      } finally {
                this.loading = false
            }
        },

        /**
         * Create a new topic
         */
        async createTopic(topicData) {
            try {
                this.loading = true
                const result = await topicsAPI.createTopic(topicData)
                ElMessage.success('Topic created successfully!')
                return result
            } catch (error) {
                handleApiError(error, 'Tạo chủ đề thất bại')
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Update an existing topic
         */
        async updateTopic(id, topicData) {
            try {
                this.loading = true
                const result = await topicsAPI.updateTopic(id, topicData)
                ElMessage.success('Topic updated successfully!')
                return result
            } catch (error) {
                handleApiError(error, 'Cập nhật chủ đề thất bại')
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Delete a topic (soft delete)
         */
        async deleteTopic(id) {
            try {
                this.loading = true
                await topicsAPI.softDeleteTopic(id)
                ElMessage.success('Topic deleted successfully!')
            } catch (error) {
                handleApiError(error, 'Xóa chủ đề thất bại')
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Restore a deleted topic
         */
        async restoreTopic(id) {
            try {
                this.loading = true
                await topicsAPI.restoreTopic(id)
                ElMessage.success('Topic restored successfully!')
            } catch (error) {
                handleApiError(error, 'Khôi phục chủ đề thất bại')
                throw error
            } finally {
                this.loading = false
            }
        }
    }
})
