import axiosInstance from './axios'

export const authAPI = {
  login: async (username, password) => {
    const response = await axiosInstance.post('/auth/login', { username, password })
    return response.data.data || response.data
  },

  register: async (data) => {
    const response = await axiosInstance.post('/auth/register', {
      username: data.username,
      fullName: data.fullName,
      email: data.email,
      password: data.password
    })
    return response.data.data || response.data
  },

  logout: async () => {
    const response = await axiosInstance.post('/auth/logout')
    return response.data.data || response.data
  },

  getCurrentUser: async () => {
    const response = await axiosInstance.get('/users/me')
    return response.data.data
  },

  refreshToken: async () => {
    const response = await axiosInstance.post('/auth/refresh')
    return response.data.data || response.data
  },

  loginWithGoogle: () => {
    window.location.href = 'http://localhost:8088/oauth2/authorization/google'
  },

  loginWithGitHub: () => {
    window.location.href = 'http://localhost:8088/oauth2/authorization/github'
  },

  forgotPassword: async (email) => {
    const response = await axiosInstance.post('/auth/forgot-password', { email })
    return response.data.data || response.data
  },

  resetPassword: async (data) => {
    const response = await axiosInstance.post('/auth/reset-password', {
      email: data.email,
      otp: data.otp,
      newPassword: data.newPassword
    })
    return response.data.data || response.data
  },

  verifyEmail: async (token) => {
    const response = await axiosInstance.get(`/auth/verify-email?token=${token}`)
    return response.data.data || response.data
  },

  resendVerificationEmail: async () => {
    const response = await axiosInstance.post('/auth/resend-verification-email')
    return response.data.data || response.data
  },

  checkEmailExists: async (email) => {
    const response = await axiosInstance.post(`/auth/check-email?email=${encodeURIComponent(email)}`)
    return response.data.data || response.data
  }
}

