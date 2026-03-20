<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { FileText, Search, ArrowUpDown, ArrowDownWideNarrow, ArrowUpNarrowWide, Filter, Gauge, Tag, Code2, Minus, Plus, LayoutGrid, RotateCcw, Calendar, Edit, Trash2, CheckCircle, Eye, Lightbulb, ChevronDown, Send } from 'lucide-vue-next'
import { useProblemStore } from '@/stores/problem'
import { useTopicStore } from '@/stores/topic'
import { ElMessageBox } from 'element-plus'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import DarkPagination from '@/components/common/DarkPagination.vue'
import { debounce } from 'lodash'

const router = useRouter()
const problemStore = useProblemStore()
const topicStore = useTopicStore()

// Real problems data from store
const problems = computed(() => problemStore.problems)
const topics = computed(() => topicStore.topics)

// Search, Sort, Filter state
const searchQuery = ref('')
const topicSearchQuery = ref('')

const currentSortField = ref('') // initial empty matching image 1
const currentSortDirection = ref('DESC')

const filters = ref({
  status: { active: false, operator: 'is', value: '' },
  problemStatus: { active: false, operator: 'is', value: '' },
  difficulty: { active: false, operator: 'is', value: '' },
  ruleType: { active: false, operator: 'is', value: '' },
  topics: { active: false, operator: 'is', value: [] }
})

const pagination = ref({
  page: 1, // Store uses 0-based page, UI uses 1-based page
  size: 20
})

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
    status: { active: false, operator: 'is', value: '' },
    problemStatus: { active: false, operator: 'is', value: '' },
    difficulty: { active: false, operator: 'is', value: '' },
    ruleType: { active: false, operator: 'is', value: '' },
    topics: { active: false, operator: 'is', value: [] }
  }
}

