<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Trophy, Clock, Users, Search, ChevronRight, Filter, Calendar, Zap, RotateCcw, LayoutGrid } from 'lucide-vue-next'
import { contestsAPI } from '@/api/contests'
import { useAuthStore } from '@/stores/auth'
import { useContestSessionStore } from '@/stores/contestSession'
import { handleApiError } from '@/utils/errorHandler'
import DarkPagination from '@/components/common/DarkPagination.vue'

const router = useRouter()

const contests = ref([])
const loading = ref(false)
const searchQuery = ref('')
const filterContestStatus = ref('')
const filterRuleType = ref('')
const pagination = ref({ page: 1, size: 20, total: 0 })

const authStore = useAuthStore()
const sessionStore = useContestSessionStore()
const activeContests = ref([])
const activeLoading = ref(false)
const now = ref(new Date())

let timerInterval = null

// Helper to parse server ISO string correctly (appending Z if missing to force UTC)
const parseServerDate = (dateStr) => {
  if (!dateStr) return null
  const cleanStr = dateStr.includes('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z'
  return new Date(cleanStr)
}

const formatDateTime = (dateStr) => {
  const date = parseServerDate(dateStr)
  if (!date) return ''
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

const loadActiveContests = async () => {
  if (!authStore.isAuthenticated) return
  
  try {
    activeLoading.value = true
    const data = await contestsAPI.getMyActiveContests()
    activeContests.value = data || []
  } catch (error) {
    console.error('Failed to load active contests:', error)
  } finally {
    activeLoading.value = false
  }
}

const loadContests = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.value.page - 1,
      size: pagination.value.size,
      sort: 'startTime,desc'
    }
    if (searchQuery.value) params.keyword = searchQuery.value
    if (filterContestStatus.value) params.contestStatus = filterContestStatus.value
    if (filterRuleType.value) params.ruleType = filterRuleType.value

    const data = await contestsAPI.getContests(params)
    contests.value = data.content || []
    pagination.value.total = data.totalElements || 0
  } catch (error) {
    handleApiError(error, 'Không thể tải danh sách contest')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.value.page = 1
  loadContests()
}

const handleFilter = (val) => {
  pagination.value.page = 1
  loadContests()
}

const handlePageChange = (page) => {
  pagination.value.page = page
  loadContests()
}

const handleSizeChange = (size) => {
  pagination.value.size = size
  pagination.value.page = 1
  loadContests()
}

const goToContest = (contest) => {
  router.push(`/contests/${contest.id}`)
}

