<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../stores/auth'
import { Mail, AlertCircle, CheckCircle } from 'lucide-vue-next'
import { handleApiError } from '../../utils/errorHandler'

const authStore = useAuthStore()
const resending = ref(false)
const emailSent = ref(false)
const { t } = useI18n()

const bannerTitle = computed(() => t('auth.verify_banner_title'))
const bannerDescription = computed(() => t('auth.verify_banner_desc'))
const resendLabel = computed(() => t('auth.verify_banner_resend'))
const sentLabel = computed(() => t('auth.verify_banner_sent'))

const handleResendEmail = async () => {
  try {
    resending.value = true
    await authStore.resendVerificationEmail()
    emailSent.value = true
    ElMessage.success(t('auth.verify_banner_resend_success'))

    setTimeout(() => {
      emailSent.value = false
    }, 5000)
  } catch (error) {
    handleApiError(error, t('auth.verify_banner_resend_fail'))
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
        <strong>{{ bannerTitle }}</strong>
        <span>{{ bannerDescription }}</span>
      </div>
      <div class="banner-actions">
        <el-button
          v-if="!emailSent"
          type="warning"
          size="small"
          :loading="resending"
          class="resend-btn"
          @click="handleResendEmail"
        >
          <Mail :size="16" style="margin-right: 6px" />
          {{ resendLabel }}
        </el-button>
        <div v-else class="email-sent-indicator">
          <CheckCircle :size="16" />
          <span>{{ sentLabel }}</span>
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
