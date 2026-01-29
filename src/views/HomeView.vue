<script setup>
import { ref, computed, onMounted } from 'vue'
import ProblemList from '../components/problems/ProblemList.vue'
import { useProblemStore } from '../stores/problem'
import { authAPI } from '../api/auth'
import { ElMessage } from 'element-plus'

const searchQuery = ref('')
const testing = ref(false)
const problemStore = useProblemStore()

const testGetMe = async () => {
  try {
    testing.value = true
    const data = await authAPI.getCurrentUser()
    console.log('Success! Data from /users/me:', data)
    ElMessage.success('Call /users/me thành công!')
  } catch (error) {
    console.error('Error calling /users/me:', error)
    ElMessage.error('Call /users/me thất bại: ' + (error.response?.status || error.message))
  } finally {
    testing.value = false
  }
}

// Use real data from store
const problems = computed(() => problemStore.problems)
const loading = computed(() => problemStore.loading)

// Fetch problems on mount
onMounted(async () => {
  await problemStore.fetchProblems({ page: 0, size: 20 })
})
</script>

<template>
  <div class="home-view">
    <div class="content-wrapper">
      <div class="header-section">
        <h1 class="page-title">Problems</h1>
        <div class="header-actions">
          <el-button type="primary" @click="testGetMe" :loading="testing">
            Test GET /api/users/me
          </el-button>
          <div class="header-stats">
            <span class="stat-item">
              <span class="stat-value">{{ problems.length }}</span>
              <span class="stat-label">Total</span>
            </span>
          </div>
        </div>
      </div>

      <div class="search-section">
        <el-input
          v-model="searchQuery"
          placeholder="Search problems..."
          size="large"
          class="search-input"
        >
          <template #prefix>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </template>
        </el-input>
      </div>

      <ProblemList :problems="problems" v-loading="loading" />
    </div>
  </div>
</template>

<style scoped>
.home-view {
  min-height: calc(100vh - 50px);
  background: var(--bg-primary);
}

.content-wrapper {
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--spacing-2xl) var(--spacing-lg);
}

.header-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-2xl);
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.header-stats {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  color: var(--text-secondary);
  font-size: 14px;
}

.stat-item {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-xs);
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-label {
  font-size: 13px;
}

.stat-divider {
  color: var(--border-primary);
}

.filters-section {
  margin-bottom: var(--spacing-xl);
}

.search-input {
  max-width: 400px;
}
</style>
