import axiosClient from './axios'

export const imagesAPI = {
    uploadTemporary: async (file) => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await axiosClient.post('/images/editor/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        return response.data
    },

    cleanupTemporary: async () => {
        const response = await axiosClient.delete('/images/editor/cleanup')
        return response.data
    }
}