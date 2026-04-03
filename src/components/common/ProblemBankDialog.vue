<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProblemStore } from '@/stores/problem'
import { ElMessage } from 'element-plus'
import { Trophy, Eye, Target, ArrowRight, ArrowLeft } from 'lucide-vue-next'
import DataTable from '@/components/common/DataTable.vue'
import TableControls from '@/components/common/TableControls.vue'
import DarkPagination from '@/components/common/DarkPagination.vue'
import AppButton from '@/components/common/AppButton.vue'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  contestId: { type: String, required: true },
  addedIds: { type: Object, required: true }, // Set of problemIds
  adding: { type: Boolean, default: false },
  existingCount: { type: Number, default: 0 }  // How many problems already in contest
})

const emit = defineEmits(['update:modelValue', 'add'])

const router = useRouter()
const problemStore = useProblemStore()

// ── Step state ────────────────────────────────────────────────────
// step: 'select' | 'configure'
const step = ref('select')

// ── Step 1: Select ────────────────────────────────────────────────
const bankLoading = ref(false)
const bankProblems = ref([])
const bankSearch = ref('')
const selectedToAdd = ref([])
const bankPagination = ref({ page: 1, size: 10 })
const bankFilters = ref({ difficulty: '', ruleType: '', status: '' })

const bankFilterConfig = [
  { key: 'difficulty', label: 'Độ khó', icon: Target, options: [
    { label: 'EASY', value: 'EASY' }, { label: 'MEDIUM', value: 'MEDIUM' }, { label: 'HARD', value: 'HARD' }
  ]},
  { key: 'ruleType', label: 'Luật thi', icon: Trophy, options: [
    { label: 'ACM', value: 'ACM' }, { label: 'OI', value: 'OI' }
  ]},
  { key: 'status', label: 'Trạng thái', icon: Eye, options: [
    { label: 'ACTIVE', value: 'ACTIVE' }, { label: 'INACTIVE', value: 'INACTIVE' }
  ]}
]

const loadBank = async () => {
  try {
    bankLoading.value = true
    await problemStore.fetchProblems({
      page: bankPagination.value.page - 1,
      size: bankPagination.value.size,
      keyword: bankSearch.value || undefined,
      difficulty: bankFilters.value.difficulty || undefined,
      ruleType: bankFilters.value.ruleType || undefined,
      status: bankFilters.value.status || undefined,
      contestId: props.contestId
    }, false, true)
    bankProblems.value = problemStore.problems
  } finally {
    bankLoading.value = false
  }
}

watch(() => props.modelValue, (open) => {
  if (open) {
    step.value = 'select'
    bankSearch.value = ''
    bankFilters.value = { difficulty: '', ruleType: '', status: '' }
    bankPagination.value.page = 1
    selectedToAdd.value = []
    configRows.value = []
    loadBank()
  }
})

let bankSearchTimer = null
watch(bankSearch, () => {
  clearTimeout(bankSearchTimer)
  bankSearchTimer = setTimeout(() => { bankPagination.value.page = 1; loadBank() }, 350)
})

const handleBankFilterChange = ({ key, value }) => {
  bankFilters.value[key] = value
  bankPagination.value.page = 1
  loadBank()
}
const handleBankResetFilters = () => {
  bankFilters.value = { difficulty: '', ruleType: '', status: '' }
  bankPagination.value.page = 1
  loadBank()
}

const canSelectRow = (row) => !props.addedIds.has(row.id)

const bankColumns = computed(() => [
  { type: 'selection', width: 50, fixed: 'left', selectable: canSelectRow },
  { key: 'title', label: 'Tiêu đề bài tập', minWidth: 280 },
  { key: 'difficulty', label: 'Độ khó', width: 100, align: 'center' },
  { key: 'isAdded', label: '', width: 100, align: 'center', fixed: 'right' }
])

// ── Step 2: Configure ─────────────────────────────────────────────
// Generate display ID: A, B, C, ... or AA, AB after Z
const genDisplayId = (index) => {
  const base = props.existingCount + index
  if (base < 26) return String.fromCharCode(65 + base)
  return String.fromCharCode(65 + Math.floor(base / 26) - 1) + String.fromCharCode(65 + (base % 26))
}

const configRows = ref([])

