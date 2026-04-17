<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authAPI } from '../../api/auth'
import { handleApiError } from '../../utils/errorHandler'
import { useI18n } from 'vue-i18n'
import AppButton from '@/components/common/AppButton.vue'

const { t } = useI18n()
const router = useRouter()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({ email: '' })

const rules = computed(() => ({
  email: [
    { required: true, message: t('auth.validation_req_email'),   trigger: 'blur' },
    { type: 'email',  message: t('auth.validation_format_email'), trigger: 'blur' },
    { max: 100,       message: t('auth.validation_len_email'),    trigger: 'blur' }
  ]
}))

const handleSubmit = async (formEl) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true
        await authAPI.forgotPassword(form.email)
        ElMessage.success(t('auth.otp_sent'))
        router.push({ name: 'reset-password', query: { email: form.email } })
      } catch (error) {
        handleApiError(error, t('auth.otp_send_fail'))
      } finally {
        loading.value = false
      }
    }
  })
}

const goToLogin = () => { router.push('/login') }
</script>

<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>{{ $t('auth.forgot_password') }}</h1>
          <p>{{ $t('auth.forgot_desc') }}</p>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          size="large"
          @keypress.enter="handleSubmit(formRef)"
        >
          <el-form-item :label="$t('auth.email')" prop="email">
            <el-input
              v-model="form.email"
              type="email"
              :placeholder="$t('auth.enter_email')"
              autocomplete="email"
            />
          </el-form-item>

          <AppButton
            variant="primary"
            size="large"
            class="submit-btn"
            :loading="loading"
            @click="handleSubmit(formRef)"
          >
            {{ $t('auth.send_otp') }}
          </AppButton>
        </el-form>

        <div class="auth-footer">
          <span>{{ $t('auth.remember_password') }}</span>
          <a @click="goToLogin" class="link">{{ $t('auth.sign_in') }}</a>
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
  max-width: 400px;
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

:deep(.el-input__wrapper:hover) { border-color: var(--border-secondary); }

:deep(.el-input__wrapper.is-focus) {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(255, 161, 22, 0.1);
}

:deep(.el-input__inner) { color: var(--text-primary); font-size: 14px; }
:deep(.el-input__inner::placeholder) { color: var(--text-tertiary); }
</style>
