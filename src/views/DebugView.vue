<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()

const localStorageUser = ref(localStorage.getItem('user'))
const cookies = ref(document.cookie)

const refreshDebugInfo = () => {
  localStorageUser.value = localStorage.getItem('user')
  cookies.value = document.cookie
  console.log('All cookies:', document.cookie)
  console.log('Cookie pairs:', document.cookie.split(';').map(c => c.trim()))
}

const parsedUser = computed(() => {
  try {
    return localStorageUser.value ? JSON.parse(localStorageUser.value) : null
  } catch {
    return null
  }
})

const cookiesList = computed(() => {
  if (!cookies.value) return []
  return cookies.value.split(';').map(c => {
    const [key, ...valueParts] = c.trim().split('=')
    return {
      name: key,
      value: valueParts.join('=')
    }
  })
})

const clearLocalStorage = () => {
  localStorage.clear()
  refreshDebugInfo()
}

const testAuthMe = async () => {
  try {
    const result = await authStore.getCurrentUser()
    console.log('Auth me result:', result)
    ElMessage.success('Call API /auth/me thành công!')
  } catch (error) {
    console.error('Auth me error:', error)
    ElMessage.error('Call API /auth/me thất bại: ' + (error.response?.status || error.message))
  }
}
</script>

<template>
  <div class="debug-view">
    <div class="content-wrapper">
      <h1>Debug Information</h1>

      <div class="button-group">
        <el-button @click="refreshDebugInfo" type="primary">Refresh Debug Info</el-button>
        <el-button @click="testAuthMe" type="success">Test API /auth/me</el-button>
        <el-button @click="clearLocalStorage" type="danger">Clear LocalStorage</el-button>
      </div>

      <el-card class="debug-card">
        <h3>Auth Store State</h3>
        <pre>{{ {
          user: authStore.user,
          isAuthenticated: authStore.isAuthenticated,
          loading: authStore.loading
        } }}</pre>
      </el-card>

      <el-card class="debug-card">
        <h3>LocalStorage 'user'</h3>
        <p><strong>Raw:</strong></p>
        <pre>{{ localStorageUser }}</pre>
        <p><strong>Parsed:</strong></p>
        <pre>{{ parsedUser }}</pre>
      </el-card>

      <el-card class="debug-card">
        <h3>Cookies (Raw)</h3>
        <pre>{{ cookies || 'No cookies found' }}</pre>

        <h3>Cookies (Parsed)</h3>
        <el-table :data="cookiesList" style="width: 100%; margin-top: 10px">
          <el-table-column prop="name" label="Cookie Name" width="200" />
          <el-table-column prop="value" label="Cookie Value" />
        </el-table>
      </el-card>

      <el-card class="debug-card">
        <h3>All LocalStorage Keys</h3>
        <ul v-if="localStorage.length > 0">
          <li v-for="i in localStorage.length" :key="i">
            <strong>{{ localStorage.key(i - 1) }}:</strong> {{ localStorage.getItem(localStorage.key(i - 1)) }}
          </li>
        </ul>
        <p v-else>No localStorage items</p>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.debug-view {
  min-height: calc(100vh - 50px);
  background: var(--bg-primary);
  padding: var(--spacing-2xl);
}

.content-wrapper {
  max-width: 1280px;
  margin: 0 auto;
}

.content-wrapper h1 {
  margin-bottom: var(--spacing-xl);
}

.button-group {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.debug-card {
  margin-top: var(--spacing-lg);
  background: var(--bg-secondary);
}

.debug-card h3 {
  margin-top: 0;
  margin-bottom: var(--spacing-md);
}

.debug-card pre {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: var(--spacing-md);
  border-radius: 4px;
  overflow-x: auto;
}

.debug-card ul {
  list-style: none;
  padding: 0;
}

.debug-card li {
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid var(--border-primary);
}
</style>

