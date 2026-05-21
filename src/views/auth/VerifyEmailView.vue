<script setup>
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../stores/auth'
import { handleApiError } from '../../utils/errorHandler'
import { CheckCircle, XCircle, Loader2 } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { t } = useI18n()

const verifying = ref(true)
const success = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  const token = route.query.token

  if (!token) {
    errorMessage.value = t('auth.verify_email_invalid_token')
    verifying.value = false
    return
  }

  try {
    await authStore.verifyEmail(token)
    success.value = true
    ElMessage.success(t('auth.verify_email_success_toast'))
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  } catch (error) {
    success.value = false
    errorMessage.value = handleApiError(error, t('auth.verify_email_failed'))
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
        <div v-if="verifying" class="verify-state">
          <div class="icon-wrapper loading">
            <Loader2 :size="64" class="spin-icon" />
          </div>
          <h1>{{ $t('auth.verify_email_loading_title') }}</h1>
          <p>{{ $t('auth.verify_email_loading_desc') }}</p>
        </div>

        <div v-else-if="success" class="verify-state">
          <div class="icon-wrapper success">
            <CheckCircle :size="64" />
          </div>
          <h1>{{ $t('auth.verify_email_success_title') }}</h1>
          <p>{{ $t('auth.verify_email_success_desc') }}</p>
          <p class="redirect-text">{{ $t('auth.verify_email_redirecting') }}</p>
          <el-button type="primary" class="action-btn" @click="goToLogin">
            {{ $t('auth.sign_in') }}
          </el-button>
        </div>

        <div v-else class="verify-state">
          <div class="icon-wrapper error">
            <XCircle :size="64" />
          </div>
          <h1>{{ $t('auth.verify_email_failed_title') }}</h1>
          <p class="error-message">{{ errorMessage }}</p>
          <p class="hint-text">{{ $t('auth.verify_email_failed_hint') }}</p>
          <div class="button-group">
            <el-button type="primary" class="action-btn" @click="goToLogin">
              {{ $t('auth.sign_in') }}
            </el-button>
            <el-button class="action-btn-secondary" @click="goToHome">
              {{ $t('nav.home') }}
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

.verify-state h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
}

.verify-state p {
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: var(--spacing-md);
}

.redirect-text,
.hint-text {
  font-size: 14px;
}

.error-message {
  color: #ef4743;
  font-weight: 500;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: var(--spacing-lg);
}

.action-btn-secondary {
  background: transparent;
  border-color: var(--border-primary);
  color: var(--text-primary);
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
