<script setup>
import { ref, onBeforeUnmount, reactive, watch, onMounted } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { Plus, CheckCircle, ArrowLeft } from 'lucide-vue-next'
import { useProblemStore } from '../../stores/problem'
import AppButton from '@/components/common/AppButton.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import JSZip from 'jszip'

// 🌟 Import hàm bóc tách link ảnh
import { extractImageKeysFromHtml } from '@/utils/quillImageUpload'

// Components
import GeneralInfoTab from '@/components/problems/GeneralInfoTab.vue'
import ConstraintsTab from '@/components/problems/ConstraintsTab.vue'
import ExamplesTab from '@/components/problems/ExamplesTab.vue'
import TemplatesTab from '@/components/problems/TemplatesTab.vue'
import TestcaseManager from '@/components/problems/TestcaseManager.vue'

const router = useRouter()
const problemStore = useProblemStore()

// Form Data
const formData = ref({
  title: '',
  slug: '',
  difficulty: 'EASY',
  description: '',
  constraints: '',
  timeLimitMs: 1000,
  memoryLimitMb: 256,
  ruleType: 'ACM',
  totalScore: 100,
  source: '',
  hint: '',
  inputFormat: '',
  outputFormat: '',
  topicIds: [],
  examples: [
    { rawInput: '', rawOutput: '', explanation: '', orderIndex: 0, expanded: true }
  ],
  templates: [],
  testcaseFile: null 
})

// Tab State
const activeTab = ref('general')
const isDirty = ref(false)
const isSubmitting = ref(false)

// Track changes
watch(formData, () => {
  if (!isSubmitting.value) isDirty.value = true
}, { deep: true })

const allowLeaving = ref(false)

onBeforeRouteLeave(async (to, from, next) => {
  if (allowLeaving.value) {
    next()
    return
  }

  if (isDirty.value && !isSubmitting.value) {
    try {
      const action = await ElMessageBox.confirm(
        'Bạn có thay đổi chưa lưu. Bạn có muốn lưu bản nháp trước khi rời đi không?',
        'Xác nhận rời khỏi trang',
        {
          confirmButtonText: 'Lưu bản nháp',
          cancelButtonText: 'Rời đi không lưu',
          distinguishCancelAndClose: true,
          type: 'warning',
        }
      )

      if (action === 'confirm') {
        allowLeaving.value = true
        await handleSubmit('DRAFT')
        next()
      }
    } catch (action) {
      if (action === 'cancel') {
        allowLeaving.value = true
        next()
      } else {
        next(false)
      }
    }
  } else {
    next()
  }
})

// Browser close/refresh
const handleBeforeUnload = (e) => {
  if (isDirty.value && !isSubmitting.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
})

// Validation Rules
const rules = reactive({
  title: [{ required: true, message: 'Title is required', trigger: 'blur' }],
  difficulty: [{ required: true, message: 'Difficulty is required', trigger: 'change' }],
  description: [{ required: true, message: 'Description is required', trigger: 'blur' }],
  constraints: [{ required: true, message: 'Constraints are required', trigger: 'blur' }]
})

const formRef = ref(null)

// Slug Logic
const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     
    .replace(/[^\w\-]+/g, '') 
    .replace(/\-\-+/g, '-')   
}

watch(() => formData.value.title, (newTitle) => {
  formData.value.slug = generateSlug(newTitle)
})

// 🌟 HÀM QUÉT TOÀN BỘ ẢNH TRONG FORM
const gatherAllImageKeys = (data) => {
    let keys = []
    const htmlFields = [
        data.description,
        data.hint,
        data.constraints,
        data.inputFormat,
        data.outputFormat
    ]
    htmlFields.forEach(html => {
        if (html) keys = [...keys, ...extractImageKeysFromHtml(html)]
    })
    if (data.examples && data.examples.length > 0) {
        data.examples.forEach(ex => {
            if (ex.explanation) keys = [...keys, ...extractImageKeysFromHtml(ex.explanation)]
        })
    }
    return [...new Set(keys)] // Unique keys
}

