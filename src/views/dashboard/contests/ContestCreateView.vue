<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { contestsAPI } from '@/api/contests'
import { ElMessage } from 'element-plus'
import { handleApiError } from '@/utils/errorHandler'
import { ArrowLeft } from 'lucide-vue-next'
import ContestForm from './ContestForm.vue'

const router = useRouter()
const createLoading = ref(false)

const handleCreate = async (payload) => {
  try {
    createLoading.value = true
    await contestsAPI.adminCreate(payload)
    ElMessage.success('Đã tạo contest')
    router.push('/dashboard/contests')
  } catch (e) {
    handleApiError(e, 'Tạo contest thất bại')
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
        <ArrowLeft :size="15" /> Quản lý Contest
      </el-button>
      <span class="sub-title"> / <strong>Tạo Contest mới</strong></span>
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
