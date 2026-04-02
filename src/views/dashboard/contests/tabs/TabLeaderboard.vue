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
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const columns = computed(() => {
  const cols = [
    { key: 'rank', label: 'Hạng', width: 80, align: 'center', fixed: 'left' },
    { key: 'username', label: 'Thí sinh', minWidth: 200 },
    { key: 'score', label: 'Điểm', width: 120, align: 'center' }
  ]
  if (props.ruleType === 'ACM') {
    cols.push({ key: 'penalty', label: 'Penalty', width: 130, align: 'center' })
  }
  return cols
})

const getMedal = (rank) => {
  if (rank === 1) return '🥇 1'
  if (rank === 2) return '🥈 2'
  if (rank === 3) return '🥉 3'
  return rank.toString()
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
      :data="leaderboard"
      :columns="columns"
      :loading="loading"
      empty-text="Chưa có dữ liệu xếp hạng."
    >
      <template #cell-rank="{ index }">
        <span class="lb-rank" :class="'rank-' + ((page - 1) * pageSize + index + 1)">
          {{ getMedal((page - 1) * pageSize + index + 1) }}
        </span>
      </template>

      <template #cell-username="{ row }">
        <span class="cell-link" @click="router.push(`/profile/${row.username}`)">{{ row.username }}</span>
      </template>

      <template #cell-score="{ row }">
        <span class="highlight-score">{{ row.score ?? 0 }}</span>
      </template>

      <template #cell-penalty="{ row }">
        <span class="penalty-text">{{ row.penalty ?? 0 }}</span>
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
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.rank-1 { color: #ffd700; font-size: 15px; }
.rank-2 { color: #c0c0c0; font-size: 14px; }
.rank-3 { color: #cd7f32; font-size: 13px; }

.highlight-score {
  font-size: 14px;
  font-weight: 700;
  color: #00b8a3;
}
.penalty-text {
  font-size: 13px;
  font-weight: 600;
  color: #ef4743;
}
</style>
