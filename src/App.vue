<script setup>
import { computed, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import Navbar from './components/layout/Navbar.vue'
import Footer from './components/layout/Footer.vue'
import EmailVerificationBanner from './components/auth/EmailVerificationBanner.vue'
import ContestGlobalTimer from './components/contests/ContestGlobalTimer.vue'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
const route = useRoute()

const GUEST_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/oauth/callback', '/verify-email']

// Hiển thị banner khi user đã login nhưng chưa verify email
const showVerificationBanner = computed(() => {
  return authStore.isAuthenticated && !authStore.isEmailVerified && !GUEST_PATHS.includes(route.path)
})

// Không hiển thị footer khi đang ở trang chi tiết bài tập hoặc Dashboard admin
const showFooter = computed(() => {
  return route.name !== 'problem-detail' && !route.path.startsWith('/dashboard')
})

onMounted(async () => {
  try {
    await authStore.getCurrentUser()
  } catch (error) {
    console.log('No active session')
  }
})
</script>

<template>
  <div class="app-layout">
    <Navbar />
    <ContestGlobalTimer />
    <main class="main-content">
      <RouterView />
    </main>
    <Footer v-if="showFooter" />
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
