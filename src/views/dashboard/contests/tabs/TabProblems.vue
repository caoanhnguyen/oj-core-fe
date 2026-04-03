<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { contestsAPI } from '@/api/contests'
import { useProblemStore } from '@/stores/problem'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Trash2 } from 'lucide-vue-next'
import DataTable from '@/components/common/DataTable.vue'
import ProblemBankDialog from '@/components/common/ProblemBankDialog.vue'
import AppButton from '@/components/common/AppButton.vue'

const props  = defineProps({
  contestId: { type: String, required: true },
  readonly: { type: Boolean, default: false }
})
const router = useRouter()
const problemStore = useProblemStore()

// ── Contest Problems ─────────────────────────────────────────────
const contestProblems = ref([])
const problemsLoading = ref(false)
const selectedRows    = ref([])

const loadContestProblems = async () => {
  try { problemsLoading.value = true; contestProblems.value = await contestsAPI.adminGetProblems(props.contestId) }
  finally { problemsLoading.value = false }
}
watch(() => props.contestId, loadContestProblems, { immediate: true })

// ── Remove ───────────────────────────────────────────────────────
const removing = ref(false)
const handleRemove = async () => {
  const toRemove = selectedRows.value
  if (!toRemove.length) return
  try {
    await ElMessageBox.confirm(`Xóa ${toRemove.length} bài khỏi contest?`, 'Xác nhận', { confirmButtonText: 'Xóa', cancelButtonText: 'Hủy', type: 'warning' })
    removing.value = true
    await contestsAPI.adminRemoveProblems(props.contestId, toRemove.map(r => r.problemId))
    selectedRows.value = []; await loadContestProblems()
    ElMessage.success('Đã xóa bài khỏi contest')
  } catch (e) { if (e !== 'cancel') ElMessage.error('Xóa thất bại') }
  finally { removing.value = false }
}
const removeSingle = async (row) => {
  try { removing.value = true; await contestsAPI.adminRemoveProblems(props.contestId, [row.problemId]); await loadContestProblems(); ElMessage.success('Đã xóa bài khỏi contest') }
  catch { ElMessage.error('Xóa thất bại') } finally { removing.value = false }
}

// ── Add Problems Dialog ──────────────────────────────────────────
const dialogVisible = ref(false)
const adding        = ref(false)
const addedIds = computed(() => new Set(contestProblems.value.map(p => p.problemId)))

const handleAddProblems = async (payload) => {
  try {
    adding.value = true
    await contestsAPI.adminAddProblems(props.contestId, payload)
    dialogVisible.value = false
    await loadContestProblems()
    ElMessage.success(`Đã thêm ${payload.length} bài vào cuộc thi`)
  } catch { ElMessage.error('Thêm bài thất bại') }
  finally { adding.value = false }
}

const tableColumns = computed(() => {
  const cols = []
  if (!props.readonly) cols.push({ type: 'selection', width: 50, fixed: 'left' })
  cols.push(
    { key: 'displayId', label: 'ID', width: 90, align: 'center' },
    { key: 'sortOrder', label: 'Thứ tự', width: 90, align: 'center' },
    { key: 'title', label: 'Tiêu đề bài tập', minWidth: 200 },
    { key: 'points', label: 'Điểm', width: 90, align: 'center' },
  )
  return cols
})

const tableActions = computed(() => {
  if (props.readonly) return []
  return [{ type: 'delete', label: 'Xóa', handler: (row) => removeSingle(row) }]
})
</script>

<template>
  <div class="tab-problems">
    <div class="sub-toolbar">
      <template v-if="!readonly">
        <AppButton variant="primary" :icon="Plus" @click="dialogVisible = true">Thêm bài tập</AppButton>
        <AppButton variant="danger" :icon="Trash2" :disabled="!selectedRows.length" :loading="removing" @click="handleRemove">
          Xóa ({{ selectedRows.length }})
        </AppButton>
      </template>
      <div class="spacer" />
      <span class="count-text">{{ contestProblems.length }} bài tập</span>
    </div>

    <DataTable
      :data="contestProblems"
      :columns="tableColumns"
      :actions="tableActions"
      :action-width="56"
      action-label=""
      :loading="problemsLoading"
      empty-text="Chưa có bài tập nào trong contest"
      @selection-change="(v) => selectedRows = v"
    >
      <template #cell-displayId="{ value }"><span class="display-id">{{ value }}</span></template>
      <template #cell-title="{ row }">
        <span class="cell-title clickable-link" @click="router.push(`/problems/${row.problemSlug}`)">{{ row.originalTitle || row.title || '—' }}</span>
      </template>
      <template #cell-points="{ value }"><span class="cell-points">{{ value }}</span></template>
      <template #cell-sortOrder="{ value }"><span class="cell-date">{{ value }}</span></template>
    </DataTable>

    <!-- Add Dialog Component -->
    <ProblemBankDialog
      v-model="dialogVisible"
      :contest-id="contestId"
      :added-ids="addedIds"
      :adding="adding"
      :existing-count="contestProblems.length"
      @add="handleAddProblems"
    />
  </div>
</template>

<style scoped>
.tab-problems { display: flex; flex-direction: column; gap: 16px; }
.sub-toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
.spacer { flex: 1; }
.count-text { font-size: 13px; color: #8a8a8a; font-weight: 500; }
.display-id { font-weight: 700; color: var(--accent-primary); }
.cell-points { font-size: 13px; font-weight: 600; color: #eff2f6; }
.cell-date { font-size: 13px; color: #8a8a8a; }
.cell-title { font-size: 14px; font-weight: 500; color: #eff2f6; cursor: pointer; transition: color 0.2s; }
.cell-title:hover { color: var(--accent-primary); }
.clickable-link { cursor: pointer; }


.added-badge { background: rgba(0,184,163,0.12); color: #00b8a3; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
.diff-badge { padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
.diff-easy   { background: rgba(0,184,163,0.12); color: #00b8a3; }
.diff-medium { background: rgba(255,192,30,0.12); color: #ffc01e; }
.diff-hard   { background: rgba(239,71,67,0.12); color: #ef4743; }




</style>

<style>
/* Dark dialog */
.dark-dialog .el-dialog { background: #1e1e1e !important; border: 1px solid #333 !important; border-radius: 12px !important; }
.dark-dialog .el-dialog__header { border-bottom: 1px solid #333; padding: 18px 24px; }
.dark-dialog .el-dialog__title { color: #eff2f6; font-size: 16px; font-weight: 700; }
.dark-dialog .el-dialog__body { padding: 24px; }
.dark-dialog .el-dialog__footer { border-top: 1px solid #333; padding: 16px 24px; }
.dark-dialog .el-form-item__label { color: #8a8a8a; }
.dark-dialog .el-input__wrapper,
.dark-dialog .el-textarea__inner,
.dark-dialog .el-select__wrapper { background: #282828 !important; box-shadow: 0 0 0 1px #3e3e3e inset !important; }
.dark-dialog .el-input__wrapper.is-focus { box-shadow: 0 0 0 1px #5c5c5c inset !important; }
.dark-dialog .el-input__inner,
.dark-dialog .el-textarea__inner,
.dark-dialog .el-select__placeholder { color: #eff2f6 !important; }
</style>
