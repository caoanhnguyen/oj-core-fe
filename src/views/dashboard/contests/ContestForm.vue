<script setup>
/**
 * ContestForm — Reusable form for create/edit contest
 *
 * Props:
 *   contest     (Object|null)  — contest to edit, null = create mode
 *   loading     (Boolean)      — external loading flag
 *   readonly    (Boolean)      — disables all form inputs (for DELETED contests)
 *
 * Emits:
 *   submit(payload)  — cleaned payload ready for API
 *   cancel()
 */
import { ref, watch, computed } from 'vue'
import RichTextEditor from '@/components/common/RichTextEditor.vue'
import AppButton from '@/components/common/AppButton.vue'
import { generateSlug } from '@/utils/stringUtils'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  contest:  { type: Object, default: null },
  loading:  { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  contestStatus: { type: String, default: null } // UPCOMING, ONGOING, ENDED
})
const emit = defineEmits(['submit', 'cancel'])

const isOngoing = computed(() => props.contestStatus === 'ONGOING')
const isEnded   = computed(() => props.contestStatus === 'ENDED')
const isCreate  = computed(() => !props.contest)

// UTC helpers
const parseUTC    = (s) => { if (!s) return null; return new Date((s.includes('Z') || s.includes('+')) ? s : s + 'Z') }
const toUTCString = (val) => { if (!val) return null; const d = val instanceof Date ? val : new Date(val); return d.toISOString().slice(0, 19) }

const formRef        = ref(null)
const userEditedKey  = ref(false)

const form = ref({
  title: '', contestKey: '', description: '', timeRange: null,
  ruleType: 'ACM', visibility: 'PUBLIC', password: '',
  durationMinutes: null, format: 'STRICT', allowLateRegistration: true,
  scoreboardVisibility: 'VISIBLE',
  resourceVisibility: 'ALWAYS_VISIBLE'
})

// Validation rules — reactive to locale because they use t()
const rules = computed(() => ({
  title:      [{ required: true, message: t('admin_contests.form.validation.req_title'), trigger: 'blur' }],
  contestKey: [
    { required: true, message: t('admin_contests.form.validation.req_key'),     trigger: 'blur' },
    { pattern: /^[a-z0-9-]+$/, message: t('admin_contests.form.validation.key_pattern') }
  ],
  timeRange:  [{ required: true, message: t('admin_contests.form.validation.req_time'), trigger: 'change' }],
}))

watch(() => form.value.title, (newVal) => {
  if (isCreate.value && !userEditedKey.value && newVal) {
    form.value.contestKey = generateSlug(newVal)
  }
})

// Sync from contest prop (edit mode)
watch(() => props.contest, (c) => {
  if (!c) {
    form.value = { title: '', contestKey: '', description: '', timeRange: null, ruleType: 'ACM', visibility: 'PUBLIC', password: '', durationMinutes: null, format: 'STRICT', allowLateRegistration: true, scoreboardVisibility: 'VISIBLE', resourceVisibility: 'ALWAYS_VISIBLE' }
    userEditedKey.value = false
    return
  }
  form.value = {
    title: c.title || '', contestKey: c.contestKey || '', description: c.description || '',
    timeRange: [parseUTC(c.startTime), parseUTC(c.endTime)],
    ruleType: c.ruleType || 'ACM', visibility: c.visibility || 'PUBLIC',
    password: c.password || '', durationMinutes: c.durationMinutes || null,
    format: c.format || 'STRICT', allowLateRegistration: c.allowLateRegistration !== false,
    scoreboardVisibility: c.scoreboardVisibility || 'VISIBLE',
    resourceVisibility: c.resourceVisibility || 'ALWAYS_VISIBLE'
  }
}, { immediate: true })

const handleSubmit = async () => {
  if (props.readonly) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  const [start, end] = form.value.timeRange || []
  emit('submit', {
    title: form.value.title, contestKey: form.value.contestKey, description: form.value.description,
    startTime: toUTCString(start), endTime: toUTCString(end),
    ruleType: form.value.ruleType, visibility: form.value.visibility,
    durationMinutes: form.value.format === 'WINDOWED' ? (form.value.durationMinutes || null) : null,
    format: form.value.format, allowLateRegistration: form.value.allowLateRegistration,
    scoreboardVisibility: form.value.scoreboardVisibility,
    resourceVisibility: form.value.resourceVisibility,
    ...(form.value.visibility === 'PRIVATE' ? { password: form.value.password } : {})
  })
}
</script>

