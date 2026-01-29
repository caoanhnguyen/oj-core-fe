import { defineStore } from 'pinia'
import { authAPI } from '../api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    currentUser: (state) => state.user,
    isEmailVerified: (state) => state.user?.emailVerified || false,
    isAdmin: (state) => state.user?.roles.includes('ROLE_ADMIN')
  },

  actions: {
    async login(username, password) {
      try {
        this.loading = true
        const data = await authAPI.login(username, password)

        // Lưu user info vào Pinia store
        this.user = data.user || data

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
        // Xóa user khỏi store
        this.user = null
      }
    },

    async getCurrentUser() {
      try {
        const data = await authAPI.getCurrentUser()
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
      } finally {
        this.loading = false
      }
    },

    async resendVerificationEmail() {
      try {
        this.loading = true
        return await authAPI.resendVerificationEmail()
      } finally {
        this.loading = false
      }
    }
  }
})