const handleSubmit = async (status = 'ACTIVE') => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid, fields) => {
    if (valid) {
      if (formData.value.examples.length === 0) {
        ElMessage.warning('Please add at least one example (Examples Tab)')
        return
      }
      if (formData.value.templates.length === 0) {
        ElMessage.warning('Please add at least one code template (Templates Tab)')
        return
      }

      try {
        isSubmitting.value = true
        const { testcaseFile, ...problemPayload } = formData.value
        
        const allowedLanguages = problemPayload.templates.map(t => t.languageKey)

        // Convert templates to backend format 
        const templates = problemPayload.templates.map(t => ({
            languageKey: t.languageKey,
            codeTemplate: t.codeTemplate
        }))

        // 🌟 Gắn mảng temporaryImageKeys vào payload
        const payload = { 
            ...problemPayload, 
            status, 
            allowedLanguages, 
            templates,
            temporaryImageKeys: gatherAllImageKeys(formData.value)
        }

        const newProblem = await problemStore.createProblem(payload)
        
        // 2. Upload Testcases Separately
        if (testcaseFile) {
            const testcasesFD = new FormData()
            testcasesFD.append('file', testcaseFile)
            await problemStore.uploadTestcasesZip(newProblem.id, testcasesFD)
        }

        isDirty.value = false // SUCCESS! No longer dirty
        allowLeaving.value = true // Guard should let us pass
        router.push('/dashboard')
      } catch (error) {
        console.error('Failed to create problem:', error)
        isSubmitting.value = false
      }
    } else {
      ElMessage.error('Please check all required fields')
    }
  })
}

const handleCancel = () => {
  problemStore.clearUploadedImages()
  router.push('/dashboard')
}

onBeforeUnmount(() => {
  problemStore.clearUploadedImages()
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

const handleBack = () => {
  router.push({ path: '/dashboard', query: { tab: 'problems' } })
}
</script>

<template>
  <div class="create-problem-container">
    <el-form 
      ref="formRef" 
      :model="formData" 
      :rules="rules" 
      label-position="top"
      class="problem-form"
      hide-required-asterisk
    >
      <div class="fixed-header">
         <div class="header-left">
            <button type="button" class="back-btn" @click="handleBack">
               <ArrowLeft :size="20" />
            </button>
            <h2 class="page-title">Create New Problem</h2>
         </div>
         <div class="header-right">
            <AppButton variant="text" @click="handleCancel" class="cancel-btn">Cancel</AppButton>
            <div class="divider-v"></div>
            <AppButton variant="outline" @click="handleSubmit('DRAFT')">Save Draft</AppButton>
            <AppButton variant="primary" @click="handleSubmit('ACTIVE')">Publish</AppButton>
         </div>
      </div>

      <div class="tabs-container">
         <el-tabs v-model="activeTab" class="custom-tabs">
            
            <el-tab-pane label="General Info" name="general">
               <GeneralInfoTab v-model="formData" />
            </el-tab-pane>

            <el-tab-pane label="Constraints" name="constraints">
               <ConstraintsTab v-model="formData" />
            </el-tab-pane>
            
            <el-tab-pane label="Examples" name="examples">
                <ExamplesTab :examples="formData.examples" />
            </el-tab-pane>

            <el-tab-pane label="Language & Template" name="templates">
               <TemplatesTab :templates="formData.templates" />
            </el-tab-pane>

            <el-tab-pane label="Test Cases" name="testcases">
               <TestcaseManager 
                  :testcaseFile="formData.testcaseFile" 
                  @update:file="(file) => formData.testcaseFile = file" 
                  mode="CREATE"
               />
            </el-tab-pane>

         </el-tabs>
      </div>
    </el-form>
  </div>
</template>

<style scoped>
.create-problem-container {
  height: calc(100vh - 64px); /* Account for Navbar */
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: #141414;
  color: #e0e0e0;
}

.problem-form {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  background: transparent;
  border: none;
  color: #a0a0a0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
  margin-left: -8px; /* Offset padding to align visually */
}

.fixed-header {
  padding: 16px 24px;
  background-color: #141414;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}
.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff; 
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.divider-v { width: 1px; height: 24px; background: #404040; }
.cancel-btn { color: #a0a0a0; transition: color 0.2s; }
.cancel-btn:hover { color: #fff; }

.tabs-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; 
  padding: 0 24px 24px;
  background-color: #141414;
}

:deep(.el-tabs) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
:deep(.el-tabs__header) {
  margin-bottom: 24px;
  flex-shrink: 0; 
}
:deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: #333;
}
:deep(.el-tabs__item) {
  color: #a0a0a0;
  font-weight: 500;
  padding: 0 20px !important;
  transition: color 0.2s;
}
:deep(.el-tabs__item.is-active) {
  color: #ffa116;
  font-weight: 600;
}
:deep(.el-tabs__active-bar) {
  background-color: #ffa116;
}
:deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden; /* Important for inner scroll */
  display: flex;
  flex-direction: column;
}
:deep(.el-tab-pane) {
  height: 100%; /* Important */
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
}
</style>