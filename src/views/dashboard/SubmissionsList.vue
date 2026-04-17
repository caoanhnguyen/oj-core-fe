<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { submissionAPI } from '@/api/submissions'
import { systemAPI } from '@/api/system'
import PageHeader from '@/components/common/PageHeader.vue'
import TableControls from '@/components/common/TableControls.vue'
import DataTable from '@/components/common/DataTable.vue'
import DarkPagination from '@/components/common/DarkPagination.vue'
import AppButton from '@/components/common/AppButton.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { RefreshCw, Ban, Trash2, RotateCcw, Activity, MoreVertical, Eye, Code2, Calendar } from 'lucide-vue-next'
import SubmissionDetailDrawer from './SubmissionDetailDrawer.vue'
import { useBadge } from '@/composables/useBadge'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()
const { estatusClass, verdictClass } = useBadge()

// ===== STATE =====
const submissions = ref([])
const totalElements = ref(0)
const loading = ref(false)

const filters = ref({
  keyword: '',
  verdict: '',
  status: '',
  language: '',
  dateRange: null,
  page: 0,
  size: 20
})

const selectedRows = ref([])
const drawerVisible = ref(false)
const drawerRow = ref(null)

// For Verdict Select options inside TableControls
const verdictOptions = [
  { value: 'AC', label: 'Accepted (AC)' },
  { value: 'WA', label: 'Wrong Answer (WA)' },
  { value: 'TLE', label: 'Time Limit Exceeded (TLE)' },
  { value: 'MLE', label: 'Memory Limit Exceeded (MLE)' },
  { value: 'RE', label: 'Runtime Error (RE)' },
  { value: 'CE', label: 'Compile Error (CE)' },
  { value: 'SE', label: 'System Error (SE)' },
  { value: 'PENDING', label: 'Pending' }
]

const filterConfig = computed(() => [
  { key: 'verdict', label: t('admin_submissions.filter_verdict'), icon: Activity, options: verdictOptions },
  { key: 'status', label: t('admin_submissions.filter_status'), icon: Eye, options: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'INACTIVE', label: 'Inactive' },
      { value: 'DELETED', label: 'Deleted' }
    ]
  },
  { key: 'language', label: t('admin_submissions.filter_language'), icon: Code2, options: languageOptions.value },
  { key: 'dateRange', label: t('admin_submissions.filter_time'), icon: Calendar, type: 'daterange' }
])

const handleFilterChange = ({ key, value }) => {
  filters.value[key] = value
  filters.value.page = 0
}

const resetFilters = () => {
  filters.value.keyword = ''
  filters.value.verdict = ''
  filters.value.status = ''
  filters.value.language = ''
  filters.value.dateRange = null
  filters.value.page = 0
}

// verdictColor replaced by useBadge.verdictClass

const parseServerDate = (dateStr) => {
  if (!dateStr) return null
  const s = dateStr.includes('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z'
  return new Date(s)
}

const formatDate = (dateStr) => {
  const d = parseServerDate(dateStr)
  if (!d) return ''
  const pad = (n) => n.toString().padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// ===== LOAD DATA =====
const loadSubmissions = async () => {
  try {
    loading.value = true
    const res = await submissionAPI.getAllSubmissions({
      keyword: filters.value.keyword || undefined,
      submissionVerdict: filters.value.verdict || undefined,
      status: filters.value.status || undefined,
      languageKey: filters.value.language || undefined,
      fromDate: (filters.value.dateRange && filters.value.dateRange.length === 2) ? filters.value.dateRange[0].toISOString() : undefined,
      toDate: (filters.value.dateRange && filters.value.dateRange.length === 2) ? filters.value.dateRange[1].toISOString() : undefined,
      page: filters.value.page,
      size: filters.value.size
    })
    submissions.value = res.content || []
    totalElements.value = res.totalElements || 0
  } catch (err) {
    ElMessage.error(err.response?.data?.message || t('admin_submissions.msg_load_fail'))
  } finally {
    loading.value = false
  }
}

let searchTimeout = null
watch(
  () => [
    filters.value.page, filters.value.size, filters.value.verdict, 
    filters.value.keyword, filters.value.status, filters.value.language, filters.value.dateRange
  ],
  (newVals, oldVals) => {
    // Nếu keyword thay đổi thì reset page
    if (oldVals && newVals[3] !== oldVals[3]) filters.value.page = 0
    
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
        loadSubmissions()
    }, 400)
  },
  { deep: true }
)

