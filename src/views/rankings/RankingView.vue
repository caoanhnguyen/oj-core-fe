<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useRankingStore } from '@/stores/ranking'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import TableControls from '@/components/common/TableControls.vue'
import DataTable from '@/components/common/DataTable.vue'
import { Trophy, User, Search, Medal } from 'lucide-vue-next'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
} from 'echarts/components'

// Register ECharts components
use([
  CanvasRenderer,
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
])

const route = useRoute()
const rankingStore = useRankingStore()
const { t } = useI18n()

const type = computed(() => (route.params.type || 'acm').toUpperCase())
const page = ref(1)
const size = ref(100)

const rankings = computed(() => rankingStore.rankings)
const topRankings = computed(() => rankingStore.topRankings)

const chartOption = computed(() => {
  const data = [...topRankings.value]
  const categories = data.map(item => item.username)
  const values = type.value === 'ACM' 
    ? data.map(item => item.solvedCount)
    : data.map(item => item.totalScore)
  
  const label = type.value === 'ACM' ? t('rankings.col_solved') : t('rankings.col_score')
  const barColor = type.value === 'ACM' ? '#ffa116' : '#2cbb5d'

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#1a1a1a',
      borderColor: '#333',
      textStyle: { color: '#fff' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: '#444' } },
      axisLabel: { 
        color: '#eff2f6',
        fontWeight: 'bold',
        fontSize: 11,
        interval: 0,
        rotate: data.length > 6 ? 30 : 0
      }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { lineStyle: { color: '#444' } },
      splitLine: { lineStyle: { color: '#333' } },
      axisLabel: { color: '#8a8a8a' }
    },
    series: [
      {
        name: label,
        type: 'bar',
        data: values,
        barWidth: '50%',
        itemStyle: {
          color: barColor,
          borderRadius: [4, 4, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          color: '#fff',
          formatter: '{c}'
        }
      }
    ]
  }
})

const getAcceptanceRating = (row) => {
  if (!row.submissionCount || row.submissionCount === 0) return '0.00%'
  return ((row.acCount / row.submissionCount) * 100).toFixed(2) + '%'
}

const fetchAll = async () => {
    try {
        await rankingStore.fetchRankings({ ruleType: type.value, page: page.value - 1, size: size.value })
    } catch (e) {
        console.error(e)
    }
}

const handlePageChange = (val) => {
    page.value = val
    rankingStore.fetchRankings({ ruleType: type.value, page: page.value - 1, size: size.value })
}

const handleSizeChange = (val) => {
    size.value = val
    page.value = 1
    rankingStore.fetchRankings({ ruleType: type.value, page: page.value - 1, size: size.value })
}

watch(type, () => {
    page.value = 1
    fetchAll()
})

onMounted(fetchAll)

const tableColumns = computed(() => {
  const baseCols = [
    { key: '_rank', label: '#', width: '70', align: 'center' },
    { key: 'user', label: t('rankings.col_user'), minWidth: '200', align: 'left' },
    { key: 'solved', label: t('rankings.col_solved'), width: '100', align: 'center' },
    { key: 'ac', label: t('rankings.col_ac'), width: '100', align: 'center' },
    { key: 'submissions', label: t('rankings.col_total_submissions'), width: '180', align: 'center' }
  ]
  if (type.value === 'OI') {
    baseCols.push({ key: 'score', label: t('rankings.col_score'), width: '130', align: 'center' })
  }
  baseCols.push({ key: 'rating', label: t('rankings.col_acceptance_rating'), width: '180', align: 'center' })
  return baseCols
})
</script>

