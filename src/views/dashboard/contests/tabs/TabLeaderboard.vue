<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { contestsAPI } from '@/api/contests'
import DataTable from '@/components/common/DataTable.vue'
import DarkPagination from '@/components/common/DarkPagination.vue'
import AppButton     from '@/components/common/AppButton.vue'
import { Download } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'
import { exportStyledExcel } from '@/utils/excelExport'

const props = defineProps({
  contestId: { type: String, required: true },
  contestTitle: { type: String, default: '' },
  ruleType: { type: String, default: 'ACM' }
})
const emit = defineEmits(['count'])
const router = useRouter()

const leaderboard = ref([])
const problems = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const columns = computed(() => {
  const cols = [
    { key: '_rank', label: 'Hạng', width: 80, align: 'center', fixed: 'left' },
    { key: 'username', label: 'Thí sinh', minWidth: 200 },
    { key: 'score', label: 'Điểm', width: 100, align: 'center' }
  ]
  
  if (props.ruleType === 'ACM' || props.ruleType === 'OI') {
    cols.push({ key: 'penalty', label: 'Penalty', width: 110, align: 'center' })
  }

  // Add problem columns
  problems.value.forEach(p => {
    cols.push({
      key: `p_${p.displayId}`,
      label: p.displayId,
      width: '90',
      align: 'center'
    })
  })
  
  return cols
})

// Rank is now fetched directly from the backend API

const getMedal = (rank) => {
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' }
  return medals[rank] || rank
}

const formatPenaltyDisplay = (minutes) => {
  if (minutes === undefined || minutes === null) return ''
  const mTotal = Math.max(0, Math.floor(minutes))
  const h = Math.floor(mTotal / 60)
  const m = mTotal % 60
  
  const hStr = h > 0 ? h + ':' : ''
  const mStr = (h > 0 ? m.toString().padStart(2, '0') : m.toString())
  
  return hStr ? `${hStr}${mStr}` : `${mStr}m`
}

const getMatrixClass = (result, maxPoints) => {
  if (!result) return 'lm-cell-empty'
  if (props.ruleType === 'ACM') {
    if (result.isAc) return 'lm-cell-ac'
    if (result.tries > 0) return 'lm-cell-wa'
    return 'lm-cell-empty'
  } else {
    if (result.score === undefined || result.score === null) return 'lm-cell-empty'
    if (result.score === 0 && result.penalty > 0) return 'lm-cell-wa'
    if (result.score === 0) return 'lm-cell-empty'
    if (result.score >= (maxPoints || 100)) return 'lm-cell-ac'
    return 'lm-cell-partial'
  }
}

const getMatrixScore = (result) => {
  if (!result) return ''
  if (props.ruleType === 'ACM') {
    if (result.isAc) return `+${result.tries > 0 ? result.tries : ''}`
    if (result.tries > 0) return `-${result.tries}`
    return ''
  } else {
    if (result.score === undefined || result.score === null) return ''
    if (result.score === 0 && result.penalty > 0) return '0'
    if (result.score === 0) return ''
    return Number.isInteger(result.score) ? result.score : result.score.toFixed(2)
  }
}

const getMatrixSubtext = (result) => {
  if (!result) return ''
  if (props.ruleType === 'ACM') {
    if (result.isAc) {
      const solveTime = result.penalty - (result.tries * 20)
      return formatPenaltyDisplay(Math.max(0, solveTime))
    }
    return ''
  } else {
    if (result.score > 0) return formatPenaltyDisplay(result.penalty)
    return ''
  }
}

const load = async () => {
  try {
    loading.value = true
    const data = await contestsAPI.adminGetLeaderboard(props.contestId, {
      page: page.value - 1,
      size: pageSize.value
    })
    leaderboard.value = data.content || []
    total.value = data.totalElements || 0
    if (data.problems) {
      problems.value = data.problems
    }
    emit('count', total.value)
  } finally {
    loading.value = false
  }
}

