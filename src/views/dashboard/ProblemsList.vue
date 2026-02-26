<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FileText, Search, ArrowUpDown, Filter, Gauge, Tag, Code2, Minus, Plus, LayoutGrid, RotateCcw, Calendar, Edit, Trash2, CheckCircle, Eye, Lightbulb } from 'lucide-vue-next'
import { useProblemStore } from '@/stores/problem'
import { ElMessageBox } from 'element-plus'

const router = useRouter()
const problemStore = useProblemStore()

// Real problems data from store
const problems = computed(() => problemStore.problems)

// Search, Sort, Filter state
const searchQuery = ref('')
const currentSort = ref('')
const filterMatch = ref('all')

const filters = ref({
  status: { active: false, operator: 'is', value: '' },
  difficulty: { active: false, operator: 'is', value: '' },
  topics: { active: false, operator: 'is', value: '' },
  language: { active: false, operator: 'is', value: '' }
})

const hasActiveFilters = computed(() => {
  return Object.values(filters.value).some(f => f.active && f.value !== '')
})

const resetFilters = () => {
  searchQuery.value = ''
  currentSort.value = ''
  filters.value = {
    status: { active: false, operator: 'is', value: '' },
    difficulty: { active: false, operator: 'is', value: '' },
    topics: { active: false, operator: 'is', value: '' },
    language: { active: false, operator: 'is', value: '' }
  }
}

const handleSort = (command) => {
  currentSort.value = currentSort.value === command ? '' : command
}

