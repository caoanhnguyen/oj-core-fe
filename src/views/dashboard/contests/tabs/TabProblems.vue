<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { contestsAPI } from '@/api/contests'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Trash2, Edit, Save, X } from 'lucide-vue-next'
import DataTable from '@/components/common/DataTable.vue'
import ProblemBankDialog from '@/components/common/ProblemBankDialog.vue'
import AppButton from '@/components/common/AppButton.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  contestId: { type: String, required: true },
  readonly:  { type: Boolean, default: false }
})
const router = useRouter()

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
    await ElMessageBox.confirm(
      t('admin_contests.tab_problems.confirm_remove_msg', { n: toRemove.length }),
      t('admin_contests.tab_problems.confirm_remove_title'),
      { confirmButtonText: t('common.delete'), cancelButtonText: t('common.cancel'), type: 'warning' }
    )
    removing.value = true
    await contestsAPI.adminRemoveProblems(props.contestId, toRemove.map(r => r.problemId))
    selectedRows.value = []; await loadContestProblems()
    ElMessage.success(t('admin_contests.tab_problems.msg_removed'))
  } catch (e) { if (e !== 'cancel') ElMessage.error(t('admin_contests.tab_problems.msg_remove_fail')) }
  finally { removing.value = false }
}

const removeSingle = async (row) => {
  try {
    removing.value = true
    await contestsAPI.adminRemoveProblems(props.contestId, [row.problemId])
    await loadContestProblems()
    ElMessage.success(t('admin_contests.tab_problems.msg_removed'))
  } catch { ElMessage.error(t('admin_contests.tab_problems.msg_remove_fail')) }
  finally { removing.value = false }
}

// ── Edit Mode ────────────────────────────────────────────────────
const isEditMode       = ref(false)
const saving           = ref(false)
const originalProblems = ref([])

const handleToggleEdit = () => {
  originalProblems.value = JSON.parse(JSON.stringify(contestProblems.value))
  isEditMode.value = true
}
const cancelEdit = () => {
  contestProblems.value = JSON.parse(JSON.stringify(originalProblems.value))
  isEditMode.value = false
}
const saveChanges = async () => {
  try {
    saving.value = true
    const payload = contestProblems.value.map(p => ({
      problemId: p.problemId, displayId: p.displayId,
      points: p.points, sortOrder: p.sortOrder
    }))
    await contestsAPI.adminUpdateProblems(props.contestId, payload)
    ElMessage.success(t('admin_contests.tab_problems.msg_saved'))
    isEditMode.value = false
    await loadContestProblems()
  } catch(e) {
    ElMessage.error(e.response?.data?.message || t('admin_contests.tab_problems.msg_save_fail'))
  } finally { saving.value = false }
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
    ElMessage.success(t('admin_contests.tab_problems.msg_added', { n: payload.length }))
  } catch { ElMessage.error(t('admin_contests.tab_problems.msg_add_fail')) }
  finally { adding.value = false }
}

const tableColumns = computed(() => {
  const cols = []
  if (!props.readonly) cols.push({ type: 'selection', width: 50, fixed: 'left' })
  cols.push(
    { key: 'displayId',  label: t('admin_contests.tab_problems.col_display_id'), width: 100, align: 'center' },
    { key: 'sortOrder',  label: t('admin_contests.tab_problems.col_sort_order'),  width: 120, align: 'center' },
    { key: 'title',      label: t('admin_contests.tab_problems.col_title'),       minWidth: 200 },
    { key: 'points',     label: t('admin_contests.tab_problems.col_points'),      width: 130, align: 'center' },
  )
  return cols
})

const tableActions = computed(() => {
  if (props.readonly) return []
  return [{ type: 'delete', label: t('admin_contests.tab_problems.action_delete'), disabled: () => isEditMode.value, handler: (row) => removeSingle(row) }]
})
</script>

<template>
  <div class="tab-problems">
    <div class="sub-toolbar">
      <template v-if="!readonly">
        <template v-if="!isEditMode">
          <AppButton variant="primary" :icon="Plus" @click="dialogVisible = true">
            {{ $t('admin_contests.tab_problems.btn_add') }}
          </AppButton>
          <AppButton variant="secondary" :icon="Edit" :disabled="contestProblems.length === 0" @click="handleToggleEdit">
            {{ $t('admin_contests.tab_problems.btn_edit') }}
          </AppButton>
          <AppButton variant="danger" :icon="Trash2" :disabled="!selectedRows.length" :loading="removing" @click="handleRemove">
            {{ $t('admin_contests.tab_problems.btn_remove_selection', { n: selectedRows.length }) }}
          </AppButton>
        </template>
        <template v-else>
          <AppButton variant="secondary" :icon="X" @click="cancelEdit">
            {{ $t('admin_contests.tab_problems.btn_cancel') }}
          </AppButton>
          <AppButton variant="success" :icon="Save" :loading="saving" @click="saveChanges">
            {{ $t('admin_contests.tab_problems.btn_save_changes') }}
          </AppButton>
        </template>
      </template>
      <div class="spacer" />
      <span class="count-text">{{ $t('admin_contests.tab_problems.count_text', { n: contestProblems.length }) }}</span>
    </div>

    <DataTable
      :data="contestProblems"
      :columns="tableColumns"
      :actions="tableActions"
      :action-width="56"
      action-label=""
      :loading="problemsLoading"
      :empty-text="$t('admin_contests.tab_problems.empty')"
      @selection-change="(v) => selectedRows = v"
    >
      <template #cell-displayId="{ row }">
        <el-input v-if="isEditMode" v-model="row.displayId" size="small" placeholder="ID" class="edit-input" />
        <span v-else class="display-id">{{ row.displayId }}</span>
      </template>
      <template #cell-sortOrder="{ row }">
        <el-input-number v-if="isEditMode" v-model="row.sortOrder" size="small" :min="0" :max="999" controls-position="right" class="edit-input-number" />
        <span v-else class="cell-date">{{ row.sortOrder }}</span>
      </template>
      <template #cell-title="{ row }">
        <span class="cell-title clickable-link" @click="router.push(`/problems/${row.problemSlug}`)">{{ row.originalTitle || row.title || '—' }}</span>
      </template>
      <template #cell-points="{ row }">
        <el-input-number v-if="isEditMode" v-model="row.points" size="small" :min="0" :max="10000" controls-position="right" class="edit-input-number" />
        <span v-else class="cell-points">{{ row.points }}</span>
      </template>
    </DataTable>

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

:deep(.edit-input .el-input__wrapper),
:deep(.edit-input-number .el-input__wrapper) { box-shadow: none !important; background-color: transparent !important; border-bottom: 1px solid #3e3e3e !important; border-radius: 0 !important; padding: 0 4px !important; transition: border-bottom-color 0.2s; }
:deep(.edit-input .el-input__wrapper.is-focus),
:deep(.edit-input-number .el-input__wrapper.is-focus) { border-bottom-color: var(--accent-primary) !important; }
:deep(.edit-input .el-input__inner),
:deep(.edit-input-number .el-input__inner) { font-size: 15px !important; font-weight: 500 !important; text-align: center !important; color: #eff2f6 !important; }
:deep(.edit-input-number) { width: 100% !important; }
:deep(.edit-input-number .el-input-number__decrease),
:deep(.edit-input-number .el-input-number__increase) { background: transparent !important; border: none !important; color: var(--text-secondary) !important; transition: color 0.2s; }
:deep(.edit-input-number .el-input-number__decrease:hover),
:deep(.edit-input-number .el-input-number__increase:hover) { color: var(--accent-primary) !important; }
</style>
