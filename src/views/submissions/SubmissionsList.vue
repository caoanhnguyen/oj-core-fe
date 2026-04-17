<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useSubmissionStore } from '@/stores/submission'
import { useAuthStore } from '@/stores/auth'
import { systemAPI } from '@/api/system'
import { handleApiError } from '@/utils/errorHandler'
import { Search, ArrowUpDown, ArrowDownWideNarrow, ArrowUpNarrowWide, Filter, RotateCcw, ChevronDown, CheckCircle, Eye, Calendar, Code2 } from 'lucide-vue-next'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import TableControls from '@/components/common/TableControls.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import DarkPagination from '@/components/common/DarkPagination.vue'
import DataTable from '@/components/common/DataTable.vue'
import { debounce } from 'lodash'
import { useBadge } from '@/composables/useBadge'

const router = useRouter()
const submissionStore = useSubmissionStore()
const authStore = useAuthStore()
const { t } = useI18n()
const { verdictClass } = useBadge()

const loading = ref(false)
const submissions = ref([])
const totalElements = ref(0)

const pagination = ref({
  page: 1,
  size: 20
})

const languageOptions = ref([])

// Search, Sort, Filter state
const searchQuery = ref('')
const currentSortField = ref('')
const currentSortDirection = ref('DESC')

const filters = ref({
  verdict: { active: false, value: '' },
  viewMode: { active: false, value: 'all' },
  language: { active: false, value: '' },
  dateRange: { active: false, value: null }
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
  return allVerdictOptions.filter(o => !o.adminOnly)
})

// Verdict colors are now handled by useBadge globals

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

    if (filters.value.language?.active && filters.value.language?.value) {
      params.languageKey = filters.value.language.value
    }
    
    if (filters.value.dateRange?.active && filters.value.dateRange?.value) {
      const dates = filters.value.dateRange.value
      if (dates && dates.length === 2) {
        params.fromDate = dates[0].toISOString()
        params.toDate = dates[1].toISOString()
      }
    }

    if (searchQuery.value) {
      params.keyword = searchQuery.value
    }

    let response
    const isMine = filters.value.viewMode.active && filters.value.viewMode.value === 'mine'

    if (isMine && authStore.user?.id) {
      params.userId = authStore.user.id
    }

    // Trang public chỉ call public endpoint
    response = await submissionStore.getSubmissions(params)

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
  filters.value.verdict = { active: false, value: '' }
  filters.value.viewMode = { active: false, value: 'all' }
  filters.value.language = { active: false, value: '' }
  filters.value.dateRange = { active: false, value: null }
  searchQuery.value = ''
}

const filterConfig = computed(() => {
  const config = [
    {
      key: 'verdict',
      label: t('submissions.filter_verdict'),
      icon: CheckCircle,
      options: verdictOptions.value
    },
    {
      key: 'language',
      label: t('submissions.filter_language'),
      icon: Code2,
      options: languageOptions.value
    }
  ]
  
  if (authStore.isAuthenticated) {
    config.push({
      key: 'viewMode',
      label: t('submissions.filter_view_mode'),
      icon: Eye,
      options: [
        { label: t('submissions.view_all'), value: 'all' },
        { label: t('submissions.view_mine'), value: 'mine' }
      ]
    })
  }

  config.push({
    key: 'dateRange',
    label: t('submissions.filter_time'),
    icon: Calendar,
    type: 'daterange'
  })
  
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
  return authStore.isAuthenticated && row.userId === authStore.user?.id
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
  const s = dateStr.includes('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z'
  const d = new Date(s)
  return d.toLocaleString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

onMounted(async () => {
  try {
    const langs = await systemAPI.getLanguages()
    languageOptions.value = langs.map(l => ({ label: l.name, value: l.languageKey }))
  } catch (error) {
    console.warn('Lỗi lấy danh sách ngôn ngữ:', error)
  }
  loadSubmissions()
})
</script>

<template>
  <div class="public-layout-page">
    <div class="public-layout-container">
    <PageHeader 
      :title="$t('submissions.list_title')" 
      :subtitle="$t('submissions.list_subtitle')"
    />

    <TableControls
      v-model="searchQuery"
      :search-placeholder="$t('submissions.search_placeholder')"
      :sort-options="[
        { label: $t('submissions.col_time'), value: 'createdDate' },
        { label: $t('submissions.col_runtime'), value: 'executionTimeMs' }
      ]"
      :current-sort="currentSortField"
      :current-sort-dir="currentSortDirection"
      @sort="handleSort"
      @reset-sort="resetSort"
      :filter-config="filterConfig"
      :filter-title="$t('submissions.filter_title')"
      @filter-change="handleFilterChange"
      @reset-filters="resetFilters"
      :total-elements="totalElements"
      :item-name="$t('submissions.item_name')"
    />

    <TableSkeleton v-if="loading && submissions.length === 0" :columns="6" :rows="12" />

    <DataTable
      v-else
      :data="submissions"
      :columns="[
        { key: 'index', label: '#', width: 60, resizable: false },
        { key: 'createdDate', label: $t('submissions.col_time'), minWidth: 165 },
        { key: 'username', label: $t('submissions.col_user'), minWidth: 130 },
        { key: 'problem', label: $t('submissions.col_problem'), minWidth: 200 },
        { key: 'contest', label: $t('submissions.col_contest'), minWidth: 180 },
        { key: 'verdict', label: $t('submissions.col_verdict'), width: 130 },
        { key: 'score', label: $t('submissions.col_score'), width: 80 },
        { key: 'runtime', label: $t('submissions.col_runtime'), width: 100 },
        { key: 'memory', label: $t('submissions.col_memory'), width: 100 },
        { key: 'language', label: $t('submissions.col_language'), width: 110 }
      ]"
      :loading="loading"
      :empty-text="$t('submissions.empty_text')"
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

      <template #cell-contest="{ row }">
        <RouterLink v-if="row.contestKey" class="cell-link" :to="`/contests/${row.contestKey}`" @click.stop>
           {{ row.contestTitle || $t('submissions.qualifier_contest') }}
        </RouterLink>
        <span v-else class="cell-date">—</span>
      </template>

      <template #cell-verdict="{ row }">
        <span :class="['oj-badge', verdictClass(row.verdict)]">
          {{ row.verdict || 'PENDING' }}
        </span>
      </template>

      <template #cell-score="{ row }">
        <span class="metric-score">{{ row.score ?? '—' }}</span>
      </template>

      <template #cell-runtime="{ row }">
        <span class="metric-runtime">{{ row.executionTimeMs != null ? row.executionTimeMs + ' ms' : '—' }}</span>
      </template>

      <template #cell-memory="{ row }">
        <span class="metric-memory">{{ row.executionMemoryMb != null ? row.executionMemoryMb + ' MB' : '—' }}</span>
      </template>

      <template #cell-language="{ row }">
        <span class="oj-badge lang-badge">{{ row.languageKey }}</span>
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

/* Verdict & lang badges → global badges.css */

.badge-contest {
  background: rgba(255,161,22,0.15);
  color: #ffa116;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  margin-right: 6px;
}
</style>

<style>

</style>
