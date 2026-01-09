import { reactive, computed } from 'vue'
import { authAPI } from '../api/auth'

const state = reactive({
  user: null,
  loading: false
})

// Load user từ localStorage khi khởi động
const loadUserFromStorage = () => {
  try {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      state.user = JSON.parse(userStr)
    }
  } catch (error) {
    console.error('Error loading user from storage:', error)
    localStorage.removeItem('user')
  }
}

loadUserFromStorage()

const login = async (username, password) => {
  try {
    state.loading = true
    const data = await authAPI.login(username, password)

    state.user = data.user || data
    localStorage.setItem('user', JSON.stringify(state.user))

    return data
  } finally {
    state.loading = false
  }
}

const register = async (formData) => {
  try {
    state.loading = true
    const data = await authAPI.register(formData)

    state.user = data.user || data
    localStorage.setItem('user', JSON.stringify(state.user))

    return data
  } finally {
    state.loading = false
  }
}

const logout = async () => {
  try {
    await authAPI.logout()
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    state.user = null
    localStorage.removeItem('user')
  }
}

const getCurrentUser = async () => {
  try {
    const data = await authAPI.getCurrentUser()
    state.user = data
    localStorage.setItem('user', JSON.stringify(data))
    return data
  } catch (error) {
    console.error('Get current user error:', error)
    state.user = null
    localStorage.removeItem('user')
    throw error
  }
}

const loginWithGoogle = () => {
  authAPI.loginWithGoogle()
}

const loginWithGitHub = () => {
  authAPI.loginWithGitHub()
}

// Export singleton store
export const useAuthStore = () => ({
  user: computed(() => state.user),
  isAuthenticated: computed(() => !!state.user),
  loading: computed(() => state.loading),
  login,
  register,
  logout,
  getCurrentUser,
  loginWithGoogle,
  loginWithGitHub
})