const filteredAndSortedProblems = computed(() => {
  let result = [...problems.value]
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(p => p.title.toLowerCase().includes(q) || p.id.toString().includes(q))
  }
  
  if (filters.value.difficulty.active && filters.value.difficulty.value) {
    result = result.filter(p => p.difficulty?.toUpperCase() === filters.value.difficulty.value.toUpperCase())
  }
  
  if (currentSort.value) {
    result.sort((a, b) => {
      if (currentSort.value === 'difficulty') {
        const order = { 'EASY': 1, 'MEDIUM': 2, 'HARD': 3, 'Easy': 1, 'Medium': 2, 'Hard': 3 }
        return (order[a.difficulty] || 0) - (order[b.difficulty] || 0)
      } else if (currentSort.value === 'created') {
        return new Date(b.createdDate || 0) - new Date(a.createdDate || 0)
      }
      return 0
    })
  }
  return result
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

const handleAddProblem = () => {
  router.push('/dashboard/create-problem')
}

onMounted(async () => {
  await problemStore.fetchProblems({ page: 0, size: 100 }) // Fetching a larger size for local filtering
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
      
      <el-dropdown trigger="click" @command="handleSort" class="control-dropdown">
        <span class="el-dropdown-link">
          <el-tooltip content="Sort problems" placement="top" effect="dark" :hide-after="0">
            <button class="control-btn" :class="{ active: currentSort }">
              <ArrowUpDown :size="16" />
            </button>
          </el-tooltip>
        </span>
        <template #dropdown>
          <el-dropdown-menu class="dark-dropdown">
            <el-dropdown-item command="difficulty" :class="{ 'is-active': currentSort === 'difficulty' }">Difficulty</el-dropdown-item>
            <el-dropdown-item command="created" :class="{ 'is-active': currentSort === 'created' }">Created Date</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-popover
        placement="bottom-start"
        :width="350"
        trigger="click"
        popper-class="filter-popover"
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
            <span>Match</span>
            <el-select v-model="filterMatch" size="small" class="dark-select match-select">
              <el-option label="All" value="all" />
              <el-option label="Any" value="any" />
            </el-select>
            <span>of the following filters:</span>
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
                  <el-option label="Published" value="published" />
                  <el-option label="Draft" value="draft" />
               </el-select>
               <Minus :size="14" class="remove-filter" />
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
               <Minus :size="14" class="remove-filter" />
             </div>
             
             <div class="filter-row">
               <el-checkbox v-model="filters.topics.active" class="dark-checkbox" />
               <span class="filter-label" :class="{ 'is-active': filters.topics.active }">
                 <Tag :size="14" /> Topics
               </span>
               <el-select v-model="filters.topics.operator" size="small" class="dark-select math-select" :disabled="!filters.topics.active" popper-class="dark-select-dropdown">
                 <el-option label="is" value="is" />
               </el-select>
               <el-select v-model="filters.topics.value" size="small" class="dark-select value-select" :disabled="!filters.topics.active" popper-class="dark-select-dropdown">
                  <el-option label="Array" value="Array" />
                  <el-option label="String" value="String" />
               </el-select>
               <Minus :size="14" class="remove-filter" />
             </div>
             
             <div class="filter-row">
               <el-checkbox v-model="filters.language.active" class="dark-checkbox" />
               <span class="filter-label" :class="{ 'is-active': filters.language.active }">
                 <Code2 :size="14" /> Language
               </span>
               <el-select v-model="filters.language.operator" size="small" class="dark-select math-select" :disabled="!filters.language.active" popper-class="dark-select-dropdown">
                 <el-option label="is" value="is" />
               </el-select>
               <el-select v-model="filters.language.value" size="small" class="dark-select value-select" :disabled="!filters.language.active" popper-class="dark-select-dropdown">
                  <el-option label="C++" value="cpp" />
                  <el-option label="Java" value="java" />
                  <el-option label="Python" value="python" />
               </el-select>
               <Minus :size="14" class="remove-filter" />
             </div>
          </div>

          <div class="filter-footer">
            <div class="spacer"></div>
            <el-button link class="reset-filters" @click="resetFilters">
              <RotateCcw :size="14" style="margin-right: 6px;" /> Reset
            </el-button>
          </div>
        </div>
      </el-popover>
      
      <div class="spacer"></div>
      <div class="solved-count">
         <div class="circle-progress"></div>
         <span>{{ filteredAndSortedProblems.length }}/{{ problems.length || 0 }} Managed</span>
      </div>
    </div>

    <el-table :data="filteredAndSortedProblems" class="dashboard-table leetcode-table" v-loading="problemStore.loading" :show-header="false">
      <el-table-column width="60" align="center">
        <template #default="{ $index }">
          <span class="cell-index">{{ $index + 1 }}</span>
        </template>
      </el-table-column>
      <el-table-column width="280">
        <template #default="{ row }">
          <span class="cell-id">{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column min-width="400">
        <template #default="{ row }">
          <span class="cell-title" @click="handleView(row)">{{ row.title }}</span>
        </template>
      </el-table-column>
      <el-table-column width="140" align="center">
        <template #default="{ row }">
          <span class="cell-date">{{ formatDate(row.createdDate) }}</span>
        </template>
      </el-table-column>
      <el-table-column width="100" align="center">
        <template #default="{ row }">
           <span :class="['difficulty-text', getDifficultyClass(row.difficulty)]">{{ !row.difficulty ? '' : row.difficulty.toUpperCase() === 'EASY' ? 'Easy' : row.difficulty.toUpperCase() === 'MEDIUM' ? 'Med.' : 'Hard' }}</span>
        </template>
      </el-table-column>
      <el-table-column width="160" align="center" fixed="right">
        <template #default="{ row }">
          <div class="action-buttons">
            <el-tooltip content="View Problem" placement="top" effect="dark" :hide-after="0" :show-after="200">
              <el-button link :icon="Eye" @click="handleView(row)" class="action-btn action-view" />
            </el-tooltip>
            <el-tooltip content="Edit Problem" placement="top" effect="dark" :hide-after="0" :show-after="200">
              <el-button link :icon="Edit" @click="handleEdit(row)" class="action-btn" />
            </el-tooltip>
            <el-tooltip content="Delete Problem" placement="top" effect="dark" :hide-after="0" :show-after="200">
              <el-button link :icon="Trash2" @click="handleDelete(row)" class="action-btn action-danger" />
            </el-tooltip>
          </div>
        </template>
      </el-table-column>
    </el-table>
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

/* LeetCode Table CSS Override */
:deep(.leetcode-table) {
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
}
:deep(.leetcode-table .el-table__inner-wrapper::before) {
  display: none;
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
</style>

<style>
/* Global Popover Styles placed here to apply globally for UI components appended to body */
.filter-popover.el-popper {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
  padding: 16px !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
  color: #eff2f6 !important;
}
.filter-popover.el-popper .el-popper__arrow::before {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
}

.filter-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #eff2f6;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 16px;
}
.filter-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}
.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.filter-label {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 90px;
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
.dark-select.math-select { width: 60px; }
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
</style>
