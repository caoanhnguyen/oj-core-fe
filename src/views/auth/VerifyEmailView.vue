<script setup>
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../stores/auth'
import { handleApiError } from '../../utils/errorHandler'
import { CheckCircle, XCircle, Loader2 } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const verifying = ref(true)
const success = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  const token = route.query.token

  if (!token) {
    errorMessage.value = 'Token xác thực không hợp lệ'
    verifying.value = false
    return
  }

  try {
    const result = await authStore.verifyEmail(token)
    success.value = true
    ElMessage.success('Xác thực email thành công!')
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  } catch (error) {
    success.value = false
    errorMessage.value = handleApiError(error, 'Xác thực email thất bại')
  } finally {
    verifying.value = false
  }
})

const goToLogin = () => {
  router.push('/login')
}

const goToHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="verify-email-page">
    <div class="verify-container">
      <div class="verify-card">
        <!-- Loading State -->
        <div v-if="verifying" class="verify-state">
          <div class="icon-wrapper loading">
            <Loader2 :size="64" class="spin-icon" />
          </div>
          <h1>Đang xác thực email...</h1>
          <p>Vui lòng đợi trong giây lát</p>
        </div>

        <!-- Success State -->
        <div v-else-if="success" class="verify-state">
          <div class="icon-wrapper success">
            <CheckCircle :size="64" />
          </div>
          <h1>Xác thực thành công!</h1>
          <p>Email của bạn đã được xác thực. Tài khoản đã được kích hoạt.</p>
          <p class="redirect-text">Đang chuyển hướng đến trang đăng nhập...</p>
          <el-button type="primary" class="action-btn" @click="goToLogin">
            Đăng nhập ngay
          </el-button>
        </div>

        <!-- Error State -->
        <div v-else class="verify-state">
          <div class="icon-wrapper error">
            <XCircle :size="64" />
          </div>
          <h1>Xác thực thất bại</h1>
          <p class="error-message">{{ errorMessage }}</p>
          <p class="hint-text">
            Token có thể đã hết hạn hoặc không hợp lệ. Vui lòng thử đăng nhập và gửi lại email xác thực.
          </p>
          <div class="button-group">
            <el-button type="primary" class="action-btn" @click="goToLogin">
              Đăng nhập
            </el-button>
            <el-button class="action-btn-secondary" @click="goToHome">
              Về trang chủ
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.verify-email-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  padding: var(--spacing-2xl);
}

.verify-container {
  width: 100%;
  max-width: 500px;
}

.verify-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-3xl);
}

.verify-state {
  text-align: center;
}

.icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  margin-bottom: var(--spacing-xl);
}

.icon-wrapper.loading {
  background: rgba(255, 161, 22, 0.1);
  color: var(--accent-primary);
}

.icon-wrapper.success {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.icon-wrapper.error {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.verify-state h1 {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
}

.verify-state p {
  font-size: 15px;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
  line-height: 1.6;
}

.error-message {
  color: #ef4444;
  font-weight: 500;
}

.hint-text {
  font-size: 14px;
  color: var(--text-tertiary);
  margin-bottom: var(--spacing-xl);
}

.redirect-text {
  font-size: 14px;
  color: var(--accent-primary);
  font-weight: 500;
  margin-bottom: var(--spacing-xl);
}

.action-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-active) 100%);
  border: none;
  color: #000;
  margin-top: var(--spacing-lg);
}

.action-btn:hover {
  background: linear-gradient(135deg, var(--accent-hover) 0%, var(--accent-primary) 100%);
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.action-btn-secondary {
  width: 100%;
  height: 44px;
  font-size: 15px;
  font-weight: 600;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  color: var(--text-primary);
}

.action-btn-secondary:hover {
  background: var(--bg-elevated);
  border-color: var(--border-secondary);
}

@media (max-width: 640px) {
  .verify-card {
    padding: var(--spacing-2xl);
  }

  .icon-wrapper {
    width: 100px;
    height: 100px;
  }

  .icon-wrapper svg {
    width: 52px;
    height: 52px;
  }

  .verify-state h1 {
    font-size: 24px;
  }
}
</style>
