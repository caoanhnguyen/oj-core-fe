<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { contestsAPI } from '@/api/contests'
import DataTable from '@/components/common/DataTable.vue'
import DarkPagination from '@/components/common/DarkPagination.vue'

const props = defineProps({
  contestId: { type: String, required: true },
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

// Tie-ranking logic
const leaderboardWithRank = computed(() => {
  if (!leaderboard.value.length) return []
  
  const result = []
  let currentRank = 1
  let prevScore = -1
  let prevPenalty = -1

  leaderboard.value.forEach((row, index) => {
    const isSameAsPrev = row.score === prevScore && row.penalty === prevPenalty
    if (!isSameAsPrev) {
      currentRank = (page.value - 1) * pageSize.value + index + 1
    }
    
    result.push({
      ...row,
      computedRank: currentRank
    })
    
    prevScore = row.score
    prevPenalty = row.penalty
  })
  
  return result
})

const getMedal = (rank) => {
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' }
  return medals[rank] || rank
}

const formatPenaltyDisplay = (seconds) => {
  if (seconds === undefined || seconds === null) return ''
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  
  const hStr = h > 0 ? h + ':' : ''
  const mStr = (h > 0 ? m.toString().padStart(2, '0') : m.toString()) + ':'
  const sStr = sec.toString().padStart(2, '0')
  
  return `${hStr}${mStr}${sStr}`
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
    if (result.isAc) return formatPenaltyDisplay(result.penalty)
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

watch(() => props.contestId, () => { page.value = 1; load() }, { immediate: true })
</script>

<template>
  <div class="tab-leaderboard">
    <DataTable
      :data="leaderboardWithRank"
      :columns="columns"
      :loading="loading"
      empty-text="Chưa có dữ liệu xếp hạng."
    >
      <template #cell-_rank="{ row }">
        <span class="lb-rank">{{ getMedal(row.computedRank) }}</span>
      </template>

      <template #cell-username="{ row }">
        <span class="cell-link" @click="router.push(`/profile/${row.username}`)">{{ row.username }}</span>
      </template>

      <template #cell-score="{ row }">
        <span class="lb-total-score">{{ row.score ?? 0 }}</span>
      </template>

      <template #cell-penalty="{ row }">
        <span class="lb-total-penalty">{{ formatPenaltyDisplay(row.penalty) || '00:00' }}</span>
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