const goToConfig = () => {
  if (!selectedToAdd.value.length) {
    ElMessage.warning('Vui lòng chọn ít nhất 1 bài')
    return
  }
  configRows.value = selectedToAdd.value.map((p, i) => ({
    problem: p,
    displayId: genDisplayId(i),
    points: 100,
    sortOrder: props.existingCount + i + 1
  }))
  step.value = 'configure'
}

const goBack = () => { step.value = 'select' }

const confirmAdd = () => {
  const payload = configRows.value.map(r => ({
    problemId: r.problem.id,
    displayId: r.displayId,
    points: r.points,
    sortOrder: r.sortOrder
  }))
  emit('add', payload)
}

const handleClose = () => emit('update:modelValue', false)

// date helper
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString + (dateString.includes('Z') ? '' : 'Z'))
  return date.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="step === 'select' ? 'Chọn bài tập' : 'Cấu hình điểm & thứ tự'"
    width="900px"
    class="dark-dialog"
    destroy-on-close
    align-center
  >
    <!-- ── STEP 1: SELECT ── -->
    <template v-if="step === 'select'">
      <TableControls
        v-model="bankSearch"
        search-placeholder="Tìm kiếm bài tập..."
        :filter-config="bankFilterConfig"
        :total-label="`${problemStore.totalElements || 0} bài tập`"
        filter-title="Lọc bài tập"
        @filter-change="handleBankFilterChange"
        @reset-filters="handleBankResetFilters"
        style="margin-top: 0; margin-bottom: 16px"
      />

      <DataTable
        :data="bankProblems"
        :columns="bankColumns"
        :loading="bankLoading"
        @selection-change="(v) => selectedToAdd = v"
        style="margin-bottom: 16px"
      >
        <template #cell-title="{ row }">
          <span class="cell-title clickable" @click="router.push(`/problems/${row.slug}`)">{{ row.title }}</span>
        </template>
        <template #cell-difficulty="{ value }">
          <span :class="['difficulty-text', `difficulty-${(value || '').toLowerCase()}`]">
            {{ !value ? '—' : value === 'EASY' ? 'Easy' : value === 'MEDIUM' ? 'Med' : 'Hard' }}
          </span>
        </template>
        <template #cell-isAdded="{ row }">
          <span v-if="row.isAdded || addedIds.has(row.id)" class="added-badge">Đã thêm</span>
        </template>
      </DataTable>

      <DarkPagination
        :current-page="bankPagination.page"
        :page-size="bankPagination.size"
        :total="problemStore.totalElements || 0"
        @current-change="(p) => { bankPagination.page = p; loadBank() }"
      />
    </template>

    <!-- ── STEP 2: CONFIGURE ── -->
    <template v-else>
      <div class="config-hint">
        Hệ thống đã tự tạo ID cho các bài theo thứ tự. Bạn có thể điều chỉnh điểm và thứ tự hiển thị.
      </div>

      <div class="config-table">
        <!-- Header -->
        <div class="config-header">
          <div class="col-id">ID</div>
          <div class="col-title">Bài tập</div>
          <div class="col-order">Thứ tự</div>
          <div class="col-points">Điểm</div>
        </div>
        <!-- Rows -->
        <div
          v-for="(row, i) in configRows"
          :key="row.problem.id"
          class="config-row"
        >
          <div class="col-id">
            <span class="display-id-badge">{{ row.displayId }}</span>
          </div>
          <div class="col-title">
            <span class="cell-title">{{ row.problem.title }}</span>
            <span class="cell-sub">{{ row.problem.difficulty }}</span>
          </div>
          <div class="col-order">
            <el-input-number
              v-model="row.sortOrder"
              :min="1"
              :max="999"
              controls-position="right"
              size="small"
              style="width: 90px"
            />
          </div>
          <div class="col-points">
            <el-input-number
              v-model="row.points"
              :min="0"
              :max="99999"
              controls-position="right"
              size="small"
              style="width: 100px"
            />
          </div>
        </div>
      </div>

      <div class="config-summary">
        Tổng: <strong>{{ configRows.reduce((s, r) => s + (r.points || 0), 0) }}</strong> điểm
        cho <strong>{{ configRows.length }}</strong> bài
      </div>
    </template>

    <!-- ── FOOTER ── -->
    <template #footer>
      <div class="dialog-footer-actions">
        <div class="selection-info">
          <template v-if="step === 'select' && selectedToAdd.length">
            Đã chọn <strong>{{ selectedToAdd.length }}</strong> bài
          </template>
        </div>
        <div class="footer-btns">
          <AppButton variant="info" @click="step === 'configure' ? goBack() : handleClose()">
            <template v-if="step === 'configure'">
              <ArrowLeft :size="14" style="margin-right:4px" /> Quay lại
            </template>
            <template v-else>Hủy</template>
          </AppButton>

          <AppButton
            v-if="step === 'select'"
            variant="primary"
            :disabled="!selectedToAdd.length"
            @click="goToConfig"
          >
            Tiếp theo <ArrowRight :size="14" style="margin-left:4px" />
          </AppButton>
          <AppButton
            v-else
            variant="primary"
            :loading="adding"
            @click="confirmAdd"
          >
            Thêm {{ configRows.length }} bài vào contest
          </AppButton>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
