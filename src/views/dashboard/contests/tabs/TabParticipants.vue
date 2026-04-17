<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { contestsAPI } from '@/api/contests'
import { handleApiError } from '@/utils/errorHandler'
import AppButton from '@/components/common/AppButton.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ShieldOff, ShieldCheck, Users } from 'lucide-vue-next'
import DarkPagination from '@/components/common/DarkPagination.vue'
import TableControls  from '@/components/common/TableControls.vue'
import DataTable      from '@/components/common/DataTable.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  contestId: { type: String, required: true },
  readonly:  { type: Boolean, default: false }
})
const emit   = defineEmits(['count'])
const router = useRouter()

const participants  = ref([])
const loading       = ref(false)
const page          = ref(1)
const pageSize      = ref(20)
const total         = ref(0)
const keyword       = ref('')
const selectedRows  = ref([])
const actionLoading = ref(false)

const filterConfig = computed(() => [
  { key: 'isDisqualified', label: t('admin_contests.tab_participants.filter_status_label'), icon: Users, options: [
    { label: t('admin_contests.tab_participants.filter_active'), value: 'false' },
    { label: t('admin_contests.tab_participants.filter_banned'), value: 'true' }
  ]}
])
const filterValues = ref({ isDisqualified: '' })
const handleFilterChange = ({ key, value }) => { filterValues.value[key] = value; page.value = 1; load() }
const handleResetFilters = () => { filterValues.value = { isDisqualified: '' }; page.value = 1; load() }

const fmtDt = (s) => {
  if (!s) return '—'
  const d = new Date((s.includes('Z') || s.includes('+')) ? s : s + 'Z')
  return d.toLocaleString(undefined, { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false })
}

const load = async () => {
  try {
    loading.value = true
    const params = { page: page.value - 1, size: pageSize.value, sort: 'createdDate,desc' }
    if (keyword.value) params.keyword = keyword.value
    if (filterValues.value.isDisqualified) params.isDisqualified = filterValues.value.isDisqualified === 'true'
    const data = await contestsAPI.adminGetParticipants(props.contestId, params)
    participants.value = data.content || []
    total.value = data.totalElements || 0
    emit('count', total.value)
  } finally { loading.value = false }
}
watch(() => props.contestId, () => { page.value = 1; load() }, { immediate: true })
let kwTimer = null
watch(keyword, () => { clearTimeout(kwTimer); kwTimer = setTimeout(() => { page.value = 1; load() }, 300) })

const canBan   = computed(() => selectedRows.value.some(r => !r.isDisqualified))
const canUnban = computed(() => selectedRows.value.some(r =>  r.isDisqualified))

const handleBan = async () => {
  if (!canBan.value) return
  const targets = selectedRows.value.filter(r => !r.isDisqualified)
  try {
    await ElMessageBox.confirm(
      t('admin_contests.tab_participants.confirm_ban_msg', { n: targets.length }),
      t('admin_contests.tab_participants.confirm_ban_title'),
      { type: 'warning', confirmButtonText: t('admin_contests.tab_participants.btn_ban'), cancelButtonText: t('common.cancel') }
    )
    actionLoading.value = true
    await contestsAPI.adminBanUsers(props.contestId, targets.map(r => r.userId))
    selectedRows.value = []; await load()
    ElMessage.success(t('admin_contests.tab_participants.msg_banned'))
  } catch (e) { if (e !== 'cancel') ElMessage.error(t('admin_contests.tab_participants.msg_action_fail')) }
  finally { actionLoading.value = false }
}

const handleUnban = async () => {
  if (!canUnban.value) return
  try {
    actionLoading.value = true
    await contestsAPI.adminUnbanUsers(props.contestId, selectedRows.value.filter(r => r.isDisqualified).map(r => r.userId))
    selectedRows.value = []; await load()
    ElMessage.success(t('admin_contests.tab_participants.msg_unbanned'))
  } catch { ElMessage.error(t('admin_contests.tab_participants.msg_action_fail')) }
  finally { actionLoading.value = false }
}

const tableColumns = computed(() => {
  const cols = []
  if (!props.readonly) cols.push({ type: 'selection', width: 50, fixed: 'left' })
  cols.push(
    { key: 'index',     label: t('admin_contests.tab_participants.col_index'),      width: 60,  align: 'center', fixed: 'left' },
    { key: 'id',        label: t('admin_contests.tab_participants.col_id'),         minWidth: 350 },
    { key: 'user',      label: t('admin_contests.tab_participants.col_user'),       minWidth: 300 },
    { key: 'email',     label: t('admin_contests.tab_participants.col_email'),      minWidth: 300 },
    { key: 'score',     label: t('admin_contests.tab_participants.col_score'),      width: 100, align: 'center' },
    { key: 'penalty',   label: t('admin_contests.tab_participants.col_penalty'),   width: 100, align: 'center' },
    { key: 'startTime', label: t('admin_contests.tab_participants.col_start_time'), minWidth: 160, align: 'center' },
    { key: 'endTime',   label: t('admin_contests.tab_participants.col_end_time'),   minWidth: 160, align: 'center' },
    { key: 'finished',  label: t('admin_contests.tab_participants.col_finished'),   width: 130, align: 'center' },
    { key: 'status',    label: t('admin_contests.tab_participants.col_status'),     width: 120, align: 'center', fixed: 'right' }
  )
  return cols
})
</script>

