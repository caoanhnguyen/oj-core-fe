<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { contestsAPI } from '@/api/contests'
import { ElMessage, ElMessageBox } from 'element-plus'
import { handleApiError } from '@/utils/errorHandler'
import { Plus, Settings, Trash2, Eye, EyeOff, Trophy, LayoutGrid, RotateCcw } from 'lucide-vue-next'
import DarkPagination from '@/components/common/DarkPagination.vue'
import TableControls  from '@/components/common/TableControls.vue'
import DataTable      from '@/components/common/DataTable.vue'
import PageHeader     from '@/components/common/PageHeader.vue'
import AppButton      from '@/components/common/AppButton.vue'
import { useRouter } from 'vue-router'
import { useBadge } from '@/composables/useBadge'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// ── Columns (computed so they react to locale change) ────────────────────────
const columns = computed(() => [
  { key: 'index',               label: '#',                                          width: 60,  align: 'center', fixed: 'left' },
  { key: 'title',               label: t('admin_contests.col_title'),                minWidth: 250 },
  { key: 'ruleType',            label: t('admin_contests.col_rule'),                 width: 100, align: 'center' },
  { key: 'durationMinutes',     label: t('admin_contests.col_duration'),             width: 130, align: 'center' },
  { key: 'contestStatus',       label: t('admin_contests.col_contest_status'),       width: 150, align: 'center' },
  { key: 'scoreboardVisibility',label: t('admin_contests.col_scoreboard'),           width: 130, align: 'center' },
  { key: 'status',              label: t('admin_contests.col_status'),               width: 120, align: 'center' },
  { key: 'startTime',           label: t('admin_contests.col_start'),                minWidth: 150 },
  { key: 'endTime',             label: t('admin_contests.col_end'),                  minWidth: 150 },
])

// ── Filter config (computed so labels react to locale) ───────────────────────
const filterConfig = computed(() => [
  {
    key: 'contestStatus',
    label: t('admin_contests.filter_labels.status'),
    icon: Trophy,
    options: [
      { label: t('admin_contests.status_opts.ongoing'),  value: 'ONGOING' },
      { label: t('admin_contests.status_opts.upcoming'), value: 'UPCOMING' },
      { label: t('admin_contests.status_opts.ended'),    value: 'ENDED' },
    ]
  },
  {
    key: 'ruleType',
    label: t('admin_contests.filter_labels.rule'),
    icon: LayoutGrid,
    options: [
      { label: 'ACM', value: 'ACM' },
      { label: 'OI',  value: 'OI' },
    ]
  },
  {
    key: 'status',
    label: t('admin_contests.filter_labels.record'),
    icon: Eye,
    options: [
      { label: t('admin_contests.record_opts.active'),   value: 'ACTIVE' },
      { label: t('admin_contests.record_opts.inactive'), value: 'INACTIVE' },
      { label: t('admin_contests.record_opts.deleted'),  value: 'DELETED' },
    ]
  }
])

// ── Navigation ───────────────────────────────────────────────────────────────
const router = useRouter()
const { contestStatusClass, estatusClass, ruleTypeClass, scoreboardClass } = useBadge()

const getContestStatusLabel = (s) => ({
  ONGOING:  t('admin_contests.status_opts.ongoing'),
  UPCOMING: t('admin_contests.status_opts.upcoming'),
  ENDED:    t('admin_contests.status_opts.ended'),
}[s] || s)

const openDetail = (id) => { router.push(`/dashboard/contests/${id}`) }
const openCreate = () =>  { router.push(`/dashboard/contests/create`) }

// ── UTC helpers ──────────────────────────────────────────────────────────────
const parseUTC = (s) => {
  if (!s) return null
  return new Date((s.includes('Z') || s.includes('+')) ? s : s + 'Z')
}
const fmtDt = (s) => {
  const d = parseUTC(s)
  if (!d) return '—'
  return d.toLocaleString(undefined, { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false })
}

// ── List state ───────────────────────────────────────────────────────────────
const contests    = ref([])
const listLoading = ref(false)
const keyword     = ref('')
const page        = ref(1)
const pageSize    = ref(20)
const total       = ref(0)
const filterValues = ref({ contestStatus: '', ruleType: '', status: '' })

const handleFilterChange = ({ key, value }) => {
  filterValues.value[key] = value
  page.value = 1
  load()
}
const handleResetFilters = () => {
  filterValues.value = { contestStatus: '', ruleType: '', status: '' }
  page.value = 1
  load()
}

