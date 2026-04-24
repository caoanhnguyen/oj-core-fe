<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
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
import { useBadge } from '@/composables/useBadge'
import AppButton from '@/components/common/AppButton.vue'
import TopicFilterPicker from '@/components/common/TopicFilterPicker.vue'

const router = useRouter()
const problemStore = useProblemStore()
const topicStore = useTopicStore()
const { t } = useI18n()
const { difficultyClass, difficultyLabel, estatusClass, problemStatusClass, ruleTypeClass } = useBadge()

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

const filterConfig = computed(() => [
  { key: 'status', label: t('admin_problems.filter_status'), icon: CheckCircle, options: [{ label: t('admin_problems.status_active'), value: 'ACTIVE' }, { label: t('admin_problems.status_deleted'), value: 'DELETED' }] },
  { key: 'problemStatus', label: t('admin_problems.filter_problem_status'), icon: CheckCircle, options: [{ label: t('admin_problems.visibility_published'), value: 'PUBLISHED' }, { label: t('admin_problems.visibility_draft'), value: 'DRAFT' }] },
  { key: 'difficulty', label: t('admin_problems.col_difficulty'), icon: Gauge, options: [{ label: t('problems.difficulty_levels.easy'), value: 'EASY' }, { label: t('problems.difficulty_levels.medium'), value: 'MEDIUM' }, { label: t('problems.difficulty_levels.hard'), value: 'HARD' }] },
  { key: 'ruleType', label: t('admin_problems.col_rule'), icon: LayoutGrid, options: [{ label: 'ACM', value: 'ACM' }, { label: 'OI', value: 'OI' }] },
])

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


// getDifficultyClass replaced by composable useBadge.difficultyClass

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
      t('admin_problems.confirm_del_msg', { title: row.title }),
      t('admin_problems.confirm_del_title'),
      {
        confirmButtonText: t('admin_problems.action_delete'),
        cancelButtonText: t('admin_problems.btn_cancel'),
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    await problemStore.deleteProblem(row.id)
    } catch (error) {
    if (error !== 'cancel') {
      handleApiError(error, t('admin_problems.msg_delete_fail'))
    }
  }
}

const handleRestore = async (row) => {
  try {
    await ElMessageBox.confirm(
      t('admin_problems.confirm_restore_msg', { title: row.title }),
      t('admin_problems.confirm_restore_title'),
      {
        confirmButtonText: t('admin_problems.action_restore'),
        cancelButtonText: t('admin_problems.btn_cancel'),
        type: 'info',
        confirmButtonClass: 'el-button--primary'
      }
    )
    await problemStore.restoreProblem(row.id)
  } catch(error) {
    if (error !== 'cancel') {
      handleApiError(error, t('admin_problems.msg_restore_fail'))
    }
  }
}

