import { defineStore } from 'pinia'
import { authAPI } from '../api/auth'
import usersApi from '../api/users'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
    initialized: false,
    initPromise: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user && (!!state.user.id || !!state.user.username),
    currentUser: (state) => state.user,
    isEmailVerified: (state) => state.user?.emailVerified || false,
    isAdmin: (state) => state.user?.roles?.includes('ROLE_ADMIN'),
    isModerator: (state) => state.user?.roles?.includes('ROLE_MODERATOR'),
    isAssessor: (state) => state.user?.roles?.includes('ROLE_ASSESSOR'),
    isAdminOrMod: (state) =>
      state.user?.roles?.includes('ROLE_ADMIN') || state.user?.roles?.includes('ROLE_MODERATOR'),
    canAccessDashboard: (state) =>
      state.user?.roles?.includes('ROLE_ADMIN') ||
      state.user?.roles?.includes('ROLE_MODERATOR') ||
      state.user?.roles?.includes('ROLE_ASSESSOR'),
  },

  actions: {
    clearAuthState() {
      this.user = null
      localStorage.removeItem('activeContestSession')
      localStorage.removeItem('contestTimeOffset')
      this.initialized = true
      this.initPromise = null
    },

    async initializeAuth(force = false) {
      if (this.initialized && !force) {
        return this.user
      }

      if (this.initPromise && !force) {
        return this.initPromise
      }

      this.initPromise = (async () => {
        try {
          await this.getCurrentUser()
        } catch {
          this.user = null
        } finally {
          this.initialized = true
        }
        return this.user
      })()

      try {
        return await this.initPromise
      } finally {
        this.initPromise = null
      }
    },

    async login(username, password) {
      try {
        this.loading = true
        await authAPI.login(username, password)
        const user = await this.getCurrentUser()
        this.initialized = true
        return user
      } finally {
        this.loading = false
      }
    },

    async register(formData) {
      try {
        this.loading = true
        return await authAPI.register(formData)
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
        this.clearAuthState()
      }
    },

    async getCurrentUser() {
      try {
        const response = await usersApi.getCurrentUser()
        const data = response.data.data
        this.user = data
        return data
      } catch (error) {
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
        return await authAPI.verifyEmail(token)
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
    },
  },
})