<template>
  <div class="public-layout-page">
    <div class="public-layout-container">
      <PageHeader 
        :title="type === 'ACM' ? $t('rankings.title_acm') : $t('rankings.title_oi')" 
        :subtitle="type === 'ACM' ? $t('rankings.subtitle_acm') : $t('rankings.subtitle_oi')"
      />

    <!-- Chart Section (Redesigned as a card matching system cards or flat) -->
    <div class="chart-container" v-loading="rankingStore.loading && topRankings.length === 0">
      <div class="chart-header">
        <Medal stroke="#ffa116" :size="18" />
        <span>{{ type === 'ACM' ? $t('rankings.top_10_solved') : $t('rankings.top_10_score') }}</span>
      </div>
      <div class="chart-wrapper">
        <VChart :option="chartOption" autoresize />
      </div>
    </div>

    <TableControls 
      hideSearch 
      :total-elements="rankingStore.pagination.totalElements" 
      :item-name="$t('rankings.item_name')" 
    />

    <TableSkeleton v-if="rankingStore.loading && rankings.length === 0" :columns="6" :rows="12" />

    <DataTable
      v-else
      :data="rankings"
      :columns="tableColumns"
      :loading="rankingStore.loading"
    >
      <template #cell-_rank="{ row }">
        <div class="rank-badge" :class="{ 'top-1': row.rank === 1, 'top-2': row.rank === 2, 'top-3': row.rank === 3 }">
           {{ row.rank }}
        </div>
      </template>

      <template #cell-user="{ row }">
        <div class="user-cell centered">
           <div class="user-avatar-wrap">
             <img v-if="row.avatarUrl" :src="row.avatarUrl" class="user-avatar-img" />
             <div v-else class="user-avatar-placeholder">
               <User :size="14" />
             </div>
           </div>
           <RouterLink :to="`/profile/${row.username}`" class="cell-link username" @click.stop>
             {{ row.username }}
           </RouterLink>
        </div>
      </template>

      <template #cell-solved="{ row }">
        <span class="stat-solved">{{ row.solvedCount }}</span>
      </template>

      <template #cell-ac="{ row }">
        <span class="stat-ac">{{ row.acCount }}</span>
      </template>

      <template #cell-submissions="{ row }">
        <span class="stat-submissions">{{ row.submissionCount }}</span>
      </template>

      <template #cell-score="{ row }">
        <span class="stat-score">{{ row.totalScore }}</span>
      </template>

      <template #cell-rating="{ row }">
        <span class="stat-rating">{{ getAcceptanceRating(row) }}</span>
      </template>
    </DataTable>

    <DarkPagination
      v-if="rankingStore.pagination.totalElements > 0"
      :current-page="page"
      :page-size="size"
      :total="rankingStore.pagination.totalElements"
      @size-change="handleSizeChange"
      @current-change="handlePageChange"
    />
      </div>
    </div>
  </template>

<style scoped>

/* Chart Card Styling */
.chart-container {
  background: #1e1e1e;
  border-radius: 12px;
  border: 1px solid #333;
  margin-bottom: 32px;
  overflow: hidden;
}

.chart-header {
  padding: 16px 20px;
  border-bottom: 1px solid #333;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #8a8a8a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.chart-wrapper {
  height: 340px;
  padding: 10px 20px;
}

/* User & Rank Specifics */
.user-cell.centered {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.user-avatar-wrap {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  background: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8a8a8a;
}

.user-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.username {
  font-weight: 600;
  color: #eff2f6;
  font-size: 14px;
  text-decoration: none;
}

.username:hover {
  color: var(--accent-primary);
}

.rank-badge {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-weight: 700;
  font-size: 12px;
  margin: 0 auto;
}

.rank-badge.top-1 { background: rgba(255, 161, 22, 0.2); color: #ffa116; }
.rank-badge.top-2 { background: rgba(255, 255, 255, 0.1); color: #eff2f6; }
.rank-badge.top-3 { background: rgba(173, 138, 86, 0.2); color: #ad8a56; }

.stat-solved { color: #ffa116; font-weight: 700; }
.stat-ac { color: #2cbb5d; font-weight: 700; }
.stat-score { color: #409eff; font-weight: 700; }
.stat-submissions { color: #8a8a8a; }
.stat-rating { font-variant-numeric: tabular-nums; }

@media (max-width: 768px) {
  .content-section { padding: 20px; }
  .chart-wrapper { height: 280px; }
}
</style>
