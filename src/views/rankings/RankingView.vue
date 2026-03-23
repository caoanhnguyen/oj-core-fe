<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useRankingStore } from '@/stores/ranking'
import DarkPagination from '@/components/common/DarkPagination.vue'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
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

const type = computed(() => (route.params.type || 'acm').toUpperCase())
const page = ref(1)
const size = ref(20)

const rankings = computed(() => rankingStore.rankings)
const topRankings = computed(() => rankingStore.topRankings)

const chartOption = computed(() => {
  const data = [...topRankings.value]
  const categories = data.map(item => item.username)
  const values = type.value === 'ACM' 
    ? data.map(item => item.solvedCount)
    : data.map(item => item.totalScore)
  
  const label = type.value === 'ACM' ? 'Solved' : 'Total Score'
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
        await Promise.all([
            rankingStore.fetchTopTen(type.value),
            rankingStore.fetchRankings({ ruleType: type.value, page: page.value - 1, size: size.value })
        ])
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
</script>

<template>
  <div class="ranking-layout">
    <div class="content-section">
      <div class="section-header">
      <div>
        <h1 class="section-title">Bảng xếp hạng {{ type }}</h1>
        <p class="section-subtitle">Vinh danh những thành viên xuất sắc nhất theo thể thức {{ type }}</p>
      </div>
    </div>

    <!-- Chart Section (Redesigned as a card matching system cards or flat) -->
    <div class="chart-container" v-loading="rankingStore.loading && topRankings.length === 0">
      <div class="chart-header">
        <Medal stroke="#ffa116" :size="18" />
        <span>Top 10 {{ type === 'ACM' ? 'Solved' : 'Total Score' }}</span>
      </div>
      <div class="chart-wrapper">
        <VChart :option="chartOption" autoresize />
      </div>
    </div>

    <div class="table-controls">
      
      <div class="spacer"></div>
      
      <div class="solved-count">
        <div class="circle-progress"></div>
        <span>{{ rankingStore.pagination.totalElements }} Members</span>
      </div>
    </div>

    <TableSkeleton v-if="rankingStore.loading && rankings.length === 0" :columns="6" :rows="12" />

    <el-table 
      v-else
      :data="rankings" 
      class="dashboard-table leetcode-table"
      v-loading="rankingStore.loading"
      :show-header="true"
    >
      <el-table-column label="#" width="70" align="center">
        <template #default="{ $index }">
          <div class="rank-badge" :class="{ 'top-1': (page - 1) * size + $index + 1 === 1, 'top-2': (page - 1) * size + $index + 1 === 2, 'top-3': (page - 1) * size + $index + 1 === 3 }">
             {{ (page - 1) * size + $index + 1 }}
          </div>
        </template>
      </el-table-column>

      <el-table-column label="User" min-width="200" align="center">
        <template #default="{ row }">
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
      </el-table-column>

      <el-table-column label="Solved" width="100" align="center">
         <template #default="{ row }">
           <span class="stat-solved">{{ row.solvedCount }}</span>
         </template>
      </el-table-column>

      <el-table-column label="AC" width="100" align="center">
         <template #default="{ row }">
           <span class="stat-ac">{{ row.acCount }}</span>
         </template>
      </el-table-column>

      <el-table-column label="Total Submissions" width="180" align="center">
         <template #default="{ row }">
           <span class="stat-submissions">{{ row.submissionCount }}</span>
         </template>
      </el-table-column>

      <el-table-column v-if="type === 'OI'" label="Score" width="130" align="center">
         <template #default="{ row }">
           <span class="stat-score">{{ row.totalScore }}</span>
         </template>
      </el-table-column>

      <el-table-column label="Acceptance Rating" width="180" align="center">
         <template #default="{ row }">
           <span class="stat-rating">{{ getAcceptanceRating(row) }}</span>
         </template>
      </el-table-column>
    </el-table>

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
.ranking-layout {
  min-height: calc(100vh - 56px);
  background: var(--bg-primary);
}

.content-section {
  padding: 32px 40px;
  max-width: 1400px;
  margin: 0 auto;
}

.section-header {
  margin-bottom: 28px;
}

.section-title {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 4px 0;
}

.section-subtitle {
  font-size: 14px;
  color: #8a8a8a;
  margin: 0;
}

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

/* Table Controls - Consistent with SubmissionsList */
.table-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.search-wrap {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #8a8a8a;
}

.search-input {
  background: #282828;
  border: 1px solid transparent;
  border-radius: 20px;
  padding: 8px 16px 8px 40px;
  color: #eff2f6;
  font-size: 13px;
  width: 240px;
  outline: none;
}

.spacer { flex: 1; }

.solved-count {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8a8a8a;
  font-size: 13px;
  font-weight: 500;
}

.circle-progress {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #3e3e3e;
  border-top-color: #ffa116;
}

/* Table Design - Exact from SubmissionsList */
:deep(.el-table) {
  background-color: transparent !important;
  --el-table-bg-color: transparent !important;
  --el-table-tr-bg-color: transparent !important;
  --el-table-header-bg-color: transparent !important;
}

:deep(.el-table__inner-wrapper),
:deep(.el-table__body-wrapper),
:deep(.el-table__header-wrapper) {
  background-color: transparent !important;
}

:deep(.el-table__inner-wrapper::before),
:deep(.el-table__inner-wrapper::after),
:deep(.el-table::before),
:deep(.el-table::after) {
  display: none !important;
}

:deep(.el-table th.el-table__cell) {
  background-color: transparent !important;
  border-bottom: 1px solid #3e3e3e !important;
  color: #8a8a8a !important;
  font-weight: 500;
  font-size: 13px;
}

:deep(.el-table td.el-table__cell) {
  border-bottom: none !important;
  padding: 12px 0;
  background-color: transparent !important;
}

:deep(.el-table tr) {
  background-color: transparent !important;
}

:deep(.el-table tr:nth-child(odd) td.el-table__cell) {
  background: rgba(255, 255, 255, 0.03) !important;
}

:deep(.el-table tr:hover td.el-table__cell) {
  background: rgba(255, 255, 255, 0.08) !important;
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
