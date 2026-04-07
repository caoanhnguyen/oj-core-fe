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

const props = defineProps({
  contest:  { type: Object, default: null },
  loading:  { type: Boolean, default: false },
  readonly: { type: Boolean, default: false }
})
const emit = defineEmits(['submit', 'cancel'])

const isCreate = computed(() => !props.contest)

// UTC helpers
const parseUTC = (s) => { if (!s) return null; return new Date((s.includes('Z') || s.includes('+')) ? s : s + 'Z') }
const toUTCString = (val) => { if (!val) return null; const d = val instanceof Date ? val : new Date(val); return d.toISOString().slice(0, 19) }

const formRef = ref(null)
const form = ref({
  title: '', description: '', timeRange: null,
  ruleType: 'ACM', visibility: 'PUBLIC', password: '', 
  durationMinutes: null, format: 'STRICT', allowLateRegistration: true,
  scoreboardVisibility: 'VISIBLE'
})
const rules = {
  title:     [{ required: true, message: 'Vui lòng nhập tiêu đề', trigger: 'blur' }],
  timeRange: [{ required: true, message: 'Vui lòng chọn thời gian', trigger: 'change' }],
}

// Sync from contest prop (edit mode)
watch(() => props.contest, (c) => {
  if (!c) { form.value = { title: '', description: '', timeRange: null, ruleType: 'ACM', visibility: 'PUBLIC', password: '', durationMinutes: null, format: 'STRICT', allowLateRegistration: true, scoreboardVisibility: 'VISIBLE' }; return }
  form.value = {
    title: c.title || '', description: c.description || '',
    timeRange: [parseUTC(c.startTime), parseUTC(c.endTime)],
    ruleType: c.ruleType || 'ACM', visibility: c.visibility || 'PUBLIC',
    password: c.password || '', durationMinutes: c.durationMinutes || null,
    format: c.format || 'STRICT', allowLateRegistration: c.allowLateRegistration !== false,
    scoreboardVisibility: c.scoreboardVisibility || 'VISIBLE'
  }
}, { immediate: true })

const handleSubmit = async () => {
  if (props.readonly) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  const [start, end] = form.value.timeRange || []
  emit('submit', {
    title: form.value.title, description: form.value.description,
    startTime: toUTCString(start), endTime: toUTCString(end),
    ruleType: form.value.ruleType, visibility: form.value.visibility,
    durationMinutes: form.value.format === 'WINDOWED' ? (form.value.durationMinutes || null) : null,
    format: form.value.format, allowLateRegistration: form.value.allowLateRegistration,
    scoreboardVisibility: form.value.scoreboardVisibility,
    ...(form.value.visibility === 'PRIVATE' ? { password: form.value.password } : {})
  })
}
</script>

