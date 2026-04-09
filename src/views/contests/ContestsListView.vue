<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Trophy, Clock, Users, ChevronRight, Calendar, Zap, Flame, AlertCircle, Archive, LayoutGrid } from 'lucide-vue-next'
import { contestsAPI } from '@/api/contests'
import { useAuthStore } from '@/stores/auth'
import { useContestSessionStore } from '@/stores/contestSession'
import { handleApiError } from '@/utils/errorHandler'
import TableControls from '@/components/common/TableControls.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import DarkPagination from '@/components/common/DarkPagination.vue'

const router = useRouter()

const allContests = ref([])
const loading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(12)
const totalElements = ref(0)

const authStore = useAuthStore()
const sessionStore = useContestSessionStore()
const activeContests = ref([])
const now = ref(new Date())
let timerInterval = null

// =====================
// UTC-safe date helpers
// =====================
const parseServerDate = (dateStr) => {
  if (!dateStr) return null
  const cleanStr = dateStr.includes('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z'
  return new Date(cleanStr)
}

const formatDateTime = (dateStr) => {
  const date = parseServerDate(dateStr)
  if (!date) return ''
  return date.toLocaleString(undefined, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  })
}

const getDuration = (start, end) => {
  if (!start || !end) return ''
  const diff = parseServerDate(end) - parseServerDate(start)
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`
}

const getRemainingTime = (endTimeStr) => {
  const endTime = parseServerDate(endTimeStr)
  if (!endTime) return null
  const diff = endTime - now.value
  if (diff <= 0) return '00:00:00'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}

// =====================
// Filters & search
// =====================
const filterValues = ref({ ruleType: '', status: '' })

const contestFilterConfig = [
  {
    key: 'ruleType',
    label: 'Rule Type',
    icon: LayoutGrid,
    options: [
      { label: 'OI',  value: 'OI' },
      { label: 'ACM', value: 'ACM' }
    ]
  },
  {
    key: 'status',
    label: 'Trạng thái',
    icon: Trophy,
    options: [
      { label: 'Đang diễn ra', value: 'ONGOING' },
      { label: 'Sắp diễn ra',  value: 'UPCOMING' },
      { label: 'Đã kết thúc',  value: 'ENDED' }
    ]
  }
]

const handleFilterChange = ({ key, value }) => {
  filterValues.value[key] = value
}

const handleResetFilters = () => {
  filterValues.value = { ruleType: '', status: '' }
}

// =====================
// Data fetching
// =====================
const loadAllContests = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value - 1,
      size: pageSize.value,
      sort: 'startTime,desc',
    }
    if (searchQuery.value) params.keyword = searchQuery.value
    if (filterValues.value.ruleType) params.ruleType = filterValues.value.ruleType
    if (filterValues.value.status) params.contestStatus = filterValues.value.status

    const data = await contestsAPI.getContests(params)
    allContests.value = data.content || []
    totalElements.value = data.totalElements || 0
  } catch (error) {
    handleApiError(error, 'Không thể tải danh sách contest')
  } finally {
    loading.value = false
  }
}

watch([searchQuery, filterValues], () => {
  currentPage.value = 1
  loadAllContests()
}, { deep: true })

const handlePageChange = (val) => {
  currentPage.value = val
  loadAllContests()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  loadAllContests()
}

const loadActiveContests = async () => {
  if (!authStore.isAuthenticated) return
  try {
    const data = await contestsAPI.getMyActiveContests()
    activeContests.value = data || []
  } catch (error) {
    console.error('Failed to load active contests:', error)
  }
}

onMounted(() => {
  loadAllContests()
  loadActiveContests()
  timerInterval = setInterval(() => {
    now.value = sessionStore.getServerNow()
  }, 1000)
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

// =====================
// Client-side grouping
// =====================
const ongoingContests  = computed(() => allContests.value.filter(c => c.contestStatus === 'ONGOING'))
const upcomingContests = computed(() => allContests.value.filter(c => c.contestStatus === 'UPCOMING'))
const endedContests    = computed(() => allContests.value.filter(c => c.contestStatus === 'ENDED'))

const goToContest = (contest) => router.push(`/contests/${contest.contestKey}`)
</script>

<template>
  <div class="public-layout-page">
    <div class="public-layout-container">

      <!-- Header -->
      <PageHeader 
        title="Contests" 
        subtitle="Tham gia các cuộc thi lập trình và thách thức bản thân!"
      />

      <TableControls
        v-model="searchQuery"
        search-placeholder="Tìm kiếm contest..."
        :filter-config="contestFilterConfig"
        :total-elements="totalElements"
        item-name="Contests"
        @filter-change="handleFilterChange"
        @reset-filters="handleResetFilters"
      />

      <!-- ===== MY ACTIVE SESSIONS ===== -->
      <div v-if="activeContests.length > 0" class="active-sessions-banner">
        <div class="banner-label">
          <span class="live-dot" />
          ĐANG THAM GIA
        </div>
        <div class="sessions-list">
          <div
            v-for="item in activeContests"
            :key="item.contest.id"
            class="session-card"
            @click="goToContest(item.contest)"
          >
            <div class="session-info">
              <span class="session-rule" :class="item.contest.ruleType === 'ACM' ? 'rule-acm' : 'rule-oi'">{{ item.contest.ruleType }}</span>
              <h3 class="session-title">{{ item.contest.title }}</h3>
            </div>
            <div class="session-timer">
              <span class="timer-label">CÒN LẠI</span>
              <span class="timer-value">
                <Clock :size="14" />
                {{ getRemainingTime(item.sessionEndTime) }}
              </span>
            </div>
            <button class="session-resume-btn">
              Tiếp tục thi <ChevronRight :size="14" />
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner" />
        <span>Đang tải...</span>
      </div>

      <template v-else>

        <div v-if="allContests.length === 0" class="empty-section">
          <span>Không tìm thấy cuộc thi nào</span>
        </div>

        <!-- ===== ONGOING ===== -->
        <section v-if="ongoingContests.length > 0" class="contest-section">
          <div class="section-header ongoing-header">
            <div class="section-title-group">
              <Flame :size="18" class="section-icon" />
              <h2 class="section-title">Đang diễn ra</h2>
              <span class="section-count">{{ ongoingContests.length }}</span>
            </div>
          </div>

          <div class="contests-grid">
            <div
              v-for="c in ongoingContests"
              :key="c.id"
              class="contest-card card-ongoing"
              @click="goToContest(c)"
            >
              <div class="card-top">
                <div class="card-badges">
                  <span :class="['rule-badge', c.ruleType === 'ACM' ? 'rule-acm' : 'rule-oi']">{{ c.ruleType }}</span>
                  <span class="status-badge status-ongoing"><span class="pulse-dot" />Đang diễn ra</span>
                </div>
                <span v-if="c.visibility === 'PRIVATE'" class="lock-badge">🔒</span>
              </div>
              <h3 class="card-title">{{ c.title }}</h3>
              <div class="card-meta">
                <div class="meta-row">
                  <Calendar :size="13" />
                  <span>{{ formatDateTime(c.startTime) }} – {{ formatDateTime(c.endTime) }}</span>
                </div>
                <div class="meta-row">
                  <Zap :size="13" />
                  <span>{{ getDuration(c.startTime, c.endTime) }}</span>
                  <span v-if="c.format === 'WINDOWED'" class="chip-windowed">⚡ {{ c.durationMinutes }} phút</span>
                </div>
                <div class="meta-row">
                  <Users :size="13" />
                  <span>{{ (c.participantCount || 0).toLocaleString() }} người</span>
                </div>
              </div>
              <div class="card-footer">
                <span class="card-link">Xem chi tiết <ChevronRight :size="13" /></span>
              </div>
            </div>
          </div>
        </section>

        <!-- ===== UPCOMING ===== -->
        <section v-if="upcomingContests.length > 0" class="contest-section">
          <div class="section-header upcoming-header">
            <div class="section-title-group">
              <AlertCircle :size="18" class="section-icon" />
              <h2 class="section-title">Sắp diễn ra</h2>
              <span class="section-count">{{ upcomingContests.length }}</span>
            </div>
          </div>

          <div class="contests-grid">
            <div
              v-for="c in upcomingContests"
              :key="c.id"
              class="contest-card card-upcoming"
              @click="goToContest(c)"
            >
              <div class="card-top">
                <div class="card-badges">
                  <span :class="['rule-badge', c.ruleType === 'ACM' ? 'rule-acm' : 'rule-oi']">{{ c.ruleType }}</span>
                  <span class="status-badge status-upcoming">Sắp diễn ra</span>
                </div>
                <span v-if="c.visibility === 'PRIVATE'" class="lock-badge">🔒</span>
              </div>
              <h3 class="card-title">{{ c.title }}</h3>
              <div class="card-meta">
                <div class="meta-row">
                  <Calendar :size="13" />
                  <span>{{ formatDateTime(c.startTime) }} – {{ formatDateTime(c.endTime) }}</span>
                </div>
                <div class="meta-row">
                  <Zap :size="13" />
                  <span>{{ getDuration(c.startTime, c.endTime) }}</span>
                  <span v-if="c.format === 'WINDOWED'" class="chip-windowed">⚡ {{ c.durationMinutes }} phút</span>
                </div>
                <div class="meta-row">
                  <Users :size="13" />
                  <span>{{ (c.participantCount || 0).toLocaleString() }} người</span>
                </div>
              </div>
              <div class="card-footer">
                <span class="card-link">Xem chi tiết <ChevronRight :size="13" /></span>
              </div>
            </div>
          </div>
        </section>

        <!-- ===== ENDED ===== -->
        <section v-if="endedContests.length > 0" class="contest-section">
          <div class="section-header ended-header">
            <div class="section-title-group">
              <Archive :size="18" class="section-icon" />
              <h2 class="section-title">Đã kết thúc</h2>
              <span class="section-count">{{ endedContests.length }}</span>
            </div>
          </div>

          <div class="contests-grid">
            <div
              v-for="c in endedContests"
              :key="c.id"
              class="contest-card card-ended"
              @click="goToContest(c)"
            >
              <div class="card-top">
                <div class="card-badges">
                  <span :class="['rule-badge', c.ruleType === 'ACM' ? 'rule-acm' : 'rule-oi']">{{ c.ruleType }}</span>
                  <span class="status-badge status-ended">Đã kết thúc</span>
                </div>
                <span v-if="c.visibility === 'PRIVATE'" class="lock-badge">🔒</span>
              </div>
              <h3 class="card-title">{{ c.title }}</h3>
              <div class="card-meta">
                <div class="meta-row">
                  <Calendar :size="13" />
                  <span>{{ formatDateTime(c.startTime) }} – {{ formatDateTime(c.endTime) }}</span>
                </div>
                <div class="meta-row">
                  <Zap :size="13" />
                  <span>{{ getDuration(c.startTime, c.endTime) }}</span>
                  <span v-if="c.format === 'WINDOWED'" class="chip-windowed">⚡ {{ c.durationMinutes }} phút</span>
                </div>
                <div class="meta-row">
                  <Users :size="13" />
                  <span>{{ (c.participantCount || 0).toLocaleString() }} người</span>
                </div>
              </div>
              <div class="card-footer">
                <span class="card-link">Xem kết quả <ChevronRight :size="13" /></span>
              </div>
            </div>
          </div>
        </section>

        <!-- Pagination -->
        <DarkPagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="totalElements"
          :page-sizes="[12, 24, 48]"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />

      </template>
    </div>
  </div>
</template>

<style scoped>
/* ===== ACTIVE SESSIONS BANNER ===== */
.active-sessions-banner {
  background: linear-gradient(135deg, rgba(255,161,22,0.07), rgba(255,161,22,0.02));
  border: 1px solid rgba(255,161,22,0.15);
  border-radius: 14px;
  padding: 20px 24px;
  margin-bottom: 40px;
}

.banner-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #ffa116;
  margin-bottom: 16px;
}

.live-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #ffa116;
  box-shadow: 0 0 8px #ffa116;
  animation: pulse-live 1.4s infinite;
}

@keyframes pulse-live {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.6); opacity: 0.4; }
}

.sessions-list { display: flex; flex-direction: column; gap: 10px; }

.session-card {
  display: flex;
  align-items: center;
  gap: 20px;
  background: #242424;
  border: 1px solid #333;
  border-radius: 10px;
  padding: 14px 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.session-card:hover {
  background: #2a2a2a;
  border-color: #444;
  transform: translateX(4px);
}

.session-info { flex: 1; min-width: 0; }

.session-rule {
  font-size: 10px; font-weight: 700;
  padding: 2px 8px; border-radius: 4px;
  margin-bottom: 6px; display: inline-block;
}

.session-title {
  font-size: 16px; font-weight: 700;
  color: #fff; margin: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.session-timer { text-align: center; min-width: 130px; }

.timer-label {
  font-size: 10px; font-weight: 700;
  color: #5c5c5c; letter-spacing: 0.06em;
  display: block; margin-bottom: 4px;
}

.timer-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 20px; font-weight: 700;
  color: #00b8a3;
  display: flex; align-items: center;
  justify-content: center; gap: 6px;
}

.session-resume-btn {
  display: flex; align-items: center; gap: 6px;
  background: #ffa116; color: #000;
  border: none; border-radius: 8px;
  padding: 9px 18px;
  font-size: 13px; font-weight: 700;
  cursor: pointer; white-space: nowrap;
  transition: all 0.2s;
}

.session-resume-btn:hover {
  background: #ffb342;
  box-shadow: 0 4px 12px rgba(255,161,22,0.35);
}

/* ===== SECTION ===== */
.contest-section { margin-bottom: 48px; }

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid transparent;
}

.ongoing-header  { border-bottom-color: rgba(0, 184, 163, 0.4); }
.upcoming-header { border-bottom-color: rgba(255, 192, 30, 0.4); }
.ended-header    { border-bottom-color: rgba(255,255,255,0.08); }

.section-title-group {
  display: flex; align-items: center; gap: 10px;
}

.section-icon { flex-shrink: 0; }
.ongoing-header  .section-icon { color: #00b8a3; }
.upcoming-header .section-icon { color: #ffc01e; }
.ended-header    .section-icon { color: #5c5c5c; }

.section-title {
  font-size: 18px; font-weight: 700;
  color: #eff2f6; margin: 0;
}

.section-count {
  font-size: 13px; font-weight: 700;
  padding: 2px 10px; border-radius: 20px;
}

.ongoing-header  .section-count { background: rgba(0,184,163,0.12); color: #00b8a3; }
.upcoming-header .section-count { background: rgba(255,192,30,0.12); color: #ffc01e; }
.ended-header    .section-count { background: rgba(255,255,255,0.06); color: #8a8a8a; }

/* ===== GRID ===== */
.contests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}

/* ===== CARD ===== */
.contest-card {
  background: #1a1a1a;
  border: 1px solid #282828;
  border-radius: 12px;
  padding: 18px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  overflow: hidden;
}

.contest-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  opacity: 0;
  transition: opacity 0.2s;
}

.card-ongoing::before  { background: linear-gradient(90deg, #00b8a3, #00d4bc); }
.card-upcoming::before { background: linear-gradient(90deg, #ffc01e, #ffaa00); }
.card-ended::before    { background: linear-gradient(90deg, #3e3e3e, #555); }

.contest-card:hover { border-color: #3e3e3e; transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.35); }
.contest-card:hover::before { opacity: 1; }

.card-ended { opacity: 0.75; }
.card-ended:hover { opacity: 1; }

/* Card top */
.card-top {
  display: flex; align-items: center;
  justify-content: space-between;
}

.card-badges { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

.rule-badge {
  padding: 3px 9px; border-radius: 5px;
  font-size: 11px; font-weight: 700;
}
.rule-acm { background: rgba(0,184,163,0.15); color: #00b8a3; }
.rule-oi  { background: rgba(255,161,22,0.15); color: #ffa116; }

.status-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 9px; border-radius: 20px;
  font-size: 11px; font-weight: 600;
}
.status-ongoing  { background: rgba(0,184,163,0.1); color: #00b8a3; }
.status-upcoming { background: rgba(255,192,30,0.1); color: #ffc01e; }
.status-ended    { background: rgba(255,255,255,0.06); color: #8a8a8a; }

.pulse-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: #00b8a3;
  animation: pulse 1.5s infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

.lock-badge { font-size: 12px; color: #5c5c5c; }

/* Card content */
.card-title {
  font-size: 15px; font-weight: 700;
  color: #eff2f6; margin: 0;
  line-height: 1.4;
}

.card-meta {
  display: flex; flex-direction: column; gap: 6px;
}

.meta-row {
  display: flex; align-items: center; gap: 7px;
  font-size: 12px; color: #8a8a8a;
}

.meta-row svg { color: #4a4a4a; flex-shrink: 0; }

.chip-windowed {
  background: rgba(255,161,22,0.1);
  color: #ffa116;
  font-size: 11px; font-weight: 600;
  padding: 1px 7px; border-radius: 10px;
  margin-left: 4px;
}

/* Card footer */
.card-footer {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid #252525;
}

.card-link {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; font-weight: 600; color: #ffa116;
  transition: gap 0.2s;
}

.contest-card:hover .card-link { gap: 8px; }

/* ===== EMPTY ===== */
.empty-section {
  padding: 28px;
  background: #161616;
  border: 1px dashed #2e2e2e;
  border-radius: 10px;
  color: #5c5c5c;
  font-size: 14px;
  text-align: center;
}

/* ===== LOADING ===== */
.loading-state {
  display: flex; align-items: center;
  justify-content: center; gap: 12px;
  padding: 80px 20px;
  color: #8a8a8a; font-size: 14px;
}

.spinner {
  width: 20px; height: 20px;
  border: 2px solid #333;
  border-top-color: #ffa116;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== RESPONSIVE ===== */
@media (max-width: 640px) {
  .content-section { padding: 20px 16px; }
  .page-header { flex-direction: column; }
  .search-input { width: 100%; }
  .session-card { flex-direction: column; align-items: flex-start; }
  .session-timer { text-align: left; }
  .contests-grid { grid-template-columns: 1fr; }
}
</style>
