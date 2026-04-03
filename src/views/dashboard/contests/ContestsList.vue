<script setup>
import { ref, onMounted, watch } from 'vue'
import { contestsAPI } from '@/api/contests'
import { ElMessage, ElMessageBox } from 'element-plus'
import { handleApiError } from '@/utils/errorHandler'
import { Plus, Settings, Trash2, Eye, EyeOff, Trophy, LayoutGrid, RotateCcw, ArrowLeft } from 'lucide-vue-next'
import DarkPagination from '@/components/common/DarkPagination.vue'
import TableControls  from '@/components/common/TableControls.vue'
import DataTable      from '@/components/common/DataTable.vue'
import PageHeader     from '@/components/common/PageHeader.vue'
import AppButton      from '@/components/common/AppButton.vue'
import { useRouter } from 'vue-router'

const columns = [
  { key: 'index', label: '#', width: 60, align: 'center', fixed: 'left' },
  { key: 'title', label: 'Tiêu đề', minWidth: 250 },
  { key: 'ruleType', label: 'Rule', width: 100, align: 'center' },
  { key: 'durationMinutes', label: 'Thời gian làm bài', width: 100, align: 'center' },
  { key: 'contestStatus', label: 'Cuộc thi', width: 150, align: 'center' },
  { key: 'status', label: 'Trạng thái', width: 120, align: 'center' },
  { key: 'startTime', label: 'Bắt đầu', minWidth: 150 },
  { key: 'endTime', label: 'Kết thúc', minWidth: 150 }
]

// ── Navigation ───────────────────────────────────────────────────
const router = useRouter()
const openDetail = (id) => { router.push(`/dashboard/contests/${id}`) }
const openCreate = () => { router.push(`/dashboard/contests/create`) }

// ── UTC helpers ──────────────────────────────────────────────────
const parseUTC = (s) => { if (!s) return null; return new Date((s.includes('Z') || s.includes('+')) ? s : s + 'Z') }
const fmtDt = (s) => { const d = parseUTC(s); if (!d) return '—'; return d.toLocaleString(undefined, { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false }) }

// ── List state ───────────────────────────────────────────────────
const contests    = ref([])
const listLoading = ref(false)
const keyword     = ref('')
const page        = ref(1)
const pageSize    = ref(20)
const total       = ref(0)

// Filter
const filterValues = ref({ contestStatus: '', ruleType: '', status: '' })
const filterConfig = [
  { key: 'contestStatus', label: 'Cuộc thi', icon: Trophy, options: [
    { label: 'Đang diễn ra', value: 'ONGOING' }, { label: 'Sắp diễn ra', value: 'UPCOMING' }, { label: 'Đã kết thúc', value: 'ENDED' }
  ]},
  { key: 'ruleType', label: 'Rule Type', icon: LayoutGrid, options: [
    { label: 'ACM', value: 'ACM' }, { label: 'OI', value: 'OI' }
  ]},
  { key: 'status', label: 'Trạng thái', icon: Eye, options: [
    { label: 'Active', value: 'ACTIVE' }, { label: 'Inactive', value: 'INACTIVE' }, { label: 'Deleted', value: 'DELETED' }
  ]}
]
const handleFilterChange = ({ key, value }) => { filterValues.value[key] = value; page.value = 1; load() }
const handleResetFilters = () => { filterValues.value = { contestStatus: '', ruleType: '', status: '' }; page.value = 1; load() }

// ── Load ─────────────────────────────────────────────────────────
const load = async () => {
  try {
    listLoading.value = true
    const params = { page: page.value - 1, size: pageSize.value, sort: 'startTime,desc' }
    if (keyword.value) params.keyword = keyword.value
    if (filterValues.value.contestStatus) params.contestStatus = filterValues.value.contestStatus
    if (filterValues.value.ruleType) params.ruleType = filterValues.value.ruleType
    if (filterValues.value.status) params.status = filterValues.value.status
    const data = await contestsAPI.adminSearch(params)
    contests.value = data.content || []
    total.value    = data.totalElements || 0
  } catch (e) { handleApiError(e, 'Không thể tải danh sách') }
  finally { listLoading.value = false }
}
onMounted(load)
let kwTimer = null
watch(keyword, () => { clearTimeout(kwTimer); kwTimer = setTimeout(() => { page.value = 1; load() }, 350) })

