<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Trophy, Plus, Edit, Trash2, RotateCcw, Eye, EyeOff, Search, BookOpen, Users, FileText, X, Check, MoreVertical, Filter, Clock, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { useContestStore } from '@/stores/contest'
import { useProblemStore } from '@/stores/problem'
import { contestsAPI } from '@/api/contests'
import { ElMessage, ElMessageBox } from 'element-plus'
import { handleApiError } from '@/utils/errorHandler'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import DarkPagination from '@/components/common/DarkPagination.vue'
import RichTextEditor from '@/components/common/RichTextEditor.vue'

const contestStore = useContestStore()
const problemStore = useProblemStore()
const router = useRouter()

// Main List State
// ====================
const searchQuery = ref('')
const filters = ref({
  status: { active: false, value: '' },
  contestStatus: { active: false, value: '' },
  visibility: { active: false, value: '' },
  ruleType: { active: false, value: '' }
})
const pagination = ref({ page: 1, size: 20 })

const contests = computed(() => contestStore.adminContests)
const totalElements = computed(() => contestStore.adminPagination.totalElements)

const loadContests = async () => {
  const params = {
    page: pagination.value.page - 1,
    size: pagination.value.size,
    sort: 'startTime,desc'
  }
  if (searchQuery.value) params.keyword = searchQuery.value
  
  if (filters.value.status.active && filters.value.status.value) {
    params.status = filters.value.status.value
  }
  if (filters.value.contestStatus.active && filters.value.contestStatus.value) {
    params.contestStatus = filters.value.contestStatus.value
  }
  if (filters.value.visibility.active && filters.value.visibility.value) {
    params.visibility = filters.value.visibility.value
  }
  if (filters.value.ruleType.active && filters.value.ruleType.value) {
    params.ruleType = filters.value.ruleType.value
  }
  
  await contestStore.fetchAdminContests(params)
}

const hasActiveFilters = computed(() => {
  return Object.values(filters.value).some(f => {
    if (!f.active) return false
    return f.value !== '' && f.value !== null
  })
})

const resetFilters = () => {
  searchQuery.value = ''
  filters.value = {
    status: { active: false, value: '' },
    contestStatus: { active: false, value: '' },
    visibility: { active: false, value: '' },
    ruleType: { active: false, value: '' }
  }
  handleSearch()
}

const handleSearch = () => {
  pagination.value.page = 1
  loadContests()
}

const handleFilterChange = () => {
  // If an active filter doesn't have a value, just wait
  const hasIncompleteFilter = Object.values(filters.value).some(f => f.active && !f.value)
  if (hasIncompleteFilter) return
  
  pagination.value.page = 1
  loadContests()
}

const handlePageChange = (val) => {
  pagination.value.page = val
  loadContests()
}

const viewMode = ref('list')
const selectedContest = ref(null)
const activeDetailTab = ref('problems')
const isDetailHeaderCollapsed = ref(false)

const openDetail = async (row) => {
  try {
    selectedContest.value = await contestStore.getAdminContestById(row.id)
    viewMode.value = 'detail'
    activeDetailTab.value = 'problems'
    isDetailHeaderCollapsed.value = false
    
    contestProblems.value = []
    participants.value = []
    contestSubmissions.value = []
    selectedProblemsToAdd.value = []

    loadContestProblems()
  } catch {}
}

const goBackToList = () => {
  viewMode.value = 'list'
  selectedContest.value = null
  loadContests()
}

const switchDetailTab = (tab) => {
  activeDetailTab.value = tab
  if (tab === 'problems' && contestProblems.value.length === 0) loadContestProblems()
  if (tab === 'participants' && participants.value.length === 0) loadParticipants()
  if (tab === 'submissions' && contestSubmissions.value.length === 0) loadContestSubmissions()
}

// ====================
// Create / Edit Form
// ====================
const formDialogVisible = ref(false)
const formMode = ref('create') // 'create' | 'edit'
const formLoading = ref(false)

const defaultForm = () => ({
  title: '',
  description: '',
  startTime: null,
  endTime: null,
  ruleType: 'ACM',
  visibility: 'PUBLIC',
  password: '',
  durationMinutes: null
})

const form = ref(defaultForm())
const formRef = ref(null)

const formRules = {
  title: [{ required: true, message: 'Vui lòng nhập tiêu đề', trigger: 'blur' }],
  description: [{ required: true, message: 'Vui lòng nhập mô tả', trigger: 'blur' }],
  startTime: [{ required: true, message: 'Vui lòng chọn thời gian bắt đầu', trigger: 'change' }],
  endTime: [{ required: true, message: 'Vui lòng chọn thời gian kết thúc', trigger: 'change' }],
  ruleType: [{ required: true, message: 'Vui lòng chọn loại', trigger: 'change' }],
  visibility: [{ required: true, message: 'Vui lòng chọn visibility', trigger: 'change' }],
}

const openCreateForm = () => {
  formMode.value = 'create'
  form.value = defaultForm()
  formDialogVisible.value = true
}

const openEditForm = async (row) => {
  try {
    const detail = row.description !== undefined ? row : await contestStore.getAdminContestById(row.id)
    formMode.value = 'edit'

    // Parse UTC strings from server into local Date objects so el-date-picker
    // displays the correct LOCAL time for the admin
    const parseUTC = (str) => {
      if (!str) return null
      const s = str.includes('Z') || str.includes('+') ? str : str + 'Z'
      return new Date(s)
    }

    form.value = {
      id: detail.id,
      title: detail.title,
      description: detail.description || '',
      startTime: parseUTC(detail.startTime),
      endTime: parseUTC(detail.endTime),
      ruleType: detail.ruleType || 'ACM',
      visibility: detail.visibility || 'PUBLIC',
      password: detail.password || '',
      durationMinutes: detail.durationMinutes || null
    }
    formDialogVisible.value = true
  } catch {}
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      formLoading.value = true
      const payload = { ...form.value }

      // Admin picks local time → convert to UTC before sending to BE
      // el-date-picker (without value-format) returns a Date object in local time
      const toUTCString = (val) => {
        if (!val) return null
        const d = val instanceof Date ? val : new Date(val)
        return d.toISOString().slice(0, 19) // "2026-04-02T02:00:00" (UTC, no Z)
      }
      payload.startTime = toUTCString(payload.startTime)
      payload.endTime   = toUTCString(payload.endTime)
      if (payload.visibility !== 'PRIVATE') delete payload.password

      if (formMode.value === 'create') {
        await contestStore.createContest(payload)
      } else {
        await contestStore.updateContest(form.value.id, payload)
      }
      formDialogVisible.value = false
      loadContests()
    } catch {} finally {
      formLoading.value = false
    }
  })
}

