import axios from './axios'

const usersApi = {
  // --- Public/User Profile APIs ---

  getUserProfileById: (id) => {
    return axios.get(`/users/${id}`)
  },

  getUserProfileByUsername: (username) => {
    return axios.get(`/users/${username}`)
  },

  getCurrentUser: () => {
    return axios.get('/users/me')
  },

  updateProfile: (data) => {
    return axios.patch('/users/me', data)
  },

  uploadAvatar: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return axios.post('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // --- Admin User Management APIs ---

  adminGetUsers: (params) => {
    return axios.get('/admin/users', { params })
  },

  adminGetUserById: (id) => {
    return axios.get(`/admin/users/${id}`)
  },

  adminBulkToggleLock: (request) => {
    return axios.patch('/admin/users/bulk-toggle-lock', request)
  },

  adminUpdateRoles: (id, request) => {
    return axios.patch(`/admin/users/${id}/roles`, request)
  }
}

export default usersApi
