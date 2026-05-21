<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { authAPI } from '../../api/auth'
import { handleApiError } from '../../utils/errorHandler'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const formRef = ref(null)
const loading = ref(false)
const countdown = ref(300)
const countdownInterval = ref(null)

const form = reactive({
  email: '',
  otp: '',
  newPassword: '',
  confirmPassword: '',
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error(t('auth.validation_req_confirm_password')))
  } else if (value !== form.newPassword) {
    callback(new Error(t('auth.validation_match_password')))
  } else {
    callback()
  }
}

const rules = computed(() => ({
  email: [
    { required: true, message: t('auth.validation_req_email'), trigger: 'blur' },
    { type: 'email', message: t('auth.validation_format_email'), trigger: 'blur' },
    { max: 100, message: t('auth.validation_len_email'), trigger: 'blur' },
  ],
  otp: [
    { required: true, message: t('auth.reset_otp_required'), trigger: 'blur' },
    { pattern: /^\d{6}$/, message: t('auth.reset_otp_invalid'), trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: t('auth.validation_req_password'), trigger: 'blur' },
    { min: 10, message: t('auth.validation_len_password'), trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: t('auth.validation_req_confirm_password'), trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}))

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const startCountdown = () => {
  countdownInterval.value = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownInterval.value)
      ElMessage.warning(t('auth.reset_otp_expired'))
    }
  }, 1000)
}

const handleSubmit = async (formEl) => {
  if (!formEl) return

  await formEl.validate(async (valid) => {
    if (!valid) return

    try {
      loading.value = true
      await authAPI.resetPassword({
        email: form.email,
        otp: form.otp,
        newPassword: form.newPassword,
      })
      ElMessage.success(t('auth.reset_success'))
      if (countdownInterval.value) {
        clearInterval(countdownInterval.value)
      }
      router.push('/login')
    } catch (error) {
      handleApiError(error, t('auth.reset_failed'))
    } finally {
      loading.value = false
    }
  })
}

const goToLogin = () => {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value)
  }
  router.push('/login')
}

const resendOTP = async () => {
  if (!form.email) {
    ElMessage.error(t('auth.validation_req_email'))
    return
  }

  try {
    loading.value = true
    await authAPI.forgotPassword(form.email)
    ElMessage.success(t('auth.reset_resend_success'))
    countdown.value = 300
    if (countdownInterval.value) {
      clearInterval(countdownInterval.value)
    }
    startCountdown()
  } catch (error) {
    handleApiError(error, t('auth.reset_resend_failed'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (route.query.email) {
    form.email = route.query.email
  }
  startCountdown()
})

onBeforeUnmount(() => {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value)
  }
})
</script>

<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>{{ $t('auth.reset_title') }}</h1>
          <p>{{ $t('auth.reset_desc') }}</p>
          <div class="countdown-timer" :class="{ 'countdown-warning': countdown < 60 }">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{{ formatTime(countdown) }}</span>
          </div>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" size="large">
          <el-form-item :label="$t('auth.email')" prop="email">
            <el-input
              v-model="form.email"
              type="email"
              :placeholder="$t('auth.reset_email_placeholder')"
              autocomplete="email"
            />
          </el-form-item>

          <el-form-item :label="$t('auth.reset_otp_label')" prop="otp">
            <el-input
              v-model="form.otp"
              :placeholder="$t('auth.reset_otp_placeholder')"
              maxlength="6"
              autocomplete="off"
            >
              <template #append>
                <el-button :disabled="countdown <= 0 || loading" style="border: none" @click="resendOTP">
                  {{ $t('auth.reset_resend') }}
                </el-button>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item :label="$t('auth.reset_new_password')" prop="newPassword">
            <el-input
              v-model="form.newPassword"
              type="password"
              :placeholder="$t('auth.reset_new_password_placeholder')"
              show-password
              autocomplete="new-password"
            />
          </el-form-item>

          <el-form-item :label="$t('auth.confirm_password')" prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              :placeholder="$t('auth.reset_confirm_password_placeholder')"
              show-password
              autocomplete="new-password"
            />
          </el-form-item>

          <el-button
            type="primary"
            class="submit-btn"
            :loading="loading"
            :disabled="countdown <= 0"
            @click="handleSubmit(formRef)"
          >
            {{ $t('auth.reset_submit') }}
          </el-button>
        </el-form>

        <div class="auth-footer">
          <span>{{ $t('auth.remember_password') }}</span>
          <a class="link" @click="goToLogin">{{ $t('auth.sign_in') }}</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: calc(100vh - 50px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  padding: var(--spacing-2xl);
}

.auth-container {
  width: 100%;
  max-width: 460px;
}

.auth-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
}

.auth-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.auth-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.auth-header p {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-lg);
}

.countdown-timer {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 161, 22, 0.08);
  border: 1px solid rgba(255, 161, 22, 0.2);
  color: var(--accent-primary);
  font-weight: 600;
  font-size: 13px;
}

.countdown-warning {
  color: #ef4743;
  background: rgba(239, 71, 67, 0.08);
  border-color: rgba(239, 71, 67, 0.2);
}

.submit-btn {
  width: 100%;
  margin-top: var(--spacing-md);
}

.auth-footer {
  margin-top: var(--spacing-xl);
  text-align: center;
  font-size: 14px;
  color: var(--text-secondary);
}

.auth-footer .link {
  margin-left: var(--spacing-xs);
  color: var(--accent-primary);
  font-weight: 600;
}

.auth-footer .link:hover {
  text-decoration: underline;
}
</style>