// ===== BULK ACTIONS =====
const executingAction = ref(false)

const getSelectedIds = () => selectedRows.value.map(row => row.submissionId || row.id)

const doApiCall = async (actionName, apiFunc, payload, successMsg) => {
  try {
    executingAction.value = true
    await ElMessageBox.confirm(
      t('admin_submissions.msg_confirm_action', { actionName, count: payload.length }),
      t('common.confirm') || 'Confirmation',
      { type: 'warning', customClass: 'dark-message-box' }
    )
    await apiFunc(payload)
    ElMessage.success(successMsg)
    
    if (actionName === 'Rejudge') {
        const idsSet = new Set(payload)
        submissions.value.forEach(sub => {
            const id = sub.submissionId || sub.id
            if (idsSet.has(id)) sub.verdict = 'PENDING'
        })
        selectedRows.value = []
    } else {
        selectedRows.value = []
        await loadSubmissions()
    }
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(t('admin_submissions.msg_failed'))
  } finally {
    executingAction.value = false
  }
}

const handleActionCommand = (cmd, row) => {
  if (cmd === 'view') {
    handleRowClick(row)
    return
  }
  
  const id = row.submissionId || row.id
  const actionMap = {
    rejudge: { func: (param) => submissionAPI.adminRejudge({ submissionIds: param }), name: t('admin_submissions.btn_rejudge') || 'Rejudge', msg: t('admin_submissions.msg_rejudge_success') },
    void: { func: submissionAPI.adminVoid, name: t('admin_submissions.btn_void') || 'Void', msg: t('admin_submissions.msg_void_success') },
    restore: { func: submissionAPI.adminRestore, name: t('admin_submissions.btn_restore') || 'Restore', msg: t('admin_submissions.msg_restore_success') },
    delete: { func: submissionAPI.adminSoftDelete, name: t('admin_submissions.btn_soft_del') || 'Soft Delete', msg: t('admin_submissions.msg_delete_success') }
  }
  
  const action = actionMap[cmd]
  if (action) {
    doApiCall(action.name, action.func, [id], action.msg)
    
    // Nếu gọi từ drawer thì cập nhật local data tạm để drawer hiển thị chính xác hoặc ẩn drawer
    if (drawerRow.value && (drawerRow.value.submissionId || drawerRow.value.id) === id) {
       if (cmd === 'void') drawerRow.value.status = 'INACTIVE'
       else if (cmd === 'delete') drawerRow.value.status = 'DELETED'
       else if (cmd === 'restore') drawerRow.value.status = 'ACTIVE'
    }
  }
}

const handleRejudge = () => {
  const ids = getSelectedIds()
  if (!ids.length) return
  doApiCall(t('admin_submissions.btn_rejudge') || 'Rejudge', (param) => submissionAPI.adminRejudge({ submissionIds: param }), ids, t('admin_submissions.msg_rejudge_success'))
}

const handleVoid = () => {
  const ids = getSelectedIds()
  if (!ids.length) return
  doApiCall(t('admin_submissions.btn_void') || 'Void', submissionAPI.adminVoid, ids, t('admin_submissions.msg_void_success'))
}

const handleRestore = () => {
  const ids = getSelectedIds()
  if (!ids.length) return
  doApiCall(t('admin_submissions.btn_restore') || 'Restore', submissionAPI.adminRestore, ids, t('admin_submissions.msg_restore_success'))
}