const exporting = ref(false)
const handleExport = async () => {
  try {
    exporting.value = true
    const response = await contestsAPI.adminExportLeaderboard(props.contestId)
    const textData = await response.text()
    // Parse CSV response using XLSX
    const workbook = XLSX.read(textData, { type: 'string' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
    
    if (rows.length < 1) {
       ElMessage.warning('Không có dữ liệu để xuất.')
       return
    }

    const headers = rows[0]
    const data = rows.slice(1)

    // Set column widths: Rank(10), Username(25), Score(15), Penalty(15), and 15 for each problem
    const columnWidths = [10, 25, 15, 15, ...Array(headers.length > 4 ? headers.length - 4 : 0).fill(15)]

    const baseName = props.contestTitle || props.contestId.substring(0, 8)
    // Replace invalid characters for filenames
    const safeName = baseName.replace(/[\/\\?%*:|"<>]/g, '_').substring(0, 50)

    await exportStyledExcel({
        title: `Kết quả bảng xếp hạng Contest: ${baseName}`,
        filename: `Leaderboard_${safeName}.xlsx`,
        sheetName: 'Leaderboard',
        headers,
        data,
        columnWidths
    })
    
    ElMessage.success('Xuất dữ liệu thành công!')
  } catch (error) {
    ElMessage.error('Xuất kết quả thất bại.')
  } finally {
    exporting.value = false
  }
}

watch(() => props.contestId, () => { page.value = 1; load() }, { immediate: true })
</script>

<template>
  <div class="tab-leaderboard">
    <div class="sub-toolbar">
      <div class="spacer" />
      <span class="count-text">Tổng thí sinh tham gia: {{ total }}</span>
      <AppButton variant="secondary" :icon="Download" :loading="exporting" @click="handleExport">Xuất kết quả (Excel)</AppButton>
    </div>

    <DataTable
      :data="leaderboard"
      :columns="columns"
      :loading="loading"
      empty-text="Chưa có dữ liệu xếp hạng."
    >
      <template #cell-_rank="{ row }">
        <span class="lb-rank">{{ getMedal(row.rank) }}</span>
      </template>

      <template #cell-username="{ row }">
        <span class="cell-link" @click="router.push(`/profile/${row.username}`)">{{ row.username }}</span>
      </template>

      <template #cell-score="{ row }">
        <span class="lb-total-score">{{ row.score ?? 0 }}</span>
      </template>

      <template #cell-penalty="{ row }">
        <span class="lb-total-penalty">{{ formatPenaltyDisplay(row.penalty) || '0m' }}</span>
      </template>

      <!-- Dynamic Problem Headers -->
      <template v-for="prob in problems" :key="'h_' + prob.id" #[`header-p_${prob.displayId}`]>
        <div class="lb-matrix-header">
          <div class="lmh-id">{{ prob.displayId }}</div>
          <div class="lmh-divider"></div>
          <div class="lmh-points">{{ prob.points }}</div>
        </div>
      </template>

      <!-- Dynamic Problem Cells -->
      <template v-for="prob in problems" :key="'c_' + prob.id" #[`cell-p_${prob.displayId}`]="{ row }">
        <div class="lb-matrix-cell" :class="getMatrixClass(row.problemResults?.[prob.displayId], prob.points)">
          <div class="lm-score">{{ getMatrixScore(row.problemResults?.[prob.displayId]) }}</div>
          <div class="lm-subtext" v-if="getMatrixSubtext(row.problemResults?.[prob.displayId])">
            {{ getMatrixSubtext(row.problemResults?.[prob.displayId]) }}
          </div>
        </div>
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
.tab-leaderboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sub-toolbar { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
  margin-bottom: 4px;
}

.spacer { flex: 1; }

.count-text {
  font-size: 13px;
  color: #8a8a8a;
}

.cell-link {
  font-size: 14px;
  font-weight: 500;
  color: #eff2f6;
  cursor: pointer;
  transition: color 0.2s;
}
.cell-link:hover { color: var(--accent-primary); }

.lb-rank {
  font-weight: 700;
  font-size: 14px;
  color: #8a8a8a;
}

.lb-total-score {
  font-size: 15px;
  font-weight: 700;
  color: #00b8a3;
}

.lb-total-penalty {
  font-size: 13px;
  font-weight: 500;
  color: #8a8a8a;
}

/* Matrix Styles */
.lb-matrix-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}
.lmh-id { font-weight: 700; font-size: 13px; color: #eff2f6; line-height: 1; }
.lmh-divider { width: 20px; height: 1px; background: #444; margin: 2px 0; }
.lmh-points { font-size: 11px; color: #8a8a8a; font-weight: 500; line-height: 1; }

.lb-matrix-cell {
  min-height: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
  padding: 4px;
}

.lm-score { font-size: 15px; font-weight: 600; line-height: 1.1; }
.lm-subtext { font-size: 10px; color: var(--text-secondary); margin-top: 3px; opacity: 0.8; line-height: 1; }

.lm-cell-ac { background-color: rgba(44, 187, 93, 0.18); border: 1px solid rgba(44, 187, 93, 0.1); }
.lm-cell-ac .lm-score { color: #2cbb5d; }
.lm-cell-wa { background-color: rgba(239, 71, 67, 0.1); border: 1px solid rgba(239, 71, 67, 0.1); }
.lm-cell-wa .lm-score { color: #ef4743; }
.lm-cell-partial { background-color: rgba(255, 161, 22, 0.1); border: 1px solid rgba(255, 161, 22, 0.1); }
.lm-cell-partial .lm-score { color: #ffa116; }

/* Customizing DataTable headers for Matrix style */
:deep(.dashboard-table th.el-table__cell) {
  background-color: #0d0d0d !important;
}
</style>

