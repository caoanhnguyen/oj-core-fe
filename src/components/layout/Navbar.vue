<script setup>

import { RouterLink, useRouter, useRoute } from 'vue-router'
import { Code2, User, LogOut, Trophy, ChevronDown, Home, LayoutDashboard, BookOpen, Send, Swords, MessageSquare, Clock, ShieldAlert } from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../../stores/auth'
import { useContestSessionStore } from '../../stores/contestSession'
import { useSyncedTimer } from '../../composables/useSyncedTimer'
import { handleApiError } from '../../utils/errorHandler'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from '@/components/common/AppButton.vue'
import { Globe } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const sessionStore = useContestSessionStore()
const { t, locale } = useI18n()

// Active state theo route
const isProblemsActive = computed(() => route.path.startsWith('/problems'))

// Removed context-aware links because user wants normal navigation

const handleLogout = async () => {
  try {
    await authStore.logout()
    ElMessage.success(t('messages.logout_success'))
    router.push('/login')
  } catch (error) {
    handleApiError(error, t('messages.logout_failed'))
  }
}

const toggleLanguage = () => {
  const newLocale = locale.value === 'vi' ? 'en' : 'vi';
  locale.value = newLocale;
  localStorage.setItem('locale', newLocale);
}
</script>

<template>
  <nav class="navbar">
    <div class="navbar-content">
      <RouterLink to="/" class="logo">
        <Code2 :size="20" />
        <span>DevAssess</span>
      </RouterLink>

      <div class="nav-links">

        <RouterLink to="/" class="nav-link" :class="{ 'is-active': route.path === '/' }">
          <Home :size="16" style="margin-right: 6px;" />
          <span>{{ $t('nav.home') }}</span>
        </RouterLink>



        <RouterLink to="/problems" class="nav-link" :class="{ 'is-active': isProblemsActive }">
          <BookOpen :size="16" style="margin-right: 6px;" />
          <span>{{ $t('nav.problems') }}</span>
        </RouterLink>

        <RouterLink to="/submissions" class="nav-link" :class="{ 'is-active': route.path.startsWith('/submissions') }">
          <Send :size="16" style="margin-right: 6px;" />
          <span>{{ $t('nav.submissions') }}</span>
        </RouterLink>

        <!-- Rank Dropdown -->
        <el-dropdown trigger="hover" placement="bottom" :show-timeout="120" :hide-timeout="120">
          <div class="nav-link rank-link" :class="{ 'is-active': route.path.startsWith('/rankings') }">
            <Trophy :size="16" style="margin-right: 6px;" />
            <span>{{ $t('nav.rank') }}</span>
            <ChevronDown :size="14" style="margin-left: 4px;" />
          </div>
          <template #dropdown>
            <el-dropdown-menu class="user-dropdown">
              <el-dropdown-item>
                <RouterLink to="/rankings/acm" class="dropdown-link">
                  <span>{{ $t('nav.acm_rank') }}</span>
                </RouterLink>
              </el-dropdown-item>
              <el-dropdown-item>
                <RouterLink to="/rankings/oi" class="dropdown-link">
                  <span>{{ $t('nav.oi_rank') }}</span>
                </RouterLink>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <RouterLink to="/contests" class="nav-link" :class="{ 'is-active': route.path.startsWith('/contests') }">
          <Swords :size="16" style="margin-right: 6px;" />
          <span>{{ $t('nav.contest') }}</span>
        </RouterLink>
      </div>

      <div class="nav-actions">
        <AppButton 
          variant="primary" 
          size="small" 
          :icon="Globe"
          @click="toggleLanguage"
        >
          {{ locale === 'vi' ? 'EN' : 'VI' }}
        </AppButton>
        <div class="divider"></div>
        <template v-if="authStore.isAuthenticated">
          <!-- open on hover -->
          <el-dropdown trigger="hover" placement="bottom-end" :show-timeout="120" :hide-timeout="120">
            <button class="user-menu" type="button">
              <span class="user-avatar">
                <User :size="18" />
              </span>
              <span class="user-name">{{ authStore.user?.username || 'User' }}</span>
            </button>
            <template #dropdown>
              <el-dropdown-menu class="user-dropdown">
                <el-dropdown-item v-if="authStore.canAccessDashboard" @click="router.push('/dashboard')">
                  <div class="dropdown-link">
                    <LayoutDashboard :size="16" />
                    <span>{{ $t('nav.dashboard') }}</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item :divided="authStore.canAccessDashboard" @click="router.push('/profile')">
                  <div class="dropdown-link">
                    <User :size="16" />
                    <span>{{ $t('nav.profile') }}</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <div class="dropdown-link">
                    <LogOut :size="16" />
                    <span>{{ $t('nav.logout') }}</span>
                  </div>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <div class="auth-buttons">
            <RouterLink to="/login">
              <el-button text class="action-btn">{{ $t('nav.signin') }}</el-button>
            </RouterLink>
            <RouterLink to="/register">
              <el-button type="warning" class="action-btn-primary">{{ $t('nav.signup') }}</el-button>
            </RouterLink>
          </div>
        </template>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  height: 56px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: height 0.3s ease;
}

