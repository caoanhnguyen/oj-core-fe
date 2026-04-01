<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSubmissionStore } from '@/stores/submission'
import { useAuthStore } from '@/stores/auth'
import { handleApiError } from '@/utils/errorHandler'
import { Search, ArrowUpDown, ArrowDownWideNarrow, ArrowUpNarrowWide, Filter, RotateCcw, ChevronDown, CheckCircle, Eye } from 'lucide-vue-next'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import DarkPagination from '@/components/common/DarkPagination.vue'
import { debounce } from 'lodash'

const router = useRouter()
const submissionStore = useSubmissionStore()
const authStore = useAuthStore()

const loading = ref(false)
const submissions = ref([])
const totalElements = ref(0)

const pagination = ref({
  page: 1,
  size: 20
})

// Search, Sort, Filter state
const searchQuery = ref('')
const currentSortField = ref('')
const currentSortDirection = ref('DESC')

const filters = ref({
  verdict: { active: false, operator: 'is', value: '' },
  viewMode: { active: false, operator: 'is', value: 'all' }
})

const hasActiveFilters = computed(() => {
  return (filters.value.verdict.active && filters.value.verdict.value) ||
         (authStore.isAuthenticated && filters.value.viewMode.active && filters.value.viewMode.value === 'mine')
})

const allVerdictOptions = [
  { label: 'Accepted (AC)', value: 'AC' },
  { label: 'Wrong Answer (WA)', value: 'WA' },
  { label: 'Time Limit Exceeded (TLE)', value: 'TLE' },
  { label: 'Memory Limit Exceeded (MLE)', value: 'MLE' },
  { label: 'Runtime Error (RE)', value: 'RE' },
  { label: 'Compile Error (CE)', value: 'CE' },
  // Admin/Moderator only:
  { label: 'System Error (SE)', value: 'SE', adminOnly: true },
  { label: 'Pending', value: 'PENDING', adminOnly: true }
]

const verdictOptions = computed(() => {
  return allVerdictOptions.filter(o => !o.adminOnly || authStore.isAdminOrMod)
})

const getVerdictType = (verdict) => {
  switch (verdict) {
    case 'AC': return 'success'
    case 'WA': return 'danger'
    case 'TLE': case 'MLE': return 'warning'
    case 'RE': case 'SE': case 'CE': return 'danger'
    default: return 'info'
  }
}

const getVerdictColor = (verdict) => {
  switch (verdict) {
    case 'AC': return '#2cbb5d'
    case 'WA': case 'RE': case 'SE': case 'CE': return '#ef4743'
    case 'TLE': case 'MLE': return '#ffa116'
    case 'PENDING': return '#8a8a8a'
    default: return '#8a8a8a'
  }
}

const loadSubmissions = async () => {
  loading.value = true
  try {
    const params = {
      page: Math.max(0, pagination.value.page - 1),
      size: pagination.value.size,
      sort: currentSortField.value
        ? `${currentSortField.value},${currentSortDirection.value}`
        : 'createdDate,desc'
    }

    if (filters.value.verdict.active && filters.value.verdict.value) {
      params.submissionVerdict = filters.value.verdict.value
    }

    if (searchQuery.value) {
      params.keyword = searchQuery.value
    }

    let response
    const isMine = filters.value.viewMode.active && filters.value.viewMode.value === 'mine'

    if (isMine && authStore.user?.id) {
      params.userId = authStore.user.id
    }

    if (authStore.isAdminOrMod) {
      // Admin/Mod: Luôn sử dụng endpoint admin để có đầy đủ thông tin (PENDING, SE, v.v.)
      response = await submissionStore.getAllSubmissions(params)
    } else {
      // User thường: Sử dụng endpoint công khai
      response = await submissionStore.getSubmissions(params)
    }

    submissions.value = response.content || []
    totalElements.value = response.totalElements || 0

  } catch (error) {
    // Bỏ qua lỗi 401/403 - chỉ log các lỗi thực sự
    const status = error.response?.status
    if (status !== 401 && status !== 403) {
      handleApiError(error, 'Lỗi khi tải danh sách bài nộp')
    }
  } finally {
    loading.value = false
  }
}

const debouncedFetch = debounce(loadSubmissions, 400)

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
  filters.value.verdict = { active: false, operator: 'is', value: '' }
  filters.value.viewMode = { active: false, operator: 'is', value: 'all' }
  searchQuery.value = ''
}