<template>
  <div class="contest-form">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" :disabled="readonly">
      <div class="form-row-2">
        <el-form-item :label="$t('admin_contests.form.field_title')" prop="title">
          <el-input v-model="form.title" :placeholder="$t('admin_contests.form.placeholder_title')" />
        </el-form-item>

        <el-form-item :label="$t('admin_contests.form.field_key')" prop="contestKey">
          <el-input v-model="form.contestKey" :placeholder="$t('admin_contests.form.placeholder_key')" @input="userEditedKey = true" />
        </el-form-item>
      </div>

      <el-form-item :label="$t('admin_contests.form.field_time_range')" prop="timeRange">
        <el-date-picker v-model="form.timeRange" type="datetimerange" range-separator="→"
          :disabled="readonly || isEnded"
          :start-placeholder="$t('admin_contests.form.field_start')"
          :end-placeholder="$t('admin_contests.form.field_end')"
          style="width:100%" popper-class="dark-date-picker" />
      </el-form-item>

      <div class="form-row-3">
        <el-form-item label="Rule Type">
          <el-select v-model="form.ruleType" :disabled="readonly || isOngoing || isEnded" style="width:100%" popper-class="dark-select-dropdown">
            <el-option label="ACM" value="ACM" /><el-option label="OI" value="OI" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('admin_contests.form.field_visibility')">
          <el-select v-model="form.visibility" style="width:100%" popper-class="dark-select-dropdown">
            <el-option :label="$t('admin_contests.visibility_opts.public')"  value="PUBLIC" />
            <el-option :label="$t('admin_contests.visibility_opts.private')" value="PRIVATE" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('admin_contests.form.field_format')">
          <el-select v-model="form.format" :disabled="readonly || isOngoing || isEnded" style="width:100%" popper-class="dark-select-dropdown">
            <el-option :label="$t('admin_contests.form.format_strict')"   value="STRICT" />
            <el-option :label="$t('admin_contests.form.format_windowed')" value="WINDOWED" />
          </el-select>
        </el-form-item>
      </div>

      <!-- Row 2 -->
      <div class="form-row-3">
        <!-- Late Registration -->
        <el-form-item :label="$t('admin_contests.form.field_late_reg')">
          <div class="switch-wrapper">
            <el-switch
              v-model="form.allowLateRegistration"
              :disabled="readonly || isEnded"
              style="--el-switch-on-color: #ffa116; --el-switch-off-color: #3e3e3e;"
            />
            <span class="switch-label" :class="{ active: form.allowLateRegistration }">
              {{ form.allowLateRegistration ? $t('admin_contests.form.late_reg_yes') : $t('admin_contests.form.late_reg_no') }}
            </span>
          </div>
        </el-form-item>

        <!-- Password if PRIVATE -->
        <el-form-item v-if="form.visibility === 'PRIVATE'" :label="$t('admin_contests.form.field_password')">
          <el-input v-model="form.password" show-password :placeholder="$t('admin_contests.form.placeholder_pass')" :disabled="readonly || isEnded" />
        </el-form-item>
        <div v-else />

        <!-- Duration if WINDOWED -->
        <el-form-item v-if="form.format === 'WINDOWED'" :label="$t('admin_contests.form.field_duration_windowed')">
          <el-input-number v-model="form.durationMinutes" :min="1" :max="1440" :disabled="readonly || isOngoing || isEnded" controls-position="right" style="width: 100%" />
        </el-form-item>
        <div v-else />
      </div>

      <div class="form-row-3">
        <el-form-item :label="$t('admin_contests.form.field_scoreboard')">
          <el-select v-model="form.scoreboardVisibility" :disabled="readonly" style="width:100%" popper-class="dark-select-dropdown">
            <el-option :label="$t('admin_contests.scoreboard_opts.visible')" value="VISIBLE" />
            <el-option :label="$t('admin_contests.scoreboard_opts.frozen')" value="HIDDEN_DURING_CONTEST" />
            <el-option :label="$t('admin_contests.scoreboard_opts.hidden')" value="HIDDEN_PERMANENTLY" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('admin_contests.form.field_resource_vis')">
          <el-select v-model="form.resourceVisibility" :disabled="readonly" style="width:100%" popper-class="dark-select-dropdown">
            <el-option :label="$t('admin_contests.form.resource_vis_public')" value="ALWAYS_VISIBLE" />
            <el-option :label="$t('admin_contests.form.resource_vis_exam')"   value="ONLY_DURING" />
          </el-select>
          <div v-if="form.resourceVisibility === 'ONLY_DURING'" class="hint-warn">
            {{ $t('admin_contests.form.resource_vis_warning') }}
          </div>
        </el-form-item>
        <div />
      </div>

      <el-form-item :label="$t('admin_contests.form.field_desc')">
        <RichTextEditor :readonly="readonly" :content="form.description" :placeholder="$t('admin_contests.form.placeholder_desc')" style="height:320px" @update:content="form.description = $event" />
      </el-form-item>

      <div v-if="!readonly" class="form-actions">
        <AppButton variant="info" @click="emit('cancel')">{{ $t('admin_contests.form.btn_cancel') }}</AppButton>
        <AppButton variant="primary" :loading="loading" @click="handleSubmit">
          {{ isCreate ? $t('admin_contests.form.btn_create') : $t('admin_contests.form.btn_save') }}
        </AppButton>
      </div>
    </el-form>
  </div>