<template>
  <div class="tab-participants">
    <div class="toolbar-row">
      <TableControls
        v-model="keyword"
        :search-placeholder="$t('admin_contests.tab_participants.search')"
        :filter-config="filterConfig"
        :total-elements="total"
        :item-name="$t('admin_contests.tab_participants.filter_item_name')"
        :filter-title="$t('admin_contests.tab_participants.filter_title')"
        @filter-change="handleFilterChange"
        @reset-filters="handleResetFilters"
      />
    </div>

    <div v-if="!readonly" class="action-row">
      <AppButton variant="danger" :icon="ShieldOff" :disabled="!canBan" :loading="actionLoading" @click="handleBan">
        {{ $t('admin_contests.tab_participants.btn_ban') }}
      </AppButton>
      <AppButton variant="success" :icon="ShieldCheck" :disabled="!canUnban" :loading="actionLoading" @click="handleUnban">
        {{ $t('admin_contests.tab_participants.btn_unban') }}
      </AppButton>
    </div>

    <DataTable
      :data="participants"
      :columns="tableColumns"
      :loading="loading"
      :empty-text="$t('admin_contests.tab_participants.empty')"
      @selection-change="(v) => selectedRows = v"
    >
      <template #cell-index="{ index }">
        <span class="cell-index">{{ (page - 1) * pageSize + index + 1 }}</span>
      </template>
      <template #cell-id="{ row }">
        <span class="cell-id">{{ row.userId }}</span>
      </template>
      <template #cell-user="{ row }">
        <div class="user-cell">
          <span class="cell-title clickable-link" @click="router.push(`/profile/${row.username}`)">{{ row.username || 'Unknown User' }}</span>
        </div>
      </template>
      <template #cell-email="{ row }">
        <span class="cell-subtext">{{ row.email || '—' }}</span>
      </template>
      <template #cell-startTime="{ row }">
        <span class="cell-date">{{ fmtDt(row.startTime) }}</span>
      </template>
      <template #cell-endTime="{ row }">
        <span class="cell-date">{{ fmtDt(row.endTime) }}</span>
      </template>
      <template #cell-score="{ row }">
        <span class="highlight-score">{{ row.score || 0 }}</span>
      </template>
      <template #cell-penalty="{ row }">
        <span class="penalty-text">{{ row.penalty || 0 }}</span>
      </template>
      <template #cell-finished="{ row }">
        <span :class="['status-badge', (row.isFinished || row.finished) ? 'status-active' : 'status-upcoming']">
          {{ (row.isFinished || row.finished) ? $t('admin_contests.tab_participants.cell_finished_yes') : $t('admin_contests.tab_participants.cell_finished_no') }}
        </span>
      </template>
      <template #cell-status="{ row }">
        <span :class="['status-badge', (row.isDisqualified || row.disqualified) ? 'status-deleted' : 'status-active']">
          {{ (row.isDisqualified || row.disqualified) ? $t('admin_contests.tab_participants.cell_status_banned') : $t('admin_contests.tab_participants.cell_status_valid') }}
        </span>
      </template>
    </DataTable>

    <DarkPagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      @current-change="load"
      @size-change="() => { page = 1; load() }"
    />
  </div>
</template>

<style scoped>
.tab-participants { display: flex; flex-direction: column; gap: 12px; }
.toolbar-row { margin-bottom: 0; }
.action-row { display: flex; gap: 10px; margin-bottom: 8px; }

.user-cell { display: flex; flex-direction: column; gap: 2px; }
.cell-title { font-size: 14px; font-weight: 500; color: #eff2f6; cursor: pointer; transition: color 0.2s; }
.cell-title:hover { color: var(--accent-primary); }
.clickable-link { cursor: pointer; }
.cell-subtext { font-size: 13px; color: #8a8a8a; }
.cell-date { font-size: 13px; color: #8a8a8a; }
.cell-index { font-weight: 500; color: #8a8a8a; font-size: 13px; }
.cell-id { color: #8a8a8a; font-weight: 500; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }

.status-badge { padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; display: inline-block; white-space: nowrap; }
.status-active  { background: rgba(0,184,163,0.1); color: #00b8a3; }
.status-deleted { background: rgba(239,71,67,0.1); color: #ef4743; }
.status-upcoming { background: rgba(255, 161, 22, 0.1); color: #ffa116; }

.highlight-score { font-weight: 600; color: #00b8a3; font-size: 14px; }
.penalty-text { font-weight: 500; color: #ef4743; font-size: 13px; }
</style>