const handlePageChange = (val) => {
  pagination.value.page = val
  loadSubmissions()
}

const handleSizeChange = (val) => {
  pagination.value.size = val
  pagination.value.page = 1
  loadSubmissions()
}

const canViewDetail = (row) => {
  return authStore.isAdminOrMod || (authStore.isAuthenticated && row.userId === authStore.user?.id)
}

const viewDetail = (row) => {
  if (canViewDetail(row)) {
    router.push(`/submissions/${row.submissionId}`)
  }
}

const rowClassName = ({ row }) => {
  return canViewDetail(row) ? 'clickable-row' : 'disabled-row'
}

watch(searchQuery, () => {
  pagination.value.page = 1
  debouncedFetch()
})

watch([currentSortField, currentSortDirection], () => {
  pagination.value.page = 1
  debouncedFetch()
})

watch(filters, () => {
  pagination.value.page = 1
  debouncedFetch()
}, { deep: true })

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('vi-VN')
}

onMounted(() => {
  loadSubmissions()
})
</script>

<template>
  <div class="content-section">
    <div class="section-header">
      <div>
        <h1 class="section-title">Danh sách Bài nộp</h1>
        <p class="section-subtitle">Theo dõi tất cả lần nộp bài trên hệ thống</p>
      </div>
    </div>

    <div class="table-controls">
      <div class="search-wrap">
        <Search class="search-icon" :size="16" />
        <input type="text" v-model="searchQuery" placeholder="Tìm kiếm theo username..." class="search-input" />
      </div>

      <!-- Sort Dropdown -->
      <el-dropdown trigger="click" @command="handleSort" class="control-dropdown sort-dropdown">
        <span class="el-dropdown-link">
          <button class="control-btn sort-btn" :class="{ active: currentSortField, 'has-text': currentSortField }">
            <ArrowUpDown v-if="!currentSortField" :size="16" />
            <ArrowUpNarrowWide v-else-if="currentSortDirection === 'ASC'" :size="16" />
            <ArrowDownWideNarrow v-else :size="16" />
            <span v-if="currentSortField" class="sort-text">{{ currentSortField === 'createdDate' ? 'Ngày nộp' : currentSortField }}</span>
          </button>
        </span>
        <template #dropdown>
          <el-dropdown-menu class="dark-dropdown custom-sort-menu">
            <el-dropdown-item command="createdDate" :class="{ 'is-active': currentSortField === 'createdDate' }">
              <div class="sort-menu-content">
                <span>Ngày nộp</span>
                <ArrowDownWideNarrow v-if="currentSortField === 'createdDate' && currentSortDirection === 'DESC'" :size="16" class="sort-indicator" />
                <ArrowUpNarrowWide v-if="currentSortField === 'createdDate' && currentSortDirection === 'ASC'" :size="16" class="sort-indicator" />
              </div>
            </el-dropdown-item>
            <el-dropdown-item command="executionTimeMs" :class="{ 'is-active': currentSortField === 'executionTimeMs' }">
              <div class="sort-menu-content">
                <span>Runtime</span>
                <ArrowDownWideNarrow v-if="currentSortField === 'executionTimeMs' && currentSortDirection === 'DESC'" :size="16" class="sort-indicator" />
                <ArrowUpNarrowWide v-if="currentSortField === 'executionTimeMs' && currentSortDirection === 'ASC'" :size="16" class="sort-indicator" />
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

      <!-- Filter Popover -->
      <el-popover
        placement="bottom-start"
        :width="350"
        trigger="click"
        popper-class="filter-popover"
        :hide-after="0"
        :persistent="true"
      >
        <template #reference>
          <div style="display: inline-block">
            <el-tooltip content="Filter submissions" placement="top" effect="dark" :hide-after="0">
              <button class="control-btn" :class="{ active: hasActiveFilters }">
                <Filter :size="16" />
              </button>
            </el-tooltip>
          </div>
        </template>
        <div class="filter-content">
          <div class="filter-header">
            <span>Filter Submissions</span>
          </div>
          <div class="filter-list">
            <!-- Verdict Filter -->
            <div class="filter-row">
              <el-checkbox v-model="filters.verdict.active" class="dark-checkbox" />
              <span class="filter-label" :class="{ 'is-active': filters.verdict.active }">
                <CheckCircle :size="14" /> Verdict
              </span>
              <el-select v-model="filters.verdict.operator" size="small" class="dark-select math-select" :disabled="!filters.verdict.active" popper-class="dark-select-dropdown">
                <el-option label="is" value="is" />
              </el-select>
              <el-select v-model="filters.verdict.value" size="small" class="dark-select value-select" :disabled="!filters.verdict.active" popper-class="dark-select-dropdown">
                <el-option v-for="v in verdictOptions" :key="v.value" :label="v.label" :value="v.value" />
              </el-select>
            </div>

            <!-- View Mode Filter (Mine/All) for logged-in users -->
            <div class="filter-row" v-if="authStore.isAuthenticated">
              <el-checkbox v-model="filters.viewMode.active" class="dark-checkbox" />
              <span class="filter-label" :class="{ 'is-active': filters.viewMode.active }">
                <Eye :size="14" /> Chế độ xem
              </span>
              <el-select v-model="filters.viewMode.operator" size="small" class="dark-select math-select" :disabled="!filters.viewMode.active" popper-class="dark-select-dropdown">
                <el-option label="is" value="is" />
              </el-select>
              <el-select v-model="filters.viewMode.value" size="small" class="dark-select value-select" :disabled="!filters.viewMode.active" popper-class="dark-select-dropdown">
                <el-option label="Tất cả" value="all" />
                <el-option label="Của tôi" value="mine" />
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

      <div class="spacer"></div>
      <div class="solved-count">
        <div class="circle-progress"></div>
        <span>{{ totalElements }} Submissions</span>
      </div>
    </div>

    <TableSkeleton v-if="loading && submissions.length === 0" :columns="6" :rows="12" />

    <el-table
      v-else
      :data="submissions"
      class="dashboard-table leetcode-table"
      v-loading="loading"
      :show-header="true"
      @row-click="viewDetail"
      :row-class-name="rowClassName"
    >
      <template #empty>
        <el-empty description="Không có dữ liệu bài nộp" />
      </template>

      <el-table-column label="#" width="60" align="center">
        <template #default="{ $index }">
          <span class="cell-index">{{ (pagination.page - 1) * pagination.size + $index + 1 }}</span>
        </template>
      </el-table-column>

      <el-table-column label="Thời gian nộp" min-width="165">
        <template #default="{ row }">
          <span class="cell-date">{{ formatDate(row.createdDate) }}</span>
        </template>
      </el-table-column>

      <el-table-column label="Người nộp" min-width="130">
        <template #default="{ row }">
          <RouterLink class="cell-link" :to="`/profile/${row.username}`" @click.stop>
            {{ row.username }}
          </RouterLink>
        </template>
      </el-table-column>

      <el-table-column label="Problem" min-width="200">
        <template #default="{ row }">
          <RouterLink class="cell-link" :to="`/problems/${row.problemSlug}`" @click.stop>
            {{ row.problemTitle }}
          </RouterLink>
        </template>
      </el-table-column>

      <el-table-column label="Kết quả" width="130" align="center">
        <template #default="{ row }">
          <span class="verdict-text" :style="{ color: getVerdictColor(row.verdict) }">
            {{ row.verdict || 'PENDING' }}
          </span>
        </template>
      </el-table-column>

      <el-table-column label="Điểm" width="80" align="center">
        <template #default="{ row }">
          <span class="cell-index">{{ row.score ?? '—' }}</span>
        </template>
      </el-table-column>

      <el-table-column label="Runtime" width="100" align="center">
        <template #default="{ row }">
          <span class="cell-date">{{ row.executionTimeMs != null ? row.executionTimeMs + ' ms' : '—' }}</span>
        </template>
      </el-table-column>

      <el-table-column label="Memory" width="100" align="center">
        <template #default="{ row }">
          <span class="cell-date">{{ row.executionMemoryMb != null ? row.executionMemoryMb + ' MB' : '—' }}</span>
        </template>
      </el-table-column>

      <el-table-column label="Ngôn ngữ" width="110" align="center">
        <template #default="{ row }">
          <span class="lang-badge">{{ row.languageKey }}</span>
        </template>
      </el-table-column>
    </el-table>

    <DarkPagination
      v-if="totalElements > 0"
      :current-page="pagination.page"
      :page-size="pagination.size"
      :total="totalElements"
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
  min-height: calc(100vh - 56px);
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
  gap: 16px;
}

