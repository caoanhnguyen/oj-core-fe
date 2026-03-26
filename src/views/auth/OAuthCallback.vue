<script setup>
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { useAuthStore } from '../../stores/auth'
import { handleApiError } from '../../utils/errorHandler'
import { getErrorMessage } from '../../utils/errorCodes'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

onMounted(async () => {
  // 1. Kiểm tra tham số lỗi (ưu tiên URLSearchParams để bắt các param chưa được VueRouter parse kịp)
  const searchParams = new URLSearchParams(window.location.search)
  const error = searchParams.get('error') || route.query.error
  const message = searchParams.get('message') || route.query.message || searchParams.get('error_code')
  
    if (error || message) {
      console.warn('OAuth failure detected:', { error, message })
      
      let displayMessage = ''
      if (message && String(message) !== 'null') {
        displayMessage = getErrorMessage(message, String(message))
      }
      
      if (!displayMessage && error) {
        if (error === 'invalid_provider' || error === 'access_denied') {
          displayMessage = 'Email đã được dùng để đăng ký tài khoản khác. Vui lòng đăng nhập bằng mật khẩu!'
        } else {
          displayMessage = getErrorMessage(error, String(error))
        }
      }
      
      ElMessage.error({
        message: displayMessage || 'Đăng nhập OAuth không thành công. Vui lòng thử lại!',
        duration: 10000, 
        showClose: true
      })
      
      // Chuyển hướng về login và xóa các param rác (đã hiển thị message rồi nên không cần pass nữa)
      router.replace('/login')
      return
    }

  // 2. Nếu không có lỗi (thành công) -> Gọi API lấy thông tin profile
  try {
    await authStore.getCurrentUser()
    ElMessage.success('Đăng nhập thành công!')
    
    // (Tùy chọn) Có thể check thêm redirect URL trong localStorage nếu trước đó user đang xem dở bài tập
    router.replace('/')
  } catch (e) {
    // Nếu quá trình lấy profile thất bại (cookie lỗi, v.v...)
    handleApiError(e, 'Không thể lấy thông tin người dùng. Vui lòng đăng nhập lại!')
    router.replace('/login')
  }
})
</script>

<template>
  <div class="oauth-callback">
    <div class="loading">
      <el-icon class="is-loading" :size="40">
        <Loading />
      </el-icon>
      <p>Đang xử lý đăng nhập...</p>
    </div>
  </div>
</template>

<style scoped>
.oauth-callback {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f0f0f;
  color: #e0e0e0;
}

.loading {
  text-align: center;
}

.loading p {
  margin-top: 16px;
  color: #a0a0a0;
  font-size: 15px;
  font-weight: 500;
}

.is-loading {
  animation: rotating 2s linear infinite;
  color: #ffa116;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>