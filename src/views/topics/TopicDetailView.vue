<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  Search, 
  ArrowUpDown, 
  ArrowDownWideNarrow, 
  ArrowUpNarrowWide, 
  Filter, 
  Gauge, 
  RotateCcw, 
  ChevronDown, 
  Check,
  Calendar,
  User,
  Info,
  Play,
  Share2,
  Star,
  LayoutGrid
} from 'lucide-vue-next'
import { useTopicStore } from '@/stores/topic'
import { useProblemStore } from '@/stores/problem'
import { useAuthStore } from '@/stores/auth'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import TableControls from '@/components/common/TableControls.vue'
import DataTable from '@/components/common/DataTable.vue'
import DarkPagination from '@/components/common/DarkPagination.vue'
import { debounce } from 'lodash'
import { ElMessage } from 'element-plus'
import { handleApiError } from '@/utils/errorHandler'

const route = useRoute()
const router = useRouter()
const topicStore = useTopicStore()
const problemStore = useProblemStore()
const authStore = useAuthStore()

const slug = computed(() => route.params.slug)
const topicData = ref(null)
const loadingDetail = ref(true)

// Problem list states (Adapted from ProblemListView)
const problems = computed(() => problemStore.problems)
const searchQuery = ref('')
const currentSortField = ref('')
const currentSortDirection = ref('DESC')
const filters = ref({
  difficulty: { active: false, operator: 'is', value: '' },
  ruleType: { active: false, operator: 'is', value: '' }
})
const pagination = ref({
  page: 1,
  size: 20
})

const progressPercent = computed(() => {
  if (!topicData.value) return 0
  const total = topicData.value.totalEasy + topicData.value.totalMedium + topicData.value.totalHard
  if (total === 0) return 0
  return Math.min(100, Math.round((topicData.value.solvedTotal / total) * 100))
})

const fetchTopicDetail = async () => {
  try {
    loadingDetail.value = true
    topicData.value = await topicStore.getTopicDetails(slug.value)
  } catch (error) {
    handleApiError(error, 'Không tải được thông tin topic')
  } finally {
    loadingDetail.value = false
  }
}

const fetchProblemsData = async () => {
  const queryParams = {
    page: pagination.value.page - 1,
    size: pagination.value.size,
    topicSlugs: slug.value // Filter by this topic
  }
  
  if (currentSortField.value) {
    queryParams.sort = `${currentSortField.value},${currentSortDirection.value}`
  }

  if (searchQuery.value) queryParams.keyword = searchQuery.value
  
  if (filters.value.difficulty.active && filters.value.difficulty.value) {
    queryParams.difficulty = filters.value.difficulty.value
  }

  if (filters.value.ruleType.active && filters.value.ruleType.value) {
    queryParams.ruleType = filters.value.ruleType.value
  }

  await problemStore.fetchProblems(queryParams, false, false)
}

const debouncedFetchProblems = debounce(fetchProblemsData, 300)

const handleSort = (command) => {
  if (currentSortField.value === command) {
    currentSortDirection.value = currentSortDirection.value === 'ASC' ? 'DESC' : 'ASC'
  } else {
    currentSortField.value = command
    currentSortDirection.value = 'DESC'
  }
}

const resetSort = () => {
  currentSortField.value = ''
  currentSortDirection.value = 'DESC'
}

const resetFilters = () => {
  searchQuery.value = ''
  filters.value.difficulty = { active: false, operator: 'is', value: '' }
  filters.value.ruleType = { active: false, operator: 'is', value: '' }
}

const filterConfig = [
  { key: 'difficulty', label: 'Difficulty', icon: Gauge, options: [{ label: 'Easy', value: 'EASY' }, { label: 'Medium', value: 'MEDIUM' }, { label: 'Hard', value: 'HARD' }] },
  { key: 'ruleType', label: 'Rule Type', icon: LayoutGrid, options: [{ label: 'ACM', value: 'ACM' }, { label: 'OI', value: 'OI' }] }
]

const handleFilterChange = ({ key, value }) => {
  if (value === '') {
     filters.value[key].active = false
     filters.value[key].value = null
  } else {
     filters.value[key].active = true
     filters.value[key].value = value
  }
}

const handlePageChange = (val) => {
  pagination.value.page = val
}

const handleSizeChange = (val) => {
  pagination.value.size = val
  pagination.value.page = 1
  fetchProblemsData()
}

