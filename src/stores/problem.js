import { defineStore } from 'pinia'
import { problemsAPI } from '../api/problems'
import { handleApiError } from '../utils/errorHandler'

export const useProblemStore = defineStore('problem', {
  state: () => ({
    problems: [],
    currentProblem: null,
    loading: false,
    pagination: {
      page: 0,
      size: 10,
      totalElements: 0,
      totalPages: 0,
    },
  }),

  getters: {
    getProblemById: (state) => (id) => state.problems.find((problem) => problem.id === id),
  },

  actions: {
    async fetchProblems(params = {}, append = false, isAdmin = false) {
      try {
        this.loading = true
        const apiCall = isAdmin ? problemsAPI.getAdminProblems : problemsAPI.getProblems
        const data = await apiCall({
          ...params,
          page: params.page || 0,
          size: params.size || 10,
        })

        this.problems = append ? [...this.problems, ...(data.content || [])] : data.content || []
        this.pagination = {
          page: data.number || 0,
          size: data.size || 10,
          totalElements: data.totalElements || 0,
          totalPages: data.totalPages || 0,
        }

        return data
      } catch (error) {
        handleApiError(error, 'Khong the tai danh sach bai tap')
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchProblemById(id) {
      try {
        this.loading = true
        const data = await problemsAPI.getProblemById(id)
        this.currentProblem = data
        return data
      } catch (error) {
        handleApiError(error, 'Khong the tai thong tin bai tap')
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchProblemBySlug(slug) {
      try {
        this.loading = true
        const data = await problemsAPI.getProblemBySlug(slug)
        this.currentProblem = data
        return data
      } catch (error) {
        handleApiError(error, 'Khong the tai thong tin bai tap')
        throw error
      } finally {
        this.loading = false
      }
    },

    async createProblem(problemData) {
      try {
        this.loading = true
        const result = await problemsAPI.createProblem(problemData)
        await this.fetchProblems({ page: 0, size: this.pagination.size }, false, true)
        return result
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateProblem(id, problemData) {
      try {
        this.loading = true
        const result = await problemsAPI.updateProblem(id, problemData)
        await this.fetchProblems({ page: this.pagination.page, size: this.pagination.size }, false, true)
        return result
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteProblem(id) {
      try {
        this.loading = true
        await problemsAPI.deleteProblem(id)
        await this.fetchProblems({ page: this.pagination.page, size: this.pagination.size }, false, true)
      } finally {
        this.loading = false
      }
    },

    async restoreProblem(id) {
      try {
        this.loading = true
        await problemsAPI.restoreProblem(id)
        await this.fetchProblems({ page: this.pagination.page, size: this.pagination.size }, false, true)
      } finally {
        this.loading = false
      }
    },

    async publishProblem(id) {
      try {
        this.loading = true
        await problemsAPI.publishProblem(id)
        await this.fetchProblems({ page: this.pagination.page, size: this.pagination.size }, false, true)
      } finally {
        this.loading = false
      }
    },

    async getSolvedCount() {
      try {
        this.loading = true
        return await problemsAPI.getSolvedCount()
      } catch (error) {
        handleApiError(error, 'Lay so luong bai da giai that bai')
        throw error
      } finally {
        this.loading = false
      }
    },

    async uploadTestcasesZip(problemId, formData) {
      return problemsAPI.uploadTestcases(problemId, formData)
    },

    clearUploadedImages() {},
  },
})
