<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { FileText, Search, ArrowUpDown, ArrowDownWideNarrow, ArrowUpNarrowWide, Filter, Gauge, Tag, Code2, Minus, Plus, LayoutGrid, RotateCcw, Calendar, Edit, Trash2, CheckCircle, Eye, Lightbulb, ChevronDown, Send } from 'lucide-vue-next'
import { useProblemStore } from '@/stores/problem'
import { useTopicStore } from '@/stores/topic'
import { ElMessageBox } from 'element-plus'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import DataTable from '@/components/common/DataTable.vue'
import TableControls from '@/components/common/TableControls.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import DarkPagination from '@/components/common/DarkPagination.vue'
import { debounce } from 'lodash'
import { handleApiError } from '@/utils/errorHandler'
import AppButton from '@/components/common/AppButton.vue'
import TopicFilterPicker from '@/components/common/TopicFilterPicker.vue'

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

const debouncedFetchProblems = debounce(fetchProblemsData, 500)

const filterConfig = [
  { key: 'status', label: 'Trạng thái', icon: CheckCircle, options: [{ label: 'Hoạt động', value: 'ACTIVE' }, { label: 'Đã xóa', value: 'DELETED' }] },
  { key: 'problemStatus', label: 'Hiển thị', icon: CheckCircle, options: [{ label: 'Công khai', value: 'PUBLISHED' }, { label: 'Bản nháp', value: 'DRAFT' }] },
  { key: 'difficulty', label: 'Độ khó', icon: Gauge, options: [{ label: 'Dễ', value: 'EASY' }, { label: 'Trung bình', value: 'MEDIUM' }, { label: 'Khó', value: 'HARD' }] },
  { key: 'ruleType', label: 'Quy tắc', icon: LayoutGrid, options: [{ label: 'ACM', value: 'ACM' }, { label: 'OI', value: 'OI' }] },
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

watch(searchQuery, () => {
  pagination.value.page = 1
  debouncedFetchProblems()
})

watch([currentSortField, currentSortDirection], () => {
  pagination.value.page = 1
  fetchProblemsData()
})

watch(filters, () => {
  // Skip fetch if an active filter has no value yet
  const hasIncomplete = Object.values(filters.value).some(f =>
    f.active && (!f.value || (Array.isArray(f.value) ? f.value.length === 0 : f.value === ''))
  )
  if (hasIncomplete) return
  pagination.value.page = 1
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
      `Bạn có chắc chắn muốn xóa "${row.title}"? Hành động này không thể hoàn tác.`,
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    await problemStore.deleteProblem(row.id)
    } catch (error) {
    if (error !== 'cancel') {
      handleApiError(error, 'Xóa bài tập thất bại')
    }
  }
}

const handleRestore = async (row) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn khôi phục "${row.title}"?`,
      'Xác nhận khôi phục',
      {
        confirmButtonText: 'Khôi phục',
        cancelButtonText: 'Hủy',
        type: 'info',
        confirmButtonClass: 'el-button--primary'
      }
    )
    await problemStore.restoreProblem(row.id)
  } catch(error) {
    if (error !== 'cancel') {
      handleApiError(error, 'Khôi phục bài tập thất bại')
    }
  }
}

const handlePublish = async (row) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn công khai bài tập "${row.title}"?`,
      'Xác nhận công khai',
      {
        confirmButtonText: 'Công khai',
        cancelButtonText: 'Hủy',
        type: 'info',
        confirmButtonClass: 'el-button--primary'
      }
    )
    await problemStore.publishProblem(row.id)
  } catch(error) {
    if (error !== 'cancel') {
      handleApiError(error, 'Công khai bài tập thất bại')
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
  <div class="admin-layout-container">
    <PageHeader 
      title="Quản lý bài tập" 
      subtitle="Tạo, chỉnh sửa và quản trị các bài tập lập trình"
    >
      <AppButton variant="primary" :icon="FileText" @click="handleAddProblem">
        Thêm bài tập
      </AppButton>
    </PageHeader>

    <TableControls
      v-model="searchQuery"
      search-placeholder="Tìm kiếm bài tập..."
      :total-elements="problemStore.pagination.totalElements"
      item-name="Bài tập"
      :sort-options="[
        { label: 'Độ khó', value: 'difficulty' },
        { label: 'Ngày tạo', value: 'createdDate' }
      ]"
      :current-sort="currentSortField"
      :current-sort-dir="currentSortDirection"
      @sort="handleSort"
      @reset-sort="resetSort"
      :filter-config="filterConfig"
      filter-title="Bộ lọc bài tập"
      @filter-change="handleFilterChange"
      @reset-filters="resetFilters"
    >
      <template #custom-filters>
        <TopicFilterPicker
          v-model="filters.topics.value"
          v-model:active="filters.topics.active"
          :topics="topics"
          label="Chủ đề"
        />
      </template>
    </TableControls>

    <TableSkeleton v-if="problemStore.loading && problems.length === 0" :columns="6" :rows="10" />

    <DataTable 
      :data="problems" 
      :columns="[
        { key: 'index', label: '#', width: 60, align: 'center' },
        { key: 'id', label: 'ID', width: 350 },
        { key: 'title', label: 'Tiêu đề', minWidth: 300 },
        { key: 'createdDate', label: 'Ngày tạo', width: 120, align: 'center' },
        { key: 'difficulty', label: 'Độ khó', width: 100, align: 'center' },
        { key: 'status', label: 'Trạng thái', width: 100, align: 'center' },
        { key: 'problemStatus', label: 'Hiển thị', width: 120, align: 'center' },
        { key: 'actions', label: 'Hành động', width: 140, align: 'center', fixed: 'right' }
      ]"
      :loading="problemStore.loading" 
      empty-text="Không tìm thấy bài tập nào"
    >
      <template #cell-index="{ index }">
        <span class="cell-index">{{ (pagination.page - 1) * pagination.size + index + 1 }}</span>
      </template>
      <template #cell-id="{ row }">
        <span class="cell-id">{{ row.id }}</span>
      </template>
      <template #cell-title="{ row }">
        <span class="cell-title" @click="handleView(row)">{{ row.title }}</span>
      </template>
      <template #cell-createdDate="{ row }">
        <span class="cell-date">{{ formatDate(row.createdDate) }}</span>
      </template>
      <template #cell-difficulty="{ row }">
         <span :class="['difficulty-text', getDifficultyClass(row.difficulty)]">{{ !row.difficulty ? '' : row.difficulty.toUpperCase() === 'EASY' ? 'Easy' : row.difficulty.toUpperCase() === 'MEDIUM' ? 'Med' : 'Hard' }}</span>
      </template>
      <template #cell-status="{ row }">
        <span :class="['status-badge', row.status === 'DELETED' ? 'status-deleted' : 'status-active']">
          {{ row.status }}
        </span>
      </template>
      <template #cell-problemStatus="{ row }">
        <span :class="['status-badge', row.problemStatus === 'PUBLISHED' ? 'status-active' : 'status-draft']">
          {{ row.problemStatus }}
        </span>
      </template>
      <template #cell-actions="{ row }">
        <div class="action-buttons" v-if="row.status === 'DELETED'">
          <el-tooltip content="Khôi phục bài tập" placement="top" effect="dark" :hide-after="0" :show-after="200">
            <el-button link :icon="RotateCcw" @click="handleRestore(row)" class="action-btn action-restore" />
          </el-tooltip>
        </div>
        <div class="action-buttons" v-else>
          <el-tooltip content="Xem chi tiết" placement="top" effect="dark" :hide-after="0" :show-after="200">
            <el-button link :icon="Eye" @click="handleView(row)" class="action-btn action-view" />
          </el-tooltip>
          <el-tooltip content="Sửa bài tập" placement="top" effect="dark" :hide-after="0" :show-after="200">
            <el-button link :icon="Edit" @click="handleEdit(row)" class="action-btn" />
          </el-tooltip>
          <el-tooltip v-if="row.problemStatus === 'DRAFT'" content="Công khai bài tập" placement="top" effect="dark" :hide-after="0" :show-after="200">
            <el-button link :icon="Send" @click="handlePublish(row)" class="action-btn action-publish" />
          </el-tooltip>
          <el-tooltip v-else content="Xóa bài tập" placement="top" effect="dark" :hide-after="0" :show-after="200">
            <el-button link :icon="Trash2" @click="handleDelete(row)" class="action-btn action-danger" />
          </el-tooltip>
        </div>
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
</template>

<style scoped>
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





.cell-index {
  font-weight: 500;
  color: #8a8a8a;
  font-size: 13px;
}
.cell-id {
  color: #8a8a8a;
  font-weight: 500;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}
.cell-title {
  font-size: 14px;
  font-weight: 500;
  color: #eff2f6;
  transition: color 0.2s;
  cursor: pointer;
}
.cell-title:hover {
  color: var(--accent-primary);
  text-decoration: underline;
}
.cell-date {
  font-size: 13px;
  color: #8a8a8a;
}
.difficulty-text {
  font-weight: 500;
  font-size: 13px;
  display: inline-block;
  white-space: nowrap;
}
.difficulty-easy { background: transparent !important; color: #00b8a3 !important; padding: 0; }
.difficulty-medium { background: transparent !important; color: #ffc01e !important; padding: 0; }
.difficulty-hard { background: transparent !important; color: #ef4743 !important; padding: 0; }

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
