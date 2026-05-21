<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useContestStore } from '@/stores/contest'
import { ElMessage } from 'element-plus'
import { handleApiError } from '@/utils/errorHandler'
import { ArrowLeft } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import ContestForm from './ContestForm.vue'

const router = useRouter()
const contestStore = useContestStore()
const { t } = useI18n()
const createLoading = ref(false)

const handleCreate = async (payload) => {
  try {
    createLoading.value = true
    await contestStore.createContest(payload)
    ElMessage.success(t('admin_contests.messages.create_success'))
    router.push('/dashboard/contests')
  } catch (e) {
    handleApiError(e, t('admin_contests.messages.create_fail'))
  } finally {
    createLoading.value = false
  }
}

const handleCancel = () => {
  router.push('/dashboard/contests')
}
</script>

<template>
  <div class="content-section">
    <div class="back-bar">
      <el-button link @click="handleCancel" class="back-btn">
        <ArrowLeft :size="15" /> {{ $t('admin_contests.page_title') }}
      </el-button>
      <span class="sub-title"> / <strong>{{ $t('admin_contests.form.title_create') }}</strong></span>
    </div>
    <div class="create-form-container">
      <ContestForm :loading="createLoading" @submit="handleCreate" @cancel="handleCancel" />
    </div>
  </div>
</template>

<style scoped>
.content-section {
  padding: var(--spacing-2xl);
  max-width: 1400px;
  margin: 0 auto;
}

.back-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #3e3e3e;
}

.back-btn {
  color: var(--text-secondary) !important;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.back-btn:hover {
  color: var(--accent-primary) !important;
}

.sub-title {
  font-size: 14px;
  color: var(--text-secondary);
}

.sub-title strong {
  color: var(--text-primary);
}

.create-form-container {
  padding: 12px 0;
}
</style>
