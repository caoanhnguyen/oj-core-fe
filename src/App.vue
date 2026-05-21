<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import Navbar from './components/layout/Navbar.vue'
import Footer from './components/layout/Footer.vue'
import EmailVerificationBanner from './components/auth/EmailVerificationBanner.vue'
import ContestGlobalTimer from './components/contests/ContestGlobalTimer.vue'
import { useAuthStore } from './stores/auth'
import { AUTH_GUEST_PATHS } from '@/utils/authFlow'

const authStore = useAuthStore()
const route = useRoute()

const showVerificationBanner = computed(() => {
  return (
    authStore.isAuthenticated &&
    !authStore.isEmailVerified &&
    !AUTH_GUEST_PATHS.includes(route.path)
  )
})

const showFooter = computed(() => {
  const hiddenNames = ['problem-detail', 'contest-problem-detail']
  return !hiddenNames.includes(route.name) && !route.path.startsWith('/dashboard')
})
</script>

<template>
  <div class="app-layout">
    <Navbar />
    <EmailVerificationBanner v-if="showVerificationBanner" />
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
