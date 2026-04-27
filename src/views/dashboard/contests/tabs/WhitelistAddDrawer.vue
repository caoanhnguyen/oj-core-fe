<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import * as XLSX from 'xlsx'
import AppButton from '@/components/common/AppButton.vue'
import DataTable from '@/components/common/DataTable.vue'
import { ElMessage } from 'element-plus'
import { Download, Upload as UploadIcon, Plus, UserPlus, Trash2 } from 'lucide-vue-next'

const { t } = useI18n()

/** RFC-5321-ish email pattern — covers the vast majority of real-world addresses */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  // Current whitelist to check for duplicates
  existingItems: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:modelValue', 'add'])

// ── Tabs: 'manual' | 'excel' ──────────────────────────────────────
const activeTab = ref('excel')

// ── Manual entry ──────────────────────────────────────────────────
const formRef    = ref(null)
const manualEntry = ref({ email: '', fullName: '', phoneNumber: '', note: '' })

/** Validation rules — reactive to locale changes via computed */
const formRules = computed(() => ({
  email: [
    { required: true,   message: t('admin_contests.tab_whitelist.err_email_required'), trigger: 'blur' },
    { pattern: EMAIL_REGEX, message: t('admin_contests.tab_whitelist.err_email_invalid'), trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        const v = (value || '').trim()
        if (v && props.existingItems.some(i => i.email.toLowerCase() === v.toLowerCase())) {
          callback(new Error(t('admin_contests.tab_whitelist.err_email_duplicate')))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  fullName: [
    { required: true, message: t('admin_contests.tab_whitelist.err_fullname_required'), trigger: 'blur' }
  ],
  phoneNumber: [
    { required: true, message: t('admin_contests.tab_whitelist.err_phone_required'), trigger: 'blur' }
  ]
}))

const addManual = async () => {
  try {
    await formRef.value.validate()
  } catch {
    return // El Plus highlights invalid fields inline — nothing else needed
  }
  const { email, fullName, phoneNumber, note } = manualEntry.value
  emit('add', [{ email: email.trim(), fullName: fullName.trim(), phoneNumber: phoneNumber.trim(), note }])
  formRef.value.resetFields()
  ElMessage.success(t('admin_contests.tab_whitelist.msg_add_success'))
}

// ── Excel import ──────────────────────────────────────────────────
const importPreview = ref([])  // Items parsed, not yet confirmed
const previewError  = ref('')
const isDragging    = ref(false)

const processFile = (file) => {
  if (!file) return
  const reader = new FileReader()
  reader.onload = (evt) => {
    try {
      const data = new Uint8Array(evt.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', blankrows: true, raw: false })

      const DATA_START_ROW = 4
      const COL_NAME  = 1
      const COL_EMAIL = 2
      const COL_PHONE = 3
      const COL_NOTE  = 4

      if (rows.length <= DATA_START_ROW) {
        previewError.value = t('admin_contests.tab_whitelist.err_excel_no_data')
        importPreview.value = []
        return
      }

      const parsed  = []
      let   skipped = 0
      for (let i = DATA_START_ROW; i < rows.length; i++) {
        const r         = rows[i]
        const emailStr  = String(r[COL_EMAIL] || '').trim()
        const nameStr   = String(r[COL_NAME]  || '').trim()
        const phoneStr  = String(r[COL_PHONE] || '').trim()

        // Skip rows missing required fields or with invalid email
        if (!emailStr || !EMAIL_REGEX.test(emailStr) || !nameStr || !phoneStr) {
          skipped++
          continue
        }
        parsed.push({
          email:       emailStr,
          fullName:    nameStr,
          phoneNumber: phoneStr,
          note:        String(r[COL_NOTE] || '').trim(),
        })
      }

      if (parsed.length === 0) {
        previewError.value = t('admin_contests.tab_whitelist.err_excel_no_valid_email')
        importPreview.value = []
      } else {
        previewError.value = ''
        importPreview.value = parsed
        if (skipped > 0) {
          ElMessage.warning(t('admin_contests.tab_whitelist.msg_import_skipped', { skipped }))
        }
      }
    } catch (err) {
      previewError.value = t('admin_contests.tab_whitelist.err_excel_read_fail')
      importPreview.value = []
    }
  }
  reader.readAsArrayBuffer(file)
}

const handleFileUpload = (e) => {
  processFile(e.target.files[0])
  e.target.value = ''
}

const handleDrop = (e) => {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

const handleDragOver = (e) => { e.preventDefault(); isDragging.value = true }
const handleDragLeave = () => { isDragging.value = false }

const confirmImport = () => {
  if (importPreview.value.length === 0) return
  // Filter out duplicates from existingItems
  const newItems = importPreview.value.filter(
    item => !props.existingItems.some(e => e.email.toLowerCase() === item.email.toLowerCase())
  )
  emit('add', newItems)
  importPreview.value = []
  ElMessage.success(t('admin_contests.tab_whitelist.msg_import_success', { count: newItems.length }))
}

const clearPreview = () => { importPreview.value = []; previewError.value = '' }

const previewColumns = [
  { key: 'email',       label: 'Email',        minWidth: 200 },
  { key: 'fullName',    label: 'Họ tên',       minWidth: 150 },
  { key: 'phoneNumber', label: 'SĐT',          width: 130 },
  { key: 'note',        label: 'Ghi chú',      minWidth: 100 },
  { key: 'remove',      label: '',             width: 50, align: 'center' },
]

const removePreviewItem = (index) => { importPreview.value.splice(index, 1) }

const close = () => {
  formRef.value?.resetFields()
  emit('update:modelValue', false)
  importPreview.value = []
  previewError.value = ''
}
</script>

<template>
  <el-drawer
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="$t('admin_contests.tab_whitelist.add_drawer_title')"
    direction="rtl"
    size="800px"
    class="whitelist-drawer"
    destroy-on-close
    @close="close"
  >
    <!-- ── Tab selector ── -->
    <div class="drawer-tabs">
      <AppButton
        :variant="activeTab === 'excel' ? 'primary' : 'secondary'"
        :icon="UploadIcon"
        style="flex: 1"
        @click="activeTab = 'excel'"
      >{{ $t('admin_contests.tab_whitelist.btn_tab_excel') }}</AppButton>
      <AppButton
        :variant="activeTab === 'manual' ? 'primary' : 'secondary'"
        :icon="Plus"
        style="flex: 1"
        @click="activeTab = 'manual'"
      >{{ $t('admin_contests.tab_whitelist.btn_tab_manual') }}</AppButton>
    </div>

    <!-- ── Excel import panel ── -->
    <div v-if="activeTab === 'excel'" class="panel">
      <!-- Download template -->
      <a
        href="/templates/Bieu_Mau_Danh_Sach_Ung_Vien.xlsx"
        download="Bieu_Mau_Danh_Sach_Ung_Vien.xlsx"
        class="template-link"
      >
        <Download :size="14" />
        {{ $t('admin_contests.tab_whitelist.btn_download_template') }}
      </a>

      <!-- Upload zone: supports both click and drag-and-drop -->
      <div
        :class="['upload-zone', isDragging ? 'upload-zone--dragging' : '']"
        @click="$el.querySelector('#drawer-excel-upload').click()"
        @drop="handleDrop"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
      >
        <UploadIcon :size="28" class="upload-icon" />
        <span class="upload-title">{{ isDragging ? 'Thả file vào đây...' : 'Kéo thả hoặc bấm để chọn file' }}</span>
        <span class="upload-sub">Hỗ trợ .xlsx, .xls, .csv</span>
      </div>
      <input
        id="drawer-excel-upload"
        type="file"
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        @change="handleFileUpload"
        style="display: none"
      />

      <!-- Error -->
      <div v-if="previewError" class="error-msg">{{ previewError }}</div>

      <!-- Preview: DataTable -->
      <template v-if="importPreview.length > 0">
        <div class="preview-bar">
          <span class="preview-count">{{ importPreview.length }} bản ghi tìm thấy</span>
          <AppButton variant="text" size="small" @click="clearPreview">Xóa tất cả</AppButton>
        </div>
        <DataTable
          :data="importPreview"
          :columns="previewColumns"
          size="small"
          empty-text="Không có dữ liệu"
          style="margin-bottom: 4px"
        >
          <template #cell-email="{ row }">
            <span class="prev-email">{{ row.email }}</span>
          </template>
          <template #cell-fullName="{ row }">
            <span class="prev-meta">{{ row.fullName || '—' }}</span>
          </template>
          <template #cell-phoneNumber="{ row }">
            <span class="prev-meta">{{ row.phoneNumber || '—' }}</span>
          </template>
          <template #cell-note="{ row }">
            <span class="prev-meta">{{ row.note || '—' }}</span>
          </template>
          <template #cell-remove="{ index }">
            <el-button type="danger" link @click="removePreviewItem(index)">
              <Trash2 :size="14" style="color: #ef4743" />
            </el-button>
          </template>
        </DataTable>
        <AppButton variant="primary" :icon="UserPlus" style="width: 100%; margin-top: 8px" @click="confirmImport">
          Thêm {{ importPreview.length }} ứng viên vào danh sách
        </AppButton>
      </template>
    </div>

    <!-- ── Manual entry panel ── -->
    <div v-if="activeTab === 'manual'" class="panel">
      <el-form
        ref="formRef"
        :model="manualEntry"
        :rules="formRules"
        label-position="top"
        class="manual-form"
      >
        <el-form-item :label="$t('admin_contests.tab_whitelist.col_email')" prop="email">
          <el-input v-model="manualEntry.email" placeholder="nguyen.an@gmail.com" clearable />
        </el-form-item>
        <el-form-item :label="$t('admin_contests.tab_whitelist.col_fullname')" prop="fullName">
          <el-input v-model="manualEntry.fullName" placeholder="Nguyễn Văn An" clearable />
        </el-form-item>
        <el-form-item :label="$t('admin_contests.tab_whitelist.col_phone')" prop="phoneNumber">
          <el-input v-model="manualEntry.phoneNumber" placeholder="0901234567" clearable />
        </el-form-item>
        <el-form-item :label="$t('admin_contests.tab_whitelist.col_note')">
          <el-input
            v-model="manualEntry.note"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="Ứng viên phòng Sale..."
          />
        </el-form-item>
        <AppButton variant="primary" :icon="UserPlus" style="width: 100%" @click="addManual">
          {{ $t('admin_contests.tab_whitelist.btn_add') }}
        </AppButton>
      </el-form>
    </div>
  </el-drawer>
</template>

<style scoped>
/* Drawer layout */
.drawer-tabs { display: flex; gap: 8px; margin-bottom: 20px; }
.panel { display: flex; flex-direction: column; gap: 14px; }

/* Template download link */
.template-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #00b8a3;
  text-decoration: none;
  padding: 8px 12px;
  background: rgba(0,184,163,0.06);
  border: 1px dashed rgba(0,184,163,0.3);
  border-radius: 8px;
  transition: all 0.2s;
}
.template-link:hover { background: rgba(0,184,163,0.12); }

/* Upload zone */
.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 20px;
  border: 2px dashed #2d2d2d;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  user-select: none;
}
.upload-zone:hover,
.upload-zone--dragging { border-color: #ffa116; background: rgba(255,161,22,0.06); }
.upload-zone--dragging .upload-icon { color: #ffa116; }
.upload-icon { color: #5a5a5a; transition: color 0.2s; }
.upload-title { font-size: 14px; font-weight: 500; color: #eff2f6; }
.upload-sub { font-size: 12px; color: #8a8a8a; }

/* Error msg */
.error-msg {
  padding: 10px 14px;
  background: rgba(239,71,67,0.08);
  border: 1px solid rgba(239,71,67,0.2);
  border-radius: 8px;
  color: #ef4743;
  font-size: 13px;
}

/* Preview DataTable cell styles */
.preview-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0 8px;
}
.preview-count { font-size: 13px; color: #00b8a3; font-weight: 600; }
.prev-email { font-size: 13px; font-weight: 500; color: #eff2f6; }
.prev-meta  { font-size: 12px; color: #8a8a8a; }


/* Manual form */
.manual-form :deep(.el-form-item__label) {
  color: var(--text-secondary);
  font-size: 13px;
  margin-bottom: 4px;
}
.manual-form :deep(.el-input__wrapper) {
  background: var(--bg-dark);
  box-shadow: 0 0 0 1px var(--border-primary) inset;
}
.manual-form :deep(.el-input__inner) { color: var(--text-primary); }
</style>

<style>
/* Global dark drawer overrides — must use !important to override Element Plus defaults */
.whitelist-drawer .el-drawer {
  background: #151515 !important;
  border-left: 1px solid #2d2d2d !important;
}
.whitelist-drawer .el-drawer__header {
  background: #1a1a1a !important;
  border-bottom: 1px solid #2d2d2d !important;
  padding: 18px 24px !important;
  margin-bottom: 0 !important;
}
.whitelist-drawer .el-drawer__title {
  color: #eff2f6 !important;
  font-size: 16px !important;
  font-weight: 700 !important;
}
.whitelist-drawer .el-drawer__body {
  background: #151515 !important;
  padding: 24px !important;
  overflow-y: auto !important;
}
.whitelist-drawer .el-drawer__close-btn {
  color: #8a8a8a !important;
}
.whitelist-drawer .el-drawer__close-btn:hover {
  color: #eff2f6 !important;
  background: rgba(255,255,255,0.06) !important;
}
/* Form items */
.whitelist-drawer .el-form-item__label {
  color: #8a8a8a !important;
  font-size: 13px !important;
}
.whitelist-drawer .el-input__wrapper {
  background-color: #1e1e1e !important;
  box-shadow: 0 0 0 1px #2d2d2d inset !important;
}
.whitelist-drawer .el-input__wrapper:hover {
  box-shadow: 0 0 0 1px #4a4a4a inset !important;
}
.whitelist-drawer .el-input__wrapper.is-focus {
  box-shadow: 0 0 0 1px #00b8a3 inset !important;
}
.whitelist-drawer .el-input__inner {
  color: #eff2f6 !important;
}
.whitelist-drawer .el-input__inner::placeholder {
  color: #5a5a5a !important;
}
.whitelist-drawer .el-textarea__inner {
  background-color: #1e1e1e !important;
  box-shadow: 0 0 0 1px #2d2d2d inset !important;
  color: #eff2f6 !important;
  border-radius: 8px !important;
  padding: 8px 12px !important;
  font-family: inherit !important;
}
.whitelist-drawer .el-textarea__inner:hover {
  box-shadow: 0 0 0 1px #4a4a4a inset !important;
}
.whitelist-drawer .el-textarea__inner:focus {
  box-shadow: 0 0 0 1px #00b8a3 inset !important;
}
.whitelist-drawer .el-textarea__inner::placeholder {
  color: #5a5a5a !important;
}
.whitelist-drawer .el-input__count {
  background: transparent !important;
  color: #5a5a5a !important;
}
</style>
