<script setup>

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useContestStore } from '@/stores/contest'
import { useContestSessionStore } from '@/stores/contestSession'
import { useSyncedTimer } from '@/composables/useSyncedTimer'
import { contestsAPI } from '@/api/contests'
import { handleApiError } from '@/utils/errorHandler'
import { Trophy, Clock, Users, BookOpen, BarChart2, List, ChevronLeft, Lock, Key, RefreshCw, Medal, ShieldAlert, Zap } from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'
import DarkPagination from '@/components/common/DarkPagination.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const contestStore = useContestStore()
const sessionStore = useContestSessionStore()

const contestId = computed(() => route.params.id)
const activeTab = ref('info')

const contest = ref(null)
const loading = ref(false)

const isRegistered = computed(() => !!contest.value?.isRegistered || !!contest.value?.registered)
const isStarted = computed(() => {
  if (!contest.value) return false
  const now = sessionStore.getServerNow()
  const start = new Date(contest.value.startTime)
  return now >= start
})

const isFinished = computed(() => contest.value?.contestStatus === 'ENDED')

const isTabDisabled = (id) => {
  if (id === 'info') return false
  
  // Rule 0: Nếu contest đã kết thúc -> Mở toang cho tất cả mọi người
  if (isFinished.value) return false
  
  // Rule 1: Chưa đăng ký -> Chỉ xem được Info (với contest chưa kết thúc)
  if (!isRegistered.value) return true
  
  // Rule 2: Đã đăng ký nhưng CHƯA tới giờ thi -> Chỉ xem được Info & Participants
  if (!isStarted.value) {
    if (id === 'problems' || id === 'leaderboard' || id === 'submissions') return true
  }
  
  return false
}

// ====================
// Load Contest Detail
// ====================
const loadContest = async () => {
  try {
    loading.value = true
    const data = await contestsAPI.getContestById(contestId.value)
    contest.value = data
    
    // Đồng bộ thời gian ngay sau khi có data từ server
    if (data.serverTime) {
      sessionStore.syncTime(data.serverTime)
    }
  } catch (error) {
    handleApiError(error, 'Không thể tải thông tin contest')
    router.replace('/contests')
  } finally {
    loading.value = false
  }
}

// ====================
// Countdown Logic (Refactored to use synced world time)
// ====================
const countdownLabel = computed(() => {
  if (!contest.value) return ''
  const now = sessionStore.getServerNow()
  const start = new Date(contest.value.startTime)
  if (now < start) return 'Bắt đầu sau'
  return 'Kết thúc sau'
})

const targetTime = computed(() => {
  if (!contest.value) return null
  const now = sessionStore.getServerNow()
  const start = new Date(contest.value.startTime).getTime()
  const end = new Date(contest.value.endTime).getTime()
  
  if (now < start) return start
  return end
})

const { formattedTime: timeLeft } = useSyncedTimer(targetTime)

// ====================
// Registration
// ====================
const registerLoading = ref(false)
const showPasswordInput = ref(false)
const registerPassword = ref('')

const handleRegister = async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  if (contest.value?.visibility === 'PRIVATE' && !showPasswordInput.value) {
    showPasswordInput.value = true
    return
  }
  try {
    registerLoading.value = true
    await contestStore.registerContest(contestId.value, registerPassword.value || null)
    // Reload to update isRegistered flag
    await loadContest()
    
    // Sync time after reload
    if (contest.value?.serverTime) {
      sessionStore.syncTime(contest.value.serverTime)
    }

    showPasswordInput.value = false
    registerPassword.value = ''
    
    // Nếu đang ở tab bài tập thì load luôn bài tập
    if (activeTab.value === 'problems') {
      loadProblems()
    }
  } catch {} finally {
    registerLoading.value = false
  }
}

const startLoading = ref(false)
const handleStartContest = async () => {
  try {
    await ElMessageBox.confirm(
      'Bạn đang chuẩn bị bắt đầu thực hiện bài thi. Một khi đã bắt đầu, đồng hồ đếm ngược sẽ chạy liên tục và không thể tạm dừng cho đến khi hết giờ hoặc bạn chọn kết thúc sớm. Bạn đã sẵn sàng?',
      'Xác nhận bắt đầu thi',
      {
        confirmButtonText: 'Bắt đầu ngay',
        cancelButtonText: 'Để sau',
        confirmButtonClass: 'confirm-start-btn',
        type: 'warning'
      }
    )
    
    startLoading.value = true
    await sessionStore.startSession(contest.value.id)
    ElMessage.success('Bắt đầu bài thi thành công!')
    
    // Switch to problems tab inside contest
    activeTab.value = 'problems'
    loadProblems()
  } catch (err) {
    if (err !== 'cancel') handleApiError(err)
  } finally {
    startLoading.value = false
  }
}

