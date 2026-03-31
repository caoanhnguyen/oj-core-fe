import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { contestsAPI } from '@/api/contests'
import { handleApiError } from '@/utils/errorHandler'

export const useContestStore = defineStore('contest', () => {
  const loading = ref(false)
  const adminContests = ref([])
  const adminPagination = ref({ page: 0, size: 20, totalElements: 0, totalPages: 0 })

  // ====================
  // ADMIN ACTIONS
  // ====================

  const fetchAdminContests = async (params = {}) => {
    try {
      loading.value = true
      const data = await contestsAPI.adminSearch(params)
      adminContests.value = data.content || []
      adminPagination.value = {
        page: data.number || 0,
        size: data.size || 20,
        totalElements: data.totalElements || 0,
        totalPages: data.totalPages || 0
      }
      return data
    } catch (error) {
      handleApiError(error, 'Không thể tải danh sách contest')
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
      handleApiError(error, 'Không thể tải thông tin contest')
      throw error
    } finally {
      loading.value = false
    }
  }

  const createContest = async (data) => {
    try {
      loading.value = true
      const result = await contestsAPI.adminCreate(data)
      ElMessage.success('Tạo contest thành công!')
      return result
    } catch (error) {
      handleApiError(error, 'Tạo contest thất bại')
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateContest = async (id, data) => {
    try {
      loading.value = true
      const result = await contestsAPI.adminUpdate(id, data)
      ElMessage.success('Cập nhật contest thành công!')
      return result
    } catch (error) {
      handleApiError(error, 'Cập nhật contest thất bại')
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteContest = async (id) => {
    try {
      loading.value = true
      await contestsAPI.adminDelete(id)
      ElMessage.success('Đã xóa contest!')
    } catch (error) {
      handleApiError(error, 'Xóa contest thất bại')
      throw error
    } finally {
      loading.value = false
    }
  }

  const restoreContest = async (id) => {
    try {
      loading.value = true
      await contestsAPI.adminRestore(id)
      ElMessage.success('Đã khôi phục contest về trạng thái inactive!')
    } catch (error) {
      handleApiError(error, 'Khôi phục contest thất bại')
      throw error
    } finally {
      loading.value = false
    }
  }

  const toggleVisibility = async (id) => {
    try {
      loading.value = true
      await contestsAPI.adminToggleVisibility(id)
      ElMessage.success('Đã cập nhật khả năng hiển thị contest!')
    } catch (error) {
      handleApiError(error, 'Cập nhật hiển thị contest thất bại')
      throw error
    } finally {
      loading.value = false
    }
  }

  const addProblems = async (id, problems) => {
    try {
      loading.value = true
      await contestsAPI.adminAddProblems(id, problems)
      ElMessage.success('Đã thêm bài tập vào contest!')
    } catch (error) {
      handleApiError(error, 'Thêm bài tập thất bại')
      throw error
    } finally {
      loading.value = false
    }
  }

  const removeProblems = async (id, problemIds) => {
    try {
      loading.value = true
      await contestsAPI.adminRemoveProblems(id, problemIds)
      ElMessage.success('Đã xóa bài tập khỏi contest!')
    } catch (error) {
      handleApiError(error, 'Xóa bài tập thất bại')
      throw error
    } finally {
      loading.value = false
    }
  }

  const banUsers = async (id, userIds) => {
    try {
      loading.value = true
      await contestsAPI.adminBanUsers(id, userIds)
      ElMessage.success('Đã cấm người dùng tham gia!')
    } catch (error) {
      handleApiError(error, 'Cấm người dùng thất bại')
      throw error
    } finally {
      loading.value = false
    }
  }

  const unbanUsers = async (id, userIds) => {
    try {
      loading.value = true
      await contestsAPI.adminUnbanUsers(id, userIds)
      ElMessage.success('Đã bỏ cấm người dùng!')
    } catch (error) {
      handleApiError(error, 'Bỏ cấm người dùng thất bại')
      throw error
    } finally {
      loading.value = false
    }
  }

  // ====================
  // USER ACTIONS
  // ====================

  const registerContest = async (id, password = null) => {
    try {
      loading.value = true
      await contestsAPI.register(id, password)
      ElMessage.success('Đăng ký tham gia contest thành công!')
    } catch (error) {
      handleApiError(error, 'Đăng ký contest thất bại')
      throw error
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
    registerContest
  }
})
