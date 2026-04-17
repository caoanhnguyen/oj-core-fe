<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { FileText, MessageSquare, Users, Trophy, ChevronDown, CheckCircle, Activity, LayoutGrid } from 'lucide-vue-next'
import PageHeader from '@/components/common/PageHeader.vue'
import { systemAPI } from '@/api/system'
import { handleApiError } from '@/utils/errorHandler'

import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import VChart, { THEME_KEY } from 'vue-echarts'
import { provide } from 'vue'

use([CanvasRenderer, LineChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

// Dark theme
provide(THEME_KEY, 'dark')

const { t } = useI18n()
const loading = ref(true)
const rawStats = ref(null)

const selectedDays = ref(7)
const dayOptions = computed(() => [
  { label: t('dashboard.overview.last_3_days'), value: 3 },
  { label: t('dashboard.overview.last_7_days'), value: 7 },
  { label: t('dashboard.overview.last_30_days'), value: 30 }
])

const stats = computed(() => {
  if (!rawStats.value) return []
  return [
    { label: t('dashboard.overview.total_problems'), value: rawStats.value.totalProblems || 0, icon: FileText, color: '#409eff', bg: 'rgba(64, 158, 255, 0.1)' },
    { label: t('dashboard.overview.active_users'), value: rawStats.value.activeUsers || 0, icon: Users, color: '#2cbb5d', bg: 'rgba(44, 187, 93, 0.1)' },
    { label: t('dashboard.overview.active_contests'), value: rawStats.value.activeContests || 0, icon: Trophy, color: '#ffa116', bg: 'rgba(255, 161, 22, 0.1)' },
    { label: t('dashboard.overview.total_submissions'), value: rawStats.value.totalSubmissions || 0, icon: Activity, color: '#f56c6c', bg: 'rgba(245, 108, 108, 0.1)' },
  ]
})

// Submission Trend Chart Option
const lineChartOption = computed(() => {
  if (!rawStats.value || !rawStats.value.trendStats) return {}
  const trendData = rawStats.value.trendStats
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '5%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendData.map(t => {
        const date = new Date(t.date)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }),
      axisLine: { lineStyle: { color: '#3e3e3e' } },
      axisLabel: { color: '#8a8a8a' }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#3e3e3e', type: 'dashed' } },
      axisLabel: { color: '#8a8a8a' }
    },
    series: [
      {
        name: t('dashboard.overview.total_submissions'),
        type: 'line',
        smooth: true,
        data: trendData.map(t => t.count),
        itemStyle: { color: '#ffa116' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 161, 22, 0.3)' },
              { offset: 1, color: 'rgba(255, 161, 22, 0)' }
            ]
          }
        }
      }
    ]
  }
})

// Verdict Pie Chart Option
const pieChartOption = computed(() => {
  if (!rawStats.value || !rawStats.value.verdictStats) return {}
  const verdicts = rawStats.value.verdictStats
  
  const colorMap = {
    'AC': '#2cbb5d',
    'WA': '#f56c6c',
    'TLE': '#ffa116',
    'MLE': '#ffa116',
    'CE': '#8a8a8a'
  }
  
  const data = verdicts.map(v => ({
    name: v.verdict,
    value: v.count,
    itemStyle: { color: colorMap[v.verdict] || '#409eff' }
  }))

  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    legend: {
      bottom: '0%',
      left: 'center',
      textStyle: { color: '#8a8a8a' }
    },
    series: [
      {
        name: 'Verdicts',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#282828',
          borderWidth: 2
        },
        label: { show: false, position: 'center' },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
            color: '#eff2f6'
          }
        },
        labelLine: { show: false },
        data: data
      }
    ]
  }
})

const fetchStats = async () => {
  try {
    loading.value = true
    rawStats.value = await systemAPI.getDashboardStats(selectedDays.value)
  } catch (error) {
    handleApiError(error, t('dashboard.overview.fetch_error'))
  } finally {
    loading.value = false
  }
}

watch(selectedDays, fetchStats)

onMounted(fetchStats)
</script>

<template>
  <div class="admin-layout-container">
    <div class="dashboard-header-wrapper">
      <PageHeader 
        :title="$t('dashboard.overview.title')" 
        :subtitle="$t('dashboard.overview.subtitle')"
      />
      <div class="filter-controls">
         <el-select v-model="selectedDays" class="dark-select date-filter" :disabled="loading">
            <template #prefix><LayoutGrid :size="16" /></template>
            <el-option
              v-for="item in dayOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
         </el-select>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid" v-loading="loading">
      <div v-for="stat in stats" :key="stat.label" class="stat-card">
        <div class="stat-icon" :style="{ color: stat.color, background: stat.bg }">
          <component :is="stat.icon" :size="24" />
        </div>
        <div class="stat-content">
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-value">{{ loading ? '-' : stat.value }}</div>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="charts-row" v-loading="loading">
      <div class="chart-card line-chart-card">
        <h3 class="chart-title">{{ $t('dashboard.overview.submission_activity') }} ({{ $t('dashboard.overview.last_days', { days: selectedDays }) }})</h3>
        <div class="chart-container">
          <v-chart class="chart" :option="lineChartOption" autoresize />
        </div>
      </div>

      <div class="chart-card pie-chart-card">
        <h3 class="chart-title">{{ $t('dashboard.overview.verdicts_distribution') }}</h3>
        <div class="chart-container">
          <v-chart class="chart" :option="pieChartOption" autoresize />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-header-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.filter-controls {
  margin-top: var(--spacing-lg);
}

.date-filter {
  width: 160px;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.stat-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  transition: all 0.2s ease;
}

.stat-card:hover {
  border-color: var(--accent-primary);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(255, 161, 22, 0.1);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

/* Charts Row */
.charts-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--spacing-lg);
}

.chart-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-lg) 0;
}

.chart-container {
  flex: 1;
  min-height: 300px;
}

.chart {
  width: 100%;
  height: 100%;
}

@media (max-width: 1024px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
}
</style>

<style>
/* Dark select overrides */
.dark-select .el-input__wrapper {
  background-color: var(--bg-secondary) !important;
  box-shadow: 0 0 0 1px var(--border-primary) inset !important;
}
.dark-select .el-input__inner {
  color: var(--text-primary) !important;
}
</style>