const handleEnterExam = () => {
  activeTab.value = 'problems'
  loadProblems()
}

// ====================
// Problems Tab
// ====================
const problems = ref([])
const problemsLoading = ref(false)

const loadProblems = async () => {
  try {
    problemsLoading.value = true
    problems.value = await contestsAPI.getProblems(contestId.value)
  } catch (error) {
    handleApiError(error, 'Không thể tải danh sách bài tập')
  } finally {
    problemsLoading.value = false
  }
}

const canViewProblems = computed(() => {
  if (!contest.value) return false
  return contest.value.contestStatus === 'ONGOING' || contest.value.contestStatus === 'ENDED'
})

// ====================
// Participants Tab
// ====================
const participants = ref([])
const participantsLoading = ref(false)
const participantSearch = ref('')
const participantsPagination = ref({ page: 0, size: 20, total: 0 })

const loadParticipants = async () => {
  try {
    participantsLoading.value = true
    const data = await contestsAPI.getPublicParticipants(contestId.value, {
      keyword: participantSearch.value || undefined,
      page: participantsPagination.value.page,
      size: participantsPagination.value.size
    })
    participants.value = data.content || []
    participantsPagination.value.total = data.totalElements || 0
  } catch (error) {
    handleApiError(error, 'Không thể tải danh sách thí sinh')
  } finally {
    participantsLoading.value = false
  }
}

// ====================
// Leaderboard Tab
// ====================
const leaderboard = ref([])
const leaderboardLoading = ref(false)
const leaderboardPagination = ref({ page: 0, size: 20, total: 0 })

const loadLeaderboard = async () => {
  try {
    leaderboardLoading.value = true
    const data = await contestsAPI.getLeaderboard(contestId.value, {
      page: leaderboardPagination.value.page,
      size: leaderboardPagination.value.size
    })
    leaderboard.value = data.content || []
    leaderboardPagination.value.total = data.totalElements || 0
  } catch (error) {
    handleApiError(error, 'Không thể tải bảng xếp hạng')
  } finally {
    leaderboardLoading.value = false
  }
}

// ====================
// My Submissions Tab
// ====================
const mySubmissions = ref([])
const mySubsLoading = ref(false)
const mySubsPagination = ref({ page: 0, size: 20, total: 0 })

const loadMySubmissions = async () => {
  try {
    mySubsLoading.value = true
    const data = await contestsAPI.getMySubmissions(contestId.value, {
      page: mySubsPagination.value.page,
      size: mySubsPagination.value.size,
      sort: 'createdDate,desc'
    })
    mySubmissions.value = data.content || []
    mySubsPagination.value.total = data.totalElements || 0
  } catch (error) {
    handleApiError(error, 'Không thể tải lịch sử nộp bài')
  } finally {
    mySubsLoading.value = false
  }
}

// ====================
// Tab switching
// ====================
const switchTab = (tab) => {
  activeTab.value = tab
  if (tab === 'problems' && problems.value.length === 0) loadProblems()
  if (tab === 'participants' && participants.value.length === 0) loadParticipants()
  if (tab === 'leaderboard' && leaderboard.value.length === 0) loadLeaderboard()
  if (tab === 'submissions' && mySubmissions.value.length === 0) loadMySubmissions()
}

