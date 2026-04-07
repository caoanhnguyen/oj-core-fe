<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useContestStore } from '@/stores/contest'
import { useContestSessionStore } from '@/stores/contestSession'
import { useSyncedTimer } from '@/composables/useSyncedTimer'
import { contestsAPI } from '@/api/contests'
import { handleApiError } from '@/utils/errorHandler'
import {
  Trophy, Clock, Users, BookOpen, BarChart2, List, ChevronLeft,
  Lock, Key, RefreshCw, Zap, Check, ChevronRight, Calendar, Shield, LogOut
} from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppButton from '@/components/common/AppButton.vue'
import DarkPagination from '@/components/common/DarkPagination.vue'
import DataTable from '@/components/common/DataTable.vue'

const route  = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const contestStore = useContestStore()
const sessionStore = useContestSessionStore()

const contestId = computed(() => route.params.id)
const activeTab  = ref(route.params.tab || 'info')
const contest    = ref(null)
const loading    = ref(false)

// =====================
// UTC-safe date helpers
// =====================
const parseServerDate = (dateStr) => {
  if (!dateStr) return null
  const s = dateStr.includes('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z'
  return new Date(s)
}

const formatDateTime = (dateStr) => {
  const d = parseServerDate(dateStr)
  if (!d) return ''
  return d.toLocaleString(undefined, { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false })
}

const getDuration = (start, end) => {
  if (!start || !end) return ''
  const diff = parseServerDate(end) - parseServerDate(start)
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h} giờ${m > 0 ? ` ${m} phút` : ''}` : `${m} phút`
}

// =====================
// Derived state
// =====================
const isRegistered = computed(() => !!contest.value?.isRegistered || !!contest.value?.registered)
const isFinished   = computed(() => contest.value?.contestStatus === 'ENDED')
const isWindowed   = computed(() => contest.value?.format === 'WINDOWED')
const hasJoined    = computed(() => !!contest.value?.contestParticipation?.startTime)

const isStarted = computed(() => {
  if (!contest.value) return false
  return sessionStore.getServerNow() >= parseServerDate(contest.value.startTime)
})

const isLeaderboardHidden = computed(() => {
  if (!contest.value) return false
  const visibility = contest.value.scoreboardVisibility
  if (visibility === 'HIDDEN_PERMANENTLY') return true
  if (visibility === 'HIDDEN_DURING_CONTEST' && !isFinished.value) return true
  return false
})

const isPersonalSessionActive = computed(() => {
  if (!hasJoined.value || !contest.value?.contestParticipation?.endTime) return false
  const end = parseServerDate(contest.value.contestParticipation.endTime)
  return sessionStore.getServerNow() < end && !contest.value.contestParticipation.isFinished
})

const isTabDisabled = (id) => {
  if (id === 'leaderboard') return isLeaderboardHidden.value
  if (id === 'info') return false
  if (isFinished.value) return false
  if (id === 'problems' || id === 'submissions') {
    if (!sessionStore.isExamMode || sessionStore.activeSession?.contestId !== contest.value?.id) return true
    return isWindowed.value ? !hasJoined.value : (!isRegistered.value || !isStarted.value)
  }
  return false
}

// =====================
// Countdown
// =====================
const countdownLabel = computed(() => {
  if (!contest.value) return ''
  return sessionStore.getServerNow() < parseServerDate(contest.value.startTime) ? 'Bắt đầu sau' : 'Kết thúc sau'
})

const targetTime = computed(() => {
  if (!contest.value) return null
  if (isWindowed.value && hasJoined.value && !contest.value.contestParticipation?.isFinished) {
    return parseServerDate(contest.value.contestParticipation.endTime)?.getTime() || null
  }
  const now   = sessionStore.getServerNow()
  const start = parseServerDate(contest.value.startTime)?.getTime()
  const end   = parseServerDate(contest.value.endTime)?.getTime()
  return start && now < start ? start : end
})

const { formattedTime: timeLeft } = useSyncedTimer(targetTime)

// =====================
// Load contest
// =====================
const loadContest = async () => {
  try {
    loading.value = true
    contest.value = await contestsAPI.getContestById(contestId.value)
  } catch (err) {
    handleApiError(err, 'Không thể tải thông tin contest')
    router.replace('/contests')
  } finally {
    loading.value = false
  }
}

// =====================
// Registration / Start
// =====================
const registerLoading = ref(false)
const showPasswordInput = ref(false)
const registerPassword  = ref('')

const handleRegister = async () => {
  if (!authStore.isAuthenticated) { router.push('/login'); return }
  if (contest.value?.visibility === 'PRIVATE' && !showPasswordInput.value) {
    showPasswordInput.value = true; return
  }
  try {
    registerLoading.value = true
    await contestStore.registerContest(contestId.value, registerPassword.value || null)
    await loadContest()
    showPasswordInput.value = false
    registerPassword.value  = ''
    if (activeTab.value === 'problems') loadProblems()
  } catch {} finally { registerLoading.value = false }
}

const startLoading = ref(false)
const handleStartContest = async () => {
  try {
    await ElMessageBox.confirm(
      'Một khi đã bắt đầu, đồng hồ sẽ chạy liên tục cho đến khi bạn nộp bài hoặc hết giờ. Bạn đã sẵn sàng?',
      'Bắt đầu thi',
      { confirmButtonText: 'Bắt đầu ngay', cancelButtonText: 'Để sau', type: 'warning' }
    )
    startLoading.value = true
    await sessionStore.startSession(contest.value.id, contest.value.title)
    await loadContest()
    ElMessage.success('Bắt đầu thi thành công!')
    router.push(`/contests/${contestId.value}/problems`)
  } catch (err) {
    if (err !== 'cancel') handleApiError(err)
  } finally { startLoading.value = false }
}

const handleEnterExam = () => { router.push(`/contests/${contestId.value}/problems`) }

const handleRejoinContest = () => {
  sessionStore.setSession(contestId.value, contest.value.contestParticipation.endTime, contest.value.title)
  router.push(`/contests/${contestId.value}/problems`)
}

const handleLeaveContest = () => {
  ElMessageBox.confirm(
    'Đồng hồ vẫn sẽ tiếp tục chạy ngầm phía Server. Lần tới quay lại bạn sẽ mất đi thời gian đã trôi qua. Bạn có chắc chắn muốn rời phòng thi không?',
    'Rời phòng thi',
    { confirmButtonText: 'Rời đi', cancelButtonText: 'Ở lại', type: 'warning' }
  ).then(() => {
    sessionStore.clearSession()
    router.push('/contests')
  }).catch(() => {})
}

// =====================
// Problems tab
// =====================
const problems        = ref([])
const problemsLoading = ref(false)

const loadProblems = async () => {
  try {
    problemsLoading.value = true
    problems.value = await contestsAPI.getProblems(contestId.value)
  } catch (err) { handleApiError(err, 'Không thể tải danh sách bài tập') }
  finally { problemsLoading.value = false }
}

const problemColumns = [
  { key: '_ac',           label: '',          width: '50',  align: 'center' },
  { key: 'displayId',     label: '#',         width: '80', align: 'center' },
  { key: 'originalTitle', label: 'Bài tập',  minWidth: '300' },
  { key: 'points',        label: 'Điểm',      width: '100', align: 'right' }
]


// =====================
// Leaderboard tab
// =====================
const leaderboard          = ref([])
const leaderboardLoading   = ref(false)
const leaderboardPagination = ref({ page: 0, size: 20, total: 0 })

const loadLeaderboard = async () => {
  if (isLeaderboardHidden.value) return
  
  try {
    leaderboardLoading.value = true
    const data = await contestsAPI.getLeaderboard(contestId.value, {
      page: leaderboardPagination.value.page,
      size: leaderboardPagination.value.size
    })
    leaderboard.value = data.content || []
    leaderboardPagination.value.total = data.totalElements || 0
  } catch (err) { handleApiError(err, 'Không thể tải bảng xếp hạng') }
  finally { leaderboardLoading.value = false }
}

const lbColumns = computed(() => [
  { key: '_rank',    label: 'Hạng',      width: '100',  align: 'center' },
  { key: 'username', label: 'Thí sinh',  minWidth: '240' },
  { key: 'score',    label: 'Điểm',       width: '120', align: 'center' },
  ...(contest.value?.ruleType === 'ACM' ? [{ key: 'penalty', label: 'Penalty', width: '130', align: 'center' }] : [])
])

// =====================
// My Submissions tab
// =====================
const mySubmissions   = ref([])
const mySubsLoading   = ref(false)
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
  } catch (err) { handleApiError(err, 'Không thể tải lịch sử nộp bài') }
  finally { mySubsLoading.value = false }
}

const submissionColumns = [
  { key: 'createdDate',   label: 'Thời gian nộp',  minWidth: '170' },
  { key: 'problemTitle',  label: 'Bài tập',         minWidth: '200' },
  { key: 'verdict',       label: 'Kết quả',         width: '130', align: 'center' },
  { key: 'score',         label: 'Điểm',            width: '90',  align: 'center' },
  { key: 'languageKey',   label: 'Ngôn ngữ',        width: '120', align: 'center' }
]

// =====================
// Tab switching
// =====================
const switchTab = (tab) => {
  if (isTabDisabled(tab)) return
  if (tab === 'info') router.push(`/contests/${contestId.value}`)
  else router.push(`/contests/${contestId.value}/${tab}`)
}

watch(() => route.params.tab, (newTab) => {
  const targetTab = newTab || 'info'
  activeTab.value = targetTab
  if (targetTab === 'problems'     && !problems.value.length)      loadProblems()
  if (targetTab === 'leaderboard'  && !leaderboard.value.length)   loadLeaderboard()
  if (targetTab === 'submissions'  && !mySubmissions.value.length)  loadMySubmissions()
}, { immediate: true })

// =====================
// Verdict styling
// =====================
const verdictColor = (v) => ({
  AC: '#2cbb5d', WA: '#ef4743', TLE: '#ffa116', MLE: '#ffa116',
  RE: '#ef4743', CE: '#ef4743', PENDING: '#8a8a8a', SE: '#ef4743'
}[v] || '#8a8a8a')

const getMedal = (rank) => ({ 1: '🥇', 2: '🥈', 3: '🥉' }[rank] || rank)

onMounted(loadContest)
onUnmounted(() => {})
</script>

<template>
  <!-- Loading fullscreen -->
  <div v-if="loading" class="page-loading">
    <div class="spin" />
  </div>

  <div v-else-if="contest" class="public-layout-page">
    <div class="public-layout-container">

      <!-- ===== BREADCRUMB ===== -->
      <div class="breadcrumb-row">
        <button class="back-btn" @click="router.push('/contests')">
          <ChevronLeft :size="14" /> Contests
        </button>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">{{ contest.title }}</span>
      </div>

      <!-- ===== HEADER BLOCK ===== -->
      <div class="page-header-row">
        <div class="header-center">
          <div class="top-badges">
            <span :class="['badge-rule', contest.ruleType === 'ACM' ? 'rule-acm' : 'rule-oi']">
              {{ contest.ruleType }}
            </span>
            <span :class="['badge-status', `status-${contest.contestStatus?.toLowerCase()}`]">
              <span v-if="contest.contestStatus === 'ONGOING'" class="pulse-dot" />
              {{ contest.contestStatus === 'ONGOING' ? 'Đang diễn ra' : contest.contestStatus === 'UPCOMING' ? 'Sắp diễn ra' : 'Đã kết thúc' }}
            </span>
            <span v-if="contest.visibility === 'PRIVATE'" class="badge-private">
              <Lock :size="11" /> Private
            </span>
          </div>
          <h1 class="contest-title">{{ contest.title }}</h1>
          <div class="contest-meta">
            <span><Calendar :size="13" /> {{ formatDateTime(contest.startTime) }} – {{ formatDateTime(contest.endTime) }}</span>
            <span><RefreshCw :size="13" /> {{ getDuration(contest.startTime, contest.endTime) }}</span>
            <span v-if="contest.durationMinutes" class="chip-windowed">
              <Zap :size="12" /> Làm bài: {{ contest.durationMinutes }} phút
            </span>
            <span><Users :size="13" /> {{ (contest.participantCount || 0).toLocaleString() }} thí sinh</span>
          </div>
        </div>

      </div>

      <!-- ===== TAB NAV ===== -->
      <div class="tab-nav">
        <div class="tab-nav-inner">
          <button
            v-for="tab in [
              { id: 'info',         label: 'Thông tin',       icon: Trophy },
              { id: 'problems',     label: 'Bài tập',         icon: BookOpen },
              { id: 'leaderboard',  label: 'Xếp hạng',        icon: BarChart2 },
              ...(isRegistered ? [{ id: 'submissions', label: 'Kết quả của tôi', icon: List }] : [])
            ]"
            :key="tab.id"
            class="tab-btn"
            :class="{ active: activeTab === tab.id, disabled: isTabDisabled(tab.id) }"
            :disabled="isTabDisabled(tab.id)"
            @click="switchTab(tab.id)"
          >
            <component :is="tab.icon" :size="15" />
            {{ tab.label }}
            <span v-if="tab.id === 'problems' && problems.length" class="tab-count">{{ problems.length }}</span>
          </button>
        </div>

        <!-- Action area in tab bar -->
        <div class="tab-action">
          <!-- Windowed: Chưa join -->
          <template v-if="isWindowed && isRegistered && !hasJoined && !isFinished && isStarted">
            <AppButton variant="primary" :disabled="startLoading" @click="handleStartContest">
              <template #icon><Zap :size="14" /></template>
              Bắt đầu thi
            </AppButton>
          </template>
          <!-- Fixed/Windowed: Đang thi -->
          <template v-else-if="hasJoined && isPersonalSessionActive">
            <template v-if="sessionStore.isExamMode && sessionStore.activeSession?.contestId === contestId">
              <AppButton variant="outline" @click="handleLeaveContest">
                <template #icon><LogOut :size="14" /></template>
                Rời phòng
              </AppButton>
            </template>
            <template v-else>
              <AppButton variant="primary" @click="handleRejoinContest">
                <template #icon><Zap :size="14" /></template>
                Vào phòng thi
              </AppButton>
            </template>
          </template>
          <!-- Chưa đăng ký -->
          <template v-else-if="!isRegistered && !isFinished">
            <template v-if="!isStarted || contest.allowLateRegistration">
              <div v-if="showPasswordInput" class="password-inline">
                <Key :size="14" />
                <input v-model="registerPassword" type="password" placeholder="Nhập mật khẩu" class="pw-input" />
              </div>
              <AppButton variant="primary" :disabled="registerLoading" @click="handleRegister">
                <template #icon><Shield :size="14" /></template>
                {{ showPasswordInput ? 'Xác nhận' : (authStore.isAuthenticated ? 'Đăng ký tham gia' : 'Đăng nhập để đăng ký') }}
              </AppButton>
            </template>
            <template v-else>
              <AppButton variant="secondary" disabled>
                <template #icon><Lock :size="14" /></template>
                Đã quá hạn đăng ký
              </AppButton>
            </template>
          </template>
          <!-- Fixed đã đăng ký, đang diễn ra, chưa thi -->
          <template v-else-if="!isWindowed && isRegistered && isStarted && !hasJoined && !isFinished">
            <AppButton variant="primary" :disabled="startLoading" @click="handleStartContest">
              <template #icon><Zap :size="14" /></template>
              Bắt đầu thi
            </AppButton>
          </template>
        </div>
      </div>

      <!-- ===== CONTENT ===== -->
      <div class="tab-content">

      <!-- INFO TAB -->
      <div v-if="activeTab === 'info'" class="info-layout">
        <div class="info-main">
          <section class="content-block">
            <h3 class="block-title">Mô tả</h3>
            <div class="desc-body" v-html="contest.description || '<p style=\'color:#8a8a8a\'>Chưa có mô tả.</p>'" />
          </section>
          <section class="content-block">
            <h3 class="block-title">Thể lệ: {{ contest.ruleType }}</h3>
            <div class="rule-box">
              <p v-if="contest.ruleType === 'ACM'">
                Hệ thống <strong>ACM/ICPC</strong>: Mỗi bài tập được chấm theo nguyên tắc "tất cả hoặc không". Kết quả <em>AC</em> khi toàn bộ test case đúng. Xếp hạng theo số bài giải được, tiebreak theo tổng thời gian + penalty (mỗi lần nộp sai: +20 phút).
              </p>
              <p v-else>
                Hệ thống <strong>OI</strong>: Điểm được tính theo tỉ lệ số test case đúng. Mỗi thí sinh chỉ được nộp một lần cho mỗi bài. Không có penalty thời gian.
              </p>
            </div>
          </section>
        </div>
        <aside class="info-sidebar">
          <div class="info-card">
            <h4 class="info-card-title">Thông tin cuộc thi</h4>
            <div class="info-rows">
              <div class="info-row">
                <span class="ir-label">Rule</span>
                <span :class="['badge-rule-sm', contest.ruleType === 'ACM' ? 'rule-acm' : 'rule-oi']">{{ contest.ruleType }}</span>
              </div>
              <div class="info-row">
                <span class="ir-label">Bắt đầu</span>
                <span class="ir-val">{{ formatDateTime(contest.startTime) }}</span>
              </div>
              <div class="info-row">
                <span class="ir-label">Kết thúc</span>
                <span class="ir-val">{{ formatDateTime(contest.endTime) }}</span>
              </div>
              <div class="info-row">
                <span class="ir-label">Thời lượng</span>
                <span class="ir-val">{{ getDuration(contest.startTime, contest.endTime) }}</span>
              </div>
              <div v-if="contest.durationMinutes" class="info-row">
                <span class="ir-label ir-highlight">Làm bài</span>
                <span class="ir-val ir-highlight">{{ contest.durationMinutes }} phút</span>
              </div>
              <div class="info-row">
                <span class="ir-label">Thí sinh</span>
                <span class="ir-val">{{ (contest.participantCount || 0).toLocaleString() }}</span>
              </div>
              <div class="info-row">
                <span class="ir-label">Quyền truy cập</span>
                <span class="ir-val">{{ contest.visibility === 'PUBLIC' ? 'Công khai' : 'Riêng tư' }}</span>
              </div>
              <div class="info-row">
                <span class="ir-label">Tổ chức bởi</span>
                <span class="ir-val">{{ contest.authorUsername }}</span>
              </div>
            </div>
          </div>

          <!-- Registration state card -->
          <div class="info-card" v-if="!isFinished">
            <h4 class="info-card-title">Trạng thái tham gia</h4>
            <div v-if="isRegistered" class="reg-state">
              <div class="reg-check-icon"><Check :size="20" stroke-width="3" /></div>
              <p class="reg-status-text">Đã đăng ký</p>
              <p v-if="contest.contestParticipation?.isFinished" class="reg-sub">Bạn đã hoàn thành.</p>
              <p v-else-if="hasJoined" class="reg-sub ongoing">Phiên thi đang chạy.</p>
              <p v-else-if="!isStarted" class="reg-sub">Chờ contest bắt đầu.</p>
            </div>
            <div v-else class="reg-state">
              <p class="reg-sub">Bạn chưa đăng ký thi.</p>
            </div>
          </div>
        </aside>
      </div>

      <!-- PROBLEMS TAB -->
      <div v-if="activeTab === 'problems'" class="full-tab">
        <DataTable
          :columns="problemColumns"
          :data="problems"
          :loading="problemsLoading"
          empty-text="Chưa có bài tập nào."
        >
          <template #cell-_ac="{ row }">
            <div v-if="row.submissionVerdict === 'AC'" class="ac-orb">
              <Check :size="11" stroke-width="4" />
            </div>
          </template>
          <template #cell-displayId="{ row }">
            <span class="prob-id">{{ row.displayId }}</span>
          </template>
          <template #cell-originalTitle="{ row }">
            <span
              class="prob-title"
              @click.stop="router.push(`/problems/${row.problemSlug}?contestId=${contestId}`)"
            >{{ row.originalTitle }}</span>
          </template>
          <template #cell-points="{ row }">
            <span class="prob-points">{{ row.points }}</span>
          </template>
        </DataTable>
      </div>


      <!-- LEADERBOARD TAB -->
      <div v-if="activeTab === 'leaderboard'" class="full-tab">
        <template v-if="isLeaderboardHidden">
          <div class="lb-locked-container">
            <Lock :size="48" class="lb-locked-icon" />
            <h3 class="lb-locked-title">Bảng xếp hạng bị ẩn</h3>
            <p class="lb-locked-desc">
              {{ contest?.scoreboardVisibility === 'HIDDEN_PERMANENTLY' 
                  ? 'Ban tổ chức đã ẩn bảng xếp hạng của kỳ thi này vĩnh viễn.' 
                  : 'Bảng xếp hạng đang bị đóng băng trong thời gian diễn ra cuộc thi.' 
              }}
            </p>
          </div>
        </template>
        
        <template v-else>
          <DataTable
            :columns="lbColumns"
            :data="leaderboard"
            :loading="leaderboardLoading"
            empty-text="Chưa có dữ liệu xếp hạng."
          >
            <template #cell-_rank="{ index }">
              <span class="lb-rank">{{ getMedal(leaderboardPagination.page * leaderboardPagination.size + index + 1) }}</span>
            </template>
            <template #cell-username="{ row }">
              <RouterLink class="user-link" :to="`/profile/${row.username}`">{{ row.username }}</RouterLink>
            </template>
            <template #cell-score="{ row }">
              <span class="lb-score">{{ row.score }}</span>
            </template>
            <template #cell-penalty="{ row }">
              <span class="lb-penalty">{{ row.penalty }}s</span>
            </template>
          </DataTable>

          <DarkPagination
            v-if="leaderboardPagination.total > leaderboardPagination.size"
            :current-page="leaderboardPagination.page + 1"
            :page-size="leaderboardPagination.size"
            :total="leaderboardPagination.total"
            @current-change="(p) => { leaderboardPagination.page = p - 1; loadLeaderboard() }"
          />
        </template>
      </div>

      <!-- MY SUBMISSIONS TAB -->
      <div v-if="activeTab === 'submissions'" class="full-tab">
        <DataTable
          :columns="submissionColumns"
          :data="mySubmissions"
          :loading="mySubsLoading"
          empty-text="Bạn chưa nộp bài nào trong contest này."
          row-class-name="clickable-row"
          @row-click="(row) => router.push(`/submissions/${row.submissionId}`)"
        >
          <template #cell-createdDate="{ row }">
            <span class="cell-date">{{ parseServerDate(row.createdDate)?.toLocaleString() }}</span>
          </template>
          <template #cell-problemTitle="{ row }">
            <span class="prob-title">{{ row.problemTitle || row.problemId }}</span>
          </template>
          <template #cell-verdict="{ row }">
            <span class="verdict-text" :style="{ color: verdictColor(row.verdict) }">
              {{ row.verdict || 'PENDING' }}
            </span>
          </template>
          <template #cell-score="{ row }">
            <span class="cell-score">{{ row.score ?? '—' }}</span>
          </template>
          <template #cell-languageKey="{ row }">
            <span class="lang-badge">{{ row.languageKey }}</span>
          </template>
        </DataTable>

        <DarkPagination
          v-if="mySubsPagination.total > mySubsPagination.size"
          :current-page="mySubsPagination.page + 1"
          :page-size="mySubsPagination.size"
          :total="mySubsPagination.total"
          @current-change="(p) => { mySubsPagination.page = p - 1; loadMySubmissions() }"
        />
      </div>

    </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== PAGE SHELL ===== */

.page-loading {
  display: flex; align-items: center; justify-content: center;
  height: 100vh;
}
.spin {
  width: 28px; height: 28px;
  border: 3px solid #333;
  border-top-color: #ffa116;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== HEADER ROW ===== */
.breadcrumb-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.back-btn {
  display: inline-flex; align-items: center; gap: 4px;
  background: transparent; border: none;
  color: #5c5c5c; font-size: 13px; cursor: pointer;
  padding: 0; border-radius: 4px;
  transition: color 0.2s;
  flex-shrink: 0;
  white-space: nowrap;
}
.back-btn:hover { color: #eff2f6; }

.breadcrumb-sep {
  color: #3e3e3e;
  font-size: 14px;
  user-select: none;
}

.breadcrumb-current {
  color: #8a8a8a;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 400px;
}

.page-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #1e1e1e;
}

.header-center { flex: 1; min-width: 0; }


.top-badges { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }

.badge-rule {
  padding: 3px 10px; border-radius: 5px;
  font-size: 11px; font-weight: 700;
}
.rule-acm { background: rgba(0,184,163,0.15); color: #00b8a3; }
.rule-oi  { background: rgba(255,161,22,0.15); color: #ffa116; }

.badge-status {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 10px; border-radius: 20px;
  font-size: 11px; font-weight: 600;
}
.status-ongoing  { background: rgba(0,184,163,0.1); color: #00b8a3; }
.status-upcoming { background: rgba(255,192,30,0.1); color: #ffc01e; }
.status-ended    { background: rgba(255,255,255,0.06); color: #8a8a8a; }

.badge-private {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 9px; border-radius: 20px;
  font-size: 11px; background: rgba(239,71,67,0.1); color: #ef4743;
}

.pulse-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: currentColor;
  animation: pulse 1.4s infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.2} }

.contest-title {
  font-size: 22px; font-weight: 800;
  color: #eff2f6; margin: 0 0 10px;
  line-height: 1.3;
}

.contest-meta {
  display: flex; align-items: center; gap: 20px;
  font-size: 13px; color: #8a8a8a;
  flex-wrap: wrap;
}
.contest-meta span { display: flex; align-items: center; gap: 5px; }

.chip-windowed {
  background: rgba(255,161,22,0.1); color: #ffa116;
  padding: 2px 8px; border-radius: 10px;
  font-size: 12px; font-weight: 600;
}

/* Countdown */
.countdown-chip {
  display: flex; align-items: center; gap: 10px;
  background: rgba(255,161,22,0.07);
  border: 1px solid rgba(255,161,22,0.2);
  border-radius: 10px; padding: 10px 16px;
  flex-shrink: 0;
  color: #ffa116;
}
.cd-label { font-size: 11px; color: #8a8a8a; margin-bottom: 2px; }
.cd-time  { font-size: 20px; font-weight: 700; font-variant-numeric: tabular-nums; }

/* ===== TAB NAV ===== */
.tab-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #222;
  margin-bottom: 28px;
  margin-left: -4px;
}

.tab-nav-inner {
  display: flex; align-items: center;
  overflow-x: auto; gap: 2px;
}
.tab-nav-inner::-webkit-scrollbar { display: none; }

.tab-btn {
  display: flex; align-items: center; gap: 7px;
  padding: 14px 18px;
  background: transparent; border: none;
  border-bottom: 2px solid transparent;
  color: #8a8a8a; font-size: 14px; font-weight: 500;
  cursor: pointer; white-space: nowrap;
  margin-bottom: -1px;
  transition: all 0.2s;
}
.tab-btn:hover:not(.disabled) { color: #eff2f6; }
.tab-btn.active { color: #ffa116; border-bottom-color: #ffa116; font-weight: 600; }
.tab-btn.disabled { opacity: 0.35; cursor: not-allowed; }

.tab-count {
  background: rgba(255,255,255,0.08);
  color: #8a8a8a; font-size: 11px; font-weight: 700;
  padding: 1px 7px; border-radius: 10px;
}
.tab-btn.active .tab-count { background: rgba(255,161,22,0.15); color: #ffa116; }

/* Tab action buttons */
.tab-action {
  display: flex; align-items: center; gap: 10px;
  flex-shrink: 0; padding: 8px 0;
}

.btn-primary {
  display: inline-flex; align-items: center; gap: 6px;
  background: #ffa116; color: #000;
  border: none; border-radius: 8px;
  padding: 8px 18px; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: all 0.2s;
}
.btn-primary:hover { background: #ffb342; box-shadow: 0 4px 14px rgba(255,161,22,0.35); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-secondary {
  display: inline-flex; align-items: center; gap: 6px;
  background: transparent;
  border: 1px solid #3e3e3e;
  color: #eff2f6;
  border-radius: 8px; padding: 8px 18px;
  font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.btn-secondary:hover { border-color: #ffa116; color: #ffa116; }

.session-live-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 12px; border-radius: 20px;
  background: rgba(255,161,22,0.1); color: #ffa116;
  font-size: 12px; font-weight: 700;
}

.password-inline {
  display: flex; align-items: center; gap: 6px;
  background: #1e1e1e; border: 1px solid #333;
  border-radius: 8px; padding: 0 12px; height: 36px;
  color: #8a8a8a;
}
.pw-input {
  background: transparent; border: none; outline: none;
  color: #eff2f6; font-size: 13px; width: 160px;
}

.tab-content { width: 100%; }

/* INFO layout */
.info-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 32px;
  align-items: flex-start;
}

.content-block { margin-bottom: 28px; }

.block-title {
  font-size: 14px; font-weight: 700;
  color: #eff2f6; margin: 0 0 14px;
  text-transform: uppercase; letter-spacing: 0.04em;
}

.desc-body {
  font-size: 14px; color: #8a8a8a; line-height: 1.8;
}
.desc-body :deep(p) { margin: 0 0 12px; }
.desc-body :deep(h1),.desc-body :deep(h2),.desc-body :deep(h3) { color: #eff2f6; }

.rule-box {
  background: rgba(255,161,22,0.04);
  border: 1px solid rgba(255,161,22,0.12);
  border-radius: 8px; padding: 16px;
  font-size: 14px; color: #8a8a8a; line-height: 1.7;
}
.rule-box p { margin: 0; }
.rule-box strong { color: #ffa116; }
.rule-box em { color: #2cbb5d; font-style: normal; font-weight: 600; }

/* Sidebar */
.info-card {
  background: #1a1a1a;
  border: 1px solid #242424;
  border-radius: 10px; padding: 18px;
  margin-bottom: 16px;
}

.info-card-title {
  font-size: 12px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.05em;
  color: #5c5c5c; margin: 0 0 14px;
}

.info-rows { display: flex; flex-direction: column; gap: 10px; }

.info-row {
  display: flex; justify-content: space-between;
  align-items: center; font-size: 13px;
}

.ir-label { color: #8a8a8a; }
.ir-val   { color: #eff2f6; font-weight: 500; text-align: right; }
.ir-highlight { color: #ffa116 !important; font-weight: 600 !important; }

.badge-rule-sm {
  padding: 2px 8px; border-radius: 4px;
  font-size: 11px; font-weight: 700;
}

/* Registration state */
.reg-state { text-align: center; padding: 8px 0; }
.reg-check-icon {
  width: 40px; height: 40px; border-radius: 50%;
  background: rgba(0,184,163,0.12); color: #00b8a3;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 10px;
  border: 1px solid rgba(0,184,163,0.2);
}
.reg-status-text { color: #00b8a3; font-weight: 700; font-size: 14px; margin: 0 0 4px; }
.reg-sub { color: #8a8a8a; font-size: 13px; margin: 0; }
.reg-sub.ongoing { color: #ffa116; }

/* ===== FULL TAB (tables) ===== */
.full-tab { width: 100%; }

.tab-toolbar {
  display: flex; align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.tab-search {
  background: #1e1e1e; border: 1px solid #333; border-radius: 8px;
  padding: 8px 14px; color: #eff2f6; font-size: 13px;
  outline: none; width: 220px; transition: border-color 0.2s;
}
.tab-search:focus { border-color: #555; }
.tab-search::placeholder { color: #5c5c5c; }

.tab-count-badge {
  font-size: 13px; color: #8a8a8a; font-weight: 500;
}

/* Cell styles */
.ac-orb {
  width: 20px; height: 20px; border-radius: 50%;
  background: rgba(44,187,93,0.15); color: #2cbb5d;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.prob-id    { font-weight: 700; color: #ffa116; font-size: 13px; }
.prob-title {
  font-size: 14px; font-weight: 500; color: #eff2f6;
  cursor: pointer; transition: color 0.2s;
}
.prob-title:hover { color: #ffa116; }
.prob-points { color: #00b8a3; font-weight: 600; font-size: 14px; }

.rank-num { color: #8a8a8a; font-size: 13px; font-weight: 600; }
.lb-rank  { font-size: 16px; }
.lb-score { color: #00b8a3; font-weight: 700; font-size: 15px; }
.lb-penalty { color: #8a8a8a; font-size: 13px; }

.user-link {
  color: #eff2f6; text-decoration: none; font-weight: 500;
  transition: color 0.2s;
}
.user-link:hover { color: #ffa116; }

.cell-date  { font-size: 13px; color: #8a8a8a; }
.cell-score { color: #eff2f6; font-weight: 600; }

.verdict-text { font-weight: 700; font-size: 13px; }

.lang-badge {
  background: rgba(255,255,255,0.07);
  border-radius: 5px; padding: 2px 8px;
  font-size: 12px; color: #ccc; font-family: monospace;
}

/* Locked Leaderboard UI */
.lb-locked-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 20px;
  background: var(--bg-tertiary, #282828);
  border: 1px solid var(--border-primary, #3e3e3e);
  border-radius: 8px;
  text-align: center;
  margin-top: 16px;
}
.lb-locked-icon {
  color: #5c5c5c;
  margin-bottom: 16px;
  opacity: 0.5;
}
.lb-locked-title {
  color: #eff2f6;
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 8px 0;
}
.lb-locked-desc {
  color: #8a8a8a;
  font-size: 14px;
  max-width: 400px;
  margin: 0;
  line-height: 1.5;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 900px) {
  .top-bar, .tab-content { padding: 16px 20px; }
  .tab-nav { padding: 0 20px; }
  .info-layout { grid-template-columns: 1fr; }
  .contest-title { font-size: 18px; }
}
</style>
