<script setup>
import { ref, computed, watch } from 'vue'
import { contestsAPI } from '@/api/contests'
import { ElMessage } from 'element-plus'
import { handleApiError } from '@/utils/errorHandler'
import { ArrowLeft, Settings, BookOpen, Users, FileText, Link as LinkIcon, Copy } from 'lucide-vue-next'
import ContestForm     from './ContestForm.vue'
import TabProblems     from './tabs/TabProblems.vue'
import TabParticipants from './tabs/TabParticipants.vue'
import TabSubmissions  from './tabs/TabSubmissions.vue'
import TabLeaderboard  from './tabs/TabLeaderboard.vue'
import TabWhitelist    from './tabs/TabWhitelist.vue'
import { Trophy, ShieldCheck } from 'lucide-vue-next'
import AppButton     from '@/components/common/AppButton.vue'

import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const props = defineProps({ contestId: { type: String, required: false } })
const emit  = defineEmits(['back', 'updated'])

const id = computed(() => props.contestId || route.params.id)

const contest          = ref(null)
const loading          = ref(false)
const saving           = ref(false)

const activeTab = computed({
  get: () => route.params.tab || 'general',
  set: (val) => router.replace(`/dashboard/contests/${id.value}/${val}`)
})

const handleBack = () => {
  if (props.contestId) emit('back') // Backward compatibility if used directly
  else router.push('/dashboard/contests')
}

const isDeleted = computed(() => contest.value?.status === 'DELETED')
const isEnded   = computed(() => contest.value?.contestStatus === 'ENDED')
const isOngoing = computed(() => contest.value?.contestStatus === 'ONGOING')

const formReadonly = computed(() => isDeleted.value)
const problemsReadonly = computed(() => isDeleted.value || isEnded.value || isOngoing.value)

const load = async () => {
  if (!id.value) return
  try { loading.value = true; contest.value = await contestsAPI.adminGetById(id.value) }
  finally { loading.value = false }
}
watch(() => id.value, load, { immediate: true })

// UTC display
const parseUTC = (s) => { if (!s) return null; return new Date((s.includes('Z') || s.includes('+')) ? s : s + 'Z') }
const fmtDt = (s) => { const d = parseUTC(s); if (!d) return '—'; return d.toLocaleString(undefined, { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false }) }
const getStatusClass = (s) => ({ ONGOING: 'status-ongoing', UPCOMING: 'status-upcoming', ENDED: 'status-ended' }[s] || '')
const getStatusLabel = (s) => ({ ONGOING: 'Đang diễn ra', UPCOMING: 'Sắp diễn ra', ENDED: 'Đã kết thúc' }[s] || s)
const getEntityStatusClass = (s) => ({ ACTIVE: 'status-active', INACTIVE: 'status-upcoming', DELETED: 'status-deleted' }[s] || '')

const handleUpdate = async (payload) => {
  try {
    saving.value = true
    await contestsAPI.adminUpdate(id.value, payload)
    ElMessage.success('Đã lưu thay đổi')
    await load()
    emit('updated')
  } catch (e) { handleApiError(e, 'Lưu thất bại') }
  finally { saving.value = false }
}

const copyInviteLink = () => {
  if (!contest.value) return
  const url = `${window.location.origin}/contests/${contest.value.slug || contest.value.contestKey}`
  navigator.clipboard.writeText(url)
  ElMessage.success('Đã sao chép Invite Link')
}
</script>