// ====================
// Helpers
// ====================
const formatDateTime = (dt) => {
  if (!dt) return ''
  return new Date(dt).toLocaleString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const getDuration = (start, end) => {
  if (!start || !end) return ''
  const diff = new Date(end) - new Date(start)
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h} giờ ${m > 0 ? m + ' phút' : ''}` : `${m} phút`
}

const getVerdictClass = (v) => ({ AC: 'verdict-ac', WA: 'verdict-wa', TLE: 'verdict-tle', MLE: 'verdict-tle', RE: 'verdict-wa', CE: 'verdict-info', PENDING: 'verdict-info', SE: 'verdict-wa' }[v] || 'verdict-info')

const getRankMedal = (rank) => {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return ''
}

onMounted(async () => {
  await loadContest()
})

onUnmounted(() => {
  // sessionStore handles itself or timer does
})
</script>

<template>
  <div class="contest-detail-page" v-if="!loading">
    <!-- Back Nav -->
    <div class="back-nav">
      <button class="back-btn" @click="router.push('/contests')">
        <ChevronLeft :size="18" /> Contests
      </button>
    </div>

    <div v-if="contest" class="contest-layout">
      <!-- Left Main Panel -->
      <div class="main-panel">
        <!-- Contest Header Card -->
        <div class="contest-header-card">
          <div class="header-top">
            <div class="header-badges">
              <span :class="['rule-badge', contest.ruleType === 'ACM' ? 'rule-acm' : 'rule-oi']">{{ contest.ruleType }}</span>
              <span :class="['status-badge', `status-${contest.contestStatus?.toLowerCase()}`]">
                <span v-if="contest.contestStatus === 'ONGOING'" class="pulse-dot" />
                {{ contest.contestStatus === 'ONGOING' ? 'Đang diễn ra' : contest.contestStatus === 'UPCOMING' ? 'Sắp diễn ra' : 'Đã kết thúc' }}
              </span>
              <span v-if="contest.visibility === 'PRIVATE'" class="private-badge"><Lock :size="12" /> Private</span>
            </div>

            <!-- Countdown -->
            <div v-if="timeLeft" class="countdown-chip">
              <Clock :size="14" />
              <span class="countdown-label">{{ countdownLabel }}</span>
              <span class="countdown-time">{{ timeLeft }}</span>
            </div>
          </div>

          <h1 class="contest-title">{{ contest.title }}</h1>

          <div class="meta-row-list">
            <div class="meta-item">
              <Clock :size="15" class="meta-icon" />
              <span>{{ formatDateTime(contest.startTime) }} – {{ formatDateTime(contest.endTime) }}</span>
            </div>
            <div class="meta-item">
              <RefreshCw :size="15" class="meta-icon" />
              <span>Thời lượng: {{ getDuration(contest.startTime, contest.endTime) }}</span>
            </div>
            <div class="meta-item" v-if="contest.durationMinutes">
              <Zap :size="15" class="meta-icon duration-icon" />
              <span class="duration-highlight">Làm bài: {{ contest.durationMinutes }} phút</span>
            </div>
            <div class="meta-item">
              <Users :size="15" class="meta-icon" />
              <span>{{ (contest.participantCount || 0).toLocaleString() }} người tham gia</span>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tab-bar">
          <button
            v-for="tab in [
              { id: 'info', label: 'Thông tin', icon: Trophy },
              { id: 'problems', label: 'Bài tập', icon: BookOpen },
              { id: 'participants', label: 'Thí sinh', icon: Users },
              { id: 'leaderboard', label: 'Xếp hạng', icon: BarChart2 },
              ...(isRegistered ? [{ id: 'submissions', label: 'Kết quả của tôi', icon: List }] : [])
            ]"
            :key="tab.id"
            class="tab-btn"
            :class="{ active: activeTab === tab.id, 'is-disabled': isTabDisabled(tab.id) }"
            :disabled="isTabDisabled(tab.id)"
            @click="switchTab(tab.id)"
          >
            <component :is="tab.icon" :size="15" />
            {{ tab.label }}
          </button>
        </div>

        <!-- ===== INFO TAB ===== -->
        <div v-if="activeTab === 'info'" class="tab-content">
          <div class="desc-section">
            <h3 class="section-label">Mô tả</h3>
            <div class="desc-body" v-html="contest.description || '<p>Chưa có mô tả.</p>'" />
          </div>

          <div class="rules-section">
            <h3 class="section-label">Thể lệ: {{ contest.ruleType }}</h3>
            <div v-if="contest.ruleType === 'ACM'" class="rule-desc">
              <p>Hệ thống <strong>ACM</strong>: Mỗi bài tập được chấm theo nguyên tắc tất cả hoặc không. Nếu tất cả test case đều đúng thì được chấp nhận (AC), ngược lại là sai (WA). Penalty được tính theo số lần nộp sai và thời gian nộp bài.</p>
            </div>
            <div v-else class="rule-desc">
              <p>Hệ thống <strong>OI</strong>: Điểm được tính theo số lượng test case đúng. Mỗi thí sinh chỉ được nộp bài một lần cho mỗi bài tập. Không tính penalty thời gian.</p>
            </div>
          </div>
        </div>

        <!-- ===== PROBLEMS TAB ===== -->
        <div v-if="activeTab === 'problems'" class="tab-content">
          <div>
            <div v-if="problemsLoading" class="loading-wrap">
              <el-icon class="is-loading" :size="24"><RefreshCw /></el-icon>
            </div>
            <div v-else class="problems-table">
              <div class="problems-header-row">
                <span class="col-id">ID</span>
                <span class="col-title">Bài tập</span>
                <span class="col-points">Điểm</span>
              </div>
              <div v-for="p in problems" :key="p.id" class="problem-row" @click="router.push(`/problems/${p.problemSlug}?contestId=${contestId}`)">
                <span class="col-id prob-id">{{ p.displayId }}</span>
                <span class="col-title prob-title">{{ p.originalTitle }}</span>
                <span class="col-points prob-points">{{ p.points }}</span>
              </div>
              <div v-if="problems.length === 0" class="empty-msg">Chưa có bài tập nào.</div>
            </div>
          </div>
        </div>

        <!-- ===== PARTICIPANTS TAB ===== -->
        <div v-if="activeTab === 'participants'" class="tab-content">
          <div class="tab-toolbar">
            <div class="search-wrap">
              <input type="text" v-model="participantSearch" @keyup.enter="() => { participantsPagination.page = 0; loadParticipants() }" placeholder="Tìm kiếm..." class="search-input-sm" />
            </div>
            <span class="count-badge">{{ participantsPagination.total }} thí sinh</span>
          </div>

          <div v-if="participantsLoading" class="loading-wrap"><el-icon class="is-loading" :size="24"><RefreshCw /></el-icon></div>

          <div v-else class="participants-list">
            <div v-for="(p, idx) in participants" :key="p.userId" class="participant-item">
              <span class="p-rank">#{{ participantsPagination.page * participantsPagination.size + idx + 1 }}</span>
              <span class="p-username">{{ p.username }}</span>
            </div>
            <div v-if="participants.length === 0" class="empty-msg">Chưa có thí sinh nào đăng ký.</div>
          </div>

          <DarkPagination
            v-if="participantsPagination.total > participantsPagination.size"
            :current-page="participantsPagination.page + 1"
            :page-size="participantsPagination.size"
            :total="participantsPagination.total"
            @current-change="(p) => { participantsPagination.page = p - 1; loadParticipants() }"
          />
        </div>

        <!-- ===== LEADERBOARD TAB ===== -->
        <div v-if="activeTab === 'leaderboard'" class="tab-content">
          <div>
            <div v-if="leaderboardLoading" class="loading-wrap"><el-icon class="is-loading" :size="24"><RefreshCw /></el-icon></div>
            <div v-else class="leaderboard-table">
              <div class="lb-header-row">
                <span class="lb-col-rank">Hạng</span>
                <span class="lb-col-user">Thí sinh</span>
                <span class="lb-col-score">Điểm</span>
                <span v-if="contest.ruleType === 'ACM'" class="lb-col-penalty">Penalty</span>
              </div>
              <div
                v-for="(entry, idx) in leaderboard"
                :key="entry.userId"
                class="lb-row"
                :class="{ 'lb-top3': leaderboardPagination.page === 0 && idx < 3 }"
              >
                <span class="lb-col-rank lb-rank-val">
                  <span v-if="leaderboardPagination.page === 0 && idx < 3" class="medal">{{ getRankMedal(idx + 1) }}</span>
                  <span v-else>{{ leaderboardPagination.page * leaderboardPagination.size + idx + 1 }}</span>
                </span>
                <span class="lb-col-user lb-username">{{ entry.username }}</span>
                <span class="lb-col-score lb-score">{{ entry.score }}</span>
                <span v-if="contest.ruleType === 'ACM'" class="lb-col-penalty lb-penalty">{{ entry.penalty }}s</span>
              </div>
              <div v-if="leaderboard.length === 0" class="empty-msg">Chưa có dữ liệu xếp hạng.</div>
            </div>

            <DarkPagination
              v-if="leaderboardPagination.total > leaderboardPagination.size"
              :current-page="leaderboardPagination.page + 1"
              :page-size="leaderboardPagination.size"
              :total="leaderboardPagination.total"
              @current-change="(p) => { leaderboardPagination.page = p - 1; loadLeaderboard() }"
            />
          </div>
        </div>

        <!-- ===== MY SUBMISSIONS TAB ===== -->
        <div v-if="activeTab === 'submissions'" class="tab-content">
          <div v-if="mySubsLoading" class="loading-wrap"><el-icon class="is-loading" :size="24"><RefreshCw /></el-icon></div>
          <div v-else class="submissions-list">
            <div v-for="sub in mySubmissions" :key="sub.id" class="submission-row" @click="router.push(`/submissions/${sub.id}`)">
              <div class="sub-info">
                <span class="sub-problem">{{ sub.problemTitle || sub.problemId }}</span>
                <span class="sub-time">{{ new Date(sub.createdDate).toLocaleString('vi-VN') }}</span>
              </div>
              <div class="sub-right">
                <el-tag type="info" size="small" effect="plain" style="margin-right: 8px;">{{ sub.languageKey }}</el-tag>
                <span :class="['verdict-badge', getVerdictClass(sub.verdict)]">{{ sub.verdict || 'PENDING' }}</span>
              </div>
            </div>
            <div v-if="mySubmissions.length === 0" class="empty-msg">Bạn chưa nộp bài nào trong contest này.</div>
          </div>

          <DarkPagination
            v-if="mySubsPagination.total > mySubsPagination.size"
            :current-page="mySubsPagination.page + 1"
            :page-size="mySubsPagination.size"
            :total="mySubsPagination.total"
            @current-change="(p) => { mySubsPagination.page = p - 1; loadMySubmissions() }"
          />
        </div>
      </div>

      <!-- Right Sidebar -->
      <div class="sidebar-panel">
        <!-- Register Card -->
        <div class="sidebar-card register-card">
          <div v-if="contest.registered || contest.isRegistered" class="registered-state">
            <div class="status-card-inner">
              <div class="status-icon-box">
                <div class="icon-circle">
                  <Check :size="24" stroke-width="3" />
                </div>
              </div>
              <p class="status-main-text">Đã đăng ký tham gia</p>
              
              <div class="participation-actions">
                <!-- Nếu đã thi xong -->
                <div v-if="contest.contestParticipation?.isFinished" class="action-group">
                  <p class="status-sub-text">Bạn đã hoàn thành bài thi này.</p>
                  <el-button type="primary" class="action-btn-premium" @click="activeTab = 'leaderboard'">
                    <BarChart2 :size="16" /> Xem bảng xếp hạng
                  </el-button>
                </div>
                
                <!-- Nếu chưa bắt đầu làm bài -->
                <div v-else-if="!contest.contestParticipation?.startTime" class="action-group">
                  <p class="status-sub-text">Sẵn sàng để bắt đầu thử thách?</p>
                  <el-button :loading="startLoading" class="action-btn-premium start-btn" @click="handleStartContest">
                    <Zap :size="16" /> Bắt đầu làm bài
                  </el-button>
                </div>
                
                <!-- Đang trong quá trình thi -->
                <div v-else class="action-group">
                  <div class="ongoing-badge">
                    <span class="dot-live" /> Đang trong giờ thi
                  </div>
                  <el-button class="action-btn-premium ongoing-btn" @click="handleEnterExam">
                    <BookOpen :size="16" /> Vào phòng thi
                  </el-button>
                </div>
              </div>
            </div>
          </div>
          <div v-else-if="contest.contestStatus === 'ENDED'" class="ended-state">
            <p class="ended-text">Contest đã kết thúc</p>
          </div>
          <div v-else>
            <p class="register-hint">
              <span v-if="contest.contestStatus === 'UPCOMING'">Contest sẽ bắt đầu sớm. Đăng ký ngay để không bỏ lỡ!</span>
              <span v-else>Contest đang diễn ra. Đăng ký để tham gia!</span>
            </p>

            <div v-if="showPasswordInput && contest.visibility === 'PRIVATE'" class="password-input-wrap">
              <Key :size="16" class="input-icon" />
              <input type="password" v-model="registerPassword" placeholder="Nhập mật khẩu..." class="password-input" />
            </div>

            <button class="register-btn" :disabled="registerLoading" @click="handleRegister">
              <span v-if="registerLoading" class="btn-loading">Đang xử lý...</span>
              <span v-else-if="!authStore.isAuthenticated">Đăng nhập để đăng ký</span>
              <span v-else-if="contest.visibility === 'PRIVATE' && !showPasswordInput">Nhập mật khẩu</span>
              <span v-else>{{ showPasswordInput ? 'Xác nhận đăng ký' : 'Đăng ký tham gia' }}</span>
            </button>
          </div>
        </div>

        <!-- Info Card -->
        <div class="sidebar-card info-card">
          <h4 class="sidebar-card-title">Thông tin</h4>
          <div class="info-list">
            <div class="info-row">
              <span class="info-label">Rule</span>
              <span :class="['rule-badge-sm', contest.ruleType === 'ACM' ? 'rule-acm' : 'rule-oi']">{{ contest.ruleType }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Bắt đầu</span>
              <span class="info-value">{{ formatDateTime(contest.startTime) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Kết thúc</span>
              <span class="info-value">{{ formatDateTime(contest.endTime) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Thời lượng</span>
              <span class="info-value">{{ getDuration(contest.startTime, contest.endTime) }}</span>
            </div>
            <div class="info-row" v-if="contest.durationMinutes">
              <span class="info-labelHighlight">Làm bài</span>
              <span class="info-valueHighlight">{{ contest.durationMinutes }} phút</span>
            </div>
            <div class="info-row">
              <span class="info-label">Thí sinh</span>
              <span class="info-value">{{ (contest.participantCount || 0).toLocaleString() }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Visibility</span>
              <span class="info-value">{{ contest.visibility === 'PUBLIC' ? 'Công khai' : 'Riêng tư' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Tổ chức bởi</span>
              <span class="info-value">{{ contest.authorUsername }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="loading" class="page-loading">
      <el-icon class="is-loading" :size="32"><RefreshCw /></el-icon>
    </div>
  </div>
</template>

<style scoped>
.contest-detail-page {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 0;
}

/* Back nav */
.back-nav {
  padding: 16px 24px;
  border-bottom: 1px solid #282828;
  background: #141414;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: #8a8a8a;
  font-size: 14px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s;
}

.back-btn:hover { color: #eff2f6; background: rgba(255,255,255,0.05); }

/* Layout */
.contest-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 0;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 24px;
  align-items: flex-start;
  gap: 24px;
}

/* Main Panel */
.main-panel { min-width: 0; }

/* Header Card */
.contest-header-card {
  background: #1e1e1e;
  border: 1px solid #282828;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 0;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.header-badges { display: flex; gap: 8px; flex-wrap: wrap; }

/* Rule badges */
.rule-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
}
.rule-acm { background: rgba(0,184,163,0.15); color: #00b8a3; }
.rule-oi  { background: rgba(255,161,22,0.15); color: #ffa116; }

.rule-badge-sm {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
}

/* Status badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}
.status-ongoing  { background: rgba(0,184,163,0.1); color: #00b8a3; }
.status-upcoming { background: rgba(255,192,30,0.1); color: #ffc01e; }
.status-ended    { background: rgba(255,255,255,0.06); color: #8a8a8a; }

.pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: #00b8a3; animation: pulse 1.5s infinite; }
@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }

.private-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: rgba(239,71,67,0.1);
  color: #ef4743;
}

/* Countdown */
.countdown-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,161,22,0.08);
  border: 1px solid rgba(255,161,22,0.2);
  border-radius: 8px;
  padding: 6px 14px;
  color: #ffa116;
}
.countdown-label { font-size: 12px; color: #8a8a8a; }
.countdown-time { font-size: 16px; font-weight: 700; font-variant-numeric: tabular-nums; }

.contest-title {
  font-size: 22px;
  font-weight: 800;
  color: #eff2f6;
  margin: 0 0 16px;
  line-height: 1.3;
}

.meta-row-list { display: flex; flex-direction: column; gap: 8px; }
.meta-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #8a8a8a; }
.meta-icon { color: #5c5c5c; flex-shrink: 0; }
.duration-icon { color: #ffa116 !important; }
.duration-highlight { color: #ffa116; font-weight: 600; }

/* Tabs */
.tab-bar {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid #282828;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0 4px;
  scrollbar-width: none; /* Hide scrollbar Firefox */
}
.tab-bar::-webkit-scrollbar { display: none; } /* Hide scrollbar Chrome/Safari */

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #8a8a8a;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  margin-bottom: -2px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-btn:hover { color: #eff2f6; background: rgba(255,255,255,0.03); }
.tab-btn.active { color: #ffa116; border-bottom-color: #ffa116; font-weight: 600; }
.tab-btn.is-disabled {
  opacity: 0.35;
  cursor: not-allowed;
  filter: grayscale(1);
}
.tab-btn.is-disabled:hover {
  color: #8a8a8a;
  background: transparent;
}

/* Tab content */
.tab-content {
  background: #1e1e1e;
  border: 1px solid #282828;
  border-top: none;
  border-radius: 0 0 12px 12px;
  padding: 24px;
  min-height: 300px;
}

/* Info tab */
.section-label { font-size: 14px; font-weight: 700; color: #eff2f6; margin: 0 0 12px; }
.desc-section { margin-bottom: 24px; }
.desc-body { color: #8a8a8a; font-size: 14px; line-height: 1.7; }
.desc-body :deep(p) { margin: 0 0 12px; }
.desc-body :deep(h1), .desc-body :deep(h2), .desc-body :deep(h3) { color: #eff2f6; }

.rules-section { padding: 16px; background: rgba(255,161,22,0.04); border: 1px solid rgba(255,161,22,0.15); border-radius: 8px; }
.rule-desc { font-size: 14px; color: #8a8a8a; line-height: 1.6; }
.rule-desc p { margin: 0; }
.rule-desc strong { color: #ffa116; }

/* Locked state */
.locked-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 20px;
  text-align: center;
}
.lock-icon { color: #3e3e3e; }
.locked-title { font-size: 16px; font-weight: 600; color: #eff2f6; margin: 0; }
.locked-sub { font-size: 14px; color: #8a8a8a; margin: 0; }

/* Problems table */
.problems-header-row, .problem-row {
  display: grid;
  grid-template-columns: 80px 1fr 80px;
  align-items: center;
  padding: 12px 8px;
}
.problems-header-row {
  font-size: 12px;
  font-weight: 700;
  color: #8a8a8a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #282828;
}
.problem-row {
  border-bottom: 1px solid #1e1e1e;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s;
}
.problem-row:hover { background: rgba(255,255,255,0.05); }
.col-id { font-size: 13px; }
.col-title { font-size: 14px; }
.col-points { font-size: 13px; text-align: right; }
.prob-id { font-weight: 700; color: #ffa116; }
.prob-title { color: #eff2f6; font-weight: 500; }
.prob-points { color: #00b8a3; font-weight: 600; }

/* Tab toolbar */
.tab-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.search-input-sm {
  background: #141414;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 7px 14px;
  color: #eff2f6;
  font-size: 13px;
  outline: none;
  width: 200px;
}
.search-input-sm::placeholder { color: #8a8a8a; }
.count-badge { margin-left: auto; font-size: 13px; color: #8a8a8a; }

/* Participants */
.participants-list { display: flex; flex-direction: column; gap: 4px; }
.participant-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  transition: background 0.15s;
}
.participant-item:hover { background: rgba(255,255,255,0.04); }
.p-rank { font-size: 13px; color: #5c5c5c; width: 30px; }
.p-username { font-size: 14px; color: #eff2f6; font-weight: 500; }

/* Leaderboard */
.lb-header-row, .lb-row {
  display: grid;
  grid-template-columns: 80px 1fr 100px 120px;
  align-items: center;
  padding: 12px 8px;
}
.lb-header-row {
  font-size: 12px;
  font-weight: 700;
  color: #8a8a8a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #282828;
}
.lb-row { border-bottom: 1px solid rgba(255,255,255,0.03); border-radius: 6px; }
.lb-top3 { background: linear-gradient(90deg, rgba(255,161,22,0.05), transparent); }
.lb-rank-val { font-size: 14px; color: #8a8a8a; font-weight: 600; }
.medal { font-size: 18px; }
.lb-username { font-size: 14px; font-weight: 500; color: #eff2f6; }
.lb-score { font-size: 15px; font-weight: 700; color: #00b8a3; }
.lb-penalty { font-size: 13px; color: #8a8a8a; }

/* Submissions */
.submissions-list { display: flex; flex-direction: column; gap: 4px; }
.submission-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #282828;
}
.submission-row:hover { background: rgba(255,255,255,0.04); }
.sub-info { display: flex; flex-direction: column; gap: 3px; }
.sub-problem { font-size: 14px; font-weight: 500; color: #eff2f6; }
.sub-time { font-size: 12px; color: #8a8a8a; }
.sub-right { display: flex; align-items: center; gap: 8px; }

/* Verdict */
.verdict-badge { font-size: 12px; font-weight: 700; padding: 3px 8px; border-radius: 6px; }
.verdict-ac   { color: #2cbb5d; background: rgba(44,187,93,0.12); }
.verdict-wa   { color: #ef4743; background: rgba(239,71,67,0.12); }
.verdict-tle  { color: #ffa116; background: rgba(255,161,22,0.12); }
.verdict-info { color: #8a8a8a; background: rgba(255,255,255,0.08); }

/* Sidebar */
.sidebar-panel { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 80px; }
.sidebar-card {
  background: #1e1e1e;
  border: 1px solid #282828;
  border-radius: 12px;
  padding: 20px;
}

/* Register card */
.registered-state {
  padding: 8px 0;
}
.status-card-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.status-icon-box {
  margin-bottom: 16px;
}
.icon-circle {
  width: 48px;
  height: 48px;
  background: rgba(0, 184, 163, 0.1);
  color: #00b8a3;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 184, 163, 0.2);
}
.status-main-text {
  font-size: 15px;
  font-weight: 700;
  color: #00b8a3;
  margin: 0 0 4px;
}
.status-sub-text {
  font-size: 13px;
  color: #8a8a8a;
  margin: 0 0 16px;
}

.action-group {
  width: 100%;
}

.ongoing-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(255, 161, 22, 0.1);
  color: #ffa116;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 12px;
}
.dot-live {
  width: 6px;
  height: 6px;
  background: #ffa116;
  border-radius: 50%;
  animation: pulse 1s infinite;
}

.action-btn-premium {
  width: 100%;
  height: 42px !important;
  background: linear-gradient(135deg, #ffa116, #ff8800) !important;
  border: none !important;
  color: #000 !important;
  font-weight: 700 !important;
  font-size: 14px !important;
  border-radius: 8px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  transition: all 0.25s !important;
}
.action-btn-premium:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(255, 161, 22, 0.3);
  opacity: 0.95;
}
.action-btn-premium:active {
  transform: translateY(0);
}

.ongoing-btn {
  background: #1e1e1e !important;
  border: 1px solid #ffa116 !important;
  color: #ffa116 !important;
}
.ongoing-btn:hover {
  background: rgba(255, 161, 22, 0.05) !important;
}
.ended-state { text-align: center; }
.ended-text { font-size: 14px; color: #8a8a8a; margin: 0; }
.register-hint { font-size: 13px; color: #8a8a8a; margin: 0 0 16px; line-height: 1.5; }

.password-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.input-icon { position: absolute; left: 12px; color: #8a8a8a; }
.password-input {
  width: 100%;
  background: #141414;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 9px 12px 9px 36px;
  color: #eff2f6;
  font-size: 14px;
  outline: none;
}
.password-input:focus { border-color: #ffa116; }

.register-btn {
  width: 100%;
  background: linear-gradient(135deg, #ffa116, #ff8800);
  border: none;
  border-radius: 8px;
  padding: 12px;
  font-size: 15px;
  font-weight: 700;
  color: #000;
  cursor: pointer;
  transition: all 0.2s;
}
.register-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.register-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

/* Info card */
.sidebar-card-title { font-size: 14px; font-weight: 700; color: #eff2f6; margin: 0 0 14px; }
.info-list { display: flex; flex-direction: column; gap: 10px; }
.info-row { display: flex; align-items: center; justify-content: space-between; }
.info-label { font-size: 12px; color: #8a8a8a; }
.info-labelHighlight { font-size: 12px; color: #8a8a8a; }
.info-value { font-size: 13px; color: #eff2f6; font-weight: 500; max-width: 60%; text-align: right; }
.info-valueHighlight { font-size: 13px; color: #ffa116; font-weight: 600; text-align: right; }

/* Loading */
.loading-wrap { display: flex; justify-content: center; padding: 60px; }
.page-loading { min-height: 60vh; display: flex; align-items: center; justify-content: center; }
.is-loading { animation: spin 1s linear infinite; color: #ffa116; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* Empty */
.empty-msg { text-align: center; padding: 40px 20px; color: #8a8a8a; font-size: 14px; }

@media (max-width: 768px) {
  .contest-layout { grid-template-columns: 1fr; }
  .sidebar-panel { order: -1; position: static; }
  .contest-title { font-size: 18px; }
  .header-top { flex-direction: column; align-items: flex-start; }
}
</style>
