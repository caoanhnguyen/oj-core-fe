<script setup>
import { ref, onBeforeUnmount, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, CheckCircle, ArrowLeft } from 'lucide-vue-next'
import { useProblemStore } from '../../stores/problem'
import AppButton from '@/components/common/AppButton.vue'
import { ElMessage } from 'element-plus'
import JSZip from 'jszip'

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
  memoryLimitKb: 256,
  topicIds: [],
  examples: [
    { inputData: '', outputData: '', explanation: '', orderIndex: 0, expanded: true }
  ],
  templates: [],
  testcases: [] 
})

// Tab State
const activeTab = ref('general')

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

// Final Zip (Keep this here for Submit logic)
const generateFinalZip = async () => {
    if (!formData.value.testcases || formData.value.testcases.length === 0) return null
    const zip = new JSZip()
    
    formData.value.testcases.forEach(tc => {
        // e.g. "1" -> "1.in" / "1.out"
        const name = tc.name || `testcase_${tc.id}`
        // Only if content exists (zip parsing gave us content)
        if (tc.input !== undefined) zip.file(`${name}.in`, tc.input)
        if (tc.output !== undefined) zip.file(`${name}.out`, tc.output)
    })
    
    return await zip.generateAsync({ type: 'blob' })
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
        // 1. Create Problem First
        const { testcases, ...problemPayload } = formData.value
        
        const payload = { ...problemPayload, status }
        
        const newProblem = await problemStore.createProblem(payload)
        
        // 2. Upload Testcases Separately
        // Note: TestcaseManager gives us the parsed list. We re-zip it here.
        if (formData.value.testcases.length > 0) {
            const zipBlob = await generateFinalZip()
            if (zipBlob) {
                const zipFile = new File([zipBlob], `testcases.zip`, { type: 'application/zip' })
                
                const testcasesFD = new FormData()
                testcasesFD.append('file', zipFile)
                
                const metadata = formData.value.testcases.map(tc => ({
                    name: tc.name,
                    isHidden: tc.isHidden
                }))
                testcasesFD.append('metadata', JSON.stringify(metadata))
                
                await problemStore.uploadTestcasesZip(newProblem.id, testcasesFD)
            }
        }

        router.push('/dashboard')
      } catch (error) {
        console.error('Failed to create problem:', error)
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
})

const handleBack = () => {
  // Navigate back to the Manage Problems tab
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
      <!-- FIXED HEADER -->
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

      <!-- MAIN TABS CONTENT -->
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

            <el-tab-pane label="Code Templates" name="templates">
               <TemplatesTab :templates="formData.templates" />
            </el-tab-pane>

            <el-tab-pane label="Test Cases" name="testcases">
               <TestcaseManager 
                  :testcases="formData.testcases" 
                  @update:testcases="(list) => formData.testcases = list" 
                  mode="CREATE"
               />
            </el-tab-pane>

         </el-tabs>
      </div>
    </el-form>
  </div>
</template>

<style scoped>
/* Reuse styles from original or extract to global if needed. 
   Keeping Layout styles here. Component styles are inside components. */

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
