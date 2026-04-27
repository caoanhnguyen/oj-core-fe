<script setup>
import { ref, computed, watch } from 'vue'
import { contestsAPI } from '@/api/contests'
import { ElMessage } from 'element-plus'
import { handleApiError } from '@/utils/errorHandler'
import { ArrowLeft, Settings, BookOpen, Users, FileText, Link as LinkIcon } from 'lucide-vue-next'
import ContestForm     from './ContestForm.vue'
import TabProblems     from './tabs/TabProblems.vue'
import TabParticipants from './tabs/TabParticipants.vue'
import TabSubmissions  from './tabs/TabSubmissions.vue'
import TabLeaderboard  from './tabs/TabLeaderboard.vue'
import TabWhitelist    from './tabs/TabWhitelist.vue'
import { Trophy, ShieldCheck } from 'lucide-vue-next'
import AppButton     from '@/components/common/AppButton.vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useBadge } from '@/composables/useBadge'

const { t } = useI18n()
const { ruleTypeClass, contestStatusClass, estatusClass, scoreboardClass } = useBadge()
const route  = useRoute()
const router = useRouter()

const props = defineProps({ contestId: { type: String, required: false } })
const emit  = defineEmits(['back', 'updated'])

const id = computed(() => props.contestId || route.params.id)

const contest = ref(null)
const loading = ref(false)
const saving  = ref(false)

const activeTab = computed({
  get: () => route.params.tab || 'general',
  set: (val) => router.replace(`/dashboard/contests/${id.value}/${val}`)
})

const handleBack = () => {
  if (props.contestId) emit('back')
  else router.push('/dashboard/contests')
}

const isDeleted = computed(() => contest.value?.status === 'DELETED')
const isEnded   = computed(() => contest.value?.contestStatus === 'ENDED')
const isOngoing = computed(() => contest.value?.contestStatus === 'ONGOING')

const formReadonly     = computed(() => isDeleted.value)
const problemsReadonly = computed(() => isDeleted.value || isEnded.value || isOngoing.value)

const load = async () => {
  if (!id.value) return
  try { loading.value = true; contest.value = await contestsAPI.adminGetById(id.value) }
  finally { loading.value = false }
}
watch(() => id.value, load, { immediate: true })

// UTC display
const parseUTC = (s) => { if (!s) return null; return new Date((s.includes('Z') || s.includes('+')) ? s : s + 'Z') }
const fmtDt    = (s) => { const d = parseUTC(s); if (!d) return '—'; return d.toLocaleString(undefined, { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false }) }

const getStatusLabel = (s) => ({
  ONGOING:  t('admin_contests.status_opts.ongoing'),
  UPCOMING: t('admin_contests.status_opts.upcoming'),
  ENDED:    t('admin_contests.status_opts.ended'),
}[s] || s)

const handleUpdate = async (payload) => {
  try {
    saving.value = true
    await contestsAPI.adminUpdate(id.value, payload)
    ElMessage.success(t('admin_contests.messages.update_success'))
    await load()
    emit('updated')
  } catch (e) { handleApiError(e, t('admin_contests.messages.update_fail')) }
  finally { saving.value = false }
}

const copyInviteLink = () => {
  if (!contest.value) return
  const url = `${window.location.origin}/contests/${contest.value.slug || contest.value.contestKey}`
  navigator.clipboard.writeText(url)
  ElMessage.success(t('admin_contests.messages.link_copied'))
}
</script>

