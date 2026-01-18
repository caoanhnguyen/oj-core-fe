<script setup>
import { ref } from 'vue'
import ProblemList from '../components/problems/ProblemList.vue'
import { authAPI } from '../api/auth'
import { ElMessage } from 'element-plus'

const searchQuery = ref('')
const testing = ref(false)

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

const problems = ref([
  { id: 1, title: 'Two Sum', slug: 'two-sum', difficulty: 'Easy', acceptance: 48.5, status: 'solved' },
  { id: 2, title: 'Add Two Numbers', slug: 'add-two-numbers', difficulty: 'Medium', acceptance: 39.2, status: 'todo' },
  { id: 3, title: 'Longest Substring Without Repeating Characters', slug: 'longest-substring', difficulty: 'Medium', acceptance: 33.8, status: 'todo' },
  { id: 4, title: 'Median of Two Sorted Arrays', slug: 'median-sorted-arrays', difficulty: 'Hard', acceptance: 35.4, status: 'todo' },
  { id: 5, title: 'Longest Palindromic Substring', slug: 'longest-palindromic-substring', difficulty: 'Medium', acceptance: 32.1, status: 'solved' },
])
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
            <span class="stat-divider">|</span>
            <span class="stat-item">
              <span class="stat-value">{{ problems.filter(p => p.status === 'solved').length }}</span>
              <span class="stat-label">Solved</span>
            </span>
          </div>
        </div>
      </div>

      <div class="filters-section">
        <el-input
          v-model="searchQuery"
          placeholder="Search questions..."
          class="search-input"
          clearable
        >
          <template #prefix>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
          </template>
        </el-input>
      </div>

      <ProblemList :problems="problems" />
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
