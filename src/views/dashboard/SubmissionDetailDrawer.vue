<script setup>
import { ref, watch, computed } from 'vue'
import { submissionAPI } from '@/api/submissions'
import AppButton from '@/components/common/AppButton.vue'
import CodeEditor from '@/components/common/CodeEditor.vue'
import { Eye, RefreshCw, Ban, Trash2, RotateCcw, X, Clock, Cpu, User, FileCode, CheckCircle, XCircle } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  submissionId: { type: String, default: null },
  rowData: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['update:modelValue', 'action'])

const drawerVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const details = ref(null)

const fetchDetails = async () => {
  if (!props.submissionId) return
  try {
    loading.value = true
    details.value = null
    const res = await submissionAPI.getAdminSubmissionResult(props.submissionId)
    details.value = res
  } catch (error) {
    ElMessage.error('Không thể tải chi tiết submission.')
  } finally {
    loading.value = false
  }
}

watch(() => props.modelValue, (newVal) => {
  if (newVal && props.submissionId) {
    fetchDetails()
  }
})

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const s = dateStr.includes('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z'
  const d = new Date(s)
  const pad = (n) => n.toString().padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const verdictColor = (v) => ({
  AC: '#2cbb5d', WA: '#ef4743', TLE: '#ffa116', MLE: '#ffa116',
  RE: '#ef4743', CE: '#ef4743', PENDING: '#8a8a8a', INACTIVE: '#5c5c5c', DELETED: '#ff0000', SE: '#ef4743'
}[v] || '#8a8a8a')

const handleCommand = (cmd) => {
  emit('action', cmd, props.rowData)
}
</script>

<template>
  <el-drawer
    v-model="drawerVisible"
    direction="rtl"
    size="900px"
    :with-header="false"
    destroy-on-close
    class="dark-drawer"
  >
    <div class="drawer-container">
      <!-- HEADER -->
      <div class="drawer-header">
        <div class="drawer-title">
          Chi tiết Submission 
          <span class="sub-id">#{{ submissionId?.substring(0,8) }}</span>
        </div>
        <button class="close-btn" @click="drawerVisible = false">
          <X :size="20" />
        </button>
      </div>

      <!-- BODY -->
      <div class="drawer-body" v-loading="loading" element-loading-background="rgba(40, 40, 40, 0.8)">
        <template v-if="details">
          
          <!-- QUICK STATS CARDS -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Trạng thái</div>
              <div class="stat-value verdict-badge" :style="{ backgroundColor: verdictColor(details.verdict) + '22', color: verdictColor(details.verdict) }">
                 {{ details.verdict }}
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Điểm số</div>
              <div class="stat-value score">{{ details.score ?? 0 }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label"><Clock :size="14" /> Thời gian</div>
              <div class="stat-value resource">{{ details.executionTimeMs ?? 0 }} ms</div>
            </div>
            <div class="stat-card">
              <div class="stat-label"><Cpu :size="14" /> Bộ nhớ</div>
              <div class="stat-value resource">{{ details.executionMemoryMb ?? 0 }} MB</div>
            </div>
          </div>

          <!-- INFO TABLE -->
          <div class="info-section">
            <h3 class="section-title">Thông tin chung</h3>
            <div class="info-table">
              <div class="info-row">
                 <span class="info-key"><User :size="14"/> Người gửi:</span>
                 <span class="info-val hl">{{ rowData?.username || '—' }}</span>
              </div>
              <div class="info-row">
                 <span class="info-key"><FileCode :size="14"/> Bài tập:</span>
                 <span class="info-val">{{ rowData?.problemTitle || rowData?.problemId || '—' }}</span>
              </div>
              <div class="info-row">
                 <span class="info-key">Ngôn ngữ:</span>
                 <span class="info-val">{{ details.language }}</span>
              </div>
              <div class="info-row">
                 <span class="info-key">Ngày nộp:</span>
                 <span class="info-val">{{ formatDate(details.createdDate) }}</span>
              </div>
              <div class="info-row">
                 <span class="info-key">Trạng thái bản ghi (Admin):</span>
                 <span class="info-val state" :class="rowData?.status?.toLowerCase()">{{ rowData?.status }}</span>
              </div>
            </div>
          </div>

          <!-- COMPILER OUTPUT -->
          <div class="info-section" v-if="details.verdict === 'CE' || details.compilerMessage">
            <h3 class="section-title">Lỗi biên dịch / System Message</h3>
            <div class="code-block error-block">{{ details.compilerMessage || 'Không có tin nhắn.' }}</div>
          </div>

          <!-- SOURCE CODE -->
          <div class="info-section" style="flex: 1; display: flex; flex-direction: column;">
            <h3 class="section-title" style="display:flex; justify-content:space-between; align-items:center;">
              Source Code
              <AppButton variant="secondary" size="small" @click="() => { navigator.clipboard.writeText(details.sourceCode); ElMessage.success('Copied!') }">Copy</AppButton>
            </h3>
            <CodeEditor
              :model-value="details.sourceCode"
              :language="(() => {
                const lang = (details.language || '').toLowerCase()
                if (lang.includes('python')) return 'python'
                if (lang.includes('c++') || lang.includes('cpp')) return 'cpp'
                if (lang === 'c') return 'c'
                if (lang.includes('java')) return 'java'
                return 'java'
              })()"
              :read-only="true"
              height="450px"
            />
          </div>

          <!-- TEST CASES (Optional) -->
          <div class="info-section" v-if="details.testcaseResults && details.testcaseResults.length > 0">
             <h3 class="section-title">Kết quả Test Cases</h3>
             <div class="tc-list">
                <div class="tc-item" v-for="(tc, idx) in details.testcaseResults" :key="idx">
                   <div class="tc-header">
                      <span class="tc-name">
                        <CheckCircle v-if="tc.verdict === 'AC'" :size="14" color="#2cbb5d" />
                        <XCircle v-else :size="14" :color="verdictColor(tc.verdict)" />
                        Test #{{ idx + 1 }}
                      </span>
                      <span class="tc-verdict" :style="{ color: verdictColor(tc.verdict) }">{{ tc.verdict }}</span>
                   </div>
                   <div class="tc-metrics" v-if="tc.verdict !== 'CE'">
                      <span>Điểm: {{ tc.score }}</span> • 
                      <span>{{ tc.timeMetric }} ms</span> • 
                      <span>{{ tc.memoryMetric }} KB</span>
                   </div>
                </div>
             </div>
          </div>

        </template>
      </div>

      <!-- FOOTER ACTIONS -->
      <div class="drawer-footer">
        <AppButton variant="primary" :icon="RefreshCw" @click="handleCommand('rejudge')" :disabled="rowData?.verdict === 'PENDING'">Rejudge</AppButton>
        <AppButton variant="secondary" :icon="Ban" @click="handleCommand('void')" v-if="rowData?.status === 'ACTIVE'">Void</AppButton>
        <AppButton variant="warning" :icon="RotateCcw" @click="handleCommand('restore')" v-if="rowData?.status === 'INACTIVE' || rowData?.status === 'DELETED'">Khôi phục</AppButton>
        <AppButton variant="danger" :icon="Trash2" @click="handleCommand('delete')" v-if="rowData?.status === 'ACTIVE' || rowData?.status === 'INACTIVE'">Xóa mềm</AppButton>
      </div>
    </div>
  </el-drawer>
