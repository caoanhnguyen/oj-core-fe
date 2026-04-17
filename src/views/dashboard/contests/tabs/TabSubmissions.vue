<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { contestsAPI } from '@/api/contests'
import DarkPagination from '@/components/common/DarkPagination.vue'
import DataTable from '@/components/common/DataTable.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({ contestId: { type: String, required: true } })
const emit  = defineEmits(['count'])
const router = useRouter()

const submissions = ref([])
const loading     = ref(false)
const page        = ref(1)
const pageSize    = ref(20)
const total       = ref(0)

const fmtDt = (s) => {
  if (!s) return '—'
  const d = new Date((s.includes('Z') || s.includes('+')) ? s : s + 'Z')
  return d.toLocaleString(undefined, { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false })
}

const getVerdictClass = (v) => ({
  AC: 'verdict-ac', ACCEPTED: 'verdict-ac',
  WA: 'verdict-wa', WRONG_ANSWER: 'verdict-wa',
  TLE: 'verdict-tle', TIME_LIMIT_EXCEEDED: 'verdict-tle',
  MLE: 'verdict-tle', MEMORY_LIMIT_EXCEEDED: 'verdict-tle',
  RE: 'verdict-wa', RUNTIME_ERROR: 'verdict-wa',
  CE: 'verdict-info', COMPILATION_ERROR: 'verdict-info',
  SE: 'verdict-wa', SYSTEM_ERROR: 'verdict-wa',
  PENDING: 'verdict-pending',
}[v] || 'verdict-info')

const load = async () => {
  try {
    loading.value = true
    const data = await contestsAPI.adminGetSubmissions(props.contestId, { page: page.value - 1, size: pageSize.value, sort: 'createdDate,desc' })
    submissions.value = data.content || []
    total.value = data.totalElements || 0
    emit('count', total.value)
  } finally { loading.value = false }
}
watch(() => props.contestId, () => { page.value = 1; load() }, { immediate: true })

const viewSubmission = (row) => { router.push(`/submissions/${row.submissionId}`) }

const tableColumns = computed(() => [
  { key: 'index',            label: '#',                                                   width: 60,  align: 'center', fixed: 'left' },
  { key: 'createdDate',      label: t('admin_contests.tab_submissions.col_time'),          minWidth: 180 },
  { key: 'username',         label: t('admin_contests.tab_submissions.col_user'),          minWidth: 150 },
  { key: 'problem',          label: t('admin_contests.tab_submissions.col_problem'),       minWidth: 200 },
  { key: 'verdict',          label: t('admin_contests.tab_submissions.col_verdict'),       width: 100, align: 'center' },
  { key: 'score',            label: t('admin_contests.tab_submissions.col_score'),         width: 100, align: 'center' },
  { key: 'test',             label: t('admin_contests.tab_submissions.col_test'),          width: 100, align: 'center' },
  { key: 'executionTimeMs',  label: t('admin_contests.tab_submissions.col_exec_time'),     width: 100, align: 'center' },
  { key: 'executionMemoryMb',label: t('admin_contests.tab_submissions.col_exec_mem'),      width: 100, align: 'center' },
  { key: 'languageKey',      label: t('admin_contests.tab_submissions.col_lang'),          width: 120, align: 'center' },
])

const tableActions = computed(() => [
  { type: 'view', label: t('admin_contests.tab_submissions.action_view'), handler: (row) => viewSubmission(row) }
])
</script>

<template>
  <div class="tab-submissions">
    <DataTable
      :data="submissions"
      :columns="tableColumns"
      :actions="tableActions"
      :action-width="110"
      :action-label="$t('admin_contests.tab_submissions.action_label')"
      :loading="loading"
      :empty-text="$t('admin_contests.tab_submissions.empty')"
    >
      <template #cell-index="{ index }"><span class="cell-index">{{ (page - 1) * pageSize + index + 1 }}</span></template>
      <template #cell-createdDate="{ row }"><span class="cell-date">{{ fmtDt(row.createdDate) }}</span></template>
      <template #cell-username="{ row }">
        <span class="cell-link" @click="router.push(`/profile/${row.username}`)">{{ row.username }}</span>
      </template>
      <template #cell-problem="{ row }">
        <span class="cell-link" @click="router.push(`/problems/${row.problemSlug}`)">{{ row.problemTitle || row.problemId }}</span>
      </template>
      <template #cell-verdict="{ row }">
        <span :class="['verdict-badge', getVerdictClass(row.verdict)]">{{ row.verdict || 'PENDING' }}</span>
      </template>
      <template #cell-score="{ row }"><span class="highlight-score">{{ row.score ?? '—' }}</span></template>
      <template #cell-test="{ row }">
        <span class="cell-test">{{ row.passedTestCount ?? '—' }}/{{ row.totalTestCount ?? '—' }}</span>
      </template>
      <template #cell-executionTimeMs="{ row }">
        <span class="cell-mono highlight-resource">{{ row.executionTimeMs != null ? row.executionTimeMs + ' ms' : '—' }}</span>
      </template>
      <template #cell-executionMemoryMb="{ row }">
        <span class="cell-mono highlight-resource">{{ row.executionMemoryMb != null ? row.executionMemoryMb + ' MB' : '—' }}</span>
      </template>
      <template #cell-languageKey="{ row }"><span class="lang-tag">{{ row.languageKey }}</span></template>
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
.tab-submissions { display: flex; flex-direction: column; gap: 16px; }
.cell-index { font-weight: 500; color: #8a8a8a; font-size: 13px; }
.cell-date { font-size: 12px; color: #8a8a8a; font-family: 'JetBrains Mono', 'Fira Code', monospace; }
.cell-mono { font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 13px; color: #8a8a8a; }
.highlight-resource { color: #ffa116; font-weight: 600; }
.cell-link { font-size: 13px; font-weight: 500; color: #eff2f6; cursor: pointer; transition: color 0.2s; }
.cell-link:hover { color: var(--accent-primary); }
.highlight-score { font-size: 14px; font-weight: 700; color: #00b8a3; }
.cell-test { font-size: 12px; color: #8a8a8a; font-family: 'JetBrains Mono', 'Fira Code', monospace; }
.verdict-badge { padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; white-space: nowrap; }
.verdict-ac      { background: rgba(0,184,163,0.15); color: #00b8a3; }
.verdict-wa      { background: rgba(239,71,67,0.15); color: #ef4743; }
.verdict-tle     { background: rgba(255,192,30,0.15); color: #ffc01e; }
.verdict-info    { background: rgba(255,255,255,0.08); color: #8a8a8a; }
.verdict-pending { background: rgba(96,165,250,0.15); color: #60a5fa; }
.lang-tag { font-size: 11px; font-weight: 700; background: rgba(163,85,245,0.15); color: #a355f5; padding: 4px 10px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
</style>
