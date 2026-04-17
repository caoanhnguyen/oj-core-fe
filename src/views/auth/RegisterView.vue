<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../stores/auth'
import { authAPI } from '../../api/auth'
import { handleApiError } from '../../utils/errorHandler'
import { useI18n } from 'vue-i18n'
import AppButton from '@/components/common/AppButton.vue'

// ...existing code...

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

const formRef = ref(null)
const loading = ref(false)
const checkingEmail = ref(false)

const form = reactive({
  username: '',
  fullName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// Validator cho password mạnh
const validateStrongPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error(t('auth.validation_req_password')))
    return
  }
  
  if (value.length < 10) {
    callback(new Error(t('auth.validation_len_password')))
    return
  }
  
  if (!/[A-Z]/.test(value)) {
    callback(new Error(t('auth.validation_upper_password')))
    return
  }
  
  if (!/[0-9]/.test(value)) {
    callback(new Error(t('auth.validation_digit_password')))
    return
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
    callback(new Error(t('auth.validation_special_password')))
    return
  }
  
  // Trigger validate confirmPassword nếu đã nhập
  if (form.confirmPassword !== '') {
    if (formRef.value) formRef.value.validateField('confirmPassword')
  }
  
  callback()
}

const validateConfirmPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error(t('auth.validation_req_confirm_password')))
    return
  }
  
  if (value !== form.password) {
    callback(new Error(t('auth.validation_match_password')))
    return
  }
  
  callback()
}

// Validator kiểm tra email đã tồn tại
const validateEmailExists = async (rule, value, callback) => {
  if (!value) {
    callback(new Error(t('auth.validation_req_email')))
    return
  }
  
  // Validate email format trước
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value)) {
    callback(new Error(t('auth.validation_format_email')))
    return
  }
  
  try {
    checkingEmail.value = true
    const result = await authAPI.checkEmailExists(value)
    
    // Nếu backend trả về { exists: true }
    if (result.exists || result === true) {
      callback(new Error(t('auth.validation_email_exists')))
      return
    }
    
    callback()
  } catch (error) {
    // Nếu API lỗi, vẫn cho phép tiếp tục (fail gracefully)
    console.error('Check email error:', error)
    callback()
  } finally {
    checkingEmail.value = false
  }
}

const rules = computed(() => ({
  username: [
    { required: true, message: t('auth.validation_req_username'), trigger: 'blur' },
    { min: 3, max: 50, message: t('auth.validation_len_username'), trigger: 'blur' }
  ],
  email: [
    { required: true, validator: validateEmailExists, trigger: 'blur' }
  ],
  password: [
    { required: true, validator: validateStrongPassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ],
  fullName: [
    { required: true, message: t('auth.validation_req_fullname'), trigger: 'blur' },
    { max: 100, message: t('auth.validation_len_fullname'), trigger: 'blur' }
  ],
}))

const handleRegister = async (formEl) => {
  if (!formEl) return

  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true
        await authStore.register({
          username: form.username,
          email: form.email,
          password: form.password,
          fullName: form.fullName
        })
        ElMessage.success({
          message: t('auth.register_success'),
          duration: 5000
        })
        // Redirect về login thay vì home (vì không auto-login nữa)
        router.push('/login')
      } catch (error) {
        handleApiError(error, t('auth.register_failed'))
      } finally {
        loading.value = false
      }
    }
  })
}

const handleGoogleLogin = () => {
  authStore.loginWithGoogle()
}

const handleGitHubLogin = () => {
  authStore.loginWithGitHub()
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>{{ $t('auth.create_account') }}</h1>
          <p>{{ $t('auth.join_community') }}</p>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          size="large"
          @keypress.enter="handleRegister(formRef)"
        >
          <el-form-item :label="$t('auth.username')" prop="username">
            <el-input
              v-model="form.username"
              :placeholder="$t('auth.choose_username')"
              autocomplete="username"
            />
          </el-form-item>

          <el-form-item :label="$t('auth.full_name')" prop="fullName">
            <el-input
              v-model="form.fullName"
              :placeholder="$t('auth.enter_full_name')"
              autocomplete="name"
            />
          </el-form-item>

          <el-form-item :label="$t('auth.email')" prop="email">
            <el-input
              v-model="form.email"
              :placeholder="$t('auth.enter_email')"
              autocomplete="email"
            />
          </el-form-item>

          <el-form-item :label="$t('auth.password')" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              :placeholder="$t('auth.create_password')"
              show-password
              autocomplete="new-password"
            />
          </el-form-item>

          <el-form-item :label="$t('auth.confirm_password')" prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              :placeholder="$t('auth.enter_confirm_password')"
              show-password
              autocomplete="new-password"
            />
          </el-form-item>

          <AppButton
            variant="primary"
            size="large"
            class="submit-btn"
            :loading="loading"
            @click="handleRegister(formRef)"
          >
            {{ $t('auth.sign_up') }}
          </AppButton>
        </el-form>

        <div class="divider">
          <span>{{ $t('auth.or_continue_with') }}</span>
        </div>

        <div class="social-buttons">
          <AppButton variant="secondary" class="social-btn" @click="handleGoogleLogin">
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
              </g>
            </svg>
            <span>Google</span>
          </AppButton>

          <AppButton variant="secondary" class="social-btn" @click="handleGitHubLogin">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span>GitHub</span>
          </AppButton>
        </div>

        <div class="auth-footer">
          <span>{{ $t('auth.have_account') }}</span>
          <RouterLink to="/login" class="link">{{ $t('auth.sign_in') }}</RouterLink>
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
}

.submit-btn {
  width: 100%;
  margin-top: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.divider {
  position: relative;
  text-align: center;
  margin: var(--spacing-xl) 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--border-primary);
}

.divider span {
  position: relative;
  background: var(--bg-secondary);
  padding: 0 var(--spacing-md);
  font-size: 13px;
  color: var(--text-tertiary);
}

.social-buttons {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.social-btn {
  flex: 1;
  gap: var(--spacing-sm);
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
</style>
