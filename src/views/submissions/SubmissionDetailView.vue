<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSubmissionStore } from '@/stores/submission'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { handleApiError } from '@/utils/errorHandler'
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Clock, Cpu, Code2, Calendar, Trophy, Copy } from 'lucide-vue-next'
import * as monaco from 'monaco-editor'

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

// Configure Monaco Workers
self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') return new jsonWorker()
    if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker()
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker()
    if (label === 'typescript' || label === 'javascript') return new tsWorker()
    return new editorWorker()
  }
}

const route = useRoute()
const router = useRouter()
const submissionStore = useSubmissionStore()
const authStore = useAuthStore()

const loading = ref(true)
const submission = ref(null)
const editorContainer = ref(null)
let editorInstance = null

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

const getVerdictIcon = (verdict) => {
    switch (verdict) {
        case 'AC': return CheckCircle
        case 'WA': case 'RE': case 'SE': case 'CE': return XCircle
        default: return AlertCircle
    }
}

const getStatusColor = (verdict) => {
    const type = getVerdictType(verdict)
    if (type === 'success') return '#2cbb5d'
    if (type === 'danger') return '#ef4743'
    if (type === 'warning') return '#ffa116'
    return '#8a8a8a'
}

const getMonacoLang = (backendKey) => {
   const map = {
       'CPP': 'cpp',
       'C': 'c',
       'JAVA': 'java',
       'PYTHON3': 'python',
       'JAVASCRIPT': 'javascript',
       'GO': 'go'
   }
   return map[backendKey] || 'plaintext'
}

const initMonaco = () => {
    if (!editorContainer.value || !submission.value) return

    editorInstance = monaco.editor.create(editorContainer.value, {
        value: submission.value.sourceCode || '// No source code available',
        language: getMonacoLang(submission.value.language),
        theme: 'vs-dark',
        readOnly: true,
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        lineHeight: 24,
        padding: { top: 16, bottom: 16 },
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        scrollBeyondLastLine: false,
        scrollbar: { vertical: 'hidden' },
        overviewRulerLanes: 0
    })

    editorContainer.value.style.height = `${editorInstance.getContentHeight()}px`
    editorInstance.onDidContentSizeChange((e) => {
        if (e.contentHeightChanged) {
            editorContainer.value.style.height = `${e.contentHeight}px`
            editorInstance.layout()
        }
    })
}

const copyCode = async () => {
    if (!submission.value?.sourceCode) return
    try {
        await navigator.clipboard.writeText(submission.value.sourceCode)
        ElMessage.success('Đã copy source code!')
    } catch (err) {
        ElMessage.error('Lỗi khi copy code')
    }
}

onMounted(async () => {
    try {
        const id = route.params.id
        // Try fetching it as admin if admin, else normal user
        submission.value = await submissionStore.getSubmissionResult(id, authStore.isAdmin)
        
        loading.value = false
        
        nextTick(() => {
            initMonaco()
        })
    } catch (error) {
        handleApiError(error, 'Không thể tải dữ liệu chi tiết bài nộp')
        loading.value = false
    }
})

import { onBeforeUnmount } from 'vue'
onBeforeUnmount(() => {
    if (editorInstance) {
        editorInstance.dispose()
    }
})
</script>

