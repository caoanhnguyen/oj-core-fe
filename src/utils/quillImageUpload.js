import { ElMessage } from 'element-plus'
import axiosInstance from '../api/axios'

/**
 * Helper to get full image URL from relative path
 */
const getFullImageUrl = (url) => {
    if (!url) return ''
    // 🌟 Nếu URL đã là link public chọc thẳng vào MinIO (bắt đầu bằng http) thì trả về luôn, không cần nối proxy nữa!
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
 */
export const createQuillImageHandler = (uploadFn, trackFn) => {
    return async function () {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp'

        input.onchange = async () => {
            const file = input.files?.[0]
            if (!file) return

            if (file.size > 5 * 1024 * 1024) {
                ElMessage.error('Image size must be less than 5MB')
                return
            }

            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
            if (!allowedTypes.includes(file.type)) {
                ElMessage.error('Only JPEG, PNG, GIF, and WebP images are allowed')
                return
            }

            try {
                const loadingMsg = ElMessage.info('Uploading image...')

                // Upload image
                const responseData = await uploadFn(file)

                loadingMsg.close()

                const quill = this.quill
                const range = quill.getSelection(true)

                // 🌟 FIX LỖI TÀNG HÌNH: Bóc tách đúng cục data bên trong ApiResponse
                // Đề phòng trường hợp Axios interceptor đã bóc sẵn data, ta dùng fallback
                const actualData = responseData.data ? responseData.data : responseData

                // Get full URL for display
                const imageUrl = getFullImageUrl(actualData.url)

                // Insert image at cursor position
                quill.insertEmbed(range.index, 'image', imageUrl)

                // Move cursor after image
                quill.setSelection(range.index + 1)

                // Track uploaded image for commit
                trackFn(actualData)

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
 * Extract image object keys from HTML content or Delta Object
 */
export const extractImageKeysFromHtml = (content) => {
    if (!content) return []

    // 1. Đề phòng trường hợp content là Object (Quill Delta JSON) thay vì HTML string
    // Ta ép tất cả thành chuỗi để regex dễ làm việc
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content)

    // 2. Regex siêu "trâu bò": Quét thẳng vào chuỗi để tìm các file có đuôi ảnh nằm trong các thư mục của MinIO
    // Bất chấp thẻ img hay JSON, nháy đơn hay nháy kép
    const regex = /(?:editor|temp|problems)\/[a-zA-Z0-9-]+\.(?:png|jpg|jpeg|gif|webp)/gi

    // 3. Lấy ra tất cả các kết quả khớp
    const matches = contentStr.match(regex)

    if (!matches) return []

    // 4. Lọc bỏ các kết quả trùng lặp (nếu có 1 ảnh copy 2 chỗ)
    return [...new Set(matches)]
}