<template>
  <div class="admin-layout-container detail-view" v-loading="loading && !contest">

    <!-- Back bar -->
    <div class="back-bar">
      <AppButton variant="text" :icon="ArrowLeft" @click="handleBack" class="back-btn">
        {{ $t('admin_contests.page_title') }}
      </AppButton>
      <span v-if="contest" class="sub-title"> / <strong>{{ contest.title }}</strong></span>
    </div>

    <!-- Header card -->
    <div v-if="contest" class="detail-card">
      <div class="detail-header">
        <h2 class="detail-title">{{ contest.title }}</h2>
        <div class="detail-badges">
          <span :class="['oj-badge', ruleTypeClass(contest.ruleType)]">{{ contest.ruleType }}</span>
          <span :class="['oj-badge', contestStatusClass(contest.contestStatus)]">{{ getStatusLabel(contest.contestStatus) }}</span>
          <span :class="['oj-badge', estatusClass(contest.status)]">{{ contest.status }}</span>
          <span :class="['oj-badge', scoreboardClass(contest.scoreboardVisibility)]">
            {{ $t('admin_contests.detail.scoreboard_prefix') }}
            {{ contest.scoreboardVisibility === 'VISIBLE' ? 'VISIBLE' : (contest.scoreboardVisibility === 'HIDDEN_PERMANENTLY' ? 'HIDDEN' : 'FROZEN') }}
          </span>
        </div>
      </div>
      <div class="detail-meta-grid">
        <div class="meta-item"><span class="meta-label">{{ $t('admin_contests.detail.meta_start') }}</span><span class="meta-value">{{ fmtDt(contest.startTime) }}</span></div>
        <div class="meta-item"><span class="meta-label">{{ $t('admin_contests.detail.meta_end') }}</span><span class="meta-value">{{ fmtDt(contest.endTime) }}</span></div>
        <div class="meta-item"><span class="meta-label">{{ $t('admin_contests.detail.meta_author') }}</span><span class="meta-value">{{ contest.authorUsername }}</span></div>
        <div class="meta-item" v-if="contest.durationMinutes">
          <span class="meta-label">{{ $t('admin_contests.detail.meta_duration') }}</span>
          <span class="meta-value">{{ contest.durationMinutes }} {{ $t('admin_contests.detail.duration_minutes') }}</span>
        </div>
        <div class="meta-item"><span class="meta-label">{{ $t('admin_contests.detail.meta_participants') }}</span><span class="meta-value">{{ contest.participantCount || 0 }}</span></div>

        <div class="meta-item" v-if="contest.visibility === 'PRIVATE'">
          <span class="meta-label">{{ $t('admin_contests.detail.invite_link_label') }}</span>
          <div style="display: flex; gap: 8px; align-items: center; margin-top: 4px;">
            <AppButton size="small" variant="primary" :icon="LinkIcon" @click="copyInviteLink">
              {{ $t('admin_contests.detail.btn_copy_link') }}
            </AppButton>
          </div>
        </div>
      </div>
      <!-- DELETED warning -->
      <div v-if="isDeleted" class="deleted-warning">
        {{ $t('admin_contests.messages.deleted_warning') }}
      </div>
    </div>

    <!-- Tabs -->
    <el-tabs v-if="contest" v-model="activeTab" class="detail-tabs">
      <el-tab-pane name="general">
        <template #label><span class="tab-label"><Settings :size="14" /> {{ $t('admin_contests.detail.tab_general') }}</span></template>
        <ContestForm :contest="contest" :loading="saving" :readonly="formReadonly" :contest-status="contest.contestStatus" @submit="handleUpdate" @cancel="handleBack" />
      </el-tab-pane>
      <el-tab-pane name="problems" lazy>
        <template #label><span class="tab-label"><BookOpen :size="14" /> {{ $t('admin_contests.tabs.problems') }}</span></template>
        <TabProblems :contest-id="id" :readonly="problemsReadonly" />
      </el-tab-pane>
      <el-tab-pane name="participants" lazy>
        <template #label><span class="tab-label"><Users :size="14" /> {{ $t('admin_contests.tabs.participants') }}</span></template>
        <TabParticipants :contest-id="id" :readonly="isDeleted" />
      </el-tab-pane>
      <el-tab-pane name="submissions" lazy>
        <template #label><span class="tab-label"><FileText :size="14" /> {{ $t('admin_contests.tabs.submissions') }}</span></template>
        <TabSubmissions :contest-id="id" />
      </el-tab-pane>
      <el-tab-pane name="leaderboard" lazy>
        <template #label><span class="tab-label"><Trophy :size="14" /> {{ $t('admin_contests.detail.tab_leaderboard') }}</span></template>
        <TabLeaderboard :contest-id="id" :contest-title="contest.title" :rule-type="contest.ruleType" />
      </el-tab-pane>
      <el-tab-pane name="whitelist" lazy v-if="contest.visibility === 'PRIVATE'">
        <template #label><span class="tab-label"><ShieldCheck :size="14" /> {{ $t('admin_contests.detail.tab_whitelist') }}</span></template>
        <TabWhitelist :contest-id="id" :contest-title="contest.title" :readonly="isDeleted || isEnded" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.detail-view { display: flex; flex-direction: column; gap: 20px; }

.back-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; padding-bottom: 16px; border-bottom: 1px solid #3e3e3e; }
.sub-title { font-size: 14px; color: var(--text-secondary); }
.sub-title strong { color: var(--text-primary); }

.detail-card { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 16px; padding: 28px; }
.detail-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.detail-title { font-size: 22px; font-weight: 700; color: var(--text-primary); margin: 0; }
.detail-badges { display: flex; gap: 8px; flex-wrap: wrap; flex-shrink: 0; }
.detail-meta-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
.meta-item { display: flex; flex-direction: column; gap: 4px; }
.meta-label { font-size: 12px; font-weight: 600; color: #8a8a8a; text-transform: uppercase; letter-spacing: 0.5px; }
.meta-value { font-size: 14px; color: var(--text-primary); }

.deleted-warning { margin-top: 16px; padding: 12px 16px; background: rgba(239,71,67,0.08); border: 1px solid rgba(239,71,67,0.2); border-radius: 8px; color: #ef4743; font-size: 13px; font-weight: 500; }

/* Badge styles delegated to global badges.css via useBadge composable */

.detail-tabs { margin-top: 4px; }
.tab-label { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; }

:deep(.detail-tabs .el-tabs__nav-wrap::after) { display: none; }
:deep(.detail-tabs .el-tabs__header) { border-bottom: 1px solid #3e3e3e; margin-bottom: 0; }
:deep(.detail-tabs .el-tabs__item) { color: #8a8a8a; font-size: 13px; }
:deep(.detail-tabs .el-tabs__item.is-active) { color: var(--accent-primary); }
:deep(.detail-tabs .el-tabs__active-bar) { background: var(--accent-primary); }
:deep(.detail-tabs .el-tabs__content) { padding-top: 24px; }
</style>