const getDifficultyClass = (difficulty) => {
  const classes = {
    'EASY': 'difficulty-easy',
    'MEDIUM': 'difficulty-medium',
    'HARD': 'difficulty-hard'
  }
  return classes[difficulty] || ''
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const getRuleTypeClass = (ruleType) => {
  const classes = {
    'OI': 'rule-type-oi',
    'ACM': 'rule-type-acm'
  }
  return classes[ruleType] || ''
}

const handleViewProblem = (row) => {
  router.push(`/problems/${row.slug}`)
}

watch(searchQuery, () => {
  pagination.value.page = 1
  debouncedFetchProblems()
})

watch([currentSortField, currentSortDirection], () => {
  pagination.value.page = 1
  debouncedFetchProblems()
})

watch(filters, () => {
  pagination.value.page = 1
  debouncedFetchProblems()
}, { deep: true })

watch(() => pagination.value.page, () => {
  fetchProblemsData()
})

const initPage = async () => {
  const currentSlug = route.params.slug
  if (!currentSlug) return
  
  try {
    loadingDetail.value = true
    // Fetch both detail and problems
    await Promise.all([
      fetchTopicDetail(),
      fetchProblemsData()
    ])
  } catch (err) {
    handleApiError(err, 'Không thể tải thông tin chủ đề')
  } finally {
    loadingDetail.value = false
  }
}

onMounted(initPage)

// Watch for route changes
watch(() => route.path, (newPath) => {
  // If we are moving within /topics/:slug
  if (newPath.startsWith('/topics/') && route.params.slug) {
    pagination.value.page = 1
    initPage()
  }
}, { immediate: false })
</script>

<template>
  <div class="public-layout-page">
    <div class="public-layout-container" v-if="!loadingDetail && topicData">
      <!-- Left Column: Topic Information -->
      <aside class="topic-sidebar">
        <div class="sidebar-card topic-info-card">
          <div class="topic-icon-wrap">
             <div class="topic-icon-placeholder">
               <Play :size="32" fill="currentColor" />
             </div>
          </div>
          
          <h1 class="topic-title">{{ topicData.name }}</h1>
          
          <div class="topic-meta">
            <span>KMA OJ</span>
            <span class="dot">•</span>
            <span>{{ (topicData.totalEasy || 0) + (topicData.totalMedium || 0) + (topicData.totalHard || 0) }} questions</span>
          </div>

          <div class="topic-update-info">
            <Calendar :size="14" />
            <span>Updated: {{ formatDate(topicData.updatedDate) }}</span>
          </div>

          <div class="topic-description" v-if="topicData.description">
            <p>{{ topicData.description }}</p>
          </div>
          
          <div class="topic-creator">
            <User :size="16" />
            <span>Created by: <router-link :to="`/profile/${topicData.createdBy}`" class="creator-name">{{ topicData.createdBy }}</router-link></span>
          </div>
        </div>

        <!-- Progress Section -->
        <div class="sidebar-card progress-card" v-if="authStore.isAuthenticated">
          <div class="progress-header">
            <h3 class="card-title">Progress</h3>
            <button class="reset-btn" @click="fetchTopicDetail"><RotateCcw :size="14" /></button>
          </div>
          
          <div class="progress-layout">
            <!-- Left: Circle section -->
            <div class="progress-main-card">
              <div class="progress-circle-wrap">
                <svg viewBox="0 0 36 36" class="circular-chart gauged">
                  <path class="circle-bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path class="circle"
                    :stroke-dasharray="`${progressPercent}, 100`"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div class="circle-content">
                  <div class="solved-numbers">
                    <span class="solved-num">{{ topicData.solvedTotal || 0 }}</span>
                    <span class="count-divider">/</span>
                    <span class="total-num">{{ (topicData.totalEasy || 0) + (topicData.totalMedium || 0) + (topicData.totalHard || 0) }}</span>
                  </div>
                  <div class="solved-status">
                    <Check :size="12" class="check-icon" />
                    <span>Solved</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Difficulty small cards -->
            <div class="difficulty-cards">
              <div class="diff-card easy">
                <div class="diff-label">Easy</div>
                <div class="diff-val"><span class="current">{{ topicData.solvedEasy || 0 }}</span>/{{ topicData.totalEasy || 0 }}</div>
              </div>
              <div class="diff-card medium">
                <div class="diff-label">Med.</div>
                <div class="diff-val"><span class="current">{{ topicData.solvedMedium || 0 }}</span>/{{ topicData.totalMedium || 0 }}</div>
              </div>
              <div class="diff-card hard">
                <div class="diff-label">Hard</div>
                <div class="diff-val"><span class="current">{{ topicData.solvedHard || 0 }}</span>/{{ topicData.totalHard || 0 }}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Right Column: Problem List -->
      <main class="problems-main">
        <TableControls
          v-model="searchQuery"
          search-placeholder="Search questions..."
          :total-elements="problemStore.pagination.totalElements"
          item-name="Problems"
          :sort-options="[
            { label: 'Title', value: 'title' },
            { label: 'Difficulty', value: 'difficulty' }
          ]"
          :current-sort="currentSortField"
          :current-sort-dir="currentSortDirection"
          @sort="handleSort"
          @reset-sort="resetSort"
          :filter-config="filterConfig"
          filter-title="Filter Problems"
          @filter-change="handleFilterChange"
          @reset-filters="resetFilters"
        />

        <TableSkeleton v-if="problemStore.loading && problems.length === 0" :columns="4" :rows="10" />

        <DataTable 
          v-else 
          :data="problems" 
          :columns="[
            { key: 'solved', label: '', width: 50, resizable: false },
            { key: 'index', label: '#', width: 60, resizable: false },
            { key: 'title', label: 'Title', minWidth: 300 },
            { key: 'ruleType', label: 'Rule Type', minWidth: 150 },
            { key: 'difficulty', label: 'Difficulty', minWidth: 150 },
            { key: 'score', label: 'Score', minWidth: 150 },
            { key: 'rate', label: 'Accepted rate', minWidth: 150 }
          ]"
          :loading="problemStore.loading"
          empty-text="No problems found in this topic"
          @row-click="handleViewProblem"
          :row-class-name="() => 'clickable-row'"
        >
          <template #cell-solved="{ row }">
            <Check v-if="row.userProblemState === 'SOLVED'" :size="20" class="solved-icon" />
          </template>
          <template #cell-index="{ index }">
            <span class="cell-index">{{ (pagination.page - 1) * pagination.size + index + 1 }}</span>
          </template>
          <template #cell-title="{ row }">
            <span class="cell-title">{{ row.title }}</span>
          </template>
          <template #cell-ruleType="{ row }">
             <span :class="['rule-type-text', getRuleTypeClass(row.ruleType)]">{{ row.ruleType }}</span>
          </template>
          <template #cell-difficulty="{ row }">
             <span :class="['difficulty-text', getDifficultyClass(row.difficulty)]">{{ !row.difficulty ? '' : row.difficulty.toUpperCase() === 'EASY' ? 'Easy' : row.difficulty.toUpperCase() === 'MEDIUM' ? 'Med' : 'Hard' }}</span>
          </template>
          <template #cell-score="{ row }">
             <span class="score-text">{{ row.totalScore }}</span>
          </template>
          <template #cell-rate="{ row }">
            <span class="cell-index">{{ row.submissionCount > 0 ? ((row.acceptedCount / row.submissionCount) * 100).toFixed(2) : '0.00' }}%</span>
          </template>
        </DataTable>

        <DarkPagination
          v-if="problemStore.pagination.totalElements > 0"
          :current-page="pagination.page"
          :page-size="pagination.size"
          :total="problemStore.pagination.totalElements"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </main>
    </div>

    <div v-else-if="loadingDetail" class="loading-state">
      <el-skeleton :rows="10" animated />
    </div>
  </div>