<template>
  <div class="admin-layout-container detail-view" v-loading="loading && !contest">

    <!-- Back bar — same style as create page -->
    <div class="back-bar">
      <AppButton variant="text" :icon="ArrowLeft" @click="handleBack" class="back-btn">Quản lý Contest</AppButton>
      <span v-if="contest" class="sub-title"> / <strong>{{ contest.title }}</strong></span>
    </div>

    <!-- Header card -->
    <div v-if="contest" class="detail-card">
      <div class="detail-header">
        <h2 class="detail-title">{{ contest.title }}</h2>
        <div class="detail-badges">
          <span :class="['rule-badge', contest.ruleType === 'ACM' ? 'rule-acm' : 'rule-oi']">{{ contest.ruleType }}</span>
          <span :class="['status-badge', getStatusClass(contest.contestStatus)]">{{ getStatusLabel(contest.contestStatus) }}</span>
          <span :class="['status-badge', getEntityStatusClass(contest.status)]">{{ contest.status }}</span>
          <span :class="['sb-badge', contest.scoreboardVisibility === 'VISIBLE' ? 'sb-visible' : 'sb-hidden']">
            XH: {{ contest.scoreboardVisibility === 'VISIBLE' ? 'VISIBLE' : (contest.scoreboardVisibility === 'HIDDEN_PERMANENTLY' ? 'HIDDEN' : 'FROZEN') }}
          </span>
        </div>
      </div>
      <div class="detail-meta-grid">
        <div class="meta-item"><span class="meta-label">Bắt đầu</span><span class="meta-value">{{ fmtDt(contest.startTime) }}</span></div>
        <div class="meta-item"><span class="meta-label">Kết thúc</span><span class="meta-value">{{ fmtDt(contest.endTime) }}</span></div>
        <div class="meta-item"><span class="meta-label">Người tạo</span><span class="meta-value">{{ contest.authorUsername }}</span></div>
        <div class="meta-item" v-if="contest.durationMinutes"><span class="meta-label">Thời hạn</span><span class="meta-value">{{ contest.durationMinutes }} phút</span></div>
        <div class="meta-item"><span class="meta-label">Thí sinh</span><span class="meta-value">{{ contest.participantCount || 0 }}</span></div>
        
        <div class="meta-item" v-if="contest.visibility === 'PRIVATE'">
          <span class="meta-label">Private Invite Link</span>
          <div style="display: flex; gap: 8px; align-items: center; margin-top: 4px;">
            <AppButton size="small" variant="primary" :icon="LinkIcon" @click="copyInviteLink">
              Sao chép Link Mời
            </AppButton>
          </div>
        </div>
      </div>
      <!-- DELETED warning -->
      <div v-if="isDeleted" class="deleted-warning">
        Contest này đã bị xóa mềm. Không cho phép chỉnh sửa.
      </div>
    </div>

    <!-- Tabs -->
    <el-tabs v-if="contest" v-model="activeTab" class="detail-tabs">
      <el-tab-pane name="general">
        <template #label><span class="tab-label"><Settings :size="14" /> Thông tin chung</span></template>
        <ContestForm :contest="contest" :loading="saving" :readonly="formReadonly" :contest-status="contest.contestStatus" @submit="handleUpdate" @cancel="handleBack" />
      </el-tab-pane>
      <el-tab-pane name="problems" lazy>
        <template #label><span class="tab-label"><BookOpen :size="14" /> Bài tập</span></template>
        <TabProblems :contest-id="id" :readonly="problemsReadonly" />
      </el-tab-pane>
      <el-tab-pane name="participants" lazy>
        <template #label><span class="tab-label"><Users :size="14" /> Thí sinh</span></template>
        <TabParticipants :contest-id="id" :readonly="isDeleted" />
      </el-tab-pane>
      <el-tab-pane name="submissions" lazy>
        <template #label><span class="tab-label"><FileText :size="14" /> Submissions</span></template>
        <TabSubmissions :contest-id="id" />
      </el-tab-pane>
      <el-tab-pane name="leaderboard" lazy>
        <template #label><span class="tab-label"><Trophy :size="14" /> Xếp hạng</span></template>
        <TabLeaderboard :contest-id="id" :contest-title="contest.title" :rule-type="contest.ruleType" />
      </el-tab-pane>
      <el-tab-pane name="whitelist" lazy v-if="contest.visibility === 'PRIVATE'">
        <template #label><span class="tab-label"><ShieldCheck :size="14" /> Whitelist</span></template>
        <TabWhitelist :contest-id="id" :contest-title="contest.title" :readonly="isDeleted" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.detail-view { display: flex; flex-direction: column; gap: 20px; }

/* Back bar */
.back-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; padding-bottom: 16px; border-bottom: 1px solid #3e3e3e; }
.sub-title { font-size: 14px; color: var(--text-secondary); }
.sub-title strong { color: var(--text-primary); }

/* Detail card */
.detail-card { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 16px; padding: 28px; }
.detail-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.detail-title { font-size: 22px; font-weight: 700; color: var(--text-primary); margin: 0; }
.detail-badges { display: flex; gap: 8px; flex-wrap: wrap; flex-shrink: 0; }
.detail-meta-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
.meta-item { display: flex; flex-direction: column; gap: 4px; }
.meta-label { font-size: 12px; font-weight: 600; color: #8a8a8a; text-transform: uppercase; letter-spacing: 0.5px; }
.meta-value { font-size: 14px; color: var(--text-primary); }

.deleted-warning { margin-top: 16px; padding: 12px 16px; background: rgba(239,71,67,0.08); border: 1px solid rgba(239,71,67,0.2); border-radius: 8px; color: #ef4743; font-size: 13px; font-weight: 500; }

/* Badges */
.rule-badge { padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; }
.rule-acm { background: rgba(0,184,163,0.15); color: #00b8a3; }
.rule-oi  { background: rgba(255,161,22,0.15); color: #ffa116; }
.status-badge { padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
.status-ongoing  { background: rgba(0,184,163,0.12); color: #00b8a3; }
.status-upcoming { background: rgba(255,192,30,0.12); color: #ffc01e; }
.status-ended    { background: rgba(255,255,255,0.08); color: #8a8a8a; }
.status-active   { background: rgba(0,184,163,0.1); color: #00b8a3; }
.status-deleted  { background: rgba(239,71,67,0.1); color: #ef4743; }

.sb-badge { padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; margin-left: 2px; }
.sb-visible { background: rgba(0, 184, 163, 0.1); color: #00b8a3; border: 1px solid rgba(0, 184, 163, 0.2); }
.sb-hidden { background: rgba(239, 71, 67, 0.1); color: #ef4743; border: 1px solid rgba(239, 71, 67, 0.2); }

/* Tabs */
.detail-tabs { margin-top: 4px; }
.tab-label { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; }

:deep(.detail-tabs .el-tabs__nav-wrap::after) { display: none; }
:deep(.detail-tabs .el-tabs__header) { border-bottom: 1px solid #3e3e3e; margin-bottom: 0; }
:deep(.detail-tabs .el-tabs__item) { color: #8a8a8a; font-size: 13px; }
:deep(.detail-tabs .el-tabs__item.is-active) { color: var(--accent-primary); }
:deep(.detail-tabs .el-tabs__active-bar) { background: var(--accent-primary); }
:deep(.detail-tabs .el-tabs__content) { padding-top: 24px; }
</style>
