<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../stores/auth'
import { Mail, AlertCircle, CheckCircle } from 'lucide-vue-next'
import { handleApiError } from '../../utils/errorHandler'

const authStore = useAuthStore()
const resending = ref(false)
const emailSent = ref(false)

const handleResendEmail = async () => {
  try {
    resending.value = true
    
    // Debug logs
    console.log('🔍 Resending verification email...')
    console.log('User:', authStore.user)
    console.log('Cookies:', document.cookie)
    
    await authStore.resendVerificationEmail()
    emailSent.value = true
    ElMessage.success('Email xác thực đã được gửi lại!')
    
    setTimeout(() => {
      emailSent.value = false
    }, 5000)
  } catch (error) {
    handleApiError(error, 'Gửi email xác thực thất bại')
  } finally {
    resending.value = false
  }
}
</script>

<template>
  <div class="email-verification-banner">
    <div class="banner-content">
      <div class="banner-icon">
        <AlertCircle :size="20" />
      </div>
      <div class="banner-text">
        <strong>Email chưa được xác thực</strong>
        <span>Vui lòng kiểm tra email và click vào link xác thực để kích hoạt tài khoản.</span>
      </div>
      <div class="banner-actions">
        <el-button 
          v-if="!emailSent"
          type="warning" 
          size="small" 
          :loading="resending"
          @click="handleResendEmail"
          class="resend-btn"
        >
          <Mail :size="16" style="margin-right: 6px;" />
          Gửi lại email
        </el-button>
        <div v-else class="email-sent-indicator">
          <CheckCircle :size="16" />
          <span>Email đã được gửi!</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.email-verification-banner {
  background: linear-gradient(135deg, rgba(255, 161, 22, 0.15) 0%, rgba(255, 136, 0, 0.15) 100%);
  border-bottom: 1px solid rgba(255, 161, 22, 0.3);
  padding: var(--spacing-md) var(--spacing-lg);
}

.banner-content {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.banner-icon {
  flex-shrink: 0;
  color: var(--accent-primary);
  display: flex;
  align-items: center;
}

.banner-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.banner-text strong {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.banner-text span {
  font-size: 13px;
  color: var(--text-secondary);
}

.banner-actions {
  flex-shrink: 0;
}

.resend-btn {
  display: inline-flex;
  align-items: center;
  font-weight: 600;
  background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-active) 100%);
  border: none;
  color: #000;
}

.resend-btn:hover {
  background: linear-gradient(135deg, var(--accent-hover) 0%, var(--accent-primary) 100%);
}

.email-sent-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 6px;
  color: #22c55e;
  font-size: 13px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .banner-content {
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }

  .banner-text {
    flex-basis: 100%;
  }

  .banner-text span {
    display: none;
  }

  .banner-actions {
    margin-left: auto;
  }
}
</style>
