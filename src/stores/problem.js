import { defineStore } from 'pinia'
import { problemsAPI } from '../api/problems'
import { imagesAPI } from '../api/images'
import { ElMessage } from 'element-plus'

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
        },
        uploadedImages: [] // Track uploaded temp images for commit
    }),

    getters: {
        getProblemById: (state) => (id) => {
            return state.problems.find(p => p.id === id)
        },

        hasUploadedImages: (state) => state.uploadedImages.length > 0
    },

    actions: {
        /**
         * Fetch problems list with pagination and filters
         */
        async fetchProblems(params = {}, append = false, isAdmin = false) {
            try {
                this.loading = true
                const apiCall = isAdmin ? problemsAPI.getAdminProblems : problemsAPI.getProblems
                const data = await apiCall({
                    page: params.page || 0,
                    size: params.size || 10,
                    difficulty: params.difficulty,
                    keyword: params.keyword,
                    status: params.status,
                    problemStatus: params.problemStatus,
                    topicSlugs: params.topicSlugs,
                    sort: params.sort // format: field,direction
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
                console.error('Failed to fetch problems:', error)
                ElMessage.error('Failed to load problems')
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Fetch single problem by ID
         */
        async fetchProblemById(id) {
            try {
                this.loading = true
                const data = await problemsAPI.getProblemById(id)
                this.currentProblem = data
                return data
            } catch (error) {
                console.error('Failed to fetch problem:', error)
                ElMessage.error('Failed to load problem details')
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Fetch single problem by Slug
         */
        async fetchProblemBySlug(slug) {
            try {
                this.loading = true
                const data = await problemsAPI.getProblemBySlug(slug)
                this.currentProblem = data
                return data
            } catch (error) {
                console.error('Failed to fetch problem:', error)
                ElMessage.error('Failed to load problem details')
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Create new problem
         */
        async createProblem(problemData) {
            try {
                this.loading = true

                let data = problemData

                // Handle FormData explicitly (for Testcases Zip)
                if (problemData instanceof FormData) {
                    if (this.uploadedImages.length > 0) {
                        // Append uploaded image keys if any
                        const keys = this.uploadedImages.map(img => img.objectKey)
                        // Note: Backend must parse this JSON string
                        data.append('temporaryImageKeys', JSON.stringify(keys))
                    }
                } else {
                    // Standard JSON payload
                    data = {
                        ...problemData,
                        temporaryImageKeys: this.uploadedImages.map(img => img.objectKey)
                    }
                }

                const result = await problemsAPI.createProblem(data)

                ElMessage.success('Problem created successfully!')

                // Clear uploaded images after successful creation
                this.clearUploadedImages()

                // Refresh problems list
                await this.fetchProblems({ page: 0, size: this.pagination.size }, false, true)

                return result
            } catch (error) {
                console.error('Failed to create problem:', error)
                ElMessage.error(error.response?.data?.message || 'Failed to create problem')
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Update existing problem
         */
        async updateProblem(id, problemData) {
            try {
                this.loading = true

                // Add uploaded image keys (for new images)
                const data = {
                    ...problemData,
                    temporaryImageKeys: this.uploadedImages.map(img => img.objectKey)
                }

                const result = await problemsAPI.updateProblem(id, data)

                ElMessage.success('Problem updated successfully!')

                // Clear uploaded images
                this.clearUploadedImages()

                // Refresh problems list
                await this.fetchProblems({ page: this.pagination.page, size: this.pagination.size }, false, true)

                return result
            } catch (error) {
                console.error('Failed to update problem:', error)
                ElMessage.error(error.response?.data?.message || 'Failed to update problem')
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Delete problem (soft delete)
         */
        async deleteProblem(id) {
            try {
                this.loading = true
                await problemsAPI.deleteProblem(id)

                ElMessage.success('Problem deleted successfully!')

                // Refresh problems list
                await this.fetchProblems({ page: this.pagination.page, size: this.pagination.size }, false, true)
            } catch (error) {
                console.error('Failed to delete problem:', error)
                ElMessage.error(error.response?.data?.message || 'Failed to delete problem')
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Restore problem
         */
        async restoreProblem(id) {
            try {
                this.loading = true
                await problemsAPI.restoreProblem(id)

                ElMessage.success('Problem restored successfully!')

                // Refresh problems list
                await this.fetchProblems({ page: this.pagination.page, size: this.pagination.size }, false, true)
            } catch (error) {
                console.error('Failed to restore problem:', error)
                ElMessage.error(error.response?.data?.message || 'Failed to restore problem')
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Publish problem
         */
        async publishProblem(id) {
            try {
                this.loading = true
                await problemsAPI.publishProblem(id)

                ElMessage.success('Problem published successfully!')

                // Refresh problems list
                await this.fetchProblems({ page: this.pagination.page, size: this.pagination.size }, false, true)
            } catch (error) {
                console.error('Failed to publish problem:', error)
                ElMessage.error(error.response?.data?.message || 'Failed to publish problem')
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Get solved count
         */
        async getSolvedCount() {
            try {
                this.loading = true
                const data = await problemsAPI.getSolvedCount()
                return data
            } catch (error) {
                console.error('Failed to get solved count:', error)
                ElMessage.error(error.response?.data?.message || 'Failed to get solved count')
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Upload Testcases Zip
         */
        async uploadTestcasesZip(problemId, formData) {
            try {
                return await problemsAPI.uploadTestcases(problemId, formData)
            } catch (error) {
                console.error('Failed to upload testcases:', error)
                // Don't throw, just log. Problem is created anyway.
                ElMessage.warning('Problem created but testcases failed to upload')
            }
        },

        /**
         * Upload temporary image
         * @param {File} file - Image file
         * @returns {Promise<{objectKey: string, url: string}>}
         */
        async uploadImage(file) {
            try {
                // Validate file size (5MB)
                if (file.size > 5 * 1024 * 1024) {
                    ElMessage.error('Image size must be less than 5MB')
                    throw new Error('File too large')
                }

                // Validate file type
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
                if (!allowedTypes.includes(file.type)) {
                    ElMessage.error('Only JPEG, PNG, GIF, and WebP images are allowed')
                    throw new Error('Invalid file type')
                }

                const imageData = await imagesAPI.uploadTemporary(file)

                // Track uploaded image for commit
                this.uploadedImages.push(imageData)

                return imageData
            } catch (error) {
                console.error('Failed to upload image:', error)
                if (!error.message.includes('File too large') && !error.message.includes('Invalid file type')) {
                    ElMessage.error('Failed to upload image')
                }
                throw error
            }
        },

        /**
         * Track uploaded image (called after successful upload)
         */
        trackUploadedImage(imageData) {
            if (!this.uploadedImages.find(img => img.objectKey === imageData.objectKey)) {
                this.uploadedImages.push(imageData)
            }
        },

        /**
         * Clear uploaded images (after submit or cancel)
         */
        clearUploadedImages() {
            this.uploadedImages = []
        }
    }
})