const handlePublish = async (row) => {
  try {
    await ElMessageBox.confirm(
      t('admin_problems.confirm_pub_msg', { title: row.title }),
      t('admin_problems.confirm_pub_title'),
      {
        confirmButtonText: t('admin_problems.btn_publish'),
        cancelButtonText: t('admin_problems.btn_cancel'),
        type: 'info',
        confirmButtonClass: 'el-button--primary'
      }
    )
    await problemStore.publishProblem(row.id)
  } catch(error) {
    if (error !== 'cancel') {
      handleApiError(error, t('admin_problems.msg_publish_fail'))
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
      :title="$t('admin_problems.title')" 
      :subtitle="$t('admin_problems.subtitle')"
    >
      <AppButton variant="primary" :icon="FileText" @click="handleAddProblem">
        {{ $t('admin_problems.btn_add') }}
      </AppButton>
    </PageHeader>

    <TableControls
      v-model="searchQuery"
      :search-placeholder="$t('admin_problems.search_placeholder')"
      :total-elements="problemStore.pagination.totalElements"
      :item-name="$t('admin_problems.item_name')"
      :sort-options="[
        { label: $t('admin_problems.col_difficulty'), value: 'difficulty' },
        { label: $t('admin_problems.col_created'), value: 'createdDate' }
      ]"
      :current-sort="currentSortField"
      :current-sort-dir="currentSortDirection"
      @sort="handleSort"
      @reset-sort="resetSort"
      :filter-config="filterConfig"
      :filter-title="$t('admin_problems.filter_title')"
      @filter-change="handleFilterChange"
      @reset-filters="resetFilters"
    >
      <template #custom-filters>
        <TopicFilterPicker
          v-model="filters.topics.value"
          v-model:active="filters.topics.active"
          :topics="topics"
          :label="$t('problem_detail.topics')"
        />
      </template>
    </TableControls>

    <TableSkeleton v-if="problemStore.loading && problems.length === 0" :columns="6" :rows="10" />

    <DataTable 
      :data="problems" 
      :columns="[
        { key: 'index', label: '#', width: 60, align: 'center' },
        { key: 'id', label: 'ID', width: 320 },
        { key: 'title', label: $t('admin_problems.col_title'), minWidth: 280 },
        { key: 'createdDate', label: $t('admin_problems.col_created'), width: 120, align: 'center' },
        { key: 'difficulty', label: $t('admin_problems.col_difficulty'), width: 100, align: 'center' },
        { key: 'ruleType', label: $t('admin_problems.col_rule'), width: 80, align: 'center' },
        { key: 'status', label: $t('admin_problems.col_status'), width: 100, align: 'center' },
        { key: 'problemStatus', label: $t('admin_problems.col_visibility'), width: 120, align: 'center' }
      ]"
      :action-width="140"
      :action-label="$t('admin_problems.col_actions')"
      :loading="problemStore.loading" 
      :empty-text="$t('admin_problems.empty_text')"
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
         <span :class="['oj-badge', difficultyClass(row.difficulty)]">{{ difficultyLabel(row.difficulty) }}</span>
      </template>
      <template #cell-status="{ row }">
        <span :class="['oj-badge', estatusClass(row.status)]">
          {{ row.status }}
        </span>
      </template>
      <template #cell-ruleType="{ row }">
        <span :class="['oj-badge', ruleTypeClass(row.ruleType)]">{{ row.ruleType }}</span>
      </template>
      <template #cell-problemStatus="{ row }">
        <span :class="['oj-badge', problemStatusClass(row.problemStatus)]">
          {{ row.problemStatus }}
        </span>
      </template>
      <template #actions="{ row }">
        <div class="action-buttons" v-if="row.status === 'DELETED'">
          <el-tooltip :content="$t('admin_problems.action_restore')" placement="top" effect="dark" :hide-after="0" :show-after="200">
            <el-button link :icon="RotateCcw" @click="handleRestore(row)" class="action-btn action-restore" />
          </el-tooltip>
        </div>
        <div class="action-buttons" v-else>
          <el-tooltip :content="$t('admin_problems.action_view')" placement="top" effect="dark" :hide-after="0" :show-after="200">
            <el-button link :icon="Eye" @click="handleView(row)" class="action-btn action-view" />
          </el-tooltip>
          <el-tooltip :content="$t('admin_problems.action_edit')" placement="top" effect="dark" :hide-after="0" :show-after="200">
            <el-button link :icon="Edit" @click="handleEdit(row)" class="action-btn" />
          </el-tooltip>
          <el-tooltip v-if="row.problemStatus === 'DRAFT'" :content="$t('admin_problems.action_publish')" placement="top" effect="dark" :hide-after="0" :show-after="200">
            <el-button link :icon="Send" @click="handlePublish(row)" class="action-btn action-publish" />
          </el-tooltip>
          <el-tooltip v-else :content="$t('admin_problems.action_delete')" placement="top" effect="dark" :hide-after="0" :show-after="200">
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
/* Difficulty / Status badges → global badges.css */

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
