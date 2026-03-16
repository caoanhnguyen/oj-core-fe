<script setup>
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { Code2, User, LogOut } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../stores/auth'
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Active state theo route
const isProblemsActive = computed(() => route.path.startsWith('/problems'))

const handleLogout = async () => {
  try {
    await authStore.logout()
    ElMessage.success('Đăng xuất thành công!')
    router.push('/login')
  } catch (error) {
    console.error('Logout error:', error)
  }
}
</script>

<template>
  <nav class="navbar">
    <div class="navbar-content">
      <RouterLink to="/" class="logo">
        <Code2 :size="20" />
        <span>KMA OJ</span>
      </RouterLink>

      <div class="nav-links">

        <RouterLink to="/" class="nav-link" :class="{ 'is-active': route.path === '/' }">
          <span>Home</span>
        </RouterLink>

        <RouterLink v-if="authStore.isAdmin" to="/dashboard" class="nav-link" :class="{ 'is-active': route.path.startsWith('/dashboard') }">
          <span>Dashboard</span>
        </RouterLink>

        <RouterLink to="/problems" class="nav-link" :class="{ 'is-active': isProblemsActive }">
          <span>Problems</span>
        </RouterLink>

        <RouterLink to="/submissions" class="nav-link" :class="{ 'is-active': route.path.startsWith('/submissions') }">
          <span>Submissions</span>
        </RouterLink>

        <a href="#" class="nav-link" @click.prevent>
          <span>Contest</span>
        </a>
        <a href="#" class="nav-link" @click.prevent>
          <span>Discuss</span>
        </a>
      </div>

      <div class="nav-actions">
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
                <el-dropdown-item>
                  <RouterLink to="/profile" class="dropdown-link">
                    <User :size="16" />
                    <span>Profile</span>
                  </RouterLink>
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <div class="dropdown-link">
                    <LogOut :size="16" />
                    <span>Logout</span>
                  </div>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <div class="auth-buttons">
            <RouterLink to="/login">
              <el-button text class="action-btn">Sign in</el-button>
            </RouterLink>
            <RouterLink to="/register">
              <el-button type="warning" class="action-btn-primary">Sign up</el-button>
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
}

.navbar-content {
  height: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 20px;
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
