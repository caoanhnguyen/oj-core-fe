<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search, ArrowUpDown, ArrowDownWideNarrow, ArrowUpNarrowWide, Filter, Gauge, Tag, RotateCcw, ChevronDown, CheckCircle, Check, LayoutGrid } from 'lucide-vue-next'
import { useProblemStore } from '@/stores/problem'
import { useTopicStore } from '@/stores/topic'
import { useAuthStore } from '@/stores/auth'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import TableControls from '@/components/common/TableControls.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import DarkPagination from '@/components/common/DarkPagination.vue'
import DataTable from '@/components/common/DataTable.vue'
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

// Configs for TableControls
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

onMounted(async () => {
  await Promise.all([
    fetchProblemsData(),
    topicStore.fetchTopics(''), // Fetch all topics
    fetchSolvedCount()
  ])
})
</script>

<template>
  <div class="public-layout-page">
    <div class="public-layout-container">
      <PageHeader 
        title="Problems" 
        subtitle="Browse and solve coding problems to improve your skills"
      />

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

      <TableControls
        v-model="searchQuery"
        search-placeholder="Search problems..."
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
      >
        <template #custom-filters>
           <div class="filter-row">
             <el-checkbox v-model="filters.topics.active" class="dark-checkbox" />
             <span class="filter-label" :class="{ 'is-active': filters.topics.active }">
               <Tag :size="14" /> Topics
             </span>
             <el-popover
               placement="right-start"
               :width="280"
               trigger="click"
               popper-class="topic-popover filter-popover"
               :hide-after="0"
               :persistent="true"
               :teleported="false"
               :disabled="!filters.topics.active"
               @show="onTopicPopoverShow"
             >
               <template #reference>
                  <div style="position: relative; flex: 1; min-width: 0;">
                    <el-select
                      size="small"
                      class="dark-select value-select"
                      :disabled="!filters.topics.active"
                      :model-value="filters.topics.value.length ? (filters.topics.value.length === 1 ? filters.topics.value[0] : `${filters.topics.value[0]} +${filters.topics.value.length - 1}`) : ''"
                      placeholder="Select"
                      style="width: 100%; pointer-events: none;"
                    />
                    <div 
                      :style="{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: filters.topics.active ? 'pointer' : 'not-allowed' }"
                    ></div>
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
        </template>
        <template #custom-total>
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
        </template>
      </TableControls>

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
        empty-text="No problems found"
      >
        <template #cell-solved="{ row }">
          <Check v-if="row.userProblemState === 'SOLVED'" :size="20" class="solved-icon" />
        </template>
        <template #cell-index="{ index }">
          <span class="cell-index">{{ (pagination.page - 1) * pagination.size + index + 1 }}</span>
        </template>
        <template #cell-title="{ row }">
          <span class="cell-title" @click="handleView(row)">{{ row.title }}</span>
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
          <span class="cell-index">{{ ((row.acceptedCount / row.submissionCount) * 100 || 0).toFixed(2) }}%</span>
        </template>
      </DataTable>

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

/* Custom Topic Selector UI */

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