const handleSoftDelete = () => {
  const ids = getSelectedIds()
  if (!ids.length) return
  doApiCall(t('admin_submissions.btn_soft_del') || 'Soft Delete', submissionAPI.adminSoftDelete, ids, t('admin_submissions.msg_delete_success'))
}

// ===== POLLING LOGIC =====
let pollingInterval = null

const startPolling = () => {
  if (pollingInterval) return
  pollingInterval = setInterval(async () => {
    const pendingIds = submissions.value
      .filter(s => s.verdict === 'PENDING')
      .map(s => s.submissionId || s.id)
    
    if (pendingIds.length === 0) {
      stopPolling()
      return
    }

    try {
      const updates = await submissionAPI.adminCheckStatuses(pendingIds)
      if (!updates || updates.length === 0) return

      const map = new Map(updates.map(u => [u.id, u.verdict]))
      let hasChanges = false

      submissions.value.forEach(sub => {
        const vid = sub.submissionId || sub.id
        if (map.has(vid)) {
            const newV = map.get(vid)
            if (newV !== 'PENDING' && sub.verdict === 'PENDING') {
                sub.verdict = newV
                hasChanges = true
            }
        }
      })

      if (hasChanges) {
          await loadSubmissions()
      }
    } catch (e) {
      // ignore
    }
  }, 3000)
}

const stopPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
}

watch(() => submissions.value, (newVals) => {
  const hasPending = newVals.some(v => v.verdict === 'PENDING')
  if (hasPending) startPolling()
  else stopPolling()
}, { deep: true })

const languageOptions = ref([])

onMounted(async () => {
  try {
    const langs = await systemAPI.getLanguages()
    languageOptions.value = langs.map(l => ({ label: l.name, value: l.languageKey }))
  } catch (error) {
    console.warn(t('admin_submissions.msg_load_lang_fail') || 'Failed to get languages:', error)
  }
  loadSubmissions()
})

onUnmounted(() => {
  stopPolling()
})

// ===== TABLE COLUMNS =====
// Columns are inlinely defined in template

const handleRowClick = (row) => {
  drawerRow.value = row
  drawerVisible.value = true
}
</script>

