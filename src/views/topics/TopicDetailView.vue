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
import DarkPagination from '@/components/common/DarkPagination.vue'
import { debounce } from 'lodash'
import { ElMessage } from 'element-plus'

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
    console.error('Failed to fetch topic detail:', error)
    ElMessage.error('Không tải được thông tin topic')
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

const debouncedFetchProblems = debounce(fetchProblemsData, 500)

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
    console.error('Error initializing topic page:', err)
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
  <div class="topic-detail-page">
    <div class="topic-container" v-if="!loadingDetail && topicData">
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
            <span>Created by: <span class="creator-name">{{ topicData.createdBy }}</span></span>
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
        <div class="table-controls">
          <div class="search-wrap">
            <Search class="search-icon" :size="16" />
            <input type="text" v-model="searchQuery" placeholder="Search questions" class="search-input" />
          </div>
          
          <el-dropdown trigger="click" @command="handleSort" class="control-dropdown sort-dropdown">
            <span class="el-dropdown-link">
              <button class="control-btn sort-btn" :class="{ active: currentSortField, 'has-text': currentSortField }">
                <ArrowUpDown v-if="!currentSortField" :size="16" />
                <ArrowUpDown v-else-if="currentSortDirection === 'ASC'" :size="16" class="up-arrow" style="transform: rotate(180deg);" />
                <ArrowUpDown v-else :size="16" />
                <span v-if="currentSortField" class="sort-text">{{ currentSortField === 'difficulty' ? 'Difficulty' : 'Title' }}</span>
              </button>
            </span>
            <template #dropdown>
              <el-dropdown-menu class="dark-dropdown custom-sort-menu">
                <el-dropdown-item command="title" :class="{ 'is-active': currentSortField === 'title' }">
                  <div class="sort-menu-content">
                    <span>Title</span>
                    <ArrowDownWideNarrow v-if="currentSortField === 'title' && currentSortDirection === 'DESC'" :size="16" class="sort-indicator" />
                    <ArrowUpNarrowWide v-if="currentSortField === 'title' && currentSortDirection === 'ASC'" :size="16" class="sort-indicator" />
                  </div>
                </el-dropdown-item>
                <el-dropdown-item command="difficulty" :class="{ 'is-active': currentSortField === 'difficulty' }">
                  <div class="sort-menu-content">
                    <span>Difficulty</span>
                    <ArrowDownWideNarrow v-if="currentSortField === 'difficulty' && currentSortDirection === 'DESC'" :size="16" class="sort-indicator" />
                    <ArrowUpNarrowWide v-if="currentSortField === 'difficulty' && currentSortDirection === 'ASC'" :size="16" class="sort-indicator" />
                  </div>
                </el-dropdown-item>
                <div class="filter-footer sort-footer">
                  <el-button link class="reset-filters" @click="resetSort">
                    <RotateCcw :size="14" style="margin-right: 6px;" /> Reset Sort
                  </el-button>
                </div>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-popover
            placement="bottom-start"
            :width="350"
            trigger="click"
            popper-class="filter-popover"
            :hide-after="0"
            :persistent="true"
          >
            <template #reference>
              <div style="display: inline-block;">
                <el-tooltip content="Filter problems" placement="top" effect="dark" :hide-after="0">
                  <button class="control-btn" :class="{ active: filters.difficulty.active }">
                    <Filter :size="16" />
                  </button>
                </el-tooltip>
              </div>
            </template>
            <div class="filter-content">
              <div class="filter-header">
                <span>Filter Problems</span>
              </div>
              
              <div class="filter-list">
                 <div class="filter-row">
                   <el-checkbox v-model="filters.difficulty.active" class="dark-checkbox" />
                   <span class="filter-label" :class="{ 'is-active': filters.difficulty.active }">
                     <Gauge :size="14" /> Difficulty
                   </span>
                   <el-select v-model="filters.difficulty.operator" size="small" class="dark-select math-select" :disabled="!filters.difficulty.active" popper-class="dark-select-dropdown">
                     <el-option label="is" value="is" />
                   </el-select>
                   <el-select v-model="filters.difficulty.value" size="small" class="dark-select value-select" :disabled="!filters.difficulty.active" popper-class="dark-select-dropdown">
                      <el-option label="Easy" value="EASY" />
                      <el-option label="Medium" value="MEDIUM" />
                      <el-option label="Hard" value="HARD" />
                   </el-select>
                 </div>

                 <div class="filter-row">
                   <el-checkbox v-model="filters.ruleType.active" class="dark-checkbox" />
                   <span class="filter-label" :class="{ 'is-active': filters.ruleType.active }">
                     <LayoutGrid :size="14" /> Rule Type
                   </span>
                   <el-select v-model="filters.ruleType.operator" size="small" class="dark-select math-select" :disabled="!filters.ruleType.active" popper-class="dark-select-dropdown">
                     <el-option label="is" value="is" />
                   </el-select>
                   <el-select v-model="filters.ruleType.value" size="small" class="dark-select value-select" :disabled="!filters.ruleType.active" popper-class="dark-select-dropdown">
                      <el-option label="ACM" value="ACM" />
                      <el-option label="OI" value="OI" />
                   </el-select>
                 </div>
              </div>

              <div class="filter-footer">
                <div class="spacer"></div>
                <el-button link class="reset-filters" @click="resetFilters">
                  <RotateCcw :size="14" style="margin-right: 6px;" /> Reset All
                </el-button>
              </div>
            </div>
          </el-popover>
        </div>

        <TableSkeleton v-if="problemStore.loading && problems.length === 0" :columns="4" :rows="10" />

        <el-table 
          v-else 
          :data="problems" 
          class="dashboard-table leetcode-table topic-problem-table" 
          v-loading="problemStore.loading"
          @row-click="handleViewProblem"
        >
          <template #empty>
            <el-empty description="No problems found in this topic" />
          </template>

          <el-table-column label="" width="50" align="center">
            <template #default="{ row }">
              <Check v-if="row.userProblemState === 'SOLVED'" :size="20" class="solved-icon" />
            </template>
          </el-table-column>
          
          <el-table-column label="#" width="60" align="center">
            <template #default="{ $index }">
              <span class="cell-index">{{ (pagination.page - 1) * pagination.size + $index + 1 }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Title" min-width="300">
            <template #default="{ row }">
              <span class="cell-title">{{ row.title }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Rule Type" width="130" align="center">
            <template #default="{ row }">
               <span :class="['rule-type-text', getRuleTypeClass(row.ruleType)]">{{ row.ruleType }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Difficulty" width="120" align="center">
            <template #default="{ row }">
               <span :class="['difficulty-text', getDifficultyClass(row.difficulty)]">{{ !row.difficulty ? '' : row.difficulty.toUpperCase() === 'EASY' ? 'Easy' : row.difficulty.toUpperCase() === 'MEDIUM' ? 'Med' : 'Hard' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Score" width="100" align="center">
            <template #default="{ row }">
               <span :class="['score-text']">{{ row.totalScore }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Acceptance" width="130" align="center">
            <template #default="{ row }">
              <span class="cell-index">{{ row.submissionCount > 0 ? ((row.acceptedCount / row.submissionCount) * 100).toFixed(2) : '0.00' }}%</span>
            </template>
          </el-table-column>
        </el-table>

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
.topic-detail-page {
  min-height: calc(100vh - 60px);
  background: var(--bg-primary);
  padding: 32px 24px;
}

.topic-container {
  max-width: 1200px;
  margin: 0 auto;
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
  background: #282828;
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
  background: #333;
  border-color: #5c5c5c;
}

.control-btn {
  background: #282828;
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

.control-btn:hover { background: #333; color: #eff2f6; }
.control-btn.active { color: var(--accent-primary); background: rgba(255, 161, 22, 0.1); border-color: rgba(255, 161, 22, 0.3); }

/* Table Styling from ProblemListView */
:deep(.leetcode-table) {
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
}

:deep(.leetcode-table .el-table__inner-wrapper::before) {
  display: none;
}

:deep(.leetcode-table.click-table tr) {
  cursor: pointer;
}
.topic-link {
  text-decoration: none;
  transition: color 0.2s;
}
.topic-link:hover {
  color: var(--accent-primary) !important;
  text-decoration: underline;
}
:deep(.leetcode-table .el-table__inner-wrapper),
:deep(.leetcode-table .el-table__body-wrapper),
:deep(.leetcode-table .el-scrollbar),
:deep(.leetcode-table .el-scrollbar__wrap) {
  overflow: visible !important;
  height: auto !important;
  max-height: none !important;
}

:deep(.leetcode-table th.el-table__cell) {
  background: transparent !important;
  border-bottom: 1px solid #3e3e3e !important;
  color: #8a8a8a;
  font-weight: 500;
  font-size: 13px;
}

:deep(.leetcode-table td.el-table__cell) {
  border-bottom: none !important;
  padding: 12px 0;
  background: transparent !important;
}

:deep(.leetcode-table tr) {
  background: transparent !important;
  cursor: pointer;
}

:deep(.leetcode-table tr:nth-child(even) td.el-table__cell) {
  background: rgba(255, 255, 255, 0.03) !important;
}

:deep(.leetcode-table tr:hover td.el-table__cell) {
  background: rgba(255, 255, 255, 0.08) !important;
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
