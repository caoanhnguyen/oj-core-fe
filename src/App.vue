<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import Navbar from './components/layout/Navbar.vue'
import EmailVerificationBanner from './components/auth/EmailVerificationBanner.vue'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
const route = useRoute()

const GUEST_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/oauth/callback', '/verify-email']

// Hiển thị banner khi user đã login nhưng chưa verify email
const showVerificationBanner = computed(() => {
  return authStore.isAuthenticated && !authStore.isEmailVerified && !GUEST_PATHS.includes(route.path)
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
