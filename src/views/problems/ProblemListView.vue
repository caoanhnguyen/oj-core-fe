<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search, ArrowUpDown, ArrowDownWideNarrow, ArrowUpNarrowWide, Filter, Gauge, Tag, RotateCcw, ChevronDown, CheckCircle, Check, LayoutGrid } from 'lucide-vue-next'
import { useProblemStore } from '@/stores/problem'
import { useTopicStore } from '@/stores/topic'
import { useAuthStore } from '@/stores/auth'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import DarkPagination from '@/components/common/DarkPagination.vue'
import { debounce } from 'lodash'

const router = useRouter()
const problemStore = useProblemStore()
const topicStore = useTopicStore()
const authStore = useAuthStore()

// Real problems data from store
const problems = computed(() => problemStore.problems)
const topics = computed(() => topicStore.topics)

// Search, Sort, Filter state
const searchQuery = ref('')
const topicSearchQuery = ref('')

const currentSortField = ref('')
const currentSortDirection = ref('DESC')

const filters = ref({
  difficulty: { active: false, operator: 'is', value: '' },
  ruleType: { active: false, operator: 'is', value: '' },
  topics: { active: false, operator: 'is', value: [] }
})

const pagination = ref({
  page: 1, // Store uses 0-based page, UI uses 1-based page
  size: 20
})

const topicSearchInput = ref(null)
const isTopicsExtraExpanded = ref(false)

const hasActiveFilters = computed(() => {
  return Object.values(filters.value).some(f => {
    if (!f.active) return false
    return Array.isArray(f.value) ? f.value.length > 0 : (f.value !== '' && f.value !== null)
  })
})

const resetFilters = () => {
  searchQuery.value = ''
  currentSortField.value = ''
  currentSortDirection.value = 'DESC'
  filters.value = {
    difficulty: { active: false, operator: 'is', value: '' },
    ruleType: { active: false, operator: 'is', value: '' },
    topics: { active: false, operator: 'is', value: [] }
  }
}

const resetSort = () => {
  currentSortField.value = ''
  currentSortDirection.value = 'DESC'
}

const toggleSortDirection = () => {
  currentSortDirection.value = currentSortDirection.value === 'ASC' ? 'DESC' : 'ASC'
}

const handleSort = (command) => {
  if (currentSortField.value === command) {
    toggleSortDirection()
  } else {
    currentSortField.value = command
    currentSortDirection.value = 'DESC'
  }
}

