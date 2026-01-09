<script setup>
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

onMounted(async () => {
  const error = route.query.error

  if (error) {
    localStorage.removeItem('user')
    ElMessage.error(String(error))
    router.replace('/login')
    return
  }

  try {
    await authStore.getCurrentUser()
    ElMessage.success('Đăng nhập thành công!')
    router.replace('/')
  } catch (e) {
    // Nếu OAuth fail hoặc cookie không hợp lệ -> về login, tránh redirect loop
    localStorage.removeItem('user')
    const message = e.response?.data?.message || 'Không thể lấy thông tin người dùng'
    ElMessage.error(message)
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
  background: var(--bg-primary);
}

.loading {
  text-align: center;
}

.loading p {
  margin-top: var(--spacing-lg);
  color: var(--text-secondary);
  font-size: 14px;
}

.is-loading {
  animation: rotating 2s linear infinite;
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
