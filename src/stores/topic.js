import { defineStore } from 'pinia'
import { topicsAPI } from '../api/topics'
import { ElMessage } from 'element-plus'

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
                console.error('Failed to fetch admin topics:', error)
                ElMessage.error('Failed to load topics')
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
                console.error('Failed to fetch topic details:', error)
                ElMessage.error('Failed to load topic details')
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
                console.error('Failed to create topic:', error)
                ElMessage.error(error.response?.data?.message || 'Failed to create topic')
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
                console.error('Failed to update topic:', error)
                ElMessage.error(error.response?.data?.message || 'Failed to update topic')
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
                console.error('Failed to delete topic:', error)
                ElMessage.error(error.response?.data?.message || 'Failed to delete topic')
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
                console.error('Failed to restore topic:', error)
                ElMessage.error(error.response?.data?.message || 'Failed to restore topic')
                throw error
            } finally {
                this.loading = false
            }
        }
    }
})
