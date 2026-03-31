<script setup>

import { RouterLink, useRouter, useRoute } from 'vue-router'
import { Code2, User, LogOut, Trophy, ChevronDown, Home, LayoutDashboard, BookOpen, Send, Swords, MessageSquare, Clock, ShieldAlert } from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../../stores/auth'
import { useContestSessionStore } from '../../stores/contestSession'
import { useSyncedTimer } from '../../composables/useSyncedTimer'
import { handleApiError } from '../../utils/errorHandler'
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const sessionStore = useContestSessionStore()

// Timer logic
const targetTime = computed(() => sessionStore.activeSession?.endTime)
const { formattedTime } = useSyncedTimer(targetTime, async () => {
    // Tự động kết thúc khi hết giờ
    if (sessionStore.activeSession) {
      const contestId = sessionStore.activeSession.contestId
      await sessionStore.finishSession(contestId)
      ElMessageBox.alert('Thời gian thi đấu của bạn đã kết thúc. Hệ thống đã tự động ghi nhận kết quả.', 'Hết giờ!', {
        confirmButtonText: 'Xem bảng xếp hạng',
        type: 'warning',
        callback: () => {
          router.push(`/contests/${contestId}?tab=leaderboard`)
        }
      })
    }
})

// Active state theo route
const isProblemsActive = computed(() => route.path.startsWith('/problems'))

const handleFinishContest = async () => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn nộp bài sớm và kết thúc kỳ thi này không? Hành động này không thể hoàn tác.',
      'Kết thúc kỳ thi',
      {
        confirmButtonText: 'Xác nhận kết thúc',
        cancelButtonText: 'Tiếp tục làm bài',
        type: 'warning'
      }
    )
    const contestId = sessionStore.activeSession.contestId
    await sessionStore.finishSession(contestId)
    ElMessage.success('Kỳ thi đã kết thúc thành công.')
    router.push(`/contests/${contestId}?tab=leaderboard`)
  } catch (err) {
    if (err !== 'cancel') handleApiError(err)
  }
}

// Redirect helpers for context-aware links
const getProblemsLink = computed(() => {
  if (sessionStore.isExamMode) return `/contests/${sessionStore.activeSession.contestId}?tab=problems`
  return '/problems'
})

const getSubmissionsLink = computed(() => {
  if (sessionStore.isExamMode) return `/contests/${sessionStore.activeSession.contestId}?tab=submissions`
  return '/submissions'
})

const handleLogout = async () => {
  try {
    await authStore.logout()
    ElMessage.success('Đăng xuất thành công!')
    router.push('/login')
  } catch (error) {
    handleApiError(error, 'Đăng xuất thất bại')
  }
}
</script>

<template>
  <nav class="navbar" :class="{ 'exam-navbar': sessionStore.isExamMode }">
    <!-- Sticky Exam Bar -->
    <div v-if="sessionStore.isExamMode" class="exam-sticky-bar">
      <div class="exam-bar-content">
        <div class="exam-info">
          <ShieldAlert :size="16" class="pulse-icon" />
          <span class="exam-label">ĐANG TRONG PHIÊN THI</span>
          <span class="exam-id">#{{ sessionStore.activeSession.contestId.slice(0,8) }}</span>
        </div>
        
        <div class="exam-timer">
          <Clock :size="16" />
          <span class="timer-countdown">{{ formattedTime }}</span>
        </div>

        <el-button type="danger" size="small" class="finish-btn" @click="handleFinishContest">
          Kết thúc bài thi
        </el-button>
      </div>
    </div>

    <div class="navbar-content">
      <RouterLink to="/" class="logo">
        <Code2 :size="20" />
        <span>KMA OJ</span>
      </RouterLink>

      <div class="nav-links">

        <RouterLink to="/" class="nav-link" :class="{ 'is-active': route.path === '/' }">
          <Home :size="16" style="margin-right: 6px;" />
          <span>Home</span>
        </RouterLink>

        <RouterLink v-if="authStore.isAdminOrMod" to="/dashboard" class="nav-link" :class="{ 'is-active': route.path.startsWith('/dashboard') }">
          <LayoutDashboard :size="16" style="margin-right: 6px;" />
          <span>Dashboard</span>
        </RouterLink>

        <RouterLink :to="getProblemsLink" class="nav-link" :class="{ 'is-active': isProblemsActive }">
          <BookOpen :size="16" style="margin-right: 6px;" />
          <span>Problems</span>
        </RouterLink>

        <RouterLink :to="getSubmissionsLink" class="nav-link" :class="{ 'is-active': route.path.startsWith('/submissions') }">
          <Send :size="16" style="margin-right: 6px;" />
          <span>Submissions</span>
        </RouterLink>

        <!-- Rank Dropdown -->
        <el-dropdown trigger="hover" placement="bottom" :show-timeout="120" :hide-timeout="120">
          <div class="nav-link rank-link" :class="{ 'is-active': route.path.startsWith('/rankings') }">
            <Trophy :size="16" style="margin-right: 6px;" />
            <span>Rank</span>
            <ChevronDown :size="14" style="margin-left: 4px;" />
          </div>
          <template #dropdown>
            <el-dropdown-menu class="user-dropdown">
              <el-dropdown-item>
                <RouterLink to="/rankings/acm" class="dropdown-link">
                  <span>ACM Rank</span>
                </RouterLink>
              </el-dropdown-item>
              <el-dropdown-item>
                <RouterLink to="/rankings/oi" class="dropdown-link">
                  <span>OI Rank</span>
                </RouterLink>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <RouterLink to="/contests" class="nav-link" :class="{ 'is-active': route.path.startsWith('/contests') }">
          <Swords :size="16" style="margin-right: 6px;" />
          <span>Contest</span>
        </RouterLink>
        <a href="#" class="nav-link" @click.prevent>
          <MessageSquare :size="16" style="margin-right: 6px;" />
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
  transition: height 0.3s ease;
}

.navbar.exam-navbar {
  height: 96px; /* 56px + 40px bar */
}

.exam-sticky-bar {
  height: 40px;
  background: linear-gradient(90deg, #ef4743 0%, #ff6b6b 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(239, 71, 67, 0.3);
}

.exam-bar-content {
  width: 100%;
  max-width: 1280px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.exam-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.exam-timer {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0,0,0,0.2);
  padding: 4px 12px;
  border-radius: 6px;
}

.timer-countdown {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.pulse-icon {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}

.finish-btn {
  background: white !important;
  border: none !important;
  color: #ef4743 !important;
  font-weight: 700 !important;
  padding: 6px 16px !important;
  height: 30px !important;
  border-radius: 6px !important;
}

.finish-btn:hover {
  background: #f8f8f8 !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.navbar-content {
  height: 56px;
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
