import { defineStore } from 'pinia'
import { authAPI } from '../api/auth'
import usersApi from '../api/users'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.user && (!!state.user.id || !!state.user.username),
    currentUser: (state) => state.user,
    isEmailVerified: (state) => state.user?.emailVerified || false,
    isAdmin: (state) => state.user?.roles?.includes('ROLE_ADMIN'),
    isModerator: (state) => state.user?.roles?.includes('ROLE_MODERATOR'),
    isAdminOrMod: (state) => state.user?.roles?.includes('ROLE_ADMIN') || state.user?.roles?.includes('ROLE_MODERATOR')
  },

  actions: {
    async login(username, password) {
      try {
        this.loading = true
        const data = await authAPI.login(username, password)

        const loginData = data.user || data
        
        // 🌟 KIỂM TRA: Chỉ gán user nếu data thực sự là user (có id hoặc username)
        if (loginData && (loginData.id || loginData.username)) {
          this.user = loginData
        } else {
          // Nếu backend trả về dữ liệu rỗng hoặc không khớp user DTO -> coi như login thất bại
          throw new Error('Invalid user data received')
        }
        
        // Save token if exists (Bearer token case)
        const token = data.accessToken || data.token
        if (token) {
          localStorage.setItem('token', token)
        }

        return data
      } finally {
        this.loading = false
      }
    },

    async register(formData) {
      try {
        this.loading = true
        const data = await authAPI.register(formData)
        return data
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        await authAPI.logout()
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        // Xóa user khỏi store và token
        this.user = null
        localStorage.removeItem('token')
        // Reset authInitialized để lần đăng nhập kế tiếp vẫn fetch session đúng
        if (typeof window !== 'undefined') {
          window.__authInitialized = false
        }
      }
    },

    async getCurrentUser() {
      try {
        const response = await usersApi.getCurrentUser()
        const data = response.data.data
        this.user = data
        return data
      } catch (error) {
        console.error('Get current user error:', error)
        this.user = null
        throw error
      }
    },

    loginWithGoogle() {
      authAPI.loginWithGoogle()
    },

    loginWithGitHub() {
      authAPI.loginWithGitHub()
    },

    async verifyEmail(token) {
      try {
        this.loading = true
        const data = await authAPI.verifyEmail(token)
        return data
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    async resendVerificationEmail() {
      try {
        this.loading = true
        return await authAPI.resendVerificationEmail()
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