</template>

<style scoped>
.public-layout-container {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 32px;
}

/* Sidebar Styling */
.topic-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sidebar-card {
  background: #282828;
  border-radius: 12px;
  padding: 24px;
  color: #eff2f6;
}

.topic-info-card {
  display: flex;
  flex-direction: column;
}

.topic-icon-wrap {
  width: 64px;
  height: 64px;
  background: #333;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  color: #8a8a8a;
  border: 1px solid #3e3e3e;
}

.topic-title {
  font-size: 26px;
  font-weight: 700;
  margin: 0 0 10px 0;
  color: #fff;
}

.topic-meta {
  font-size: 14px;
  color: #8a8a8a;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}

.dot { font-size: 10px; }

.topic-update-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #8a8a8a;
  margin-bottom: 20px;
}

.topic-description {
  font-size: 14px;
  line-height: 1.6;
  color: #eff2f6;
  margin-bottom: 24px;
}

.topic-creator {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #8a8a8a;
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #3e3e3e;
}

.creator-name {
  color: var(--accent-primary);
  font-weight: 600;
  font-size: 15px;
}

/* Progress Section REDESIGNED to match LeetCode image */
.progress-card {
  padding: 24px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: #fff;
}

.reset-btn {
  background: transparent;
  border: none;
  color: #8a8a8a;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.reset-btn:hover { background: #3e3e3e; color: #fff; }

.progress-layout {
  display: flex;
  gap: 12px;
}

.progress-main-card {
  flex: 2;
  background: #2c2c2c;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.progress-circle-wrap {
  position: relative;
  width: 140px;
  height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.circular-chart.gauged {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}

.circle-bg {
  fill: none;
  stroke: #3e3e3e;
  stroke-width: 1.5;
}

.circle {
  fill: none;
  stroke: #00b8a3;
  stroke-width: 1.5;
  stroke-linecap: round;
  transition: stroke-dasharray 0.5s ease;
}

.circle-content {
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -45%);
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.solved-numbers {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.solved-num {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
}

.count-divider {
  font-size: 14px;
  color: #8a8a8a;
}

.total-num {
  font-size: 16px;
  color: #8a8a8a;
}

.solved-status {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #fff;
  font-size: 14px;
  margin-top: 4px;
}

.check-icon {
  color: #2cbb5d;
}

.difficulty-cards {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.diff-card {
  background: #2c2c2c;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1;
}

.diff-label {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.diff-val {
  font-size: 16px;
  color: #8a8a8a;
  font-weight: 500;
}

.diff-val .current {
  color: #fff;
  font-size: 18px;
  font-weight: 700;
}

.diff-card.easy .diff-label { color: #00b8a3; }
.diff-card.medium .diff-label { color: #ffc01e; }
.diff-card.hard .diff-label { color: #ef4743; }

/* Main Content Area */
.problems-main {
  background: transparent;
}



.cell-title-wrap {
  display: flex;
  align-items: center;
}

.problem-index {
  color: #8a8a8a;
  font-weight: 500;
  margin-right: 4px;
  font-size: 14px;
}

.cell-title {
  color: #eff2f6;
  font-weight: 500;
  font-size: 14px;
  transition: color 0.2s;
}

:deep(.leetcode-table tr:hover .cell-title) {
  color: var(--accent-primary);
}

.solution-icon { color: #8a8a8a; }
.acceptance-text { color: #8a8a8a; font-size: 13px; }

.solved-icon { color: #2cbb5d; }

:deep(.difficulty-text) { font-weight: 600; font-size: 13px; }
:deep(.difficulty-easy) { color: #00b8a3; }
:deep(.difficulty-medium) { color: #ffc01e; }
:deep(.difficulty-hard) { color: #ef4743; }

.simple-filter {
  padding: 4px 12px 12px;
}

.loading-state {
  max-width: 1200px;
  margin: 0 auto;
}

/* Rule Type Styles */
:deep(.rule-type-text) {
  font-weight: 600;
  font-size: 13px;
  padding: 2px 8px;
  border-radius: 4px;
}
:deep(.rule-type-oi) {
  color: #00b8a3;
  background: rgba(0, 184, 163, 0.1);
}
:deep(.rule-type-acm) {
  color: #ffc01e;
  background: rgba(255, 192, 30, 0.1);
}

.score-text {
  color: #eff2f6;
  font-weight: 500;
}
</style>

<style>
/* Global Styles to match ProblemListView */
.topic-detail-page .filter-popover.el-popper {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
  padding: 0 !important;
  border-radius: 8px !important;
  color: #eff2f6 !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
  width: 350px !important;
  min-width: 310px !important;
}

.topic-detail-page .filter-popover.el-popper .el-popper__arrow::before {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
}

.topic-detail-page .dark-select .el-input__wrapper {
  background-color: #333 !important;
  box-shadow: 0 0 0 1px #3e3e3e inset !important;
  border-radius: 6px;
}

.topic-detail-page .dark-select .el-input__inner {
  color: #eff2f6 !important;
  font-size: 13px;
}

.topic-detail-page .dark-dropdown {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
}

.topic-detail-page .dark-dropdown .el-dropdown-menu__item {
  color: #eff2f6 !important;
}

.topic-detail-page .dark-dropdown .el-dropdown-menu__item:hover,
.topic-detail-page .dark-dropdown .el-dropdown-menu__item.is-active {
  background-color: #333 !important;
  color: var(--accent-primary) !important;
}

.topic-detail-page .dark-select-dropdown {
  background-color: #282828 !important;
  border: 1px solid #3e3e3e !important;
}

.topic-detail-page .dark-select-dropdown .el-select-dropdown__item {
  color: #eff2f6 !important;
}

.topic-detail-page .dark-select-dropdown .el-select-dropdown__item.is-hovering {
  background-color: #333 !important;
}

.topic-detail-page .dark-select-dropdown .el-select-dropdown__item.is-selected {
  color: var(--accent-primary) !important;
  background-color: rgba(255, 161, 22, 0.1) !important;
}
</style>
