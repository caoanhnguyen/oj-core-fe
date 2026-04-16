<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useSubmissionStore } from '@/stores/submission'
import VChart, { THEME_KEY } from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components'

use([
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
])

const props = defineProps({
  problemId: {
    type: String,
    required: true
  }
})

const submissionStore = useSubmissionStore()

const loading = ref(true)
const statisticsData = ref(null)

const verdictColors = {
  'AC': '#2cbb5d',   // Green
  'WA': '#ef4743',   // Red
  'TLE': '#ffa116',  // Orange
  'MLE': '#facc15',  // Yellow
  'RE': '#d93a00',   // Dark Orange Error
  'CE': '#8a8a8a',   // Gray
  'SE': '#a855f7',   // Purple
  'PENDING': '#3b82f6' // Blue
}

const loadStatistics = async () => {
    loading.value = true
    try {
        statisticsData.value = await submissionStore.getProblemStatistics(props.problemId)
    } catch (error) {
        console.error("Failed to load statistics", error)
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    loadStatistics()
})

// Khi problemId thay đổi, tải lại (giả sử dùng param change)
watch(() => props.problemId, () => {
    loadStatistics()
})

const chartOptions = computed(() => {
    if (!statisticsData.value) return {}

    const { totalSubmissions, verdictCounts } = statisticsData.value
    
    // Chuẩn bị dữ liệu vẽ bánh
    const pieData = []
    
    // Group 1: AC vs Bị lỗi. Theo thiết kế, Vòng tròn TRONG chia 2: AC và Errors (Tổng WA+TLE+MLE+RE+CE+SE)
    let acCount = verdictCounts['AC'] || 0
    let otherCount = totalSubmissions - acCount

    const innerData = [
        { value: acCount, name: 'AC' },
        { value: otherCount, name: 'Others' }
    ].filter(i => i.value > 0)
    
    // Group 2: Vòng ngoài, break detail ra từng loại cụ thể
    const outerData = Object.entries(verdictCounts)
        .map(([name, value]) => ({ name, value }))
        .filter(item => item.value > 0)

    return {
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)'
        },
        legend: {
            // Hiển thị legend theo chiều ngang ở phía trên
            // Chỉ hiển thị legend cho các loại verdict có giá trị
            data: outerData.map(o => o.name),
            icon: 'roundRect',
            top: 'top',
            textStyle: {
                color: '#fff'
            }
        },
        series: [
            {
                name: 'AC vs Others',
                type: 'pie',
                selectedMode: 'single',
                radius: [0, '40%'], // Vòng trong
                label: {
                    position: 'inner',
                    fontSize: 14,
                    color: '#fff',
                    formatter: (params) => {
                       return `${params.name}: ${params.value}\n${params.percent}%`
                    }
                },
                labelLine: {
                    show: false
                },
                itemStyle: {
                    color: (params) => params.data.name === 'AC' ? verdictColors['AC'] : verdictColors['WA']
                     // Others lấy WA làm màu (đỏ)
                },
                data: innerData
            },
            {
                name: 'Details',
                type: 'pie',
                radius: ['55%', '85%'], // Vòng ngoài (Doughnut)
                labelLine: {
                    length: 10,
                },
                label: {
                    formatter: function (params) {
                         return `{name|${params.name}: }{c|${params.value}}\n{per|${params.percent}%}`;
                    },
                    backgroundColor: 'transparent',
                    rich: {
                        name: {
                            color: '#e2e8f0',
                            fontWeight: 'bold'
                        },
                        c: {
                            color: '#94a3b8'
                        },
                        per: {
                            color: '#94a3b8',
                            fontSize: 12
                        }
                    }
                },
                itemStyle: {
                    color: (params) => verdictColors[params.data.name] || '#ccc'
                },
                data: outerData
            }
        ]
    }
})

</script>

<template>
  <div class="statistics-tab">
      <div v-if="loading" class="loading-state">
          <el-skeleton :rows="5" animated />
      </div>
      <div v-else-if="!statisticsData || statisticsData.totalSubmissions === 0" class="empty-state">
          <span>Chưa có dữ liệu thống kê nào cho bài này.</span>
      </div>
      <div v-else class="chart-container">
          <!-- Doughnut Chart ECharts -->
           <v-chart class="chart" :option="chartOptions" autoresize />
      </div>
  </div>
</template>

<style scoped>
.statistics-tab {
    padding: 100px 0;
}

.chart-container {
    width: 100%;
    height: 500px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.chart {
    height: 100%;
    width: 100%;
}

.empty-state {
    text-align: center;
    color: #888;
    padding: 40px;
}
</style>
