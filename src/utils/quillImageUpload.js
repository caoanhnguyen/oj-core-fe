import { ElMessage } from 'element-plus'
import axiosInstance from '../api/axios'

/**
 * Helper to get full image URL from relative path
 * BE returns /api/files/view?key=..., we need to prepend API domain
 */
const getFullImageUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('http')) return url

    const baseURL = axiosInstance.defaults.baseURL
    if (baseURL && baseURL.startsWith('http')) {
        try {
            const urlObj = new URL(baseURL)
            return urlObj.origin + url
        } catch (e) {
            console.error('Invalid baseURL', e)
        }
    }
    return url
}

/**
 * Create Quill image upload handler
 * @param {Function} uploadFn - Function to upload image, returns {objectKey, url}
 * @param {Function} trackFn - Function to track uploaded image
 * @returns {Function} Quill image handler
 */
export const createQuillImageHandler = (uploadFn, trackFn) => {
    return async function () {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp'

        input.onchange = async () => {
            const file = input.files?.[0]
            if (!file) return

            // Validate size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                ElMessage.error('Image size must be less than 5MB')
                return
            }

            // Validate type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
            if (!allowedTypes.includes(file.type)) {
                ElMessage.error('Only JPEG, PNG, GIF, and WebP images are allowed')
                return
            }

            try {
                // Show loading message
                const loadingMsg = ElMessage.info('Uploading image...')

                // Upload image
                const imageData = await uploadFn(file)

                // Close loading message
                loadingMsg.close()

                // Get Quill instance and insert image
                const quill = this.quill
                const range = quill.getSelection(true)

                // Get full URL for display
                const imageUrl = getFullImageUrl(imageData.url)

                // Insert image at cursor position
                quill.insertEmbed(range.index, 'image', imageUrl)

                // Move cursor after image
                quill.setSelection(range.index + 1)

                // Track uploaded image for commit
                trackFn(imageData)

                ElMessage.success('Image uploaded successfully')
            } catch (error) {
                console.error('Failed to upload image:', error)
                ElMessage.error('Failed to upload image')
            }
        }

        input.click()
    }
}

/**
 * Extract image object keys from HTML content
 * Useful for finding which temp images are actually used in content
 * @param {string} htmlContent - HTML content with img tags
 * @returns {string[]} Array of object keys found in src attributes
 */
export const extractImageKeysFromHtml = (htmlContent) => {
    if (!htmlContent) return []

    const imgRegex = /<img[^>]+src="([^"]+)"/g
    const keys = []
    let match

    while ((match = imgRegex.exec(htmlContent)) !== null) {
        const src = match[1]
        // Extract object key from URL (temp/xxx.png or problems/xxx/yyy.png)
        const keyMatch = src.match(/(temp\/[^"?]+|problems\/[^"?]+)/)
        if (keyMatch) {
            keys.push(keyMatch[1])
        }
    }

    return keys
}
