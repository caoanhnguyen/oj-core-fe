<script setup>
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { useAuthStore } from '../../stores/auth'
import { handleApiError } from '../../utils/errorHandler'
import { useI18n } from 'vue-i18n'
import {
  getAuthRedirectMessage,
  getAuthRedirectPayload,
  getPostAuthRedirect,
} from '@/utils/authFlow'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { t } = useI18n()
const profileErrorFallback = t('auth.oauth_profile_load_failed')

onMounted(async () => {
  const { error, message } = getAuthRedirectPayload(route)

  if (error || message) {
    ElMessage.error({
      message: getAuthRedirectMessage({ error, message }, t),
      duration: 10000,
      showClose: true,
    })
    router.replace('/login')
    return
  }

  try {
    await authStore.initializeAuth(true)
    ElMessage.success(t('auth.login_success'))
    router.replace(getPostAuthRedirect(authStore))
  } catch (error) {
    handleApiError(error, profileErrorFallback)
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
      <p>{{ $t('auth.oauth_processing') }}</p>
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
