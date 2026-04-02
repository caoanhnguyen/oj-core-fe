<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProblemStore } from '@/stores/problem'
import { ElMessage } from 'element-plus'
import { Trophy, Eye, Target } from 'lucide-vue-next'
import DataTable from '@/components/common/DataTable.vue'
import TableControls from '@/components/common/TableControls.vue'
import DarkPagination from '@/components/common/DarkPagination.vue'
import AppButton from '@/components/common/AppButton.vue'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  contestId: { type: String, required: true },
  addedIds: { type: Object, required: true }, // Set of problemIds
  adding: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'add'])

const router = useRouter()
const problemStore = useProblemStore()

// State
const bankLoading = ref(false)
const bankProblems = ref([])
const bankSearch = ref('')
const selectedToAdd = ref([])
const bankPagination = ref({ page: 1, size: 10 })
const bankFilters = ref({ difficulty: '', ruleType: '', status: '' })

// Filter Config matching ProblemsList + Contest requirements
const bankFilterConfig = [
  { key: 'difficulty', label: 'Độ khó', icon: Target, options: [
    { label: 'EASY', value: 'EASY' }, { label: 'MEDIUM', value: 'MEDIUM' }, { label: 'HARD', value: 'HARD' }
  ]},
  { key: 'ruleType', label: 'Luật thi', icon: Trophy, options: [
    { label: 'ACM', value: 'ACM' }, { label: 'OI', value: 'OI' }
  ]},
  { key: 'status', label: 'Trạng thái thẻ', icon: Eye, options: [
    { label: 'ACTIVE', value: 'ACTIVE' }, { label: 'INACTIVE', value: 'INACTIVE' }, { label: 'DELETED', value: 'DELETED' }
  ]}
]

// Data fetching
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

// Watchers
watch(() => props.modelValue, (open) => { 
  if (open) { 
    bankSearch.value = ''
    bankFilters.value = { difficulty: '', ruleType: '', status: '' }
    bankPagination.value.page = 1
    selectedToAdd.value = []
    loadBank() 
  } 
})

let bankSearchTimer = null
watch(bankSearch, () => { 
  clearTimeout(bankSearchTimer)
  bankSearchTimer = setTimeout(() => { bankPagination.value.page = 1; loadBank() }, 350) 
})

// Handlers
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

const confirmAdd = () => {
  if (!selectedToAdd.value.length) { 
    ElMessage.warning('Vui lòng chọn bài')
    return 
  }
  emit('add', selectedToAdd.value)
}

const handleClose = () => {
  emit('update:modelValue', false)
}

// Table config matching ProblemsList
const canSelectRow = (row) => !props.addedIds.has(row.id)

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString + (dateString.includes('Z') ? '' : 'Z'))
  return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const bankColumns = computed(() => [
  { type: 'selection', width: 50, fixed: 'left', selectable: canSelectRow },
  { key: 'id', label: 'ID', minWidth: 320 },
  { key: 'title', label: 'Tiêu đề', minWidth: 320 },
  { key: 'problemStatus', label: 'Hiển thị', width: 140, align: 'center' },
  { key: 'difficulty', label: 'Độ khó', width: 130, align: 'center' },
  { key: 'status', label: 'Trạng thái', width: 130, align: 'center' },
  { key: 'createdDate', label: 'Ngày tạo', width: 150, align: 'center' },
  { key: 'isAdded', label: 'Trạng thái', width: 150, align: 'center', fixed: 'right' }
])
</script>

<template>
  <el-dialog 
    :model-value="modelValue" 
    @update:model-value="$emit('update:modelValue', $event)" 
    title="Thêm bài vào cuộc thi" 
    width="1200px" 
    class="dark-dialog" 
    destroy-on-close 
    align-center
  >
    <TableControls
      v-model="bankSearch"
      search-placeholder="Tìm kiếm bài tập..."
      :filter-config="bankFilterConfig"
      :total-label="`${problemStore.totalElements || 0} bài tập`"
      filter-title="Lọc bài tập"
      @filter-change="handleBankFilterChange"
      @reset-filters="handleBankResetFilters"
      style="margin-top: 0; margin-bottom: 20px"
    />

    <DataTable
      :data="bankProblems"
      :columns="bankColumns"
      :loading="bankLoading"
      @selection-change="(v) => selectedToAdd = v"
      style="margin-bottom: 24px"
    >
      <template #cell-id="{ row }">
        <span class="cell-id">{{ row.id }}</span>
      </template>

      <template #cell-title="{ row }">
        <span class="cell-title clickable" @click="router.push(`/problems/${row.slug}`)">{{ row.title }}</span>
      </template>

      <template #cell-difficulty="{ value }">
        <span :class="['difficulty-text', `difficulty-${(value || '').toLowerCase()}`]">
          {{ !value ? '' : value.toUpperCase() === 'EASY' ? 'Easy' : value.toUpperCase() === 'MEDIUM' ? 'Med' : 'Hard' }}
        </span>
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

      <template #cell-createdDate="{ value }">
        <span class="cell-date">{{ formatDate(value) }}</span>
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

    <template #footer>
      <div class="dialog-footer-actions">
         <div class="selection-info" v-if="selectedToAdd.length">
            Đã chọn <strong>{{ selectedToAdd.length }}</strong> bài tập
         </div>
         <div v-else></div>
         <div class="footer-btns">
           <AppButton variant="info" @click="handleClose">Hủy</AppButton>
           <AppButton variant="primary" :loading="adding" :disabled="!selectedToAdd.length" @click="confirmAdd">
              Thêm {{ selectedToAdd.length }} bài
           </AppButton>
         </div>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
/* Typography matching ProblemsList */
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
  font-weight: 500; 
  font-size: 14px; 
  color: #eff2f6; 
  transition: color 0.2s;
}

.cell-title.clickable { cursor: pointer; }
.cell-title.clickable:hover { color: var(--accent-primary); }

.cell-date { font-size: 13px; color: #8a8a8a; }

.difficulty-text {
  font-weight: 600;
  font-size: 13px;
}
.difficulty-easy { color: #00b8a3; }
.difficulty-medium { color: #ffc01e; }
.difficulty-hard { color: #ef4743; }

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.status-active { background: rgba(0, 184, 163, 0.1); color: #00b8a3; }
.status-draft { background: rgba(255, 161, 22, 0.1); color: #ffa116; }
.status-deleted { background: rgba(239, 71, 67, 0.1); color: #ef4743; }

.added-badge { background: rgba(255,161,22,0.15); color: #ffa116; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; }

.dialog-footer-actions { display: flex; align-items: center; justify-content: space-between; }
.selection-info { font-size: 13px; color: #8a8a8a; }
.selection-info strong { color: var(--accent-primary); }
.footer-btns { display: flex; gap: 8px; }
</style>