// ── Helpers ──────────────────────────────────────────────────────
const getContestStatusClass = (s) => ({ ONGOING: 'status-ongoing', UPCOMING: 'status-upcoming', ENDED: 'status-ended' }[s] || '')
const getContestStatusLabel = (s) => ({ ONGOING: 'Đang diễn ra', UPCOMING: 'Sắp diễn ra', ENDED: 'Đã kết thúc' }[s] || s)
const getEntityStatusClass = (s) => ({ ACTIVE: 'status-active', INACTIVE: 'status-upcoming', DELETED: 'status-deleted' }[s] || '')

// ── Actions with confirm ─────────────────────────────────────────
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `Xóa mềm contest "${row.title}"? Contest sẽ chuyển sang trạng thái DELETED.`,
      'Xác nhận xóa mềm',
      { confirmButtonText: 'Xóa', cancelButtonText: 'Hủy', type: 'warning', confirmButtonClass: 'el-button--danger' }
    )
    await contestsAPI.adminDelete(row.id)
    ElMessage.success('Đã xóa mềm contest')
    load()
  } catch (e) { if (e !== 'cancel') handleApiError(e, 'Xóa thất bại') }
}

const handleRestore = async (row) => {
  try {
    await ElMessageBox.confirm(
      `Khôi phục contest "${row.title}"? Contest sẽ chuyển về trạng thái INACTIVE.`,
      'Xác nhận khôi phục',
      { confirmButtonText: 'Khôi phục', cancelButtonText: 'Hủy', type: 'info' }
    )
    await contestsAPI.adminRestore(row.id)
    ElMessage.success('Đã khôi phục contest')
    load()
  } catch (e) { if (e !== 'cancel') handleApiError(e, 'Khôi phục thất bại') }
}

const handleToggleVisibility = async (row) => {
  const isActive = row.status === 'ACTIVE'
  const action = isActive ? 'ẩn (INACTIVE)' : 'công khai (ACTIVE)'
  try {
    await ElMessageBox.confirm(
      `Chuyển contest "${row.title}" sang trạng thái ${action}?`,
      `Xác nhận ${isActive ? 'ẩn' : 'công khai'}`,
      { confirmButtonText: isActive ? 'Ẩn contest' : 'Công khai', cancelButtonText: 'Hủy', type: 'info' }
    )
    await contestsAPI.adminToggleVisibility(row.id)
    ElMessage.success(`Đã ${action} contest`)
    load()
  } catch (e) { if (e !== 'cancel') handleApiError(e, 'Thao tác thất bại') }
}
</script>

<template>
  <div class="admin-layout-container">
      <PageHeader 
        title="Quản lý Contest" 
        subtitle="Tạo và quản trị các cuộc thi lập trình"
      >
        <AppButton variant="primary" :icon="Plus" @click="openCreate">Tạo Contest</AppButton>
      </PageHeader>

      <TableControls
        v-model="keyword"
        search-placeholder="Tìm kiếm contest..."
        :filter-config="filterConfig"
        :total-elements="total"
        item-name="Contests"
        filter-title="Lọc Contest"
        @filter-change="handleFilterChange"
        @reset-filters="handleResetFilters"
      />

      <DataTable
        :data="contests"
        :columns="columns"
        :loading="listLoading"
        empty-text="Không tìm thấy contest nào"
      >
        <template #cell-index="{ index }">
          <span class="cell-index">{{ (page - 1) * pageSize + index + 1 }}</span>
        </template>
        
        <template #cell-title="{ row, value }">
          <span class="cell-title" @click="openDetail(row.id)">{{ value }}</span>
        </template>

        <template #cell-ruleType="{ value }">
          <span :class="['rule-badge', value === 'ACM' ? 'rule-acm' : 'rule-oi']">{{ value }}</span>
        </template>

        <template #cell-durationMinutes="{ row }">
          <span v-if="row.format === 'STRICT' || !row.durationMinutes" class="cell-date mute">Cố định</span>
          <span v-else class="cell-date highlight-dur">{{ row.durationMinutes }}m</span>
        </template>

        <template #cell-contestStatus="{ value }">
          <span :class="['status-badge', getContestStatusClass(value)]">{{ getContestStatusLabel(value) }}</span>
        </template>

        <template #cell-status="{ value }">
          <span :class="['status-badge', getEntityStatusClass(value)]">{{ value }}</span>
        </template>

        <template #cell-startTime="{ value }"><span class="cell-date">{{ fmtDt(value) }}</span></template>
        <template #cell-endTime="{ value }"><span class="cell-date">{{ fmtDt(value) }}</span></template>

        <template #actions="{ row }">
          <!-- DELETED row -->
          <div v-if="row.status === 'DELETED'" class="action-buttons" @click.stop>
            <el-tooltip content="Quản trị" placement="top" :hide-after="0" :show-after="200">
              <el-button link class="action-btn" @click="openDetail(row.id)"><Settings :size="15" /></el-button>
            </el-tooltip>
            <el-tooltip content="Khôi phục" placement="top" :hide-after="0" :show-after="200">
              <el-button link class="action-btn action-restore" @click="handleRestore(row)"><RotateCcw :size="15" /></el-button>
            </el-tooltip>
          </div>
          <!-- ACTIVE / INACTIVE row -->
          <div v-else class="action-buttons" @click.stop>
            <el-tooltip content="Quản trị" placement="top" :hide-after="0" :show-after="200">
              <el-button link class="action-btn" @click="openDetail(row.id)"><Settings :size="15" /></el-button>
            </el-tooltip>
            <el-tooltip :content="row.status === 'ACTIVE' ? 'Ẩn (Inactive)' : 'Công khai (Active)'" placement="top" :hide-after="0" :show-after="200">
              <el-button link class="action-btn" @click="handleToggleVisibility(row)">
                <EyeOff v-if="row.status === 'ACTIVE'" :size="15" />
                <Eye v-else :size="15" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="Xóa mềm" placement="top" :hide-after="0" :show-after="200">
              <el-button link class="action-btn action-danger" @click="handleDelete(row)"><Trash2 :size="15" /></el-button>
            </el-tooltip>
          </div>
        </template>
      </DataTable>

      <DarkPagination :current-page="page" :page-size="pageSize" :total="total" @current-change="(p) => { page = p; load() }" />
    </div>