// ── Load ─────────────────────────────────────────────────────────────────────
const load = async () => {
  try {
    listLoading.value = true
    const params = { page: page.value - 1, size: pageSize.value, sort: 'startTime,desc' }
    if (keyword.value)                    params.keyword       = keyword.value
    if (filterValues.value.contestStatus) params.contestStatus = filterValues.value.contestStatus
    if (filterValues.value.ruleType)      params.ruleType      = filterValues.value.ruleType
    if (filterValues.value.status)        params.status        = filterValues.value.status
    const data = await contestsAPI.adminSearch(params)
    contests.value = data.content || []
    total.value    = data.totalElements || 0
  } catch (e) {
    handleApiError(e, t('admin_contests.messages.err_load'))
  } finally {
    listLoading.value = false
  }
}

onMounted(load)
let kwTimer = null
watch(keyword, () => {
  clearTimeout(kwTimer)
  kwTimer = setTimeout(() => { page.value = 1; load() }, 350)
})

// ── Actions ──────────────────────────────────────────────────────────────────
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      t('admin_contests.messages.soft_del_msg', { title: row.title }),
      t('admin_contests.messages.soft_del_title'),
      { confirmButtonText: t('common.delete'), cancelButtonText: t('common.cancel'), type: 'warning', confirmButtonClass: 'el-button--danger' }
    )
    await contestsAPI.adminDelete(row.id)
    ElMessage.success(t('admin_contests.messages.soft_del_success'))
    load()
  } catch (e) {
    if (e !== 'cancel') handleApiError(e, t('admin_contests.messages.soft_del_fail'))
  }
}

const handleRestore = async (row) => {
  try {
    await ElMessageBox.confirm(
      t('admin_contests.messages.restore_msg', { title: row.title }),
      t('admin_contests.messages.restore_title'),
      { confirmButtonText: t('common.restore'), cancelButtonText: t('common.cancel'), type: 'info' }
    )
    await contestsAPI.adminRestore(row.id)
    ElMessage.success(t('admin_contests.messages.restore_success'))
    load()
  } catch (e) {
    if (e !== 'cancel') handleApiError(e, t('admin_contests.messages.restore_fail'))
  }
}

const handleToggleVisibility = async (row) => {
  const isActive = row.status === 'ACTIVE'
  const title = isActive ? t('admin_contests.messages.toggle_hide_title') : t('admin_contests.messages.toggle_show_title')
  const msg   = isActive
    ? t('admin_contests.messages.toggle_hide_msg', { title: row.title })
    : t('admin_contests.messages.toggle_show_msg', { title: row.title })
  const btnText = isActive ? t('admin_contests.action_toggle_hide') : t('admin_contests.action_toggle_show')
  try {
    await ElMessageBox.confirm(msg, title, {
      confirmButtonText: btnText,
      cancelButtonText: t('common.cancel'),
      type: 'info'
    })
    await contestsAPI.adminToggleVisibility(row.id)
    ElMessage.success(t('admin_contests.messages.toggle_success'))
    load()
  } catch (e) {
    if (e !== 'cancel') handleApiError(e, t('admin_contests.messages.toggle_fail'))
  }
}
</script>