// Fetch problems with BE filter/sort state (isAdmin = false)
const fetchProblemsData = async () => {
  const queryParams = {
    page: pagination.value.page - 1, // Convert layout 1-based to BE 0-based
    size: pagination.value.size
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

  if (filters.value.topics.active && filters.value.topics.value.length > 0) {
    // Backend API expects list of topic slugs
    const selectedTopics = topics.value.filter(t => filters.value.topics.value.includes(t.name))
    queryParams.topicSlugs = selectedTopics.map(t => t.slug).join(',')
  }

  await problemStore.fetchProblems(queryParams, false, false)
}

const solvedCount = ref(0)
const progressPercent = computed(() => {
  const total = problemStore.pagination.totalElements || 0
  if (total === 0) return 0
  return Math.min(100, Math.round((solvedCount.value / total) * 100))
})

const fetchSolvedCount = async () => {
  if (!authStore.isAuthenticated) return
  
  try {
    const count = await problemStore.getSolvedCount()
    // count đã là giá trị number trả về từ store
    solvedCount.value = count || 0
  } catch (error) {
    console.error('Failed to fetch solved count:', error)
  }
}

// Debounced fetch automatically triggering API for search/filter inputs 
const debouncedFetchProblems = debounce(fetchProblemsData, 500)

watch(searchQuery, () => {
  pagination.value.page = 1
  debouncedFetchProblems()
})

watch([currentSortField, currentSortDirection], () => {
  pagination.value.page = 1
  debouncedFetchProblems()
})

watch(filters, () => {
  // Do not fetch if an active filter doesn't have a value yet
  const hasIncompleteFilter = Object.values(filters.value).some(f => 
    f.active && (!f.value || f.value.length === 0)
  );
  if (hasIncompleteFilter) {
    return;
  }
  pagination.value.page = 1 // Reset to first page
  debouncedFetchProblems()
}, { deep: true })

watch(() => pagination.value.page, () => {
  fetchProblemsData()
})

const getDifficultyClass = (difficulty) => {
  const classes = {
    'EASY': 'difficulty-easy',
    'MEDIUM': 'difficulty-medium',
    'HARD': 'difficulty-hard',
    'Easy': 'difficulty-easy',
    'Medium': 'difficulty-medium',
    'Hard': 'difficulty-hard'
  }
  return classes[difficulty] || ''
}

const getRuleTypeClass = (ruleType) => {
  const classes = {
    'OI': 'rule-type-oi',
    'ACM': 'rule-type-acm'
  }
  return classes[ruleType] || ''
}

const filteredTopicsList = computed(() => {
  if (!topicSearchQuery.value) return topics.value
  const q = topicSearchQuery.value.toLowerCase()
  return topics.value.filter(t => t.name.toLowerCase().includes(q))
})

const handleTopicToggle = (topicName) => {
  const current = [...filters.value.topics.value]
  const index = current.indexOf(topicName)
  if (index > -1) {
    current.splice(index, 1)
  } else {
    current.push(topicName)
  }
  filters.value.topics.value = current // Trigger reactivity explicitly
  filters.value.topics.active = true // Auto activate filter if they select a topic
}

const onTopicPopoverShow = () => {
  // Use timeout to ensure DOM is ready
  setTimeout(() => {
    topicSearchInput.value?.focus()
  }, 50)
}

const resetTopicFilter = () => {
  filters.value.topics.value = []
  topicSearchQuery.value = ''
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const handleView = (row) => {
  router.push(`/problems/${row.slug}`)
}

// Handle page changes
const handlePageChange = (val) => {
  pagination.value.page = val
}

const handleSizeChange = (val) => {
  pagination.value.size = val
  pagination.value.page = 1
  fetchProblemsData()
}

onMounted(async () => {
  await Promise.all([
    fetchProblemsData(),
    topicStore.fetchTopics(''), // Fetch all topics
    fetchSolvedCount()
  ])
})
</script>

<template>
  <div class="problems-page">
    <div class="content-section">
      <div class="section-header">
        <div>
          <h1 class="section-title">Problems</h1>
          <p class="section-subtitle">Browse and solve coding problems to improve your skills</p>
        </div>
      </div>

      <!-- Quick Topic Filters Row -->
      <div v-if="topics.length > 0" class="topics-row-outer">
        <div class="topics-row-container" :class="{ expanded: isTopicsExtraExpanded }">
          <button
            v-for="topic in topics"
            :key="topic.id || topic.slug"
            class="topic-pill-btn"
            @click="router.push(`/topics/${topic.slug}`)"
          >
            {{ topic.name }}
          </button>
        </div>
        <button 
          v-if="topics.length > 8" 
          class="topics-expand-btn" 
          @click="isTopicsExtraExpanded = !isTopicsExtraExpanded"
        >
          {{ isTopicsExtraExpanded ? 'Show Less' : 'Show More' }}
          <ChevronDown :size="14" :style="{ transform: isTopicsExtraExpanded ? 'rotate(180deg)' : 'none' }" />
        </button>
      </div>

      <div class="table-controls">
        <div class="search-wrap">
          <Search class="search-icon" :size="16" />
          <input type="text" v-model="searchQuery" placeholder="Search problems" class="search-input" />
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
                <button class="control-btn" :class="{ active: hasActiveFilters }">
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
               
               <div class="filter-row">
                 <el-checkbox v-model="filters.topics.active" class="dark-checkbox" />
                 <span class="filter-label" :class="{ 'is-active': filters.topics.active }">
                   <Tag :size="14" /> Topics
                 </span>
                 <el-select v-model="filters.topics.operator" size="small" class="dark-select math-select" :disabled="!filters.topics.active" popper-class="dark-select-dropdown">
                   <el-option label="in" value="in" />
                 </el-select>
                 <el-popover
                   placement="right-start"
                   :width="280"
                   trigger="click"
                   popper-class="topic-popover filter-popover"
                   :hide-after="0"
                   :persistent="true"
                   :teleported="false"
                   @show="onTopicPopoverShow"
                 >
                   <template #reference>
                     <div class="topic-trigger" :class="{ 'is-inactive': !filters.topics.active }" @click.stop>
                       <span v-if="filters.topics.value.length === 0">Select</span>
                       <div v-else class="selected-topics-text">
                          {{ filters.topics.value[0] }}
                          <span v-if="filters.topics.value.length > 1" class="more-count">
                            +{{ filters.topics.value.length - 1 }}
                          </span>
                       </div>
                       <ChevronDown :size="14" class="topic-trigger-icon" />
                     </div>
                   </template>
                   <div class="topic-selector-content" @click.stop>
                     <div class="popover-search">
                       <Search class="search-icon" :size="14" />
                       <input 
                         ref="topicSearchInput"
                         type="text" 
                         v-model="topicSearchQuery" 
                         placeholder="search" 
                         class="search-input" 
                       />
                     </div>
                     <div class="topic-pills-container">
                       <button
                         v-for="topic in filteredTopicsList"
                         :key="topic.id || topic.name"
                         class="topic-pill"
                         :class="{ 'is-active': filters.topics.value.includes(topic.name) }"
                         @click="handleTopicToggle(topic.name)"
                       >
                         {{ topic.name }}
                       </button>
                       <div v-if="filteredTopicsList.length === 0" class="no-topics">No topics found</div>
                     </div>
                     <div class="topic-selector-footer">
                       <el-button link class="reset-filters" @click="resetTopicFilter">
                         <RotateCcw :size="14" style="margin-right: 6px;" /> Reset
                       </el-button>
                     </div>
                   </div>
                 </el-popover>
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
        
        <div class="spacer"></div>
        <div class="solved-count-container" v-if="authStore.isAuthenticated">
          <!-- Normal state: No filters -> Show progress ring -->
          <template v-if="!hasActiveFilters && !searchQuery">
            <div class="progress-ring">
              <svg viewBox="0 0 36 36" class="circular-chart">
                <path class="circle-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path class="circle"
                  :stroke-dasharray="`${progressPercent}, 100`"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>
            <span class="solved-text">Solved: {{ solvedCount }} / {{ problemStore.pagination.totalElements }}</span>
          </template>

          <!-- Filter state: Show total results -->
          <template v-else>
            <div class="results-badge">
              <Search :size="14" class="search-indicator" />
              <span class="results-count">Found: {{ problemStore.pagination.totalElements }} results</span>
            </div>
          </template>
        </div>
      </div>

      <TableSkeleton v-if="problemStore.loading && problems.length === 0" :columns="4" :rows="10" />

      <el-table 
        v-else 
        :data="problems" 
        class="dashboard-table leetcode-table" 
        v-loading="problemStore.loading" 
        :show-header="true"
      >
        <template #empty>
          <el-empty description="No problems found" />
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
            <span class="cell-title" @click="handleView(row)">{{ row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Rule Type" min-width="150" align="center">
          <template #default="{ row }">
             <span :class="['rule-type-text', getRuleTypeClass(row.ruleType)]">{{ row.ruleType }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Difficulty" min-width="150" align="center">
          <template #default="{ row }">
             <span :class="['difficulty-text', getDifficultyClass(row.difficulty)]">{{ !row.difficulty ? '' : row.difficulty.toUpperCase() === 'EASY' ? 'Easy' : row.difficulty.toUpperCase() === 'MEDIUM' ? 'Med' : 'Hard' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Score" min-width="150" align="center">
          <template #default="{ row }">
             <span :class="['score-text']">{{ row.totalScore }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Accepted rate" min-width="150" align="center">
          <template #default="{ row }">
            <span class="cell-index">{{ ((row.acceptedCount / row.submissionCount) * 100).toFixed(2) }}%</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- Generic Pagination -->
      <DarkPagination
        v-if="problemStore.pagination.totalElements > 0"
        :current-page="pagination.page"
        :page-size="pagination.size"
        :total="problemStore.pagination.totalElements"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.problems-page {
  min-height: calc(100vh - 60px);
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
.solved-count-container {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.03);
  padding: 6px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.progress-ring {
  width: 18px;
  height: 18px;
}

.circular-chart {
  display: block;
  margin: 0 auto;
  max-width: 100%;
  max-height: 100%;
}

.circle-bg {
  fill: none;
  stroke: #3e3e3e;
  stroke-width: 3.8;
}

.circle {
  fill: none;
  stroke: #00b8a3;
  stroke-width: 3.8;
  stroke-linecap: round;
  transition: stroke-dasharray 0.5s ease;
}

.solved-text {
  color: #eff2f6;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.sort-btn.has-text {
  width: auto;
  padding: 0 16px;
  gap: 8px;
  border-radius: 20px;
}

.sort-text {
  font-size: 13px;
  font-weight: 500;
}

.custom-sort-menu .el-dropdown-menu__item {
  padding: 0 12px;
}

.sort-footer {
  padding: 8px 12px 4px 12px;
  border-top: 1px solid #3e3e3e;
  margin-top: 4px;
}

.sort-menu-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 140px;
  width: 100%;
}
.sort-indicator {
  color: var(--accent-primary);
  margin-left: 12px;
}

/* LeetCode Table CSS Override */
:deep(.leetcode-table) {
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
}
:deep(.leetcode-table .el-table__inner-wrapper::before) {
  display: none;
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
}
/* Updated Zebra Backgrounds */
:deep(.leetcode-table tr:nth-child(even) td.el-table__cell) {
  background: rgba(255, 255, 255, 0.03) !important;
}
:deep(.leetcode-table tr:hover td.el-table__cell) {
  background: rgba(255, 255, 255, 0.08) !important;
}
:deep(.leetcode-table .cell-index) {
  font-weight: 500;
  color: #8a8a8a;
  font-size: 13px;
}
:deep(.leetcode-table .cell-title) {
  font-size: 14px;
  font-weight: 500;
  color: #eff2f6;
  transition: color 0.2s;
  cursor: pointer;
}
:deep(.leetcode-table tr:hover .cell-title) {
  color: var(--accent-primary);
}
:deep(.leetcode-table .difficulty-text) {
  font-weight: 500;
  font-size: 13px;
  display: inline-block;
  white-space: nowrap;
}
:deep(.leetcode-table .score-text) {
  font-weight: 500;
  font-size: 13px;
  display: inline-block;
  white-space: nowrap;
  background: transparent !important; 
  color: #07c511 !important; 
  padding: 0;
}
:deep(.leetcode-table .difficulty-easy) { background: transparent !important; color: #00b8a3 !important; padding: 0; }
:deep(.leetcode-table .difficulty-medium) { background: transparent !important; color: #ffc01e !important; padding: 0; }
:deep(.leetcode-table .difficulty-hard) { background: transparent !important; color: #ef4743 !important; padding: 0; }


:deep(.leetcode-table .rule-type-text) {
  font-weight: 500;
  font-size: 13px;
  display: inline-block;
  white-space: nowrap;
}

:deep(.leetcode-table .rule-type-oi) { background: transparent !important; color: #2cbb5d !important; padding: 0; }
:deep(.leetcode-table .rule-type-acm) { background: transparent !important; color: #ffa116 !important; padding: 0; }

.solved-icon {
  color: #2cbb5d;
  font-weight: bold;
}

/* Topic Tags */
.topic-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.topic-tag {
  background: rgba(255,255,255,0.08); /* Matches .status-draft essentially */
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  color: #8a8a8a;
}
</style>

<style>
/* Global Filter Popover Styles */
.filter-popover.el-popper {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
  padding: 0 !important;
  border-radius: 8px !important;
  color: #eff2f6 !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
  width: 350px !important; /* Sweet spot width */
  min-width: 310px !important;
}
.filter-popover.el-popper .el-popper__arrow::before {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
}

.filter-content {
  display: flex;
  flex-direction: column;
}
.filter-header {
  padding: 12px 16px;
  border-bottom: 1px solid #3e3e3e;
  font-size: 14px;
  font-weight: 600;
  color: #eff2f6;
  display: flex;
  align-items: center;
  gap: 8px;
}
.filter-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px; /* Back to original comfortable gap */
  margin-bottom: 0 !important;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px; /* Standard gap */
}

.dark-checkbox {
  --el-checkbox-checked-bg-color: var(--accent-primary);
  --el-checkbox-checked-input-border-color: var(--accent-primary);
}
.dark-checkbox .el-checkbox__inner {
  background-color: #333;
  border-color: #5c5c5c;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 90px;
  color: #8a8a8a;
  font-size: 13px;
  flex-shrink: 0;
  transition: color 0.2s;
}
.filter-label.is-active {
  color: var(--accent-primary) !important;
}

/* Base Select styling for filters */
.dark-select .el-input__wrapper {
  background-color: #333 !important;
  box-shadow: 0 0 0 1px #3e3e3e inset !important;
  border-radius: 6px;
}
.dark-select .el-input__wrapper.is-focus {
  box-shadow: 0 0 0 1px #5c5c5c inset !important;
}
.dark-select .el-input__inner {
  color: #eff2f6 !important;
  font-size: 13px;
}
.dark-select .el-input__suffix .el-select__caret {
  color: #8a8a8a;
}
.dark-select.is-disabled .el-input__wrapper {
  background-color: #282828 !important;
  box-shadow: 0 0 0 1px #333 inset !important;
  border-radius: 6px;
}
.dark-select.is-disabled .el-input__inner {
  color: #5c5c5c !important;
}

.math-select {
  width: 65px;
  flex-shrink: 0;
}
.value-select {
  flex: 1;
  min-width: 0;
}

/* Global Select Dropdown Styling */
.dark-select-dropdown {
  background-color: #282828 !important;
  border: 1px solid #3e3e3e !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
}
.dark-select-dropdown .el-select-dropdown__item {
  color: #eff2f6 !important;
  padding: 0 12px;
}
.dark-select-dropdown .el-select-dropdown__item.is-selected {
  color: var(--accent-primary) !important;
  background-color: rgba(255, 161, 22, 0.1) !important;
  font-weight: 600;
}
.dark-select-dropdown .el-select-dropdown__item.is-hovering {
  background-color: #333 !important;
}
.dark-select-dropdown .el-popper__arrow::before {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
}

.filter-footer {
  padding: 12px 16px;
  border-top: 1px solid #3e3e3e;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.reset-filters {
  color: #8a8a8a !important;
  font-size: 13px;
}
.reset-filters:hover {
  color: #eff2f6 !important;
}

/* Custom Topic Selector UI */
.topic-trigger {
  flex: 1;
  min-width: 0; /* Let flex handle it */
  height: 24px;
  background-color: #333;
  box-shadow: 0 0 0 1px #3e3e3e inset;
  border-radius: 6px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  color: #eff2f6;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
}
.topic-trigger .topic-trigger-icon {
  margin-left: auto;
  color: #8a8a8a;
  flex-shrink: 0;
}
.topic-trigger:not(.is-disabled):hover {
  box-shadow: 0 0 0 1px #5c5c5c inset;
}
.topic-trigger.is-inactive {
  background-color: #282828;
  box-shadow: 0 0 0 1px #333 inset;
  color: #5c5c5c;
  cursor: pointer; /* Cho phép click để mở popover kể cả khi filter chưa active */
}
.selected-topics-text {
  color: var(--accent-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: 105px;
}
.more-count {
  font-size: 11px;
  background: rgba(255, 161, 22, 0.2);
  padding: 0 4px;
  border-radius: 4px;
  color: var(--accent-primary);
}

.topic-popover {
  padding: 0 !important; /* Managed by topic-selector-content */
}
.topic-selector-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px; /* Consistency with other filters */
}
.popover-search {
  position: relative;
  display: flex;
  align-items: center;
}
.popover-search .search-icon {
  position: absolute;
  left: 12px;
  color: #8a8a8a;
}
.popover-search .search-input {
  background-color: #333;
  border: 1px solid transparent;
  border-radius: 20px;
  padding: 6px 12px 6px 32px;
  color: #eff2f6;
  font-size: 13px;
  width: 100%;
  outline: none;
  transition: all 0.2s;
}
.popover-search .search-input:focus {
  border-color: #5c5c5c;
}
.popover-search .search-input::placeholder {
  color: #8a8a8a;
}
.topic-pills-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding-right: 4px;
}
/* Scrollbar for pills */
.topic-pills-container::-webkit-scrollbar {
  width: 6px;
}
.topic-pills-container::-webkit-scrollbar-thumb {
  background-color: #444;
  border-radius: 3px;
}
.topic-pill {
  background: #3e3e3e;
  border: 1px solid transparent;
  color: #eff2f6;
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.topic-pill:hover {
  background: #4a4a4a;
}
.topic-pill.is-active {
  background: rgba(255, 161, 22, 0.1);
  color: var(--accent-primary);
  border-color: rgba(255, 161, 22, 0.3);
}
.no-topics {
  color: #8a8a8a;
  font-size: 12px;
  padding: 8px 4px;
  font-style: italic;
  width: 100%;
  text-align: center;
}
.topic-selector-footer {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #3e3e3e;
  padding-top: 8px;
}

/* Topics Row Above Table */
.topics-row-outer {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(255, 255, 255, 0.03);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.topics-row-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  height: 34px; /* Default one row */
  overflow: hidden;
  transition: height 0.3s ease-in-out;
}

.topics-row-container.expanded {
  height: auto;
  max-height: 200px;
  overflow-y: auto;
}

.topic-pill-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #a0a0a0;
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.topic-pill-btn:hover {
  background: rgba(255, 161, 22, 0.1);
  color: var(--accent-primary);
  border-color: rgba(255, 161, 22, 0.3);
}

.topics-expand-btn {
  background: transparent;
  border: none;
  color: #8a8a8a;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  width: fit-content;
}

.topics-expand-btn:hover {
  color: #fff;
}

.results-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 161, 22, 0.1);
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid rgba(255, 161, 22, 0.2);
}
.search-indicator {
  color: var(--accent-primary);
}
.results-count {
  color: #eff2f6;
  font-size: 13px;
  font-weight: 500;
}
</style>