<template>
  <div class="submission-detail">
    <div class="page-container">
        
        <div class="header-nav">
            <el-button link @click="router.back()" class="back-btn">
                <ArrowLeft :size="18" />
                <span class="back-text">Quay lại danh sách</span>
            </el-button>
        </div>

        <div v-if="loading" class="loading-state">
            <el-skeleton :rows="6" animated />
        </div>

        <div v-else-if="submission" class="content">
            
            <!-- Verdict Banner -->
            <div class="verdict-banner" :style="{ backgroundColor: getStatusColor(submission.verdict) + '20', borderColor: getStatusColor(submission.verdict) + '40' }">
                <div class="verdict-title" :style="{ color: getStatusColor(submission.verdict) }">
                    <component :is="getVerdictIcon(submission.verdict)" :size="28" />
                    <h2>{{ submission.verdict || 'PENDING' }}</h2>
                    <div v-if="submission.score != null" class="score-badge" :style="{ color: getStatusColor(submission.verdict), borderColor: getStatusColor(submission.verdict) + '40', background: getStatusColor(submission.verdict) + '15' }">
                        Score: {{ submission.score }}
                    </div>
                </div>
                <div class="problem-link">
                    Bài toán: <RouterLink :to="`/problems/${submission.problemSlug}`" class="link-text">{{ submission.problemTitle }}</RouterLink>
                </div>

                <div class="problem-link">
                    Người nộp: <RouterLink :to="`/profile/${submission.username}`" class="link-text">{{ submission.username }}</RouterLink>
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon"><Clock :size="20" /></div>
                    <div class="stat-info">
                        <span class="stat-label">Thời gian chạy (Runtime)</span>
                        <span class="stat-value">{{ submission.executionTimeMs != null ? submission.executionTimeMs + ' ms' : 'N/A' }}</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><Cpu :size="20" /></div>
                    <div class="stat-info">
                        <span class="stat-label">Bộ nhớ sử dụng (Memory)</span>
                        <span class="stat-value">{{ submission.executionMemoryMb != null ? submission.executionMemoryMb + ' MB' : 'N/A' }}</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><Code2 :size="20" /></div>
                    <div class="stat-info">
                        <span class="stat-label">Ngôn ngữ (Language)</span>
                        <span class="stat-value">{{ submission.language }}</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><Calendar :size="20" /></div>
                    <div class="stat-info">
                        <span class="stat-label">Đã nộp lúc</span>
                        <span class="stat-value">{{ new Date(submission.createdDate).toLocaleString('vi-VN') }}</span>
                    </div>
                </div>
            </div>

            <!-- Testcases & Error Info -->
            <div v-if="submission.errorMessage" class="error-panel">
                <h3><AlertCircle :size="18" /> Thông báo lỗi</h3>
                <pre class="error-text custom-scrollbar">{{ submission.errorMessage }}</pre>
            </div>
            
            <div v-else-if="submission.totalTestCount > 0" class="testcase-progress-wrapper" :style="{ borderColor: getStatusColor(submission.verdict) + '40' }">
                <div class="testcase-stats">
                    Testcases đã vượt qua: <strong>{{ submission.passedTestCount }}</strong> / {{ submission.totalTestCount }}
                </div>
                <el-progress 
                   :percentage="submission.totalTestCount ? Math.round((submission.passedTestCount / submission.totalTestCount) * 100) : 0" 
                   :color="getStatusColor(submission.verdict)"
                   :stroke-width="12"
                   style="margin-top: 10px;"
                />
            </div>

            <!-- Source Code Viewer -->
            <div class="code-section">
                <div class="code-header">
                    <span>Source Code</span>
                    <el-button link @click="copyCode" class="copy-btn">
                        <Copy :size="14" style="margin-right: 6px;" /> Copy
                    </el-button>
                </div>
                <div class="editor-container" ref="editorContainer"></div>
            </div>

        </div>

        <div v-else class="empty-state">
            Mã bài nộp không tồn tại hoặc bạn không có quyền xem.
        </div>
    </div>
  </div>
</template>

<style scoped>
.submission-detail {
    min-height: calc(100vh - 56px);
    background-color: var(--bg-primary);
    padding: 30px 20px;
    color: var(--text-primary);
}

.page-container {
    max-width: 1000px;
    margin: 0 auto;
}

.header-nav {
    margin-bottom: 24px;
}

.back-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 500;
}

.back-btn:hover {
    color: var(--text-primary);
}

.verdict-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 30px;
    border-radius: 12px;
    border: 1px solid;
    margin-bottom: 24px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.verdict-title {
    display: flex;
    align-items: center;
    gap: 12px;
}

.verdict-title h2 {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
}

.score-badge {
    margin-left: 16px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 15px;
    font-weight: 700;
    border: 1px solid;
}

.problem-link {
    font-size: 15px;
    color: var(--text-secondary);
}

.link-text {
    color: var(--accent-primary);
    text-decoration: none;
    font-weight: 600;
}
.link-text:hover { text-decoration: underline; }

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
}

.stat-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    border-radius: 10px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 16px;
}

.stat-icon {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
}

.stat-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.stat-label {
    font-size: 12px;
    color: var(--text-secondary);
}

.stat-value {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
}

.error-panel {
    background: rgba(239, 71, 67, 0.05);
    border: 1px solid rgba(239, 71, 67, 0.2);
    border-radius: 10px;
    padding: 16px 20px;
    margin-bottom: 24px;
}

.error-panel h3 {
    margin: 0 0 12px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #ef4743;
    font-size: 15px;
}

.error-text {
    margin: 0;
    color: #ef4743;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    white-space: pre-wrap;
    max-height: 200px;
    overflow-y: auto;
}

.testcase-progress-wrapper {
    background: var(--bg-secondary);
    border: 1px solid;
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 24px;
}

.testcase-stats {
    font-size: 15px;
    color: var(--text-secondary);
}

.testcase-stats strong {
    color: var(--text-primary);
    font-size: 18px;
}

.code-section {
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.code-header {
    background: rgba(255, 255, 255, 0.02);
    border-bottom: 1px solid var(--border-primary);
    padding: 10px 20px;
    font-weight: 600;
    font-size: 14px;
    color: var(--text-secondary);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.copy-btn {
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 500;
}
.copy-btn:hover {
    color: var(--text-primary);
}

.editor-container {
    min-height: 100px;
    width: 100%;
}

.empty-state {
    text-align: center;
    padding: 40px;
    color: var(--text-secondary);
}

:deep(.el-progress__text) {
    margin-left: 20px !important;
    font-weight: 600;
}
</style>
