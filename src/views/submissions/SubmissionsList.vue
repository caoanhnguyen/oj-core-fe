<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSubmissionStore } from '@/stores/submission'
import { useAuthStore } from '@/stores/auth'
import { handleApiError } from '@/utils/errorHandler'
import { Search, ArrowUpDown, ArrowDownWideNarrow, ArrowUpNarrowWide, Filter, RotateCcw, ChevronDown, CheckCircle, Eye } from 'lucide-vue-next'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import TableControls from '@/components/common/TableControls.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import DarkPagination from '@/components/common/DarkPagination.vue'
import DataTable from '@/components/common/DataTable.vue'
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

const filterConfig = computed(() => {
  const config = [
    {
      key: 'verdict',
      label: 'Verdict',
      icon: CheckCircle,
      options: verdictOptions.value
    }
  ]
  
  if (authStore.isAuthenticated) {
    config.push({
      key: 'viewMode',
      label: 'Chế độ xem',
      icon: Eye,
      options: [
        { label: 'Tất cả', value: 'all' },
        { label: 'Của tôi', value: 'mine' }
      ]
    })
  }
  
  return config
})

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
  <div class="public-layout-page">
    <div class="public-layout-container">
    <PageHeader 
      title="Danh sách Bài nộp" 
      subtitle="Theo dõi tất cả lần nộp bài trên hệ thống"
    />

    <TableControls
      v-model="searchQuery"
      search-placeholder="Tìm kiếm theo username..."
      :sort-options="[
        { label: 'Ngày nộp', value: 'createdDate' },
        { label: 'Runtime', value: 'executionTimeMs' }
      ]"
      :current-sort="currentSortField"
      :current-sort-dir="currentSortDirection"
      @sort="handleSort"
      @reset-sort="resetSort"
      :filter-config="filterConfig"
      filter-title="Filter Submissions"
      @filter-change="handleFilterChange"
      @reset-filters="resetFilters"
      :total-elements="totalElements"
      item-name="Submissions"
    />

    <TableSkeleton v-if="loading && submissions.length === 0" :columns="6" :rows="12" />

    <DataTable
      v-else
      :data="submissions"
      :columns="[
        { key: 'index', label: '#', width: 60, resizable: false },
        { key: 'createdDate', label: 'Thời gian nộp', minWidth: 165 },
        { key: 'username', label: 'Người nộp', minWidth: 130 },
        { key: 'problem', label: 'Problem', minWidth: 200 },
        { key: 'verdict', label: 'Kết quả', width: 130 },
        { key: 'score', label: 'Điểm', width: 80 },
        { key: 'runtime', label: 'Runtime', width: 100 },
        { key: 'memory', label: 'Memory', width: 100 },
        { key: 'language', label: 'Ngôn ngữ', width: 110 }
      ]"
      :loading="loading"
      empty-text="Không có dữ liệu bài nộp"
      @row-click="viewDetail"
      :row-class-name="rowClassName"
    >

      <template #cell-index="{ index }">
        <span class="cell-index">{{ (pagination.page - 1) * pagination.size + index + 1 }}</span>
      </template>

      <template #cell-createdDate="{ row }">
        <span class="cell-date">{{ formatDate(row.createdDate) }}</span>
      </template>

      <template #cell-username="{ row }">
        <RouterLink class="cell-link" :to="`/profile/${row.username}`" @click.stop>
          {{ row.username }}
        </RouterLink>
      </template>

      <template #cell-problem="{ row }">
        <RouterLink class="cell-link" :to="`/problems/${row.problemSlug}`" @click.stop>
          {{ row.problemTitle }}
        </RouterLink>
      </template>

      <template #cell-verdict="{ row }">
        <span class="verdict-text" :style="{ color: getVerdictColor(row.verdict) }">
          {{ row.verdict || 'PENDING' }}
        </span>
      </template>

      <template #cell-score="{ row }">
        <span class="cell-index">{{ row.score ?? '—' }}</span>
      </template>

      <template #cell-runtime="{ row }">
        <span class="cell-date">{{ row.executionTimeMs != null ? row.executionTimeMs + ' ms' : '—' }}</span>
      </template>

      <template #cell-memory="{ row }">
        <span class="cell-date">{{ row.executionMemoryMb != null ? row.executionMemoryMb + ' MB' : '—' }}</span>
      </template>

      <template #cell-language="{ row }">
        <span class="lang-badge">{{ row.languageKey }}</span>
      </template>
    </DataTable>

    <DarkPagination
      v-if="totalElements > 0"
      :current-page="pagination.page"
      :page-size="pagination.size"
      :total="totalElements"
      @size-change="handleSizeChange"
      @current-change="handlePageChange"
    />
    </div>
  </div>
</template>

<style scoped>

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

</style>