</template>

<style scoped>
.drawer-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg-secondary, #1e1e1e);
  color: var(--text-primary, #eff2f6);
}

.drawer-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-primary, #3e3e3e);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.drawer-title {
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}
.sub-id { font-family: monospace; color: var(--accent-primary); font-size: 16px; }

.close-btn {
  background: none; border: none; color: #8a8a8a; cursor: pointer; transition: color 0.2s;
  display: flex; align-items: center; justify-content: center;
}
.close-btn:hover { color: #eff2f6; }

.drawer-body {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-card {
  background: var(--bg-tertiary, #282828);
  border: 1px solid var(--border-primary, #3e3e3e);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex; flex-direction: column; gap: 8px;
}
.stat-label { color: #8a8a8a; font-size: 12px; font-weight: 500; display: flex; align-items: center; gap: 6px; text-transform: uppercase;}
.stat-value { font-size: 16px; font-weight: 700; }
.verdict-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 14px; width: fit-content; }
.score { font-family: monospace; color: #eff2f6; font-size: 18px; }
.resource { color: #eff2f6; }

.section-title { font-size: 14px; font-weight: 700; color: #fff; margin: 0 0 12px 0; border-left: 3px solid var(--accent-primary); padding-left: 8px; }

.info-table { display: flex; flex-direction: column; gap: 10px; background: #282828; padding: 16px; border-radius: 8px; border: 1px solid #3e3e3e; }
.info-row { display: flex; align-items: center; justify-content: space-between; font-size: 13px; }
.info-key { color: #8a8a8a; display: flex; align-items: center; gap: 6px; }
.info-val { color: #eff2f6; font-weight: 500; text-align: right; }
.info-val.hl { color: var(--accent-primary); }
.state { padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
.state.active { background: rgba(0, 184, 163, 0.1); color: #00b8a3; }
.state.inactive { background: rgba(138, 138, 138, 0.1); color: #8a8a8a; }
.state.deleted { background: rgba(239, 71, 67, 0.1); color: #ef4743; }

.code-block {
  background: #111;
  padding: 16px;
  border-radius: 8px;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 13px;
  color: #eff2f6;
  overflow-x: auto;
  border: 1px solid #333;
  white-space: pre-wrap;
  word-break: break-all;
}
.error-block { color: #ef4743; }

.tc-list { display: flex; flex-direction: column; gap: 8px; }
.tc-item { background: #282828; border: 1px solid #3e3e3e; border-radius: 6px; padding: 10px 12px; }
.tc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.tc-name { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #eff2f6;}
.tc-verdict { font-size: 12px; font-weight: 700; }
.tc-metrics { font-size: 11px; color: #8a8a8a; display: flex; gap: 8px; }

.drawer-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-primary, #3e3e3e);
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}
</style>

<style>
/* Global override for el-drawer to ensure dark theme compatibility */
.dark-drawer.el-drawer { background-color: var(--bg-secondary, #1e1e1e) !important; color: #eff2f6 !important; }
.dark-drawer .el-drawer__body { padding: 0 !important; }
</style>
