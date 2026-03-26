import { defineStore } from 'pinia'
import { rankingsAPI } from '@/api/rankings'
import { ElMessage } from 'element-plus'
import { handleApiError } from '@/utils/errorHandler'

export const useRankingStore = defineStore('ranking', {
  state: () => ({
    rankings: [],
    topRankings: [], // For charts
    loading: false,
    pagination: {
      page: 0,
      size: 20,
      totalElements: 0,
      totalPages: 0
    }
  }),

  actions: {
    async fetchRankings(params = {}) {
      try {
        this.loading = true
        // If it's the first page, we'll extract the top 10 for the chart
        const data = await rankingsAPI.getRankings({
          ruleType: params.ruleType || 'ACM',
          page: params.page || 0,
          size: params.size || 20
        })

        this.rankings = data.content || []
        this.pagination = {
          page: data.number || 0,
          size: data.size || 20,
          totalElements: data.totalElements || 0,
          totalPages: data.totalPages || 0
        }

        return data
      } catch (error) {
        handleApiError(error, 'Không tải được danh sách xếp hạng')
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchTopTen(ruleType = 'ACM') {
        try {
            // For chart, we always want the top 10
            const data = await rankingsAPI.getRankings({
                ruleType,
                page: 0,
                size: 10
            })
            this.topRankings = data.content || []
            return this.topRankings
        } catch (error) {
            console.error('Failed to fetch top rankings:', error)
            return []
        }
    }
  }
})