<template>
  <div class="admin-layout-container">
    <PageHeader 
      :title="$t('admin_submissions.page_title')" 
      :subtitle="$t('admin_submissions.page_subtitle')"
    >
      <div class="bulk-actions-header">
        <AppButton variant="primary" :icon="RefreshCw" :disabled="!selectedRows.length || executingAction" @click="handleRejudge">
          {{ $t('admin_submissions.btn_rejudge') }}
        </AppButton>
        <AppButton variant="secondary" :icon="Ban" :disabled="!selectedRows.length || executingAction" @click="handleVoid">
          {{ $t('admin_submissions.btn_void') }}
        </AppButton>
        <AppButton variant="warning" :icon="RotateCcw" :disabled="!selectedRows.length || executingAction" @click="handleRestore">
          {{ $t('admin_submissions.btn_restore') }}
        </AppButton>
        <AppButton variant="danger" :icon="Trash2" :disabled="!selectedRows.length || executingAction" @click="handleSoftDelete">
          {{ $t('admin_submissions.btn_soft_del') }}
        </AppButton>
      </div>
    </PageHeader>

    <TableControls
      v-model="filters.keyword"
      :search-placeholder="$t('admin_submissions.search_placeholder')"
      :total-elements="totalElements"
      :item-name="$t('admin_submissions.item_name')"
      :filter-config="filterConfig"
      :filter-title="$t('admin_submissions.filter_title')"
      @filter-change="handleFilterChange"
      @reset-filters="resetFilters"
    />

    <DataTable
      :data="submissions"
      :columns="[
        { type: 'selection', width: 50, fixed: 'left', align: 'center' },
        { key: 'index', label: '#', width: 60, fixed: 'left', align: 'center' },
        { key: 'submissionId', label: $t('admin_submissions.col_id'), minWidth: 200, align: 'center' },
        { key: 'createdDate', label: $t('admin_submissions.col_date'), width: 200, align: 'center' },
        { key: 'username', label: $t('admin_submissions.col_sender'), width: 150, align: 'center' },
        { key: 'problemTitle', label: $t('admin_submissions.col_problem'), minWidth: 200, align: 'center' },
        { key: 'contestTitle', label: $t('admin_submissions.col_contest'), minWidth: 200, align: 'center' },
        { key: 'executionTimeMs', label: $t('admin_submissions.col_runtime'), width: 100, align: 'center' },
        { key: 'executionMemoryMb', label: $t('admin_submissions.col_memory'), width: 100, align: 'center' },
        { key: 'verdict', label: $t('admin_submissions.col_verdict'), width: 140, align: 'center' },
        { key: 'score', label: $t('admin_submissions.col_score'), width: 80, align: 'center' },
        { key: 'languageKey', label: $t('admin_submissions.col_lang'), width: 120, align: 'center' },
        { key: 'status', label: $t('admin_submissions.col_status'), width: 120, align: 'center' }
      ]"
      :loading="loading"
      rowKey="id"
      :empty-text="$t('admin_submissions.empty_text')"
      @selection-change="v => selectedRows = v"
      @row-click="handleRowClick"
      class="clickable-row-table"
      :action-label="$t('admin_submissions.col_actions')"
      :action-width="120"
    >
      <template #cell-index="{ index }">
        <span class="cell-index">{{ filters.page * filters.size + index + 1 }}</span>
      </template>

      <template #cell-submissionId="{ row }">
        <span class="sub-id-text">
          {{ row.submissionId || row.id }}
        </span>
      </template>

      <template #cell-createdDate="{ value }">
        <span class="cell-date">{{ formatDate(value) }}</span>
      </template>

      <template #cell-username="{ row }">
        <RouterLink class="user-link" :to="`/profile/${row.username}`" @click.stop>{{ row.username }}</RouterLink>
      </template>

      <template #cell-problemTitle="{ row }">
        <div class="prob-cell">
           <RouterLink v-if="row.problemSlug" class="prob-title" :to="`/problems/${row.problemSlug}`" @click.stop>
             {{ row.problemTitle || row.problemId }}
           </RouterLink>
           <span v-else class="prob-title">{{ row.problemTitle || row.problemId }}</span>
        </div>
      </template>

      <template #cell-contestTitle="{ row }">
        <RouterLink v-if="row.contestId" class="cell-link" :to="`/dashboard/contests/${row.contestId}`" @click.stop>
          {{ row.contestTitle || $t('admin_submissions.hidden_contest') }}
        </RouterLink>
        <span v-else class="cell-date">—</span>
      </template>

      <template #cell-executionTimeMs="{ value }">
         <span class="score-text">{{ value != null ? value + ' ms' : '—' }}</span>
      </template>
      
      <template #cell-executionMemoryMb="{ value }">
         <span class="score-text">{{ value != null ? value + ' KB' : '—' }}</span>
      </template>

      <template #cell-verdict="{ value }">
        <div class="verdict-col">
           <div v-if="value === 'PENDING'" class="pending-spinner-wrapper">
             <div class="spin-small"></div>
             <span :class="['oj-badge', verdictClass(value)]">PENDING</span>
           </div>
           <span v-else :class="['oj-badge', verdictClass(value)]">
             {{ value }}
           </span>
        </div>
      </template>

      <template #cell-status="{ value }">
        <span :class="['oj-badge', estatusClass(value)]">{{ value || 'ACTIVE' }}</span>
      </template>
      
      <template #cell-score="{ value }">
         <span class="score-text">{{ value ?? '—' }}</span>
      </template>
      
      <template #cell-languageKey="{ value }">
         <span class="oj-badge lang-badge">{{ value }}</span>
      </template>
      
      <template #actions="{ row }">
        <el-dropdown trigger="click" @command="(cmd) => handleActionCommand(cmd, row)">
          <el-button link class="action-menu-btn" @click.stop>
            <MoreVertical :size="16" />
          </el-button>
          <template #dropdown>
            <el-dropdown-menu class="dark-dropdown">
              <el-dropdown-item command="view"><Eye :size="14" style="margin-right:8px;"/> {{ $t('admin_submissions.action_view') }}</el-dropdown-item>
              <el-dropdown-item command="rejudge" :disabled="row.verdict === 'PENDING'"><RefreshCw :size="14" style="margin-right:8px;"/> {{ $t('admin_submissions.btn_rejudge') }}</el-dropdown-item>
              <el-dropdown-item command="void" v-if="row.status === 'ACTIVE'"><Ban :size="14" style="margin-right:8px;"/> {{ $t('admin_submissions.btn_void') }}</el-dropdown-item>
              <el-dropdown-item command="restore" v-if="row.status === 'INACTIVE' || row.status === 'DELETED'"><RotateCcw :size="14" style="margin-right:8px;"/> {{ $t('admin_submissions.btn_restore') }}</el-dropdown-item>
              <el-dropdown-item command="delete" v-if="row.status === 'ACTIVE' || row.status === 'INACTIVE'"><Trash2 :size="14" style="margin-right:8px;"/> {{ $t('admin_submissions.btn_soft_del') }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </DataTable>

    <div class="pagination-wrapper" v-if="totalElements > 0">
      <DarkPagination
        :current-page="filters.page + 1"
        :page-size="filters.size"
        :total="totalElements"
        @current-change="(p) => filters.page = p - 1"
        @size-change="(s) => { filters.size = s; filters.page = 0 }"
      />
    </div>

    <!-- SIDE-OVER MODAL -->
    <SubmissionDetailDrawer
      v-model="drawerVisible"
      :submission-id="drawerRow ? (drawerRow.submissionId || drawerRow.id) : null"
      :row-data="drawerRow"
      @action="handleActionCommand"
    />
  </div>
</template>

<style scoped>
.bulk-actions-header {
  display: flex;
  gap: 12px;
  align-items: center;
}

.sub-id-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  color: #8a8a8a;
  white-space: nowrap;
}
.cell-index { font-weight: 500; color: #8a8a8a; font-size: 13px; }
.cell-date { font-size: 13px; color: #8a8a8a; white-space: nowrap; }

.user-link {
  color: #eff2f6; font-weight: 500; font-size: 13px; text-decoration: none; transition: color 0.2s;
}
.user-link:hover { color: var(--accent-primary); }

.prob-cell { display: flex; flex-direction: column; gap: 4px; align-items: center; }
.prob-title { color: #eff2f6; font-size: 14px; font-weight: 600; text-decoration: none; transition: color 0.15s; }
.prob-title:hover { color: var(--accent-primary); }
.badge-contest { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: rgba(0, 184, 163, 0.1); color: #00b8a3; font-weight: 700; text-transform: uppercase; }

.verdict-col { display: flex; justify-content: center; align-items: center; }
.verdict-text { font-size: 13px; font-weight: 700; white-space: nowrap; }

/* EStatus, verdict, lang badges → global badges.css */
.pending-spinner-wrapper {
  display: flex; align-items: center; gap: 6px; justify-content: center;
}
.spin-small {
  width: 14px; height: 14px;
  border: 2px solid var(--border-primary);
  border-top-color: #8a8a8a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.score-text { font-size: 13px; font-weight: 600; color: #eff2f6; }

.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

.action-menu-btn {
  color: #8a8a8a !important;
  padding: 4px;
  height: 24px;
}
.action-menu-btn:hover {
  color: var(--accent-primary) !important;
}

:deep(.clickable-row-table tbody tr) { cursor: pointer; }
:deep(.clickable-row-table tbody tr:hover td) { background-color: #1e1e1e !important; }

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