const getDuration = (start, end) => {
  if (!start || !end) return ''
  const diff = parseServerDate(end) - parseServerDate(start)
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  return hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ''}` : `${mins}m`
}

onMounted(() => {
  loadContests()
  loadActiveContests()
  
  timerInterval = setInterval(() => {
    now.value = sessionStore.getServerNow()
  }, 1000)
})

import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

const getRemainingTime = (endTimeStr) => {
  const endTime = parseServerDate(endTimeStr)
  if (!endTime) return null
  
  const diff = endTime - now.value
  if (diff <= 0) return '00:00:00'
  
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  const secs = Math.floor((diff % 60000) / 1000)
  
  return [hours, mins, secs].map(v => String(v).padStart(2, '0')).join(':')
}
</script>

<template>
  <div class="contests-page">
    <div class="content-section">
      <div class="section-header">
        <div>
          <h1 class="section-title">Contests</h1>
          <p class="section-subtitle">Tham gia các cuộc thi lập trình và thách thức bản thân!</p>
        </div>
      </div>

      <!-- Active Contests Section -->
      <div v-if="activeContests.length > 0" class="active-contests-section">
        <div class="section-badge">
          <span class="active-dot"></span>
          ĐANG THAM GIA
        </div>
        
        <div class="active-grid">
          <div 
            v-for="item in activeContests" 
            :key="item.contest.id" 
            class="active-card"
            @click="goToContest(item.contest)"
          >
            <div class="active-card-content">
              <div class="active-info">
                <h3 class="active-title">{{ item.contest.title }}</h3>
                <div class="active-meta">
                  <div class="meta-item">
                    <Trophy :size="14" />
                    <span>{{ item.contest.ruleType }}</span>
                  </div>
                  <div class="meta-item">
                    <Users :size="14" />
                    <span>{{ item.contest.participantCount }} người thi</span>
                  </div>
                </div>
              </div>
              
              <div class="active-timer">
                <div class="timer-label">THỜI GIAN CÒN LẠI</div>
                <div class="timer-value" :class="{ 'timer-warning': parseServerDate(item.sessionEndTime) - now < 300000 }">
                  <Clock :size="18" />
                  {{ getRemainingTime(item.sessionEndTime) }}
                </div>
              </div>

              <div class="active-action">
                <button class="resume-btn">
                  Tiếp tục thi
                  <ChevronRight :size="16" />
                </button>
              </div>
            </div>
            
            <!-- Progress bar (visual only for now) -->
            <div class="active-progress-bg">
              <div class="active-progress-fill" :style="{ width: '100%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="table-controls">
        <div class="search-wrap">
          <Search class="search-icon" :size="16" />
          <input
            type="text"
            v-model="searchQuery"
            @keyup.enter="handleSearch"
            placeholder="Tìm kiếm contest..."
            class="search-input"
          />
        </div>

        <el-popover
          placement="bottom-start"
          :width="320"
          trigger="click"
          popper-class="filter-popover"
          :hide-after="0"
          :persistent="true"
        >
          <template #reference>
            <div style="display: inline-block;">
              <el-tooltip content="Lọc contest" placement="top" effect="dark" :hide-after="0">
                <button class="control-btn" :class="{ active: filterContestStatus !== '' || filterRuleType !== '' }">
                  <Filter :size="16" />
                </button>
              </el-tooltip>
            </div>
          </template>
          
          <div class="filter-content">
            <div class="filter-header">
              <span>Bộ lọc Contests</span>
            </div>
            
            <div class="filter-list">
               <div class="filter-row">
                 <span class="filter-label" :class="{ 'is-active': filterContestStatus !== '' }">
                   <Clock :size="14" /> Trạng thái
                 </span>
                 <el-select v-model="filterContestStatus" size="small" class="dark-select value-select" @change="handleFilter" popper-class="dark-select-dropdown">
                    <el-option label="Tất cả" value="" />
                    <el-option label="Sắp diễn ra" value="UPCOMING" />
                    <el-option label="Đang diễn ra" value="ONGOING" />
                    <el-option label="Đã kết thúc" value="ENDED" />
                 </el-select>
               </div>

               <div class="filter-row">
                 <span class="filter-label" :class="{ 'is-active': filterRuleType !== '' }">
                   <LayoutGrid :size="14" /> Rule Type
                 </span>
                 <el-select v-model="filterRuleType" size="small" class="dark-select value-select" @change="handleFilter" popper-class="dark-select-dropdown">
                    <el-option label="Tất cả" value="" />
                    <el-option label="ACM" value="ACM" />
                    <el-option label="OI" value="OI" />
                 </el-select>
               </div>
            </div>

            <div class="filter-footer">
              <div class="spacer"></div>
              <el-button link class="reset-filters" @click="filterContestStatus=''; filterRuleType=''; handleFilter()">
                <RotateCcw :size="14" style="margin-right: 6px;" /> Đặt lại
              </el-button>
            </div>
          </div>
        </el-popover>
        
        <div class="spacer"></div>
        <div class="solved-count-container" v-if="pagination.total >= 0">
          <div class="solved-count">
            <div class="circle-progress"></div>
            <span>{{ pagination.total }} Contests</span>
          </div>
        </div>
      </div>

      <!-- Loading Skeletons -->
      <div v-if="loading && contests.length === 0" class="skeletons">
        <div v-for="i in 6" :key="i" class="contest-card-skeleton">
          <div class="skel-line skel-title" />
          <div class="skel-line skel-meta" />
          <div class="skel-line skel-meta short" />
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="!loading && contests.length === 0" class="empty-state">
        <Trophy :size="48" class="empty-icon" />
        <p class="empty-text">Không tìm thấy contest nào</p>
        <span class="empty-sub">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</span>
      </div>

      <!-- Contest Grid -->
      <div v-else class="contests-grid">
        <div
          v-for="contest in contests"
          :key="contest.id"
          class="contest-card"
          @click="goToContest(contest)"
        >
          <!-- Status Indicator -->
          <div class="card-top-bar">
            <div class="card-badges">
              <span :class="['rule-badge', contest.ruleType === 'ACM' ? 'rule-acm' : 'rule-oi']">
                {{ contest.ruleType }}
              </span>
              <span :class="['status-badge', `status-${contest.contestStatus?.toLowerCase()}`]">
                <span v-if="contest.contestStatus === 'ONGOING'" class="pulse-dot" />
                {{ contest.contestStatus === 'ONGOING' ? 'Đang diễn ra' : contest.contestStatus === 'UPCOMING' ? 'Sắp diễn ra' : 'Đã kết thúc' }}
              </span>
            </div>
            <span v-if="contest.visibility === 'PRIVATE'" class="lock-badge">🔒 Private</span>
          </div>

          <h3 class="card-title">{{ contest.title }}</h3>

          <div class="card-meta">
            <div class="meta-row">
              <Calendar :size="14" class="meta-icon" />
              <span>{{ formatDateTime(contest.startTime) }} – {{ formatDateTime(contest.endTime) }}</span>
            </div>
            <div class="meta-row">
              <Zap :size="14" class="meta-icon" />
              <span>Thời lượng: {{ getDuration(contest.startTime, contest.endTime) }}</span>
              <span v-if="contest.durationMinutes" class="meta-dot">•</span>
              <span v-if="contest.durationMinutes" class="duration-highlight">Làm bài: {{ contest.durationMinutes }} phút</span>
            </div>
            <div class="meta-row">
              <Users :size="14" class="meta-icon" />
              <span>{{ (contest.participantCount || 0).toLocaleString() }} người tham gia</span>
            </div>
          </div>

          <div class="card-footer">
            <span class="join-link">Xem chi tiết <ChevronRight :size="14" /></span>
          </div>
        </div>
      </div>

      <DarkPagination
        v-if="pagination.total > 0"
        :current-page="pagination.page"
        :page-size="pagination.size"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.contests-page {
  min-height: 100vh;
  background: var(--bg-primary);
}

.content-section {
  padding: var(--spacing-2xl);
  max-width: 1400px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--spacing-2xl);
  gap: var(--spacing-lg);
}

.section-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.section-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

/* Table Controls CSS */
.table-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}
.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 14px;
  color: #8a8a8a;
}
.search-input {
  background-color: #282828;
  border: 1px solid transparent;
  border-radius: 20px;
  padding: 8px 16px 8px 40px;
  color: #eff2f6;
  font-size: 13px;
  width: 240px;
  outline: none;
  transition: all 0.2s;
}
.search-input:focus {
  border-color: #5c5c5c;
  background-color: #333;
}
.search-input::placeholder {
  color: #8a8a8a;
}
.control-btn {
  background-color: #282828;
  border: 1px solid transparent;
  color: #8a8a8a;
  border-radius: 20px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.control-btn:hover {
  background-color: #333;
  color: #eff2f6;
}
.control-btn.active {
  background-color: rgba(255, 161, 22, 0.1);
  color: var(--accent-primary);
  border-color: rgba(255, 161, 22, 0.3);
}
.spacer {
  flex: 1;
}

.solved-count {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8a8a8a;
  font-size: 13px;
  font-weight: 500;
}
.circle-progress {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #3e3e3e;
  border-top-color: #00b8a3;
  transform: rotate(-45deg);
}

.results-badge {
  display: flex;
  align-items: center;
  gap: 6px;
}
.search-indicator {
  color: #ffc01e;
}
.results-count {
  font-size: 13px;
  color: #eff2f6;
  font-weight: 500;
}

/* Grid */
.contests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

/* Contest Card */
.contest-card {
  background: #1e1e1e;
  border: 1px solid #282828;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.contest-card:hover {
  border-color: rgba(255, 161, 22, 0.4);
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.card-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-badges {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* Rule badges */
.rule-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
}
.rule-acm { background: rgba(0, 184, 163, 0.15); color: #00b8a3; }
.rule-oi  { background: rgba(255, 161, 22, 0.15); color: #ffa116; }

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

.status-ongoing  { background: rgba(0, 184, 163, 0.1); color: #00b8a3; }
.status-upcoming { background: rgba(255, 192, 30, 0.1); color: #ffc01e; }
.status-ended    { background: rgba(255,255,255,0.06); color: #8a8a8a; }

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00b8a3;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.3; }
  100% { opacity: 1; }
}

.lock-badge {
  font-size: 11px;
  color: #8a8a8a;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #eff2f6;
  margin: 0;
  line-height: 1.4;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #8a8a8a;
}

.meta-icon { color: #5c5c5c; flex-shrink: 0; }

.meta-dot {
  color: #5c5c5c;
  font-size: 10px;
}

.duration-highlight {
  color: #ffa116;
  font-weight: 600;
}

.card-footer {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid #282828;
}

.join-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #ffa116;
  transition: gap 0.2s;
}

.contest-card:hover .join-link { gap: 8px; }

/* Skeleton */
.skeletons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.contest-card-skeleton {
  background: #1e1e1e;
  border: 1px solid #282828;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: shimmer 1.5s infinite linear;
}

@keyframes shimmer {
  0% { border-color: #282828; }
  50% { border-color: #333; }
  100% { border-color: #282828; }
}

.skel-line {
  background: linear-gradient(90deg, #282828 25%, #333 50%, #282828 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
  height: 14px;
}

.skel-title { height: 20px; width: 70%; }
.skel-meta { width: 100%; }
.skel-meta.short { width: 50%; }

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon { color: #3e3e3e; }
.empty-text { font-size: 18px; font-weight: 600; color: var(--text-primary); margin: 0; }
.empty-sub { font-size: 14px; color: #8a8a8a; margin: 0; }

@media (max-width: 768px) {
  .contests-hero { padding: 24px 20px; }
  .contests-body { padding: 20px 16px; }
  .controls-bar { gap: 8px; }
  .search-input { width: 170px; }
  .contests-grid { grid-template-columns: 1fr; }
}

/* Active Contests Styles */
.active-contests-section {
  margin-bottom: 40px;
  background: linear-gradient(135deg, rgba(255, 161, 22, 0.05) 0%, rgba(255, 161, 22, 0.02) 100%);
  border: 1px solid rgba(255, 161, 22, 0.1);
  border-radius: 16px;
  padding: 24px;
}

.section-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 161, 22, 0.15);
  color: #ffa116;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  margin-bottom: 20px;
}

.active-dot {
  width: 6px;
  height: 6px;
  background: #ffa116;
  border-radius: 50%;
  box-shadow: 0 0 8px #ffa116;
  animation: pulse-active 1.5s infinite;
}

@keyframes pulse-active {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}

.active-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.active-card {
  background: #242424;
  border: 1px solid #333;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.active-card:hover {
  background: #2a2a2a;
  border-color: #444;
  transform: translateX(4px);
}

.active-card-content {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  padding: 16px 24px;
  gap: 24px;
}

.active-title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 8px 0;
}

.active-meta {
  display: flex;
  gap: 16px;
  color: #8a8a8a;
  font-size: 13px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.active-timer {
  text-align: right;
  min-width: 140px;
}

.timer-label {
  font-size: 10px;
  font-weight: 700;
  color: #5c5c5c;
  margin-bottom: 4px;
}

.timer-value {
  font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
  font-size: 20px;
  font-weight: 700;
  color: #00b8a3;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.timer-warning {
  color: #ff4d4f;
  animation: shake 0.5s infinite;
}

@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(1px); }
  75% { transform: translateX(-1px); }
  100% { transform: translateX(0); }
}

.resume-btn {
  background: #ffa116;
  color: #000;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.resume-btn:hover {
  background: #ffb342;
  box-shadow: 0 4px 12px rgba(255, 161, 22, 0.3);
}

.active-progress-bg {
  height: 2px;
  background: #333;
  width: 100%;
}

.active-progress-fill {
  height: 100%;
  background: #ffa116;
  transition: width 1s linear;
}

@media (max-width: 640px) {
  .active-card-content {
    grid-template-columns: 1fr;
    gap: 16px;
    text-align: center;
  }
  .active-timer {
    text-align: center;
  }
  .timer-value {
    justify-content: center;
  }
  .active-action {
    display: flex;
    justify-content: center;
  }
}
</style>

<style>
/* Global Filter Popover Styles */
.filter-popover.el-popper {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
  border-radius: 12px !important;
  padding: 0 !important;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4) !important;
}
.filter-popover.el-popper .el-popper__arrow::before {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
}

.filter-header {
  padding: 16px;
  border-bottom: 1px solid #3e3e3e;
  font-weight: 600;
  color: #eff2f6;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-list {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8a8a8a;
  font-size: 13px;
  width: 100px;
  transition: color 0.2s;
}
.filter-label.is-active {
  color: #eff2f6;
}

.dark-select.value-select {
  flex: 1;
}

.dark-select .el-input__wrapper {
  background-color: transparent !important;
  box-shadow: none !important;
  padding: 0 8px;
}
.dark-select .el-input__inner {
  color: #eff2f6;
  font-size: 13px;
}
.dark-select:not(.is-disabled):hover .el-input__wrapper {
  background-color: rgba(255, 255, 255, 0.05) !important;
}

.filter-footer {
  padding: 12px 16px;
  border-top: 1px solid #3e3e3e;
  display: flex;
  justify-content: flex-end;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 0 0 12px 12px;
}

.reset-filters {
  color: #8a8a8a !important;
  font-size: 13px;
}
.reset-filters:hover {
  color: #eff2f6 !important;
}
</style>
