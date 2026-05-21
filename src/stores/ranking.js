import { defineStore } from 'pinia'
import { rankingsAPI } from '@/api/rankings'
import { handleApiError } from '@/utils/errorHandler'

export const useRankingStore = defineStore('ranking', {
  state: () => ({
    rankings: [],
    topRankings: [],
    loading: false,
    pagination: {
      page: 0,
      size: 100,
      totalElements: 0,
      totalPages: 0,
    },
  }),

  actions: {
    async fetchRankings(params = {}) {
      try {
        this.loading = true
        const data = await rankingsAPI.getRankings({
          ruleType: params.ruleType || 'ACM',
          page: params.page || 0,
          size: params.size || 20,
        })

        this.rankings = data.content || []
        this.pagination = {
          page: data.number || 0,
          size: data.size || 20,
          totalElements: data.totalElements || 0,
          totalPages: data.totalPages || 0,
        }

        if (this.pagination.page === 0 && this.rankings.length > 0) {
          this.topRankings = this.rankings.slice(0, 10)
        }

        return data
      } catch (error) {
        handleApiError(error, 'Khong tai duoc danh sach xep hang')
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchTopTen(ruleType = 'ACM') {
      try {
        const data = await rankingsAPI.getRankings({
          ruleType,
          page: 0,
          size: 10,
        })
        this.topRankings = data.content || []
        return this.topRankings
      } catch (error) {
        console.error('Failed to fetch top rankings:', error)
        return []
      }
    },
  },
})