// ====================
// Delete / Restore / Toggle
// ====================
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc muốn xóa contest "${row.title}"?`,
      'Xác nhận xóa',
      { confirmButtonText: 'Xóa', cancelButtonText: 'Hủy', type: 'warning', confirmButtonClass: 'el-button--danger' }
    )
    await contestStore.deleteContest(row.id)
    loadContests()
  } catch (error) {
    if (error !== 'cancel') handleApiError(error, 'Xóa contest thất bại')
  }
}

const handleRestore = async (row) => {
  try {
    await ElMessageBox.confirm(
      `Khôi phục contest "${row.title}" về trạng thái inactive?`,
      'Xác nhận khôi phục',
      { confirmButtonText: 'Khôi phục', cancelButtonText: 'Hủy', type: 'info' }
    )
    await contestStore.restoreContest(row.id)
    loadContests()
  } catch (error) {
    if (error !== 'cancel') handleApiError(error, 'Khôi phục thất bại')
  }
}

const handleToggleVisibility = async (row) => {
  try {
    await contestStore.toggleVisibility(row.id)
    loadContests()
  } catch {}
}

// ====================
// Problems Sub-view
// ====================
const contestProblems = ref([])
const problemsLoading = ref(false)
const allProblems = ref([])
const selectedProblemIds = ref([])
const addProblemDialogVisible = ref(false)
const selectedProblemsToAdd = ref([])
const problemSearchQuery = ref('')

const loadContestProblems = async () => {
  if (!selectedContest.value) return
  try {
    problemsLoading.value = true
    contestProblems.value = await contestsAPI.adminGetProblems(selectedContest.value.id)
  } catch (error) {
    handleApiError(error, 'Không thể tải danh sách bài tập')
  } finally {
    problemsLoading.value = false
  }
}

const openProblemsView = (row) => {
  openDetail(row)
}

const filteredAllProblems = computed(() => {
  // Use the problems directly from the store as they are fetched with keyword
  return allProblems.value
})

const loadAllProblemsForPicker = async () => {
  const contestId = selectedContest.value?.id
  if (!contestId) return
  
  try {
    await problemStore.fetchProblems({ 
      page: 0, 
      size: 50, 
      keyword: problemSearchQuery.value,
      contestId: contestId
    }, false, true)
    allProblems.value = problemStore.problems
  } catch (error) {
    console.error('Lỗi khi tải danh sách bài tập:', error)
  }
}

watch(addProblemDialogVisible, (newVal) => {
  if (newVal) {
    problemSearchQuery.value = ''
    loadAllProblemsForPicker()
  }
})

let searchTimeout = null
watch(problemSearchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadAllProblemsForPicker()
  }, 300)
})

const toggleProblemSelection = (p) => {
  if (p.isAdded) return
  const existing = selectedProblemsToAdd.value.findIndex(x => x.problemId === p.id)
  if (existing > -1) {
    selectedProblemsToAdd.value.splice(existing, 1)
  } else {
    const totalCount = contestProblems.value.length + selectedProblemsToAdd.value.length
    let nextChar = 'A'
    if (totalCount < 26) {
      nextChar = String.fromCharCode(65 + totalCount)
    } else {
      nextChar = 'P' + (totalCount + 1)
    }
    selectedProblemsToAdd.value.push({
      problemId: p.id,
      title: p.title,
      displayId: nextChar,
      points: 100,
      sortOrder: totalCount + 1
    })
  }
}

const handleAddProblem = async () => {
  if (selectedProblemsToAdd.value.length === 0) { ElMessage.warning('Vui lòng chọn bài tập'); return }
  try {
    await contestStore.addProblems(selectedContest.value.id, selectedProblemsToAdd.value)
    addProblemDialogVisible.value = false
    selectedProblemsToAdd.value = []
    await loadContestProblems()
  } catch {}
}

const handleRemoveProblems = async () => {
  if (selectedProblemIds.value.length === 0) { ElMessage.warning('Vui lòng chọn ít nhất một bài'); return }
  try {
    await ElMessageBox.confirm('Xóa các bài đã chọn khỏi contest?', 'Xác nhận', { confirmButtonText: 'Xóa', cancelButtonText: 'Hủy', type: 'warning' })
    // selectedProblemIds is the ContestProblem IDs within the contest, not problemIds. We need problemId.
    const problemIds = contestProblems.value.filter(p => selectedProblemIds.value.includes(p.id)).map(p => p.problemId)
    await contestStore.removeProblems(selectedContest.value.id, problemIds)
    selectedProblemIds.value = []
    await loadContestProblems()
  } catch (e) {
    if (e !== 'cancel') handleApiError(e, 'Xóa bài thất bại')
  }
}

// ====================
// Participants Sub-view
// ====================
const participants = ref([])
const participantsPagination = ref({ page: 0, size: 20, totalElements: 0 })
const participantsLoading = ref(false)
const participantSearch = ref('')
const filterDisqualified = ref(null)
const selectedParticipantRows = ref([])

const canBanSelected = computed(() => {
  return selectedParticipantRows.value.length > 0 && selectedParticipantRows.value.some(r => !r.isDisqualified)
})

const canUnbanSelected = computed(() => {
  return selectedParticipantRows.value.length > 0 && selectedParticipantRows.value.some(r => !!r.isDisqualified)
})

const loadParticipants = async () => {
  if (!selectedContest.value) return
  try {
    participantsLoading.value = true
    const params = {
      page: participantsPagination.value.page,
      size: participantsPagination.value.size,
      sort: 'createdDate,desc'
    }
    if (participantSearch.value) params.keyword = participantSearch.value
    if (filterDisqualified.value !== null) params.isDisqualified = filterDisqualified.value
    const data = await contestsAPI.adminGetParticipants(selectedContest.value.id, params)
    participants.value = data.content || []
    participantsPagination.value.totalElements = data.totalElements || 0
  } catch (error) {
    handleApiError(error, 'Không thể tải danh sách người tham gia')
  } finally {
    participantsLoading.value = false
  }
}

const openParticipantsView = (row) => {
  openDetail(row).then(() => switchDetailTab('participants'))
}

const handleBanUsers = async () => {
  if (selectedParticipantRows.value.length === 0) { ElMessage.warning('Vui lòng chọn ít nhất một người'); return }
  try {
    const ids = selectedParticipantRows.value.map(r => r.userId)
    await ElMessageBox.confirm('Cấm các người dùng đã chọn khỏi contest?', 'Xác nhận', { type: 'warning' })
    await contestStore.banUsers(selectedContest.value.id, ids)
    selectedParticipantRows.value = []
    await loadParticipants()
  } catch (e) {
    if (e !== 'cancel') handleApiError(e, 'Cấm người dùng thất bại')
  }
}

const handleUnbanUsers = async () => {
  if (selectedParticipantRows.value.length === 0) { ElMessage.warning('Vui lòng chọn ít nhất một người'); return }
  try {
    const ids = selectedParticipantRows.value.map(r => r.userId)
    await contestStore.unbanUsers(selectedContest.value.id, ids)
    selectedParticipantRows.value = []
    await loadParticipants()
  } catch {}
}

// ====================
// Submissions Sub-view
// ====================
const contestSubmissions = ref([])
const submissionsPagination = ref({ page: 0, size: 20, totalElements: 0 })
const submissionsLoading = ref(false)

const loadContestSubmissions = async () => {
  if (!selectedContest.value) return
  try {
    submissionsLoading.value = true
    const data = await contestsAPI.adminGetSubmissions(selectedContest.value.id, {
      page: submissionsPagination.value.page,
      size: submissionsPagination.value.size,
      sort: 'createdDate,desc'
    })
    contestSubmissions.value = data.content || []
    submissionsPagination.value.totalElements = data.totalElements || 0
  } catch (error) {
    handleApiError(error, 'Không thể tải lịch sử nộp bài')
  } finally {
    submissionsLoading.value = false
  }
}

const openSubmissionsView = (row) => {
  openDetail(row).then(() => switchDetailTab('submissions'))
}

// ====================
// Helpers
// ====================
const parseServerDate = (str) => {
  if (!str) return null
  // Append 'Z' if no timezone info — backend returns LocalDateTime without offset
  const s = (str.includes('Z') || str.includes('+')) ? str : str + 'Z'
  return new Date(s)
}

const formatDateTime = (dt) => {
  const d = parseServerDate(dt)
  if (!d) return '—'
  return d.toLocaleString(undefined, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  })
}

const formatDate = formatDateTime  // alias — same precision for table column

const getContestStatusClass = (s) => ({
  ONGOING: 'status-ongoing',
  UPCOMING: 'status-upcoming',
  ENDED: 'status-ended'
}[s] || '')

const getContestStatusLabel = (s) => ({
  ONGOING: 'Đang diễn ra',
  UPCOMING: 'Sắp diễn ra',
  ENDED: 'Đã kết thúc'
}[s] || s)

const getVerdictClass = (v) => ({
  AC: 'verdict-ac', WA: 'verdict-wa', TLE: 'verdict-tle', MLE: 'verdict-tle',
  RE: 'verdict-wa', CE: 'verdict-info', PENDING: 'verdict-info', SE: 'verdict-wa'
}[v] || '')

onMounted(loadContests)
</script>

<template>
  <div class="content-section">
    <!-- ===== LIST VIEW ===== -->
    <template v-if="viewMode === 'list'">
      <div class="section-header">
        <div>
          <h1 class="section-title">Quản lý Contest</h1>
          <p class="section-subtitle">Tạo và quản trị các cuộc thi lập trình</p>
        </div>
        <el-button type="primary" @click="openCreateForm" class="add-button">
          <Plus :size="16" style="margin-right: 8px;" /> Tạo Contest
        </el-button>
      </div>

      <!-- Controls -->
      <div class="table-controls">
        <div class="search-wrap">
          <Search class="search-icon" :size="16" />
          <input 
            type="text" 
            v-model="searchQuery" 
            @keyup.enter="handleSearch" 
            placeholder="Tìm kiếm contest..." 
            class="search-input" 
          />
        </div>

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
              <el-tooltip content="Lọc contest" placement="top" effect="dark" :hide-after="0">
                <button class="control-btn" :class="{ active: hasActiveFilters }">
                  <Filter :size="16" />
                </button>
              </el-tooltip>
            </div>
          </template>
          
          <div class="filter-content">
            <div class="filter-header">
              <span>Bộ lọc Contest</span>
            </div>
            
            <div class="filter-list">
              <!-- Contest Status -->
              <div class="filter-row">
                <el-checkbox v-model="filters.contestStatus.active" @change="handleFilterChange" class="dark-checkbox" />
                <span class="filter-label" :class="{ 'is-active': filters.contestStatus.active }">
                  <Clock :size="14" /> Trạng thái
                </span>
                <el-select 
                  v-model="filters.contestStatus.value" 
                  size="small" 
                  class="dark-select value-select" 
                  :disabled="!filters.contestStatus.active"
                  @change="handleFilterChange"
                  popper-class="dark-select-dropdown"
                >
                  <el-option label="Sắp diễn ra" value="UPCOMING" />
                  <el-option label="Đang diễn ra" value="ONGOING" />
                  <el-option label="Đã kết thúc" value="ENDED" />
                </el-select>
              </div>

              <!-- Visibility -->
              <div class="filter-row">
                <el-checkbox v-model="filters.visibility.active" @change="handleFilterChange" class="dark-checkbox" />
                <span class="filter-label" :class="{ 'is-active': filters.visibility.active }">
                  <Eye :size="14" /> Visibility
                </span>
                <el-select 
                  v-model="filters.visibility.value" 
                  size="small" 
                  class="dark-select value-select" 
                  :disabled="!filters.visibility.active"
                  @change="handleFilterChange"
                  popper-class="dark-select-dropdown"
                >
                  <el-option label="Công khai" value="PUBLIC" />
                  <el-option label="Riêng tư" value="PRIVATE" />
                </el-select>
              </div>

              <!-- Rule Type -->
              <div class="filter-row">
                <el-checkbox v-model="filters.ruleType.active" @change="handleFilterChange" class="dark-checkbox" />
                <span class="filter-label" :class="{ 'is-active': filters.ruleType.active }">
                  <BookOpen :size="14" /> Quy tắc
                </span>
                <el-select 
                  v-model="filters.ruleType.value" 
                  size="small" 
                  class="dark-select value-select" 
                  :disabled="!filters.ruleType.active"
                  @change="handleFilterChange"
                  popper-class="dark-select-dropdown"
                >
                  <el-option label="ACM" value="ACM" />
                  <el-option label="OI" value="OI" />
                </el-select>
              </div>

              <!-- General Status (Record Status) -->
              <div class="filter-row">
                <el-checkbox v-model="filters.status.active" @change="handleFilterChange" class="dark-checkbox" />
                <span class="filter-label" :class="{ 'is-active': filters.status.active }">
                  <FileText :size="14" /> Record
                </span>
                <el-select 
                  v-model="filters.status.value" 
                  size="small" 
                  class="dark-select value-select" 
                  :disabled="!filters.status.active"
                  @change="handleFilterChange"
                  popper-class="dark-select-dropdown"
                >
                  <el-option label="Active" value="ACTIVE" />
                  <el-option label="Deleted" value="DELETED" />
                </el-select>
              </div>

              <div class="filter-footer">
                <el-button link class="reset-filters" @click="resetFilters">
                  <RotateCcw :size="14" style="margin-right: 6px;" /> Đặt lại
                </el-button>
              </div>
            </div>
          </div>
        </el-popover>

        <div class="spacer" />
        <span class="count-text">{{ totalElements }} contests</span>
      </div>

      <TableSkeleton v-if="contestStore.loading && contests.length === 0" :columns="6" :rows="10" />

      <el-table v-else :data="contests" class="dashboard-table leetcode-table" v-loading="contestStore.loading">
        <template #empty>
          <el-empty description="Không tìm thấy contest nào" />
        </template>

        <el-table-column label="#" width="50" align="center">
          <template #default="{ $index }">
            <span class="cell-index">{{ (pagination.page - 1) * pagination.size + $index + 1 }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Tiêu đề" min-width="220">
          <template #default="{ row }">
            <span class="cell-title" @click="openDetail(row)">{{ row.title }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Rule" width="100" align="center">
          <template #default="{ row }">
            <span :class="['rule-badge', row.ruleType === 'ACM' ? 'rule-acm' : 'rule-oi']">{{ row.ruleType }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Trạng thái" width="150" align="center">
          <template #default="{ row }">
            <span :class="['status-badge', getContestStatusClass(row.contestStatus)]">{{ getContestStatusLabel(row.contestStatus) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Visibility" width="100" align="center">
          <template #default="{ row }">
            <span :class="['visibility-badge', row.visibility === 'PUBLIC' ? 'vis-public' : 'vis-private']">{{ row.visibility }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Ngày bắt đầu" width="160" align="center">
          <template #default="{ row }">
            <span class="cell-date">{{ formatDate(row.startTime) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Ngày kết thúc" width="160" align="center">
          <template #default="{ row }">
            <span class="cell-date">{{ formatDate(row.endTime) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Thí sinh" width="80" align="center">
          <template #default="{ row }">
            <span class="cell-date">{{ row.participantCount || 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Trạng thái bản ghi" width="150" align="center">
          <template #default="{ row }">
            <span :class="['status-badge', row.status === 'DELETED' ? 'status-deleted' : 'status-active']">{{ row.status }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Hành động" width="170" align="center" fixed="right">
          <template #default="{ row }">
            <!-- DELETED: chỉ hiển thị Chi tiết + Khôi phục -->
            <div v-if="row.status === 'DELETED'" class="action-buttons">
              <el-tooltip content="Chi tiết" placement="top" effect="dark" :hide-after="0" :show-after="200">
                <el-button link :icon="Eye" @click="openDetail(row)" class="action-btn" />
              </el-tooltip>
              <el-tooltip content="Khôi phục" placement="top" effect="dark" :hide-after="0" :show-after="200">
                <el-button link :icon="RotateCcw" @click="handleRestore(row)" class="action-btn action-restore" />
              </el-tooltip>
            </div>

            <!-- ACTIVE: 3 primary + dropdown 3 chấm -->
            <div v-else class="action-buttons">
              <el-tooltip content="Chi tiết" placement="top" effect="dark" :hide-after="0" :show-after="200">
                <el-button link :icon="Eye" @click="openDetail(row)" class="action-btn" />
              </el-tooltip>
              <el-tooltip content="Bài tập" placement="top" effect="dark" :hide-after="0" :show-after="200">
                <el-button link :icon="BookOpen" @click="openProblemsView(row)" class="action-btn" />
              </el-tooltip>
              <el-tooltip content="Thí sinh" placement="top" effect="dark" :hide-after="0" :show-after="200">
                <el-button link :icon="Users" @click="openParticipantsView(row)" class="action-btn" />
              </el-tooltip>

              <!-- Dropdown 3 chấm -->
              <el-dropdown trigger="hover" placement="bottom-end" :show-timeout="80" :hide-timeout="120" popper-class="action-dropdown">
                <el-button link class="action-btn more-btn">
                  <MoreVertical :size="16" />
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu class="dark-action-menu">
                    <el-dropdown-item @click="openEditForm(row)">
                      <Edit :size="14" style="margin-right:8px;" /> Chỉnh sửa
                    </el-dropdown-item>
                    <el-dropdown-item @click="openSubmissionsView(row)">
                      <FileText :size="14" style="margin-right:8px;" /> Submissions
                    </el-dropdown-item>
                    <el-dropdown-item @click="handleToggleVisibility(row)" divided>
                      <component :is="row.status === 'ACTIVE' ? EyeOff : Eye" :size="14" style="margin-right:8px;" />
                      {{ row.status === 'ACTIVE' ? 'Gỡ bỏ (Ẩn)' : 'Công khai (Hiển thị)' }}
                    </el-dropdown-item>
                    <el-dropdown-item @click="handleDelete(row)" class="danger-item">
                      <Trash2 :size="14" style="margin-right:8px;" /> Xóa contest
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <DarkPagination
        v-if="totalElements > 0"
        :current-page="pagination.page"
        :page-size="pagination.size"
        :total="totalElements"
        @current-change="handlePageChange"
      />
    </template>

    <!-- ===== CONTEST DETAIL VIEW (WITH TABS) ===== -->
    <template v-if="viewMode === 'detail' && selectedContest">
      <div class="back-bar">
        <el-button link @click="goBackToList"><RotateCcw :size="16" style="margin-right:6px;" /> Danh sách</el-button>
        <span class="sub-title">Quản trị Contest: <strong>{{ selectedContest.title }}</strong></span>
        <div class="spacer" />
        <div class="detail-actions-inline">
          <el-button size="small" class="detail-action-btn edit-btn" @click="openEditForm(selectedContest)">
            <Edit :size="14" style="margin-right:6px;" /> Chỉnh sửa
          </el-button>
          <el-button size="small" class="detail-action-btn toggle-btn" @click="handleToggleVisibility(selectedContest)">
            <component :is="selectedContest.status === 'ACTIVE' ? EyeOff : Eye" :size="14" style="margin-right:6px;" />
            {{ selectedContest.status === 'ACTIVE' ? 'Gỡ bỏ (Ẩn)' : 'Công khai (Hiển thị)' }}
          </el-button>
        </div>
      </div>

      <div class="detail-container">
        <!-- Collapsible Header Card -->
        <div class="collapsible-header-card" :class="{ 'is-collapsed': isDetailHeaderCollapsed }">
          <div class="header-main" @click="isDetailHeaderCollapsed = !isDetailHeaderCollapsed">
            <div class="header-info">
              <h2 class="detail-title">{{ selectedContest.title }}</h2>
              <div class="detail-badges">
                <span :class="['rule-badge', selectedContest.ruleType === 'ACM' ? 'rule-acm' : 'rule-oi']">{{ selectedContest.ruleType }}</span>
                <span :class="['status-badge', getContestStatusClass(selectedContest.contestStatus)]">{{ getContestStatusLabel(selectedContest.contestStatus) }}</span>
                <span :class="['visibility-badge', selectedContest.visibility === 'PUBLIC' ? 'vis-public' : 'vis-private']">{{ selectedContest.visibility }}</span>
              </div>
            </div>
            <div class="header-toggle-icon">
              <ChevronDown v-if="isDetailHeaderCollapsed" :size="18" />
              <ChevronUp v-else :size="18" />
            </div>
          </div>

          <div v-show="!isDetailHeaderCollapsed" class="header-content">
            <div class="detail-meta-grid">
              <div class="meta-item"><span class="meta-label">Bắt đầu</span><span class="meta-value">{{ formatDateTime(selectedContest.startTime) }}</span></div>
              <div class="meta-item"><span class="meta-label">Kết thúc</span><span class="meta-value">{{ formatDateTime(selectedContest.endTime) }}</span></div>
              <div class="meta-item"><span class="meta-label">Người tạo</span><span class="meta-value">{{ selectedContest.authorUsername }}</span></div>
              <div class="meta-item" v-if="selectedContest.durationMinutes"><span class="meta-label">Thời hạn làm bài</span><span class="meta-value">{{ selectedContest.durationMinutes }} phút</span></div>
              <div class="meta-item"><span class="meta-label">Thí sinh</span><span class="meta-value">{{ selectedContest.participantCount || 0 }}</span></div>
              <div class="meta-item" v-if="selectedContest.password"><span class="meta-label">Mật khẩu</span><span class="meta-value">{{ selectedContest.password }}</span></div>
            </div>
            <div class="detail-description">
              <div class="meta-label" style="margin-bottom: 8px;">Mô tả</div>
              <div class="desc-content" v-html="selectedContest.description" />
            </div>
          </div>
        </div>

        <!-- Detail Tabs -->
        <div class="detail-tabs-area">
          <div class="detail-tabs-container">
            <el-tabs v-model="activeDetailTab" @tab-change="switchDetailTab" class="dark-tabs-system">
            <!-- Problems Tab -->
            <el-tab-pane name="problems">
              <template #label><span class="tab-label-custom"><BookOpen :size="14" /> Bài tập</span></template>
              <div class="tab-pane-content">
                <div class="tab-toolbar">
                  <el-button class="add-button-light" size="small" @click="addProblemDialogVisible = true">
                    <Plus :size="14" style="margin-right:6px;" /> Thêm bài tập
                  </el-button>
                  <el-button class="delete-btn-custom" size="small" :disabled="selectedProblemIds.length === 0" @click="handleRemoveProblems">
                    <Trash2 :size="14" style="margin-right:6px;" /> Xóa ({{ selectedProblemIds.length }})
                  </el-button>
                </div>
                <el-table :data="contestProblems" class="dashboard-table leetcode-table" v-loading="problemsLoading" @selection-change="(val) => selectedProblemIds = val.map(r => r.id)">
                  <el-table-column type="selection" width="50" />
                  <el-table-column label="ID" width="90" align="center">
                    <template #default="{ row }"><span class="cell-date">{{ row.displayId }}</span></template>
                  </el-table-column>
                  <el-table-column label="Tiêu đề bài tập" min-width="200">
                    <template #default="{ row }">
                      <span class="cell-title clickable-link" @click="router.push(`/problems/${row.problemSlug}`)">{{ row.originalTitle }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="Điểm" width="90" align="center">
                    <template #default="{ row }"><span class="cell-points">{{ row.points }}</span></template>
                  </el-table-column>
                  <el-table-column label="Thứ tự" width="90" align="center">
                    <template #default="{ row }"><span class="cell-date">{{ row.sortOrder }}</span></template>
                  </el-table-column>
                  <template #empty><el-empty description="Chưa có bài tập nào" /></template>
                </el-table>
              </div>
            </el-tab-pane>

            <!-- Participants Tab -->
            <el-tab-pane name="participants">
              <template #label><span class="tab-label-custom"><Users :size="14" /> Thí sinh</span></template>
              <div class="tab-pane-content">
                <div class="tab-toolbar">
                  <div class="search-wrap">
                    <Search class="search-icon" :size="16" />
                    <input type="text" v-model="participantSearch" @keyup.enter="() => { participantsPagination.page = 0; loadParticipants() }" placeholder="Tìm thí sinh..." class="search-input-sm" />
                  </div>
                  <el-select v-model="filterDisqualified" placeholder="Tất cả" clearable size="small" class="filter-select-sm dark-select" @change="() => { participantsPagination.page = 0; loadParticipants() }" popper-class="dark-select-dropdown">
                    <el-option label="Đang tham gia" :value="false" />
                    <el-option label="Đã bị cấm" :value="true" />
                  </el-select>
                  <div class="spacer" />
                  <el-button class="delete-btn-custom" size="small" :disabled="!canBanSelected" @click="handleBanUsers">
                    <X :size="14" style="margin-right:4px;" /> Cấm thi
                  </el-button>
                  <el-button class="action-btn-custom" size="small" :disabled="!canUnbanSelected" @click="handleUnbanUsers">
                    <Check :size="14" style="margin-right:4px;" /> Bỏ cấm
                  </el-button>
                </div>
                <el-table :data="participants" class="dashboard-table leetcode-table" v-loading="participantsLoading" @selection-change="(val) => selectedParticipantRows = val">
                  <el-table-column type="selection" width="50" />
                  <el-table-column label="Người dùng" min-width="150">
                    <template #default="{ row }">
                      <div class="user-cell">
                        <span class="cell-title clickable-link" @click="router.push(`/profile/${row.username}`)">{{ row.username }}</span>
                        <span class="cell-subtext">{{ row.email }}</span>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="Trạng thái" width="140" align="center">
                    <template #default="{ row }">
                      <span :class="['status-badge', row.isDisqualified ? 'status-deleted' : 'status-active']">
                        {{ row.isDisqualified ? 'Đã bị cấm' : 'Đang tham gia' }}
                      </span>
                    </template>
                  </el-table-column>
                  <template #empty><el-empty description="Chưa có thí sinh nào" /></template>
                </el-table>
                <div class="table-pagination-footer">
                  <DarkPagination
                    v-if="participantsPagination.totalElements > 0"
                    :current-page="participantsPagination.page + 1"
                    :page-size="participantsPagination.size"
                    :total="participantsPagination.totalElements"
                    @current-change="(p) => { participantsPagination.page = p - 1; loadParticipants() }"
                  />
                </div>
              </div>
            </el-tab-pane>

            <!-- Submissions Tab -->
            <el-tab-pane name="submissions">
              <template #label><span class="tab-label-custom"><FileText :size="14" /> Submissions</span></template>
              <div class="tab-pane-content">
                <el-table :data="contestSubmissions" class="dashboard-table leetcode-table" v-loading="submissionsLoading">
                  <el-table-column label="Thời gian" min-width="160">
                    <template #default="{ row }"><span class="cell-date">{{ new Date(row.createdDate).toLocaleString('vi-VN') }}</span></template>
                  </el-table-column>
                  <el-table-column label="User" min-width="140">
                    <template #default="{ row }">
                      <span class="cell-title clickable-link" @click="router.push(`/profile/${row.username}`)">{{ row.username }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="Bài" min-width="160">
                    <template #default="{ row }">
                      <span class="cell-title clickable-link" @click="router.push(`/problems/${row.problemSlug}`)">{{ row.problemTitle || row.problemId }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="Kết quả" width="120" align="center">
                    <template #default="{ row }"><span :class="['verdict-badge', getVerdictClass(row.verdict)]">{{ row.verdict || 'PENDING' }}</span></template>
                  </el-table-column>
                  <el-table-column label="Lang" width="90" align="center">
                    <template #default="{ row }"><el-tag type="info" size="small" effect="dark">{{ row.languageKey }}</el-tag></template>
                  </el-table-column>
                  <template #empty><el-empty description="Chưa có submission nào" /></template>
                </el-table>
                <div class="table-pagination-footer">
                  <DarkPagination
                    v-if="submissionsPagination.totalElements > 0"
                    :current-page="submissionsPagination.page + 1"
                    :page-size="submissionsPagination.size"
                    :total="submissionsPagination.totalElements"
                    @current-change="(p) => { submissionsPagination.page = p - 1; loadContestSubmissions() }"
                  />
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
          </div>
        </div>
      </div>
    </template>

    <!-- ===== CREATE/EDIT FORM DIALOG ===== -->
    <el-dialog v-model="formDialogVisible" :title="formMode === 'create' ? 'Tạo Contest mới' : 'Chỉnh sửa Contest'" width="700px" class="dark-dialog custom-message-box-theme" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="formRules" label-position="top" class="dark-form">
        <el-form-item label="Tiêu đề" prop="title">
          <el-input v-model="form.title" placeholder="Nhập tiêu đề contest..." />
        </el-form-item>

        <div class="form-row-2">
          <el-form-item label="Thời gian bắt đầu" prop="startTime">
            <!-- No value-format: returns Date object so we can convert local→UTC in submitForm -->
            <el-date-picker v-model="form.startTime" type="datetime" placeholder="Chọn thời gian" style="width: 100%;" />
          </el-form-item>
          <el-form-item label="Thời gian kết thúc" prop="endTime">
            <el-date-picker v-model="form.endTime" type="datetime" placeholder="Chọn thời gian" style="width: 100%;" />
          </el-form-item>
        </div>

        <div class="form-row-2">
          <el-form-item label="Rule Type" prop="ruleType">
            <el-select v-model="form.ruleType" style="width: 100%;" popper-class="dark-select-dropdown">
              <el-option label="ACM" value="ACM" />
              <el-option label="OI" value="OI" />
            </el-select>
          </el-form-item>
          <el-form-item label="Thời gian làm bài (Phút)">
            <el-input-number v-model="form.durationMinutes" :min="1" placeholder="Để trống nếu không giới hạn" style="width: 100%;" />
          </el-form-item>
        </div>

        <div class="form-row-1">
          <el-form-item label="Visibility" prop="visibility">
            <el-select v-model="form.visibility" style="width: 100%;" popper-class="dark-select-dropdown">
              <el-option label="Public" value="PUBLIC" />
              <el-option label="Private" value="PRIVATE" />
            </el-select>
          </el-form-item>
        </div>

        <el-form-item v-if="form.visibility === 'PRIVATE'" label="Mật khẩu">
          <el-input v-model="form.password" show-password placeholder="Mật khẩu cho contest private..." />
        </el-form-item>

        <el-form-item label="Mô tả" prop="description">
          <RichTextEditor v-model:content="form.description" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="formDialogVisible = false" class="dark-btn-cancel">Hủy</el-button>
        <el-button type="primary" :loading="formLoading" @click="submitForm" class="dark-btn-submit">
          {{ formMode === 'create' ? 'Tạo mới' : 'Lưu thay đổi' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- ===== ADD PROBLEM DIALOG ===== -->
    <el-dialog v-model="addProblemDialogVisible" title="Bulk Add Bài tập vào Contest" width="1150px" class="dark-dialog custom-message-box-theme" top="5vh">
      <div class="problem-add-container">
        <!-- Pick Problems Column -->
        <div class="problem-source-col">
          <div class="problem-picker-search">
            <Search :size="16" class="search-icon" />
            <input type="text" v-model="problemSearchQuery" placeholder="Tìm bài tập..." class="search-input" style="width: 100%; box-sizing: border-box;" />
          </div>

          <div class="problem-picker-list thin-scrollbar">
            <div
              v-for="p in allProblems"
              :key="p.id"
              class="problem-picker-item"
              :class="{ 'is-selected': selectedProblemsToAdd.some(x => x.problemId === p.id), 'is-added': p.isAdded }"
              @click="toggleProblemSelection(p)"
            >
              <Check v-if="p.isAdded" :size="14" class="check-icon added-icon" />
              <Check v-else-if="selectedProblemsToAdd.some(x => x.problemId === p.id)" :size="14" class="check-icon selected-icon" style="color: #ffa116" />
              <div v-else class="check-placeholder" style="width:14px; margin-right:8px" />
              
              <span class="picker-title" style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ p.title }}</span>
              <span :class="['picker-diff', `diff-${p.difficulty?.toLowerCase()}`]">{{ p.difficulty }}</span>
            </div>
            <div v-if="filteredAllProblems.length === 0" style="text-align: center; color: #8a8a8a; margin-top: 20px;">Không tìm thấy bài tập</div>
          </div>
        </div>

        <!-- Selected Problems Column -->
        <div class="problem-target-col">
          <div class="target-col-header">Đã chọn ({{ selectedProblemsToAdd.length }})</div>
          <div class="target-col-list thin-scrollbar" v-if="selectedProblemsToAdd.length > 0">
             <div v-for="(item, idx) in selectedProblemsToAdd" :key="item.problemId" class="selected-target-item">
               <div class="target-item-header">
                 <span class="target-item-title">{{ idx + 1 }}. {{ item.title }}</span>
                 <X :size="20" class="remove-target-icon" @click="toggleProblemSelection({ id: item.problemId })" />
               </div>
               <div class="target-item-configs">
                 <div class="cfg-group">
                   <span class="cfg-label">ID HIỂN THỊ</span>
                   <el-input v-model="item.displayId" size="large" class="cfg-input input-display" />
                 </div>
                 <div class="cfg-group">
                   <span class="cfg-label">ĐIỂM</span>
                   <el-input-number v-model="item.points" :min="1" size="large" class="cfg-input input-points" :controls="false" />
                 </div>
                 <div class="cfg-group">
                   <span class="cfg-label">THỨ TỰ</span>
                   <el-input-number v-model="item.sortOrder" :min="1" size="large" class="cfg-input input-sort" :controls="false" />
                 </div>
               </div>
             </div>
          </div>
          <div v-else class="target-col-empty">
             Chưa có bài tập nào được chọn
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="addProblemDialogVisible = false" class="dark-btn-cancel">Hủy</el-button>
        <el-button type="primary" @click="handleAddProblem" :loading="contestStore.loading" class="dark-btn-submit" :disabled="selectedProblemsToAdd.length === 0">Thêm {{ selectedProblemsToAdd.length }} bài</el-button>
      </template>
    </el-dialog>
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

/* Table Controls */
.table-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  flex-wrap: wrap;
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
  width: 220px;
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

.filter-select {
  width: 140px;
}

.spacer {
  flex: 1;
}

.count-text {
  font-size: 13px;
  color: #8a8a8a;
  font-weight: 500;
}

/* LeetCode Table Overrides */
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
  padding: 10px 0;
  background: transparent !important;
}

:deep(.leetcode-table tr) {
  background: transparent !important;
}

:deep(.leetcode-table tr:nth-child(odd) td.el-table__cell) {
  background: rgba(255, 255, 255, 0.03) !important;
}

:deep(.leetcode-table tr:hover td.el-table__cell) {
  background: rgba(255, 255, 255, 0.07) !important;
}

.cell-index { color: #8a8a8a; font-size: 13px; }
.cell-title { font-size: 14px; font-weight: 500; color: #eff2f6; cursor: pointer; transition: color 0.2s; }
.cell-title:hover { color: var(--accent-primary); }
.cell-date { font-size: 13px; color: #8a8a8a; }

/* Badges */
.rule-badge {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
}
.rule-acm { background: rgba(0, 184, 163, 0.15); color: #00b8a3; }
.rule-oi  { background: rgba(255, 161, 22, 0.15); color: #ffa116; }

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}
.status-ongoing  { background: rgba(0, 184, 163, 0.12); color: #00b8a3; }
.status-upcoming { background: rgba(255, 192, 30, 0.12); color: #ffc01e; }
.status-ended    { background: rgba(255,255,255,0.08); color: #8a8a8a; }
.status-active   { background: rgba(0, 184, 163, 0.1); color: #00b8a3; }
.status-deleted  { background: rgba(239, 71, 67, 0.1); color: #ef4743; }

.visibility-badge {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}
.vis-public  { background: rgba(0, 184, 163, 0.1); color: #00b8a3; }
.vis-private { background: rgba(239, 71, 67, 0.1); color: #ef4743; }

/* Action buttons */
.action-buttons { display: flex; gap: 2px; justify-content: center; flex-wrap: nowrap; }
:deep(.action-btn) { padding: 4px; color: var(--text-secondary); transition: all 0.2s ease; }
:deep(.action-btn:hover) { color: var(--accent-primary); background: rgba(255, 161, 22, 0.1); }
:deep(.action-btn.action-danger:hover) { color: var(--error); background: rgba(239, 71, 67, 0.1); }
:deep(.action-btn.action-restore:hover) { color: #00b8a3; background: rgba(0, 184, 163, 0.1); }
:deep(.more-btn) { color: #8a8a8a; }
:deep(.more-btn:hover) { color: #fff; background: rgba(255, 255, 255, 0.05); }

/* Action Dropdown Menu */
:deep(.dark-action-menu) {
  background-color: #1e1e1e !important;
  border: 1px solid #333 !important;
  padding: 4px 0 !important;
}

:deep(.dark-action-menu .el-dropdown-menu__item) {
  color: #eff2f6 !important;
  font-size: 13px !important;
  padding: 8px 16px !important;
  display: flex !important;
  align-items: center !important;
}

:deep(.dark-action-menu .el-dropdown-menu__item:hover) {
  background-color: rgba(255, 255, 255, 0.05) !important;
  color: var(--accent-primary) !important;
}

:deep(.dark-action-menu .el-dropdown-menu__item.danger-item) {
  color: #ef4743 !important;
}

:deep(.dark-action-menu .el-dropdown-menu__item.danger-item:hover) {
  background-color: rgba(239, 71, 67, 0.1) !important;
  color: #ef4743 !important;
}

:deep(.dark-action-menu .el-dropdown-menu__item--divided) {
  border-top-color: #333 !important;
}

/* Back bar */
.back-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #3e3e3e;
}

.sub-title {
  font-size: 16px;
  color: var(--text-secondary);
  font-weight: 500;
}

.sub-title strong {
  color: var(--text-primary);
}

/* Sub-toolbar */
.sub-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

/* Detail card */
.detail-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 16px;
  padding: 28px;
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.detail-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.detail-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.detail-meta-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.meta-label {
  font-size: 12px;
  font-weight: 600;
  color: #8a8a8a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.meta-value {
  font-size: 14px;
  color: var(--text-primary);
}

.detail-description {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 24px;
}

.desc-content {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
}

.detail-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* Form Dialog */
.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-row-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

/* Problem picker */
.problem-picker-search {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.problem-picker-search .search-icon {
  position: absolute;
  left: 14px;
  color: #8a8a8a;
}

.problem-picker-search .search-input {
  width: 100%;
  padding-left: 40px;
}

.problem-picker-list {
  max-height: 260px;
  overflow-y: auto;
  border: 1px solid #3e3e3e;
  border-radius: 8px;
}

.problem-picker-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #282828;
}

.problem-picker-item:last-child { border-bottom: none; }
.problem-picker-item:hover:not(.is-added) { background: rgba(255, 255, 255, 0.05); }
.problem-picker-item.is-selected { background: rgba(255, 161, 22, 0.1); }
.problem-picker-item.is-added { opacity: 0.5; cursor: not-allowed; }

.check-icon { color: #00b8a3; }
.added-icon { color: #00b8a3; }

.picker-title { flex: 1; font-size: 14px; color: var(--text-primary); }
.picker-diff {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}
.diff-easy   { background: rgba(0,184,163,0.15); color: #00b8a3; }
.diff-medium { background: rgba(255,192,30,0.15); color: #ffc01e; }
.diff-hard   { background: rgba(239,71,67,0.15); color: #ef4743; }

/* Verdict badges */
.verdict-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
}
.verdict-ac   { color: #2cbb5d; background: rgba(44,187,93,0.12); }
.verdict-wa   { color: #ef4743; background: rgba(239,71,67,0.12); }
.verdict-tle  { color: #ffa116; background: rgba(255,161,22,0.12); }
.verdict-info { color: #8a8a8a; background: rgba(255,255,255,0.08); }

/* Dark form / dialog shared overrides */
:deep(.el-form-item__label) { color: #8a8a8a !important; font-weight: 600; font-size: 12px; text-transform: uppercase; }
:deep(.el-input__wrapper), :deep(.el-textarea__inner), :deep(.el-select__wrapper) {
  background-color: #141414 !important;
  border: 1px solid #333 !important;
  box-shadow: none !important;
}
:deep(.el-input__inner) { color: #eff2f6 !important; }
:deep(.el-input__wrapper.is-focus), :deep(.el-select__wrapper.is-focused) { border-color: #ffa116 !important; }
:deep(.el-date-editor .el-input__wrapper) { background-color: #141414 !important; border: 1px solid #333 !important; }

.dark-btn-cancel {
  background-color: transparent;
  border-color: #5c5c5c;
  color: #8a8a8a;
}
.dark-btn-cancel:hover { color: #eff2f6; border-color: #8a8a8a; }
.dark-btn-submit {
  background-color: var(--accent-primary);
  border-color: var(--accent-primary);
  color: #000;
}
.dark-btn-submit:hover { background-color: #ff8800; border-color: #ff8800; }

.count-text {
  font-size: 13px;
  color: #8a8a8a;
  font-weight: 500;
}
</style>

<style>
/* Global Popover Styles for UI components appended to body */
.filter-popover.el-popper {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
  padding: 0 !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
  color: #eff2f6 !important;
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

.filter-footer {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #3e3e3e;
  padding-top: 12px;
  margin-top: 4px;
}

.reset-filters {
  color: #eff2f6 !important;
  font-size: 13px;
}

.reset-filters:hover {
  color: #fff !important;
}

/* Custom Select styling */
.dark-select.value-select {
  flex: 1;
}

.dark-select .el-input__wrapper,
.dark-select .el-select__wrapper {
  background-color: #333 !important;
  box-shadow: 0 0 0 1px #3e3e3e inset !important;
  border-radius: 6px;
}

.dark-select .el-input__inner,
.dark-select .el-select__placeholder {
  color: #eff2f6 !important;
}

.dark-select.el-select:hover:not(.is-disabled) .el-input__wrapper,
.dark-select.el-select:hover:not(.is-disabled) .el-select__wrapper {
  box-shadow: 0 0 0 1px #5c5c5c inset !important;
}

.dark-select.el-select .el-input.is-focus .el-input__wrapper,
.dark-select.el-select .el-select__wrapper.is-focused {
  box-shadow: 0 0 0 1px var(--accent-primary) inset !important;
}

/* Disabled states */
.dark-select .el-input.is-disabled .el-input__wrapper,
.dark-select .el-select__wrapper.is-disabled {
  background-color: #282828 !important;
  box-shadow: 0 0 0 1px #333 inset !important;
}

.dark-select .el-input.is-disabled .el-input__inner,
.dark-select .el-select__wrapper.is-disabled .el-select__placeholder {
  color: #5c5c5c !important;
}

/* Custom Checkbox styling */
.dark-checkbox .el-checkbox__inner {
  background-color: transparent !important;
  border-color: #5c5c5c !important;
  border-radius: 4px;
}

.dark-checkbox.is-checked .el-checkbox__inner {
  background-color: transparent !important;
  border-color: #5c5c5c !important;
}

.dark-checkbox.is-checked .el-checkbox__inner::after {
  border-color: #8a8a8a !important;
}

/* Control buttons (Filter button) */
.control-btn {
  height: 36px;
  width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282828;
  border: 1px solid transparent;
  border-radius: 50%;
  color: #8a8a8a;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:hover {
  background: #333;
  color: #eff2f6;
}

.control-btn.active {
  background: rgba(255, 161, 22, 0.1);
  border-color: rgba(255, 161, 22, 0.3);
  color: var(--accent-primary);
}

.dark-select-dropdown.el-popper {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
}

.dark-select-dropdown .el-select-dropdown__item {
  color: #eff2f6 !important;
}

.dark-select-dropdown .el-select-dropdown__item.is-hovering,
.dark-select-dropdown .el-select-dropdown__item:hover {
  background-color: #333 !important;
}

.dark-select-dropdown .el-popper__arrow::before {
  background: #282828 !important;
  border-color: #3e3e3e !important;
}

/* Detail View Refactor Styles */
.detail-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 20px;
}

.collapsible-header-card {
  background: #1e1e1e;
  border: 1px solid #282828;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.header-main {
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.header-main:hover {
  background: rgba(255, 255, 255, 0.02);
}

.header-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.detail-title {
  font-size: 20px;
  font-weight: 700;
  color: #eff2f6;
  margin: 0;
}

.header-toggle-icon {
  color: #5c5c5c;
  transition: color 0.2s;
}

.header-main:hover .header-toggle-icon {
  color: #8a8a8a;
}

.header-content {
  padding: 0 24px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.03);
  margin-top: -4px;
  padding-top: 20px;
}

.detail-meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-size: 12px;
  color: #8a8a8a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.meta-value {
  font-size: 14px;
  color: #eff2f6;
  font-weight: 500;
}

.detail-description .desc-content {
  font-size: 14px;
  color: #8a8a8a;
  line-height: 1.6;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
}

/* Detail actions buttons */
.detail-action-btn {
  background: #282828 !important;
  border: 1px solid #333 !important;
  color: #eff2f6 !important;
  font-weight: 500;
  transition: all 0.2s;
}

.detail-action-btn:hover {
  background: #333 !important;
  border-color: #5c5c5c !important;
}

.detail-action-btn.edit-btn:hover {
  color: var(--accent-primary) !important;
}

.detail-action-btn.toggle-btn:hover {
  color: #ffa116 !important;
}

/* Clickable links in tables */
.clickable-link {
  cursor: pointer;
  transition: color 0.2s;
  color: #eff2f6;
}

.clickable-link:hover {
  color: var(--accent-primary) !important;
  text-decoration: underline;
}

/* Tab area deep styling overhaul */
.detail-tabs-container {
  background: #1e1e1e;
  border: 1px solid #282828;
  border-radius: 12px;
  overflow: hidden;
}

.dark-tabs-system {
  --el-color-primary: #ffa116 !important;
  --el-border-color-light: #282828 !important;
}

.dark-tabs-system :deep(.el-tabs__header) {
  background-color: #141414 !important;
  margin: 0 !important;
  border-bottom: 1px solid #282828 !important;
  padding: 0 24px !important;
}

.dark-tabs-system :deep(.el-tabs__nav-wrap) {
  padding: 0 !important;
}

.dark-tabs-system :deep(.el-tabs__nav-wrap::after) {
  background-color: transparent !important;
  height: 0 !important;
  display: none !important;
}

.dark-tabs-system :deep(.el-tabs__active-bar) {
  background-color: #ffa116 !important;
  height: 2px !important;
}

.dark-tabs-system :deep(.el-tabs__item) {
  color: #8a8a8a !important;
  height: 50px !important;
  line-height: 50px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  transition: all 0.2s !important;
  border: none !important;
}

.dark-tabs-system :deep(.el-tabs__item.is-active) {
  color: #ffa116 !important;
  font-weight: 700 !important;
}

.dark-tabs-system :deep(.el-tabs__item:hover) {
  color: #eff2f6 !important;
}

.dark-tabs-system :deep(.el-tabs__content) {
  background-color: #1e1e1e !important;
  padding: 0 !important;
}

/* Force dark header on all detail sub-tables */
.tab-pane-content :deep(.el-table__header-wrapper th) {
  background-color: #141414 !important;
  border-bottom: 1px solid #282828 !important;
  color: #8a8a8a !important;
  font-weight: 600 !important;
  font-size: 12px !important;
  text-transform: uppercase !important;
}

.tab-pane-content :deep(.el-table) {
  background-color: #1e1e1e !important;
}

.tab-pane-content :deep(.el-table tr) {
  background-color: #1e1e1e !important;
}

.tab-pane-content :deep(.el-table__body tr:hover > td) {
  background-color: rgba(255, 255, 255, 0.03) !important;
}

/* Checkbox styling */
.tab-pane-content :deep(.el-checkbox__inner) {
  background-color: #141414 !important;
  border-color: #3e3e3e !important;
}

.tab-pane-content :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #ffa116 !important;
  border-color: #ffa116 !important;
}

.tab-pane-content :deep(.el-checkbox__input.is-indeterminate .el-checkbox__inner) {
  background-color: #ffa116 !important;
  border-color: #ffa116 !important;
}

/* Dark Select Boxes for Filters */
:deep(.dark-select .el-select__wrapper) {
  background-color: #1a1a1a !important;
  box-shadow: 0 0 0 1px #333 inset !important;
  border: none !important;
}

:deep(.dark-select .el-select__wrapper.is-focused),
:deep(.dark-select .el-select__wrapper:hover) {
  box-shadow: 0 0 0 1px #ffa116 inset !important;
}

:deep(.dark-select .el-select__placeholder) {
  color: #eff2f6 !important;
}

:deep(.dark-select-dropdown) {
  background-color: #1a1a1a !important;
  border: 1px solid #333 !important;
}

:deep(.dark-select-dropdown .el-select-dropdown__item) {
  color: #8a8a8a !important;
}

:deep(.dark-select-dropdown .el-select-dropdown__item.hover),
:deep(.dark-select-dropdown .el-select-dropdown__item:hover) {
  background-color: #282828 !important;
}

/* Custom Delete and Action buttons within tabs */
.delete-btn-custom {
  background: rgba(239, 71, 67, 0.1) !important;
  border: 1px solid rgba(239, 71, 67, 0.3) !important;
  color: #ef4743 !important;
  padding: 8px 16px;
  font-weight: 600;
  border-radius: 6px;
  transition: all 0.2s;
}

.delete-btn-custom:hover:not(.is-disabled) {
  background: rgba(239, 71, 67, 0.2) !important;
  border-color: #ef4743 !important;
}

.delete-btn-custom.is-disabled {
  background: #222 !important;
  border-color: #333 !important;
  color: #555 !important;
  opacity: 0.6;
}

.action-btn-custom {
  background: rgba(255, 161, 22, 0.1) !important;
  border: 1px solid rgba(255, 161, 22, 0.3) !important;
  color: #ffa116 !important;
  padding: 8px 16px;
  font-weight: 600;
  border-radius: 6px;
  transition: all 0.2s;
}

.action-btn-custom:hover:not(.is-disabled) {
  background: rgba(255, 161, 22, 0.2) !important;
  border-color: #ffa116 !important;
}

.action-btn-custom.is-disabled {
  background: #222 !important;
  border-color: #333 !important;
  color: #555 !important;
  opacity: 0.6;
}

/* Tab area */
.detail-tabs-area {
  min-height: 500px;
}

/* ===== TAB SYSTEM (Global override - renders outside scoped scope) ===== */
.dark-tabs-system .el-tabs__header {
  background-color: #141414 !important;
  border-bottom: 1px solid #282828 !important;
  margin: 0 !important;
  padding: 0 24px !important;
}

.dark-tabs-system .el-tabs__nav-wrap::after {
  display: none !important;
  height: 0 !important;
}

.dark-tabs-system .el-tabs__active-bar {
  background-color: #ffa116 !important;
  height: 2px !important;
}

.dark-tabs-system .el-tabs__item {
  color: #8a8a8a !important;
  border: none !important;
  height: 46px !important;
  line-height: 46px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  transition: color 0.2s !important;
  outline: none !important;
}

.dark-tabs-system .el-tabs__item.is-active {
  color: #ffa116 !important;
  font-weight: 700 !important;
}

.dark-tabs-system .el-tabs__item:hover {
  color: #eff2f6 !important;
}

.dark-tabs-system .el-tabs__content {
  background-color: #1e1e1e !important;
  padding: 0 !important;
}

.tab-pane-content {
  padding: 24px;
}

.tab-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.tab-label-custom {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-actions-inline {
  display: flex;
  gap: 8px;
}

.add-button-light {
  background: rgba(255, 161, 22, 0.1) !important;
  border-color: rgba(255, 161, 22, 0.3) !important;
  color: #ffa116 !important;
}

.add-button-light:hover {
  background: rgba(255, 161, 22, 0.2) !important;
  border-color: #ffa116 !important;
}

.user-cell {
  display: flex;
  flex-direction: column;
}

.cell-subtext {
  font-size: 11px;
  color: #5c5c5c;
}

.table-pagination-footer {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

.cell-points {
  font-weight: 700;
  color: #ffa116;
}

.search-input-sm {
  background: #141414;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 6px 12px 6px 36px;
  color: #eff2f6;
  font-size: 13px;
  width: 200px;
  outline: none;
  transition: all 0.2s;
}

.search-input-sm:focus {
  border-color: #5c5c5c;
}

.filter-select-sm {
  width: 130px;
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

/* Dark Select Boxes - for .dark-select class elements */
.dark-select .el-select__wrapper {
  background-color: #1a1a1a !important;
  box-shadow: 0 0 0 1px #3e3e3e inset !important;
  border-radius: 6px !important;
}

.dark-select .el-select__wrapper:hover {
  box-shadow: 0 0 0 1px #5c5c5c inset !important;
}

.dark-select .el-select__wrapper.is-focused {
  box-shadow: 0 0 0 1px #ffa116 inset !important;
}

.dark-select .el-select__placeholder {
  color: #8a8a8a !important;
}

.dark-select .el-select__selected-item {
  color: #ffa116 !important;
  font-weight: 600;
}

.dark-select-dropdown {
  background-color: #1a1a1a !important;
  border: 1px solid #3e3e3e !important;
  border-radius: 8px !important;
}

.dark-select-dropdown .el-select-dropdown__item {
  color: #8a8a8a !important;
}

/* Dark Input Number Buttons (+/-) */
.dark-form .el-input-number__increase,
.dark-form .el-input-number__decrease {
  background-color: #282828 !important;
  border-color: #333 !important;
  color: #eff2f6 !important;
  transition: all 0.2s;
}

.dark-form .el-input-number__increase:hover,
.dark-form .el-input-number__decrease:hover {
  color: #ffa116 !important;
  background-color: #333 !important;
}

/* Problem Add Dual-Column Modal */
.problem-add-container {
  display: flex;
  gap: 20px;
  min-height: 400px;
  max-height: 60vh;
}
.problem-source-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-right: 1px solid #333;
  padding-right: 20px;
}
.problem-target-col {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.thin-scrollbar {
  overflow-y: auto;
}
.thin-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.thin-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.thin-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.target-col-header {
  font-size: 15px;
  font-weight: 600;
  color: #eff2f6;
  padding-bottom: 12px;
  border-bottom: 1px solid #333;
  margin-bottom: 12px;
}

.target-col-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.selected-target-item {
  background: #242424;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.2s;
}
.selected-target-item:hover {
  border-color: #444;
  background: #2a2a2a;
}
.target-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.target-item-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--accent-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.target-item-configs {
  display: flex;
  align-items: center;
  gap: 16px;
}
.cfg-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}
.cfg-label {
  font-size: 11px;
  color: #8a8a8a;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.selected-target-item :deep(.el-input__wrapper) {
  background: #1a1a1a !important;
  box-shadow: 0 0 0 1px #333 inset !important;
  border-radius: 8px !important;
  height: 40px;
}
.selected-target-item :deep(.el-input__inner) {
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #eff2f6;
}
.selected-target-item :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #ffa116 inset !important;
}

.input-display { width: 100% !important; }
.input-points { width: 100% !important; }
.input-sort { width: 100% !important; }

.remove-target-icon {
  color: #ef4743;
  border-radius: 6px;
  cursor: pointer;
  padding: 4px;
  transition: all 0.2s;
}
.remove-target-icon:hover {
  background: rgba(239, 71, 67, 0.1);
  transform: scale(1.1);
}

.target-col-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5c5c5c;
  font-size: 14px;
  min-height: 200px;
}
</style>
