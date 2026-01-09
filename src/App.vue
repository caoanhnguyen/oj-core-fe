<script setup>
import { onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
const route = useRoute()

const GUEST_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/oauth/callback']

onMounted(async () => {
  // Tránh gọi /users/me liên tục gây loop khi OAuth lỗi.
  // Chỉ hydrate ở các trang không phải guest và chỉ 1 lần mỗi tab.
  if (GUEST_PATHS.includes(route.path)) return
  if (sessionStorage.getItem('me_hydrated') === '1') return

  sessionStorage.setItem('me_hydrated', '1')

  if (!authStore.isAuthenticated.value) {
    try {
      await authStore.getCurrentUser()
    } catch {
      // ignore
    }
  }
})
</script>

<template>
  <div class="app-layout">
    <Navbar />
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
}
</style>
