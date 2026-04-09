<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSubmissionStore } from '@/stores/submission'
import { useAuthStore } from '@/stores/auth'
import { contestsAPI } from '@/api/contests'
import { ElMessage } from 'element-plus'
import { handleApiError } from '@/utils/errorHandler'

const props = defineProps({
  problemId: {
    type: String,
    required: true
  },
  contestId: {
    type: String,
    default: null
  },
  contestKey: {
    type: String,
    default: null
  }
})

const router = useRouter()
const submissionStore = useSubmissionStore()
const authStore = useAuthStore()

const loading = ref(true)
const submissions = ref([])
const totalElements = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const getVerdictType = (verdict) => {
  switch (verdict) {
    case 'AC': return 'success'
    case 'WA': return 'danger'
    case 'TLE': case 'MLE': return 'warning'
    case 'RE': case 'SE': return 'danger'
    case 'CE': return 'info'
    default: return 'info'
  }
}

const loadSubmissions = async () => {
    loading.value = true
    try {
        const params = {
            page: Math.max(0, currentPage.value - 1),
            size: pageSize.value,
            problemId: props.problemId,
            sort: 'createdDate,desc'
        }

        let response
        if (authStore.isAdminOrMod) {
            // Admin/Mod
            if (props.contestId) {
                // Nếu đang soi contest, dùng API contest
                params.contestId = props.contestId
                response = await contestsAPI.adminGetSubmissions(props.contestId, params)
            } else {
                response = await submissionStore.getAllSubmissions(params)
            }
        } else {
            // User thường: chỉ lấy submissions của chính mình
            if (!authStore.isAuthenticated) {
                submissions.value = []
                totalElements.value = 0
                loading.value = false
                return
            }
            params.userId = authStore.user?.id
            
            if (props.contestKey) {
                // Ưu tiên dùng contestKey cho user API
                response = await contestsAPI.getMySubmissions(props.contestKey, params)
            } else if (props.contestId) {
                // Fallback nếu component caller truyền lú contestId
                response = await contestsAPI.getMySubmissions(props.contestId, params)
            } else {
                response = await submissionStore.getSubmissions(params)
            }
        }

        submissions.value = response.content || []
        totalElements.value = response.totalElements || 0

    } catch (error) {
        handleApiError(error, 'Lỗi khi tải lịch sử bài nộp')
    } finally {
        loading.value = false
    }
}

const handlePageChange = (val) => {
    currentPage.value = val
    loadSubmissions()
}

const canViewDetail = (row) => {
    return authStore.isAdminOrMod || (authStore.isAuthenticated && row.userId === authStore.user?.id)
}

const viewSubmissionDetails = (row) => {
    if (canViewDetail(row)) {
        router.push({ path: `/submissions/${row.submissionId}`})
    }
}

const rowClassName = ({ row }) => {
    return canViewDetail(row) ? 'clickable-row' : 'disabled-row'
}

onMounted(() => {
    loadSubmissions()
})

watch(() => props.problemId, () => {
    currentPage.value = 1
    loadSubmissions()
})

// Expose so parent can trigger a reload (e.g. after submit polling completes)
defineExpose({ loadSubmissions })

</script>

<template>
  <div class="submissions-tab">
      <div class="table-container" v-loading="loading">
        <el-table 
            :data="submissions" 
            style="width: 100%" 
            @row-click="viewSubmissionDetails" 
            :row-class-name="rowClassName"
            empty-text="Bạn chưa có bài nộp nào cho bài này."
        >
            <el-table-column label="Time" min-width="160">
                <template #default="{ row }">
                   {{ new Date(row.createdDate).toLocaleString('vi-VN') }}
                </template>
            </el-table-column>
            
            <el-table-column label="Status" min-width="120">
                <template #default="{ row }">
                    <span :class="['status-cell', getVerdictType(row.verdict)]">
                        {{ row.verdict || 'PENDING' }}
                    </span>
                </template>
            </el-table-column>

            <el-table-column label="Score" min-width="120">
                <template #default="{ row }">
                    <span :class="['status-cell']">
                        {{ row.score }}
                    </span>
                </template>
            </el-table-column>

            <el-table-column label="Runtime" min-width="100">
                <template #default="{ row }">
                    <span v-if="row.executionTimeMs != null" class="metrics">
                        {{ row.executionTimeMs }} ms
                    </span>
                    <span v-else>N/A</span>
                </template>
            </el-table-column>

            <el-table-column label="Memory" min-width="100">
                <template #default="{ row }">
                    <span v-if="row.executionMemoryMb != null" class="metrics">
                        {{ row.executionMemoryMb }} MB
                    </span>
                    <span v-else>N/A</span>
                </template>
            </el-table-column>
            
            <el-table-column label="Language" min-width="100">
                 <template #default="{ row }">
                    <el-tag type="info" size="small" effect="plain" class="lang-tag">{{ row.languageKey }}</el-tag>
                 </template>
            </el-table-column>
        </el-table>

        <div class="pagination-container" v-if="totalElements > 0">
            <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :total="totalElements"
                layout="prev, pager, next"
                small
                @current-change="handlePageChange"
            />
        </div>
      </div>
  </div>
</template>

<style scoped>
.submissions-tab {
    padding: 16px 0;
}

.table-container {
    width: 100%;
}

:deep(.el-table) {
    background-color: transparent;
    --el-table-border-color: rgba(255, 255, 255, 0.1);
    --el-table-header-bg-color: rgba(255, 255, 255, 0.04);
    --el-table-header-text-color: #a0a0a0;
    --el-table-row-hover-bg-color: rgba(255, 255, 255, 0.05);
}

:deep(.el-table th.el-table__cell) {
    background-color: var(--el-table-header-bg-color);
    border-bottom: 1px solid var(--el-table-border-color);
    font-weight: 600;
}

:deep(.el-table tr) {
    background-color: transparent;
}

:deep(.el-table td.el-table__cell) {
    border-bottom: 1px solid var(--el-table-border-color);
}

:deep(.clickable-row) {
    cursor: pointer;
}
:deep(.disabled-row) {
    cursor: default;
}

:deep(.el-table .disabled-row:hover > td.el-table__cell) {
    background-color: transparent !important;
}

.status-cell {
    font-weight: 700;
    font-size: 13px;
}
.status-cell.success { color: #2cbb5d; }
.status-cell.danger { color: #ef4743; }
.status-cell.warning { color: #ffa116; }
.status-cell.info { color: #8a8a8a; }

.metrics {
    font-size: 13px;
    color: #e0e0e0;
}

.lang-tag {
    background-color: rgba(255, 255, 255, 0.08);
    border: none;
    color: #ccc;
}

.pagination-container {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
}

:deep(.el-pagination button) { background-color: transparent !important; }
:deep(.el-pager li) { background-color: transparent !important; }
:deep(.el-pager li.is-active) { color: #ffa116; font-weight: bold; }
</style>