.navbar-content {
  height: 56px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 40px;
  display: flex;
  align-items: center;
  gap: 28px;
}

.logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 16px;
  color: var(--text-primary);
  white-space: nowrap;
}

.logo:hover {
  opacity: 0.9;
}

.logo svg {
  color: var(--accent-primary);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.nav-link {
  position: relative;
  padding: 0 12px;
  height: 56px;
  display: inline-flex;
  align-items: center;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  transition: color 0.2s;
  user-select: none;
}

.nav-link:hover {
  color: var(--text-primary);
}

.nav-link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  background: var(--accent-primary);
  opacity: 0;
  transition: opacity 0.2s;
}

.nav-link.is-active {
  color: var(--text-primary);
}

.nav-link.is-active::after {
  opacity: 1;
}

.nav-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 240px;
}

.divider {
  width: 1px;
  height: 24px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 0 12px;
}

.lang-btn {
  font-weight: 700;
  font-size: 13px;
  padding: 8px 12px;
}

.auth-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-btn {
  font-size: 14px;
  font-weight: 800;
  color: #ffa116;
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: 10px 18px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: linear-gradient(135deg, #ffa116 0%, #ff8800 100%);
  color: var(--bg-secondary);
}

.action-btn-primary {
  font-size: 14px;
  font-weight: 800;
  border: none;
  color: var(--bg-secondary);
  border-radius: 6px;
  padding: 10px 18px;
  background: linear-gradient(135deg, #ffa116 0%, #ff8800 100%);
  transition: all 0.2s ease;
}

.action-btn-primary:hover {
  background: transparent;
  color: #ffa116;
}

.user-menu {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 12px;
  border-radius: 12px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.user-menu:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.14);
}

.user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.80);
  flex: 0 0 auto;
}

.user-name {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
}

/* Dropdown theme */
:deep(.user-dropdown.el-dropdown-menu),
:deep(.el-dropdown-menu.user-dropdown) {
  background: rgba(18, 18, 18, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55);
  min-width: 200px;
}

:deep(.el-button.is-text) {
  color: #ffa116;
}

:deep(.el-button.is-text:hover) {
  color: var(--bg-secondary);
}

:deep(.user-dropdown .el-dropdown-menu__item) {
  color: rgba(255, 255, 255, 0.92);
  padding: 10px 12px;
  border-radius: 10px;
}

:deep(.user-dropdown .el-dropdown-menu__item:hover) {
  background: rgba(255, 255, 255, 0.10);
  color: #fff;
}

:deep(.user-dropdown .el-dropdown-menu__item.is-divided) {
  margin-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.10);
}

.dropdown-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: inherit;
  width: 100%;
}

.dropdown-link span {
  color: inherit;
}

@media (max-width: 768px) {
  .navbar-content {
    gap: 16px;
    padding: 0 14px;
  }

  .nav-actions {
    min-width: unset;
  }

  .user-name {
    max-width: 110px;
  }
}
</style>