<template>
  <div class="contest-form">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" :disabled="readonly">
      <el-form-item label="Tiêu đề" prop="title">
        <el-input v-model="form.title" placeholder="Tên contest..." />
      </el-form-item>

      <el-form-item label="Thời gian bắt đầu – Kết thúc" prop="timeRange">
        <el-date-picker v-model="form.timeRange" type="datetimerange" range-separator="→"
          :disabled="readonly"
          start-placeholder="Bắt đầu" end-placeholder="Kết thúc" style="width:100%" popper-class="dark-date-picker" />
      </el-form-item>

      <div class="form-row-3">
        <el-form-item label="Rule Type">
          <el-select v-model="form.ruleType" style="width:100%" popper-class="dark-select-dropdown">
            <el-option label="ACM" value="ACM" /><el-option label="OI" value="OI" />
          </el-select>
        </el-form-item>
        <el-form-item label="Visibility">
          <el-select v-model="form.visibility" style="width:100%" popper-class="dark-select-dropdown">
            <el-option label="Public" value="PUBLIC" /><el-option label="Private" value="PRIVATE" />
          </el-select>
        </el-form-item>
        <el-form-item label="Định dạng Contest (Format)">
          <el-select v-model="form.format" style="width:100%" popper-class="dark-select-dropdown">
            <el-option label="Cố định (Strict)" value="STRICT" />
            <el-option label="Khung giờ linh hoạt (Windowed)" value="WINDOWED" />
          </el-select>
        </el-form-item>
      </div>

      <!-- Row 2: Aligned exactly under Rule Type | Visibility | Format -->
      <div class="form-row-3">
        <!-- Col 1 (under Rule Type): Late Registration switch -->
        <el-form-item label="Tham gia trễ (Late Registration)">
          <div class="switch-wrapper">
            <el-switch
              v-model="form.allowLateRegistration"
              :disabled="readonly"
              style="--el-switch-on-color: #ffa116; --el-switch-off-color: #3e3e3e;"
            />
            <span class="switch-label" :class="{ active: form.allowLateRegistration }">
              {{ form.allowLateRegistration ? 'Cho phép tham gia muộn' : 'Chỉ đăng ký trước' }}
            </span>
          </div>
        </el-form-item>

        <!-- Col 2 (under Visibility): Password if PRIVATE, else empty spacer -->
        <el-form-item v-if="form.visibility === 'PRIVATE'" label="Mật khẩu">
          <el-input v-model="form.password" show-password placeholder="Mật khẩu tham gia..." />
        </el-form-item>
        <div v-else />

        <!-- Col 3 (under Format): Duration if WINDOWED, else empty spacer -->
        <el-form-item v-if="form.format === 'WINDOWED'" label="Thời hạn làm bài (phút)">
          <el-input-number v-model="form.durationMinutes" :min="1" :max="1440" controls-position="right" style="width: 100%" />
        </el-form-item>
        <div v-else />
      </div>

      <div class="form-row-3">
        <el-form-item label="Chế độ Bảng xếp hạng">
          <el-select v-model="form.scoreboardVisibility" :disabled="readonly" style="width:100%" popper-class="dark-select-dropdown">
            <el-option label="Hiện toàn thời gian" value="VISIBLE" />
            <el-option label="Đóng băng lúc thi" value="HIDDEN_DURING_CONTEST" />
            <el-option label="Ẩn vĩnh viễn" value="HIDDEN_PERMANENTLY" />
          </el-select>
        </el-form-item>
        <div /> <div />
      </div>

      <el-form-item label="Mô tả">
        <RichTextEditor :readonly="readonly" :content="form.description" placeholder="Mô tả contest..." style="height:320px" @update:content="form.description = $event" />
      </el-form-item>

      <div v-if="!readonly" class="form-actions">
        <AppButton variant="info" @click="emit('cancel')">Hủy</AppButton>
        <AppButton variant="primary" :loading="loading" @click="handleSubmit">
          {{ isCreate ? 'Tạo Contest' : 'Lưu thay đổi' }}
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

/* Switch inside grid cell */
.switch-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 32px;
}
.switch-label {
  font-size: 13px;
  color: #5c5c5c;
  transition: color 0.2s;
}
.switch-label.active {
  color: #eff2f6;
}

/* Dark form controls */
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

/* Disabled state */
:deep(.el-form.is-disabled .el-input__wrapper),
:deep(.el-form.is-disabled .el-select__wrapper),
:deep(.el-date-editor.is-disabled) { opacity: 0.6 !important; cursor: not-allowed !important; background: #282828 !important; box-shadow: 0 0 0 1px #3e3e3e inset !important; }
:deep(.el-date-editor.is-disabled input) { background: transparent !important; color: #8a8a8a !important; cursor: not-allowed !important; }

/* Switch dark theme */
:deep(.el-switch__label) { color: #5c5c5c !important; font-size: 13px; }
:deep(.el-switch__label.is-active) { color: #eff2f6 !important; }
:deep(.el-switch.is-checked .el-switch__core) { border-color: #ffa116 !important; background-color: #ffa116 !important; }
</style>
