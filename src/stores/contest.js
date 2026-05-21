import { defineStore } from 'pinia'
import { ref } from 'vue'
import { contestsAPI } from '@/api/contests'
import { handleApiError } from '@/utils/errorHandler'

export const useContestStore = defineStore('contest', () => {
  const loading = ref(false)
  const adminContests = ref([])
  const adminPagination = ref({ page: 0, size: 20, totalElements: 0, totalPages: 0 })

  const fetchAdminContests = async (params = {}) => {
    try {
      loading.value = true
      const data = await contestsAPI.adminSearch(params)
      adminContests.value = data.content || []
      adminPagination.value = {
        page: data.number || 0,
        size: data.size || 20,
        totalElements: data.totalElements || 0,
        totalPages: data.totalPages || 0,
      }
      return data
    } catch (error) {
      handleApiError(error, 'Khong the tai danh sach contest')
      throw error
    } finally {
      loading.value = false
    }
  }

  const getAdminContestById = async (id) => {
    try {
      loading.value = true
      return await contestsAPI.adminGetById(id)
    } catch (error) {
      handleApiError(error, 'Khong the tai thong tin contest')
      throw error
    } finally {
      loading.value = false
    }
  }

  const createContest = async (data) => {
    try {
      loading.value = true
      return await contestsAPI.adminCreate(data)
    } finally {
      loading.value = false
    }
  }

  const updateContest = async (id, data) => {
    try {
      loading.value = true
      return await contestsAPI.adminUpdate(id, data)
    } finally {
      loading.value = false
    }
  }

  const deleteContest = async (id) => {
    try {
      loading.value = true
      await contestsAPI.adminDelete(id)
    } finally {
      loading.value = false
    }
  }

  const restoreContest = async (id) => {
    try {
      loading.value = true
      await contestsAPI.adminRestore(id)
    } finally {
      loading.value = false
    }
  }

  const toggleVisibility = async (id) => {
    try {
      loading.value = true
      await contestsAPI.adminToggleVisibility(id)
    } finally {
      loading.value = false
    }
  }

  const addProblems = async (id, problems) => {
    try {
      loading.value = true
      await contestsAPI.adminAddProblems(id, problems)
    } finally {
      loading.value = false
    }
  }

  const removeProblems = async (id, problemIds) => {
    try {
      loading.value = true
      await contestsAPI.adminRemoveProblems(id, problemIds)
    } finally {
      loading.value = false
    }
  }

  const banUsers = async (id, userIds) => {
    try {
      loading.value = true
      await contestsAPI.adminBanUsers(id, userIds)
    } finally {
      loading.value = false
    }
  }

  const unbanUsers = async (id, userIds) => {
    try {
      loading.value = true
      await contestsAPI.adminUnbanUsers(id, userIds)
    } finally {
      loading.value = false
    }
  }

  const registerContest = async (id, password = null) => {
    try {
      loading.value = true
      await contestsAPI.register(id, password)
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    adminContests,
    adminPagination,
    fetchAdminContests,
    getAdminContestById,
    createContest,
    updateContest,
    deleteContest,
    restoreContest,
    toggleVisibility,
    addProblems,
    removeProblems,
    banUsers,
    unbanUsers,
    registerContest,
  }
})
