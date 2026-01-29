import axiosInstance from './axios'

/**
 * Images API
 * Upload and manage images for problems
 */
export const imagesAPI = {
    /**
     * Upload temporary image for problem description/examples
     * Image will be stored with "temp/" prefix and auto-deleted after 24h if not committed
     * Admin only
     * 
     * @param {File} file - Image file (max 5MB, jpeg/jpg/png/gif/webp)
     * @returns {Promise<{objectKey: string, url: string, originalFilename: string, fileSize: number, uploadedAt: string}>}
     */
    uploadTemporary: async (file) => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await axiosInstance.post('/images/upload-temp', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })

        return response.data.data
    }
}