/* ── STEP 1 ── */
.cell-title { font-weight: 500; font-size: 14px; color: #eff2f6; transition: color 0.2s; }
.cell-title.clickable { cursor: pointer; }
.cell-title.clickable:hover { color: var(--accent-primary); }
.difficulty-text { font-weight: 600; font-size: 13px; }
.difficulty-easy { color: #00b8a3; }
.difficulty-medium { color: #ffc01e; }
.difficulty-hard { color: #ef4743; }
.added-badge { background: rgba(255,161,22,0.15); color: #ffa116; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }

/* ── STEP 2 ── */
.config-hint {
  font-size: 13px;
  color: #8a8a8a;
  margin-bottom: 18px;
  padding: 10px 14px;
  background: rgba(255,161,22,0.05);
  border: 1px solid rgba(255,161,22,0.12);
  border-radius: 8px;
}

.config-table {
  border: 1px solid #333;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 16px;
}

.config-header {
  display: grid;
  grid-template-columns: 70px 1fr 110px 120px;
  gap: 0;
  background: #1e1e1e;
  padding: 10px 16px;
  font-size: 11px;
  font-weight: 700;
  color: #5c5c5c;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-bottom: 1px solid #333;
}

.config-row {
  display: grid;
  grid-template-columns: 70px 1fr 110px 120px;
  gap: 0;
  padding: 12px 16px;
  align-items: center;
  border-bottom: 1px solid #222;
  transition: background 0.15s;
}
.config-row:last-child { border-bottom: none; }
.config-row:hover { background: rgba(255,255,255,0.02); }

.col-id { display: flex; align-items: center; }
.col-title { display: flex; flex-direction: column; gap: 3px; min-width: 0; padding-right: 12px; }
.col-order, .col-points { display: flex; align-items: center; }

.display-id-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px; height: 32px;
  border-radius: 8px;
  background: rgba(255,161,22,0.12);
  color: #ffa116;
  font-weight: 800;
  font-size: 14px;
}

.cell-title { font-size: 13px; font-weight: 500; color: #eff2f6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cell-sub { font-size: 11px; color: #5c5c5c; }

.config-summary {
  font-size: 13px;
  color: #8a8a8a;
  text-align: right;
}
.config-summary strong { color: var(--accent-primary); }

/* Footer */
.dialog-footer-actions { display: flex; align-items: center; justify-content: space-between; }
.selection-info { font-size: 13px; color: #8a8a8a; }
.selection-info strong { color: var(--accent-primary); }
.footer-btns { display: flex; gap: 8px; }
</style>

<style>
/* Dark dialog global overrides */
.dark-dialog .el-dialog { background: #1e1e1e !important; border: 1px solid #333 !important; border-radius: 12px !important; }
.dark-dialog .el-dialog__header { border-bottom: 1px solid #333; padding: 18px 24px; }
.dark-dialog .el-dialog__title { color: #eff2f6; font-size: 16px; font-weight: 700; }
.dark-dialog .el-dialog__body { padding: 24px; }
.dark-dialog .el-dialog__footer { border-top: 1px solid #333; padding: 16px 24px; }
.dark-dialog .el-input-number .el-input__wrapper { background: #282828 !important; box-shadow: 0 0 0 1px #3e3e3e inset !important; }
.dark-dialog .el-input-number .el-input__inner { color: #eff2f6 !important; }
.dark-dialog .el-input-number__decrease,
.dark-dialog .el-input-number__increase { background: #333 !important; border-color: #3e3e3e !important; color: #eff2f6 !important; }
</style>