<template>
  <div class="admin-layout-container">
    <PageHeader
      :title="$t('admin_contests.page_title')"
      :subtitle="$t('admin_contests.page_subtitle')"
    >
      <AppButton variant="primary" :icon="Plus" @click="openCreate">
        {{ $t('admin_contests.btn_create') }}
      </AppButton>
    </PageHeader>

    <TableControls
      v-model="keyword"
      :search-placeholder="$t('admin_contests.search_placeholder')"
      :filter-config="filterConfig"
      :total-elements="total"
      :item-name="$t('admin_contests.item_name')"
      :filter-title="$t('admin_contests.filter_title')"
      @filter-change="handleFilterChange"
      @reset-filters="handleResetFilters"
    />

    <DataTable
      :data="contests"
      :columns="columns"
      :loading="listLoading"
      :empty-text="$t('admin_contests.empty_text')"
    >
      <template #cell-index="{ index }">
        <span class="cell-index">{{ (page - 1) * pageSize + index + 1 }}</span>
      </template>

      <template #cell-title="{ row, value }">
        <span class="cell-title" @click="openDetail(row.id)">{{ value }}</span>
      </template>

      <template #cell-ruleType="{ value }">
        <span :class="['oj-badge', ruleTypeClass(value)]">{{ value }}</span>
      </template>

      <template #cell-durationMinutes="{ row }">
        <span v-if="row.format === 'STRICT' || !row.durationMinutes" class="cell-date mute">
          {{ $t('admin_contests.col_duration_fixed') }}
        </span>
        <span v-else class="cell-date highlight-dur">{{ row.durationMinutes }}m</span>
      </template>

      <template #cell-scoreboardVisibility="{ value }">
        <el-tooltip
          :content="value === 'VISIBLE'
            ? $t('admin_contests.scoreboard_opts.visible')
            : (value === 'HIDDEN_PERMANENTLY'
              ? $t('admin_contests.scoreboard_opts.hidden')
              : $t('admin_contests.scoreboard_opts.frozen'))"
          placement="top" effect="dark"
        >
          <span :class="['oj-badge', scoreboardClass(value)]">
            {{ value === 'VISIBLE' ? 'VISIBLE' : (value === 'HIDDEN_PERMANENTLY' ? 'HIDDEN' : 'FROZEN') }}
          </span>
        </el-tooltip>
      </template>

      <template #cell-contestStatus="{ value }">
        <span :class="['oj-badge', contestStatusClass(value)]">{{ getContestStatusLabel(value) }}</span>
      </template>

      <template #cell-status="{ value }">
        <span :class="['oj-badge', estatusClass(value)]">{{ value }}</span>
      </template>

      <template #cell-startTime="{ value }"><span class="cell-date">{{ fmtDt(value) }}</span></template>
      <template #cell-endTime="{ value }"><span class="cell-date">{{ fmtDt(value) }}</span></template>

      <template #actions="{ row }">
        <!-- DELETED row -->
        <div v-if="row.status === 'DELETED'" class="action-buttons" @click.stop>
          <el-tooltip :content="$t('admin_contests.action_manage')" placement="top" :hide-after="0" :show-after="200">
            <el-button link class="action-btn" @click="openDetail(row.id)"><Settings :size="15" /></el-button>
          </el-tooltip>
          <el-tooltip :content="$t('admin_contests.action_restore')" placement="top" :hide-after="0" :show-after="200">
            <el-button link class="action-btn action-restore" @click="handleRestore(row)"><RotateCcw :size="15" /></el-button>
          </el-tooltip>
        </div>
        <!-- ACTIVE / INACTIVE row -->
        <div v-else class="action-buttons" @click.stop>
          <el-tooltip :content="$t('admin_contests.action_manage')" placement="top" :hide-after="0" :show-after="200">
            <el-button link class="action-btn" @click="openDetail(row.id)"><Settings :size="15" /></el-button>
          </el-tooltip>
          <el-tooltip
            :content="row.status === 'ACTIVE' ? $t('admin_contests.action_toggle_hide') : $t('admin_contests.action_toggle_show')"
            placement="top" :hide-after="0" :show-after="200"
          >
            <el-button link class="action-btn" @click="handleToggleVisibility(row)">
              <EyeOff v-if="row.status === 'ACTIVE'" :size="15" />
              <Eye v-else :size="15" />
            </el-button>
          </el-tooltip>
          <el-tooltip :content="$t('admin_contests.action_soft_delete')" placement="top" :hide-after="0" :show-after="200">
            <el-button link class="action-btn action-danger" @click="handleDelete(row)"><Trash2 :size="15" /></el-button>
          </el-tooltip>
        </div>
      </template>
    </DataTable>

    <DarkPagination
      :current-page="page"
      :page-size="pageSize"
      :total="total"
      @current-change="(p) => { page = p; load() }"
    />
  </div>
</template>

<style scoped>
.cell-index { color: #8a8a8a; font-size: 13px; }
.cell-title { font-size: 14px; font-weight: 500; color: #eff2f6; cursor: pointer; transition: color 0.2s; }
.cell-title:hover { color: var(--accent-primary); }
.cell-date { font-size: 13px; color: #8a8a8a; }
.highlight-dur { color: #ffa116; font-weight: 600; }
.mute { opacity: 0.4; }
.action-buttons { display: flex; gap: 2px; justify-content: center; flex-wrap: nowrap; }
</style>

<style>
.dark-btn-cancel { background: #282828 !important; border-color: #3e3e3e !important; color: #eff2f6 !important; }
.dark-btn-cancel:hover { background: #333 !important; border-color: #555 !important; }
.dark-btn-submit { background: var(--accent-primary) !important; border-color: var(--accent-primary) !important; color: #000 !important; font-weight: 600; }
.dark-btn-submit:hover { background: #ff8800 !important; }
</style>
