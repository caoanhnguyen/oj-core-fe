import { defineStore } from 'pinia'
import { problemsAPI } from '../api/problems'
import { imagesAPI } from '../api/images'
import { ElMessage } from 'element-plus'
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
            totalPages: 0
        }
    }),

    getters: {
        getProblemById: (state) => (id) => {
            return state.problems.find(p => p.id === id)
        }
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

                if (append) {
                    this.problems = [...this.problems, ...(data.content || [])]
                } else {
                    this.problems = data.content || []
                }
                this.pagination = {
                    page: data.number || 0,
                    size: data.size || 10,
                    totalElements: data.totalElements || 0,
                    totalPages: data.totalPages || 0
                }

                return data
            } catch (error) {
                handleApiError(error, 'Không thể tải danh sách bài tập')
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
                handleApiError(error, 'Không thể tải thông tin bài tập')
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
                handleApiError(error, 'Không thể tải thông tin bài tập')
                throw error
            } finally {
                this.loading = false
            }
        },

        async createProblem(problemData) {
            try {
                this.loading = true

                // 🌟 FIX: Truyền thẳng problemData (đã chứa mảng ảnh quét từ Regex) xuống API
                const result = await problemsAPI.createProblem(problemData)

                ElMessage.success('Problem created successfully!')

                await this.fetchProblems({ page: 0, size: this.pagination.size }, false, true)

                return result
            } catch (error) {
                handleApiError(error, 'Tạo bài tập thất bại')
                throw error
            } finally {
                this.loading = false
            }
        },

        async updateProblem(id, problemData) {
            try {
                this.loading = true

                // 🌟 FIX: Truyền thẳng problemData (đã chứa mảng ảnh quét từ Regex) xuống API
                const result = await problemsAPI.updateProblem(id, problemData)

                ElMessage.success('Problem updated successfully!')

                await this.fetchProblems({ page: this.pagination.page, size: this.pagination.size }, false, true)

                return result
            } catch (error) {
                handleApiError(error, 'Cập nhật bài tập thất bại')
                throw error
            } finally {
                this.loading = false
            }
        },

        async deleteProblem(id) {
            try {
                this.loading = true
                await problemsAPI.deleteProblem(id)

                ElMessage.success('Problem deleted successfully!')

                await this.fetchProblems({ page: this.pagination.page, size: this.pagination.size }, false, true)
            } catch (error) {
                handleApiError(error, 'Xóa bài tập thất bại')
                throw error
            } finally {
                this.loading = false
            }
        },

        async restoreProblem(id) {
            try {
                this.loading = true
                await problemsAPI.restoreProblem(id)

                ElMessage.success('Problem restored successfully!')

                await this.fetchProblems({ page: this.pagination.page, size: this.pagination.size }, false, true)
            } catch (error) {
                handleApiError(error, 'Khôi phục bài tập thất bại')
                throw error
            } finally {
                this.loading = false
            }
        },

        async publishProblem(id) {
            try {
                this.loading = true
                await problemsAPI.publishProblem(id)

                ElMessage.success('Problem published successfully!')

                await this.fetchProblems({ page: this.pagination.page, size: this.pagination.size }, false, true)
            } catch (error) {
                handleApiError(error, 'Công khai bài tập thất bại')
                throw error
            } finally {
                this.loading = false
            }
        },

        async getSolvedCount() {
            try {
                this.loading = true
                const data = await problemsAPI.getSolvedCount()
                return data
            } catch (error) {
                handleApiError(error, 'Lấy số lượng bài đã giải thất bại')
                throw error
            } finally {
                this.loading = false
            }
        },

        async uploadTestcasesZip(problemId, formData) {
            try {
                return await problemsAPI.uploadTestcases(problemId, formData)
            } catch (error) {
                handleApiError(error, 'Bài tập đã được tạo nhưng tải tệp testcase thất bại')
            }
        },

        // 🌟 Các hàm upload/track ảnh cũ thừa thãi đã được loại bỏ cho sạch sẽ!
        // Giờ FE gọi API chọc MinIO thẳng trong Component, Store không cần ôm rơm rặm bụng nữa.

        clearUploadedImages() {
            // Hàm này để lại chống lỗi (nếu trong component lỡ còn gọi đến)
            // Nhưng thực tế không còn xài
        }
    }
})