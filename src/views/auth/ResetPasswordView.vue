<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authAPI } from '../../api/auth'

// ...existing code...

const router = useRouter()
const route = useRoute()
const formRef = ref(null)
const loading = ref(false)
const countdown = ref(300) // 5 phút = 300 giây
const countdownInterval = ref(null)

const form = reactive({
  email: '',
  otp: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('Please confirm your password'))
  } else if (value !== form.newPassword) {
    callback(new Error('Passwords do not match'))
  } else {
    callback()
  }
}

const rules = {
  email: [
    { required: true, message: 'Please input email', trigger: 'blur' },
    { type: 'email', message: 'Please input a valid email', trigger: 'blur' },
    { max: 100, message: 'Email must not exceed 100 characters', trigger: 'blur' }
  ],
  otp: [
    { required: true, message: 'Please input OTP', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: 'OTP must be 6 digits', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: 'Please input new password', trigger: 'blur' },
    { min: 6, message: 'Password must be at least 6 characters', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: 'Please confirm password', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

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
      ElMessage.warning('OTP đã hết hạn. Vui lòng yêu cầu gửi lại OTP.')
    }
  }, 1000)
}

const handleSubmit = async (formEl) => {
  if (!formEl) return

  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true
        await authAPI.resetPassword({
          email: form.email,
          otp: form.otp,
          newPassword: form.newPassword
        })
        ElMessage.success('Đặt lại mật khẩu thành công!')
        if (countdownInterval.value) {
          clearInterval(countdownInterval.value)
        }
        router.push('/login')
      } catch (error) {
        const message = error.response?.data?.message || 'Đặt lại mật khẩu thất bại'
        ElMessage.error(message)
      } finally {
        loading.value = false
      }
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
    ElMessage.error('Vui lòng nhập email')
    return
  }

  try {
    loading.value = true
    await authAPI.forgotPassword(form.email)
    ElMessage.success('OTP mới đã được gửi đến email của bạn!')
    countdown.value = 300
    if (countdownInterval.value) {
      clearInterval(countdownInterval.value)
    }
    startCountdown()
  } catch (error) {
    const message = error.response?.data?.message || 'Gửi lại OTP thất bại'
    ElMessage.error(message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Lấy email từ query params nếu có
  if (route.query.email) {
    form.email = route.query.email
  }

  // Bắt đầu đếm ngược
  startCountdown()
})

// Cleanup khi component bị destroy
import { onBeforeUnmount } from 'vue'
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
          <h1>Reset Password</h1>
          <p>Enter OTP sent to your email and new password</p>
          <div class="countdown-timer" :class="{ 'countdown-warning': countdown < 60 }">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>{{ formatTime(countdown) }}</span>
          </div>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          size="large"
        >
          <el-form-item label="Email" prop="email">
            <el-input
              v-model="form.email"
              type="email"
              placeholder="Enter your email address"
              autocomplete="email"
            />
          </el-form-item>

          <el-form-item label="OTP Code" prop="otp">
            <el-input
              v-model="form.otp"
              placeholder="Enter 6-digit OTP"
              maxlength="6"
              autocomplete="off"
            >
              <template #append>
                <el-button
                  :disabled="countdown <= 0 || loading"
                  @click="resendOTP"
                  style="border: none;"
                >
                  Resend
                </el-button>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="New Password" prop="newPassword">
            <el-input
              v-model="form.newPassword"
              type="password"
              placeholder="Enter new password"
              show-password
              autocomplete="new-password"
            />
          </el-form-item>

          <el-form-item label="Confirm Password" prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="Confirm new password"
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
            Reset Password
          </el-button>
        </el-form>

        <div class="auth-footer">
          <span>Remember your password?</span>
          <a @click="goToLogin" class="link">Sign in</a>
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
  max-width: 420px;
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
  margin-bottom: var(--spacing-md);
}

.countdown-timer {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  color: var(--accent-primary);
  font-size: 13px;
  font-weight: 600;
  margin-top: var(--spacing-sm);
}

.countdown-timer.countdown-warning {
  color: #ef4444;
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.submit-btn {
  width: 100%;
  height: 42px;
  font-size: 15px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-active) 100%);
  border: none;
  color: #000;
  margin-bottom: var(--spacing-xl);
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--accent-hover) 0%, var(--accent-primary) 100%);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auth-footer {
  text-align: center;
  font-size: 14px;
  color: var(--text-secondary);
}

.auth-footer .link {
  color: var(--accent-primary);
  font-weight: 600;
  margin-left: var(--spacing-xs);
  cursor: pointer;
}

.auth-footer .link:hover {
  text-decoration: underline;
}

/* Element Plus Overrides */
:deep(.el-form-item__label) {
  color: var(--text-primary);
  font-weight: 500;
  font-size: 14px;
  margin-bottom: var(--spacing-sm);
}

:deep(.el-input__wrapper) {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  box-shadow: none;
  padding: 0px 12px;
}

:deep(.el-input__wrapper:hover) {
  border-color: var(--border-secondary);
}

:deep(.el-input__wrapper.is-focus) {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(255, 161, 22, 0.1);
}

:deep(.el-input__inner) {
  color: var(--text-primary);
  font-size: 14px;
}

:deep(.el-input__inner::placeholder) {
  color: var(--text-tertiary);
}

:deep(.el-input-group__append) {
  background: var(--bg-tertiary);
  border-color: var(--border-primary);
  color: var(--text-primary);
  box-shadow: none;
  padding: 0;
}

:deep(.el-input-group__append .el-button) {
  color: var(--accent-primary);
  font-weight: 600;
  font-size: 13px;
}

:deep(.el-input-group__append .el-button:hover:not(:disabled)) {
  color: var(--accent-hover);
}

:deep(.el-input-group__append .el-button:disabled) {
  color: var(--text-tertiary);
  cursor: not-allowed;
}
</style>