</template>

<style scoped>

.add-button { background: var(--accent-primary) !important; border-color: var(--accent-primary) !important; color: #000 !important; font-weight: 600; }
.add-button:hover { background: #ff8800 !important; border-color: #ff8800 !important; }

/* Back bar — consistent with detail view */
.back-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #3e3e3e; }
.back-btn { color: var(--text-secondary) !important; display: flex; align-items: center; gap: 6px; font-size: 14px; }
.back-btn:hover { color: var(--accent-primary) !important; }
.sub-title { font-size: 14px; color: var(--text-secondary); }
.sub-title strong { color: var(--text-primary); }

.create-form-container { padding: 12px 0; }



.cell-index { color: #8a8a8a; font-size: 13px; }
.cell-title { font-size: 14px; font-weight: 500; color: #eff2f6; cursor: pointer; transition: color 0.2s; }
.cell-title:hover { color: var(--accent-primary); }
.cell-date { font-size: 13px; color: #8a8a8a; }
.highlight-dur { color: #ffa116; font-weight: 600; }
.mute { opacity: 0.4; }

/* Badges */
.status-badge, .rule-badge { padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; display: inline-block; }
.rule-acm { background: rgba(0,184,163,0.15); color: #00b8a3; }
.rule-oi  { background: rgba(255,161,22,0.15); color: #ffa116; }
.status-ongoing  { background: rgba(0,184,163,0.12); color: #00b8a3; }
.status-upcoming { background: rgba(255,192,30,0.12); color: #ffc01e; }
.status-ended    { background: rgba(255,255,255,0.08); color: #8a8a8a; }
.status-active   { background: rgba(0,184,163,0.1); color: #00b8a3; }
.status-deleted  { background: rgba(239,71,67,0.1); color: #ef4743; }

/* Actions */
.action-buttons { display: flex; gap: 2px; justify-content: center; flex-wrap: nowrap; }
:deep(.action-btn) { padding: 4px; color: var(--text-secondary); transition: all 0.2s; }
:deep(.action-btn:hover) { color: var(--accent-primary); background: rgba(255,161,22,0.1); }
:deep(.action-btn.action-danger:hover) { color: var(--error); background: rgba(239,71,67,0.1); }
:deep(.action-btn.action-restore:hover) { color: #00b8a3; background: rgba(0,184,163,0.1); }
</style>

<style>
.dark-btn-cancel { background: #282828 !important; border-color: #3e3e3e !important; color: #eff2f6 !important; }
.dark-btn-cancel:hover { background: #333 !important; border-color: #555 !important; }
.dark-btn-submit { background: var(--accent-primary) !important; border-color: var(--accent-primary) !important; color: #000 !important; font-weight: 600; }
.dark-btn-submit:hover { background: #ff8800 !important; }
</style>
