import { defineStore } from 'pinia'
import { topicsAPI } from '../api/topics'
import { handleApiError } from '../utils/errorHandler'

export const useTopicStore = defineStore('topic', {
  state: () => ({
    topics: [],
    adminTopics: [],
    loading: false,
    pagination: {
      page: 0,
      size: 10,
      totalElements: 0,
      totalPages: 0,
    },
  }),

  actions: {
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

    async fetchAdminTopics(params = {}) {
      try {
        this.loading = true
        const data = await topicsAPI.getAdminTopics({
          page: params.page || 0,
          size: params.size || 10,
          name: params.name,
        })

        this.adminTopics = data.content || []
        this.pagination = {
          page: data.number || 0,
          size: data.size || 10,
          totalElements: data.totalElements || 0,
          totalPages: data.totalPages || 0,
        }

        return data
      } catch (error) {
        handleApiError(error, 'Khong tai duoc danh sach chu de')
        throw error
      } finally {
        this.loading = false
      }
    },

    async getAdminTopicById(id) {
      try {
        this.loading = true
        return await topicsAPI.getAdminTopicById(id)
      } catch (error) {
        handleApiError(error, 'Khong tai duoc thong tin chu de')
        throw error
      } finally {
        this.loading = false
      }
    },

    async createTopic(topicData) {
      try {
        this.loading = true
        return await topicsAPI.createTopic(topicData)
      } finally {
        this.loading = false
      }
    },

    async updateTopic(id, topicData) {
      try {
        this.loading = true
        return await topicsAPI.updateTopic(id, topicData)
      } finally {
        this.loading = false
      }
    },

    async deleteTopic(id) {
      try {
        this.loading = true
        await topicsAPI.softDeleteTopic(id)
      } finally {
        this.loading = false
      }
    },

    async restoreTopic(id) {
      try {
        this.loading = true
        await topicsAPI.restoreTopic(id)
      } finally {
        this.loading = false
      }
    },
  },
})