const resetSort = () => {
  currentSortField.value = ''
  currentSortDirection.value = 'DESC'
  // Watcher will trigger fetch
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

// Fetch problems with BE filter/sort state
const fetchProblemsData = async () => {
  const queryParams = {
    page: pagination.value.page - 1, // Convert layout 1-based to BE 0-based
    size: pagination.value.size
  }
  
  if (currentSortField.value) {
    queryParams.sort = `${currentSortField.value},${currentSortDirection.value}`
  }

  if (searchQuery.value) queryParams.keyword = searchQuery.value
  
  if (filters.value.status.active && filters.value.status.value) {
    queryParams.status = filters.value.status.value
  }
  
  if (filters.value.problemStatus.active && filters.value.problemStatus.value) {
    queryParams.problemStatus = filters.value.problemStatus.value
  }
  
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

  await problemStore.fetchProblems(queryParams, false, true)
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

const filteredTopicsList = computed(() => {
  if (!topicSearchQuery.value) return topics.value
  const q = topicSearchQuery.value.toLowerCase()
  return topics.value.filter(t => t.name.toLowerCase().includes(q))
})

const handleTopicToggle = (topicName) => {
  const index = filters.value.topics.value.indexOf(topicName)
  if (index > -1) {
    filters.value.topics.value.splice(index, 1)
  } else {
    filters.value.topics.value.push(topicName)
  }
  filters.value.topics.active = true // Auto activate filter if they select a topic
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

const handleEdit = (row) => {
  router.push(`/dashboard/update-problem/${row.id}`)
}

const handleView = (row) => {
  router.push(`/problems/${row.slug}`)
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete "${row.title}"? This action cannot be undone.`,
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    await problemStore.deleteProblem(row.id)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete failed:', error)
    }
  }
}

const handleRestore = async (row) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to restore "${row.title}"?`,
      'Confirm Restore',
      {
        confirmButtonText: 'Restore',
        cancelButtonText: 'Cancel',
        type: 'info',
        confirmButtonClass: 'el-button--primary'
      }
    )
    await problemStore.restoreProblem(row.id)
  } catch(error) {
    if (error !== 'cancel') {
      console.error('Restore failed:', error)
    }
  }
}

const handlePublish = async (row) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to publish "${row.title}"?`,
      'Confirm Publish',
      {
        confirmButtonText: 'Publish',
        cancelButtonText: 'Cancel',
        type: 'info',
        confirmButtonClass: 'el-button--primary'
      }
    )
    await problemStore.publishProblem(row.id)
  } catch(error) {
    if (error !== 'cancel') {
      console.error('Publish failed:', error)
    }
  }
}

const handleAddProblem = () => {
  router.push('/dashboard/create-problem')
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
    topicStore.fetchTopics('') // Fetch all topics
  ])
})
</script>

<template>
  <div class="content-section">
    <div class="section-header">
      <div>
        <h1 class="section-title">Manage Problems</h1>
        <p class="section-subtitle">Create, edit, and manage coding problems</p>
      </div>
      <el-button type="primary" @click="handleAddProblem" class="add-button">
        <FileText :size="16" style="margin-right: 8px;" />
        Add Problem
      </el-button>
    </div>

    <div class="table-controls">
      <div class="search-wrap">
        <Search class="search-icon" :size="16" />
        <input type="text" v-model="searchQuery" placeholder="Search questions" class="search-input" />
      </div>
      
        <el-dropdown trigger="click" @command="handleSort" class="control-dropdown sort-dropdown">
          <span class="el-dropdown-link">
            <button class="control-btn sort-btn" :class="{ active: currentSortField, 'has-text': currentSortField }">
              <ArrowUpDown v-if="!currentSortField" :size="16" />
              <ArrowUpDown v-else-if="currentSortDirection === 'ASC'" :size="16" class="up-arrow" />
              <ArrowUpDown v-else :size="16" />
              <span v-if="currentSortField" class="sort-text">{{ currentSortField === 'difficulty' ? 'Difficulty' : 'Created Date' }}</span>
            </button>
          </span>
          <template #dropdown>
            <el-dropdown-menu class="dark-dropdown custom-sort-menu">
              <el-dropdown-item command="difficulty" :class="{ 'is-active': currentSortField === 'difficulty' }">
                <div class="sort-menu-content">
                  <span>Difficulty</span>
                  <ArrowDownWideNarrow v-if="currentSortField === 'difficulty' && currentSortDirection === 'DESC'" :size="16" class="sort-indicator" />
                  <ArrowUpNarrowWide v-if="currentSortField === 'difficulty' && currentSortDirection === 'ASC'" :size="16" class="sort-indicator" />
                </div>
              </el-dropdown-item>
              <el-dropdown-item command="createdDate" :class="{ 'is-active': currentSortField === 'createdDate' }">
                <div class="sort-menu-content">
                  <span>Created Date</span>
                  <ArrowDownWideNarrow v-if="currentSortField === 'createdDate' && currentSortDirection === 'DESC'" :size="16" class="sort-indicator" />
                  <ArrowUpNarrowWide v-if="currentSortField === 'createdDate' && currentSortDirection === 'ASC'" :size="16" class="sort-indicator" />
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
        :width="450"
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
               <el-checkbox v-model="filters.status.active" class="dark-checkbox" />
               <span class="filter-label" :class="{ 'is-active': filters.status.active }">
                 <CheckCircle :size="14" /> Status
               </span>
               <el-select v-model="filters.status.operator" size="small" class="dark-select math-select" :disabled="!filters.status.active" popper-class="dark-select-dropdown">
                 <el-option label="is" value="is" />
               </el-select>
               <el-select v-model="filters.status.value" size="small" class="dark-select value-select" :disabled="!filters.status.active" popper-class="dark-select-dropdown">
                  <el-option label="Active" value="ACTIVE" />
                  <el-option label="Deleted" value="DELETED" />
               </el-select>
             </div>

             <div class="filter-row">
               <el-checkbox v-model="filters.problemStatus.active" class="dark-checkbox" />
               <span class="filter-label" :class="{ 'is-active': filters.problemStatus.active }">
                 <CheckCircle :size="14" /> Visibility
               </span>
               <el-select v-model="filters.problemStatus.operator" size="small" class="dark-select math-select" :disabled="!filters.problemStatus.active" popper-class="dark-select-dropdown">
                 <el-option label="is" value="is" />
               </el-select>
               <el-select v-model="filters.problemStatus.value" size="small" class="dark-select value-select" :disabled="!filters.problemStatus.active" popper-class="dark-select-dropdown">
                  <el-option label="Published" value="PUBLISHED" />
                  <el-option label="Draft" value="DRAFT" />
               </el-select>
             </div>
             
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
               >
                 <template #reference>
                   <div class="topic-trigger" :class="{ 'is-disabled': !filters.topics.active }" @click.stop>
                     <span v-if="filters.topics.value.length === 0">Select</span>
                     <span v-else class="selected-topics-text">{{ filters.topics.value.join(', ') }}</span>
                     <ChevronDown :size="14" class="topic-trigger-icon" />
                   </div>
                 </template>
                 <div class="topic-selector-content" @click.stop>
                   <div class="popover-search">
                     <Search class="search-icon" :size="14" />
                     <input type="text" v-model="topicSearchQuery" placeholder="search" class="search-input" />
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
      <div class="solved-count">
         <div class="circle-progress"></div>
         <span>{{ problemStore.pagination.totalElements || 0 }} Problems</span>
      </div>
    </div>

    <TableSkeleton v-if="problemStore.loading && problems.length === 0" :columns="6" :rows="10" />

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

      <el-table-column label="#" width="60" align="center">
        <template #default="{ $index }">
          <span class="cell-index">{{ (pagination.page - 1) * pagination.size + $index + 1 }}</span>
        </template>
      </el-table-column>
      <el-table-column label="ID" width="300">
        <template #default="{ row }">
          <span class="cell-id">{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Title" min-width="300">
        <template #default="{ row }">
          <span class="cell-title" @click="handleView(row)">{{ row.title }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Created Date" width="120" align="center">
        <template #default="{ row }">
          <span class="cell-date">{{ formatDate(row.createdDate) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Difficulty" width="100" align="center">
        <template #default="{ row }">
           <span :class="['difficulty-text', getDifficultyClass(row.difficulty)]">{{ !row.difficulty ? '' : row.difficulty.toUpperCase() === 'EASY' ? 'Easy' : row.difficulty.toUpperCase() === 'MEDIUM' ? 'Med' : 'Hard' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Status" width="100" align="center">
        <template #default="{ row }">
          <span :class="['status-badge', row.status === 'DELETED' ? 'status-deleted' : 'status-active']">
            {{ row.status }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="Visibility" width="150" align="center">
        <template #default="{ row }">
          <span :class="['status-badge', row.problemStatus === 'PUBLISHED' ? 'status-active' : 'status-draft']">
            {{ row.problemStatus }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="140" align="center" fixed="right">
        <template #default="{ row }">
          <div class="action-buttons" v-if="row.status === 'DELETED'">
            <el-tooltip content="Restore Problem" placement="top" effect="dark" :hide-after="0" :show-after="200">
              <el-button link :icon="RotateCcw" @click="handleRestore(row)" class="action-btn action-restore" />
            </el-tooltip>
          </div>
          <div class="action-buttons" v-else>
            <el-tooltip content="View Problem" placement="top" effect="dark" :hide-after="0" :show-after="200">
              <el-button link :icon="Eye" @click="handleView(row)" class="action-btn action-view" />
            </el-tooltip>
            <el-tooltip content="Edit Problem" placement="top" effect="dark" :hide-after="0" :show-after="200">
              <el-button link :icon="Edit" @click="handleEdit(row)" class="action-btn" />
            </el-tooltip>
            <el-tooltip v-if="row.problemStatus === 'DRAFT'" content="Publish Problem" placement="top" effect="dark" :hide-after="0" :show-after="200">
              <el-button link :icon="Send" @click="handlePublish(row)" class="action-btn action-publish" />
            </el-tooltip>
            <el-tooltip v-else content="Delete Problem" placement="top" effect="dark" :hide-after="0" :show-after="200">
              <el-button link :icon="Trash2" @click="handleDelete(row)" class="action-btn action-danger" />
            </el-tooltip>
          </div>
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
</template>

<style scoped>
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

/* Add Button */
.add-button {
  background: var(--accent-primary) !important;
  border-color: var(--accent-primary) !important;
  color: #000 !important;
  font-weight: 600;
}

.add-button:hover {
  background: #ff8800 !important;
  border-color: #ff8800 !important;
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
:deep(.leetcode-table tr:nth-child(odd) td.el-table__cell) {
  background: rgba(255, 255, 255, 0.05) !important;
}
:deep(.leetcode-table tr:hover td.el-table__cell) {
  background: rgba(255, 255, 255, 0.1) !important;
}
:deep(.leetcode-table .cell-index) {
  font-weight: 500;
  color: #8a8a8a;
  font-size: 13px;
}
:deep(.leetcode-table .cell-id) {
  color: #8a8a8a;
  font-weight: 500;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
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
:deep(.leetcode-table .cell-date) {
  font-size: 13px;
  color: #8a8a8a;
}
:deep(.leetcode-table .difficulty-text) {
  font-weight: 500;
  font-size: 13px;
  display: inline-block;
  white-space: nowrap;
}
:deep(.leetcode-table .difficulty-easy) { background: transparent !important; color: #00b8a3 !important; padding: 0; }
:deep(.leetcode-table .difficulty-medium) { background: transparent !important; color: #ffc01e !important; padding: 0; }
:deep(.leetcode-table .difficulty-hard) { background: transparent !important; color: #ef4743 !important; padding: 0; }

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}
.status-active {
  background: rgba(0, 184, 163, 0.1);
  color: #00b8a3;
}
.status-deleted {
  background: rgba(239, 71, 67, 0.1);
  color: #ef4743;
}
.status-draft {
  background: rgba(138, 138, 138, 0.1);
  color: #8a8a8a;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: var(--spacing-xs);
  justify-content: center;
}

:deep(.action-btn) {
  padding: 6px;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

:deep(.action-btn:hover) {
  color: var(--accent-primary);
  background: rgba(255, 161, 22, 0.1);
}

:deep(.action-btn.action-view:hover) {
  color: #0088ff;
  background: rgba(0, 136, 255, 0.1);
}

:deep(.action-btn.action-danger:hover) {
  color: var(--error);
  background: rgba(239, 71, 67, 0.1);
}

:deep(.action-btn.action-publish:hover) {
  color: #2cbb5d;
  background: rgba(44, 187, 93, 0.1);
}

/* Responsive */
@media (max-width: 768px) {
  .content-section {
    padding: var(--spacing-lg);
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

.up-arrow {
  transform: rotate(180deg);
}

:deep(.action-btn.action-restore:hover) {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}
</style>

<style>
/* Global Popover Styles placed here to apply globally for UI components appended to body */
.filter-popover.el-popper {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
  padding: 0 !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
  color: #eff2f6 !important;
  width: 450px !important;
  min-width: 310px !important;
}
.filter-popover.el-popper .el-popper__arrow::before {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
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
  gap: 16px;
  margin-bottom: 0 !important;
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
  width: 110px;
  color: #8a8a8a;
  font-size: 13px;
  transition: color 0.2s;
}
.filter-label.is-active {
  color: var(--accent-primary) !important;
}
.remove-filter {
  color: #5c5c5c;
  cursor: pointer;
}
.remove-filter:hover { color: #eff2f6; }
.add-filter-row {
  display: flex;
  padding-top: 4px;
}
.add-filter-icon {
  color: #8a8a8a;
  cursor: pointer;
}
.add-filter-icon:hover { color: #eff2f6; }
.filter-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #3e3e3e;
  padding-top: 12px;
  margin-top: 16px;
}
.save-smart-list { color: #a470cd !important; font-size: 13px; }
.save-smart-list:hover { color: #c090e5 !important; }
.reset-filters { color: #eff2f6 !important; font-size: 13px; }
.reset-filters:hover { color: #fff !important; }

.dark-select.match-select { width: 80px; }
.dark-select.math-select { width: 75px; }
.dark-select.value-select { width: 110px; flex: 1; }
/* V2 style wrappers */
.dark-select .el-input__wrapper,
.dark-select .el-select__wrapper {
  background-color: #333 !important;
  box-shadow: 0 0 0 1px #3e3e3e inset !important;
  border-radius: 6px;
}
.dark-select .el-input__inner,
.dark-select .el-select__placeholder { color: #eff2f6 !important; }
.dark-select.el-select:hover:not(.is-disabled) .el-input__wrapper,
.dark-select.el-select:hover:not(.is-disabled) .el-select__wrapper { box-shadow: 0 0 0 1px #5c5c5c inset !important; }
.dark-select.el-select .el-input.is-focus .el-input__wrapper,
.dark-select.el-select .el-select__wrapper.is-focused,
.dark-select.el-select:has(.el-select__wrapper.is-focused) .el-select__wrapper { box-shadow: 0 0 0 1px var(--accent-primary) inset !important; }

/* Disabled states */
.dark-select .el-input.is-disabled .el-input__wrapper,
.dark-select .el-select__wrapper.is-disabled {
  background-color: #282828 !important;
  box-shadow: 0 0 0 1px #333 inset !important;
}
.dark-select .el-input.is-disabled .el-input__inner,
.dark-select .el-select__wrapper.is-disabled .el-select__placeholder {
  color: #5c5c5c !important;
  -webkit-text-fill-color: #5c5c5c !important;
}
.dark-checkbox .el-checkbox__inner {
  background-color: transparent !important;
  border-color: #5c5c5c !important;
  border-radius: 4px;
}
.dark-checkbox.is-checked .el-checkbox__inner { background-color: transparent !important; border-color: #5c5c5c !important; }
.dark-checkbox.is-checked .el-checkbox__inner::after { border-color: #8a8a8a !important; }

.dark-dropdown {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
}
.dark-dropdown .el-dropdown-menu__item {
  color: #eff2f6 !important;
}
.dark-dropdown .el-dropdown-menu__item:hover,
.dark-dropdown .el-dropdown-menu__item.is-active {
  background-color: #333 !important;
  color: var(--accent-primary) !important;
}
.dark-dropdown.el-popper .el-popper__arrow::before {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
}

/* Combobox (Select) Dropdowns */
.dark-select-dropdown.el-popper {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
}
.dark-select-dropdown .el-select-dropdown__item {
  color: #eff2f6 !important;
}
.dark-select-dropdown .el-select-dropdown__item.hover, 
.dark-select-dropdown .el-select-dropdown__item:hover {
  background-color: #333 !important;
  color: var(--accent-primary) !important;
}
.dark-select-dropdown .el-select-dropdown__item.selected {
  color: var(--accent-primary) !important;
  background-color: transparent !important;
  font-weight: 600;
}
.dark-select-dropdown.el-popper .el-popper__arrow::before {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
}

/* Custom Topic Selector UI */
.topic-trigger {
  width: 110px;
  flex: 1;
  background-color: #333;
  box-shadow: 0 0 0 1px #3e3e3e inset;
  border-radius: 6px;
  height: 24px; /* match el-select small size */
  display: flex;
  align-items: center;
  padding: 0 8px; /* Slightly reduced padding */
  color: #eff2f6;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.topic-trigger .topic-trigger-icon {
  margin-left: auto;
  color: #8a8a8a;
  flex-shrink: 0;
}
.topic-trigger:not(.is-disabled):hover {
  box-shadow: 0 0 0 1px #5c5c5c inset;
}
.topic-trigger.is-disabled {
  background-color: #282828;
  box-shadow: 0 0 0 1px #333 inset;
  color: #5c5c5c;
  cursor: not-allowed;
  pointer-events: none;
}
.selected-topics-text {
  color: var(--accent-primary);
  overflow: hidden;
  text-overflow: ellipsis;
}

.topic-popover {
  padding: 12px !important;
}
.topic-selector-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  background: #5c5c5c;
}
.topic-pill.is-active {
  background: rgba(255, 161, 22, 0.1);
  color: var(--accent-primary);
  border-color: rgba(255, 161, 22, 0.3);
}
.no-topics {
  color: #8a8a8a;
  font-size: 12px;
  padding: 8px 0;
  text-align: center;
  width: 100%;
}
.topic-selector-footer {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #3e3e3e;
  padding-top: 8px;
  margin-top: 4px;
}
</style>