.section-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.section-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

/* Table Controls */
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
.search-input::placeholder { color: #8a8a8a; }

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

.spacer { flex: 1; }
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

.link-text {
    color: var(--accent-primary);
    text-decoration: none;
    font-weight: 600;
}

.link-text:hover { text-decoration: underline; }

/* Table */
:deep(.leetcode-table) {
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
}
:deep(.leetcode-table .el-table__inner-wrapper::before) { display: none; }
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
:deep(.leetcode-table tr) { background: transparent !important; }
:deep(.leetcode-table tr:nth-child(odd) td.el-table__cell) {
  background: rgba(255, 255, 255, 0.03) !important;
}
:deep(.leetcode-table tr.clickable-row:hover td.el-table__cell) {
  background: rgba(255, 255, 255, 0.08) !important;
}
:deep(.leetcode-table tr.disabled-row:hover td.el-table__cell) {
  background: transparent !important;
}
:deep(.clickable-row) { cursor: pointer; }
:deep(.disabled-row) { cursor: default; }

.cell-index {
  font-weight: 500;
  color: #8a8a8a;
  font-size: 13px;
}
.cell-date {
  font-size: 13px;
  color: #8a8a8a;
}
.cell-title {
  font-size: 14px;
  font-weight: 500;
  color: #eff2f6;
}
.cell-link {
  font-size: 14px;
  font-weight: 500;
  color: #eff2f6;
  text-decoration: none;
  transition: color 0.2s;
}
.cell-link:hover { color: var(--accent-primary); }

.verdict-text {
  font-weight: 700;
  font-size: 13px;
}

.lang-badge {
  background: rgba(255,255,255,0.07);
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 12px;
  color: #ccc;
  font-family: monospace;
}
</style>

<style>
/* Global: Popover & Dropdown dark styling */
.filter-popover.el-popper {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
  padding: 0 !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
  color: #eff2f6 !important;
  width: 350px !important;
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
  gap: 6px;
  width: 90px;
  color: #8a8a8a;
  font-size: 13px;
  transition: color 0.2s;
}
.filter-label.is-active { color: var(--accent-primary) !important; }
.filter-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #3e3e3e;
  padding-top: 12px;
  margin-top: 16px;
}
.reset-filters { color: #eff2f6 !important; font-size: 13px; }
.reset-filters:hover { color: #fff !important; }

.dark-select.math-select { width: 65px; }
.dark-select.value-select { width: 115px; flex: 1; }
.dark-select .el-input__wrapper,
.dark-select .el-select__wrapper {
  background-color: #333 !important;
  box-shadow: 0 0 0 1px #3e3e3e inset !important;
  border-radius: 6px;
}
.dark-select .el-input__inner,
.dark-select .el-select__placeholder { color: #eff2f6 !important; }
.dark-select .el-input.is-disabled .el-input__wrapper,
.dark-select .el-select__wrapper.is-disabled {
  background-color: #282828 !important;
  box-shadow: 0 0 0 1px #333 inset !important;
}
.dark-select .el-input.is-disabled .el-input__inner,
.dark-select .el-select__wrapper.is-disabled .el-select__placeholder {
  color: #5c5c5c !important;
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
.dark-dropdown .el-dropdown-menu__item { color: #eff2f6 !important; }
.dark-dropdown .el-dropdown-menu__item:hover,
.dark-dropdown .el-dropdown-menu__item.is-active {
  background-color: #333 !important;
  color: var(--accent-primary) !important;
}
.dark-dropdown.el-popper .el-popper__arrow::before {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
}
.dark-select-dropdown.el-popper {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
}
.dark-select-dropdown .el-select-dropdown__item { color: #eff2f6 !important; }
.dark-select-dropdown .el-select-dropdown__item.hover,
.dark-select-dropdown .el-select-dropdown__item:hover {
  background-color: #333 !important;
  color: var(--accent-primary) !important;
}
.dark-select-dropdown .el-select-dropdown__item.selected {
  color: var(--accent-primary) !important;
}
.dark-select-dropdown.el-popper .el-popper__arrow::before {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
}
</style>