</template>

<style scoped>
.contest-form { width: 100%; }
.form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-actions { display: flex; justify-content: flex-end; gap: 12px; padding-top: 16px; }

.switch-wrapper { display: flex; align-items: center; gap: 10px; height: 32px; }
.switch-label { font-size: 13px; color: #5c5c5c; transition: color 0.2s; }
.switch-label.active { color: #eff2f6; }

:deep(.el-form-item__label) { color: #8a8a8a; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-select__wrapper) { background: #282828 !important; box-shadow: 0 0 0 1px #3e3e3e inset !important; }
:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus) { box-shadow: 0 0 0 1px #5c5c5c inset !important; }
:deep(.el-input__inner),
:deep(.el-textarea__inner),
:deep(.el-select__placeholder),
:deep(.el-range-input) { color: #eff2f6 !important; }
:deep(.el-input-number) { width: 100%; }
:deep(.el-date-editor--datetimerange) { width: 100% !important; }
:deep(.el-range-separator) { color: #8a8a8a !important; }
:deep(.el-input-number .el-input-number__decrease),
:deep(.el-input-number .el-input-number__increase) { background: #333 !important; border-color: #3e3e3e !important; color: #eff2f6 !important; }
:deep(.el-input-number .el-input-number__decrease:hover),
:deep(.el-input-number .el-input-number__increase:hover) { color: var(--accent-primary) !important; }

:deep(.el-form.is-disabled .el-input__wrapper),
:deep(.el-form.is-disabled .el-select__wrapper),
:deep(.el-date-editor.is-disabled) { opacity: 0.6 !important; cursor: not-allowed !important; background: #282828 !important; box-shadow: 0 0 0 1px #3e3e3e inset !important; }
:deep(.el-date-editor.is-disabled input) { background: transparent !important; color: #8a8a8a !important; cursor: not-allowed !important; }

:deep(.el-switch__label) { color: #5c5c5c !important; font-size: 13px; }
:deep(.el-switch__label.is-active) { color: #eff2f6 !important; }
:deep(.el-switch.is-checked .el-switch__core) { border-color: #ffa116 !important; background-color: #ffa116 !important; }

.hint-warn { margin-top: 6px; font-size: 12px; color: #ffa116; padding: 6px 10px; background: rgba(255,161,22,0.06); border: 1px solid rgba(255,161,22,0.2); border-radius: 6px; line-height: 1.5; }
</style>
