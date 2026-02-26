<script setup>
import { ref, onMounted, reactive, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProblemStore } from '../../stores/problem'
import AppButton from '@/components/common/AppButton.vue'
import { ElMessage } from 'element-plus'

// Components
import GeneralInfoTab from '@/components/problems/GeneralInfoTab.vue'
import ConstraintsTab from '@/components/problems/ConstraintsTab.vue'
import ExamplesTab from '@/components/problems/ExamplesTab.vue'
import TemplatesTab from '@/components/problems/TemplatesTab.vue'
import TestcaseManager from '@/components/problems/TestcaseManager.vue'
import { ArrowLeft } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
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
  examples: [],
  templates: [],
  testcases: [] 
})

const activeTab = ref('general')
const loading = ref(false)
const isSaving = ref(false)

const rules = reactive({
  title: [{ required: true, message: 'Title is required', trigger: 'blur' }],
  difficulty: [{ required: true, message: 'Difficulty is required', trigger: 'change' }],
  description: [{ required: true, message: 'Description is required', trigger: 'blur' }],
  constraints: [{ required: true, message: 'Constraints are required', trigger: 'blur' }]
})

const formRef = ref(null)

// Load Data
onMounted(async () => {
    const id = route.params.id
    if (!id) {
        ElMessage.error('Invalid Problem ID')
        router.push('/dashboard')
        return
    }

    try {
        loading.value = true
        const problem = await problemStore.fetchProblemById(id)
        if (problem) {
            // Map SDO to Form Data
            formData.value.title = problem.title
            formData.value.slug = problem.slug
            formData.value.difficulty = problem.difficulty
            formData.value.description = problem.description
            formData.value.constraints = problem.constraints
            formData.value.timeLimitMs = problem.timeLimitMs
            formData.value.memoryLimitKb = problem.memoryLimitKb
            
            // Examples
            if (problem.examples) {
                formData.value.examples = problem.examples.map(ex => ({
                    ...ex,
                    expanded: false
                }))
            }

            // Templates
            if (problem.templates) {
                formData.value.templates = problem.templates.map(t => ({
                    ...t,
                    expanded: false
                }))
            }

            // Testcases
            if (problem.testCases) {
                formData.value.testcases = problem.testCases.map(tc => ({
                    id: tc.id,
                    name: `Testcase ${tc.orderIndex}`, // or use ID
                    input: tc.inputData,
                    output: tc.outputData,
                    inputUrl: tc.inputUrl,
                    outputUrl: tc.outputUrl,
                    isHidden: !tc.isSample, // Map Sample -> Hidden
                    orderIndex: tc.orderIndex
                }))
            }
        }
    } catch (e) {
        console.error('Failed to load problem', e)
    } finally {
        loading.value = false
    }
})

// Slug Logic (Only update if manually changed or specific logic?)
// Usually update doesn't auto-update slug to avoid breaking links, 
// unless user explicitly wants to. 
// For now, let's allow editing slug manually in GeneralTab if needed, 
// OR simpler: don't watch title for existing problem. 
// I'll keep the watch commented out or removed for Update.

/*
watch(() => formData.value.title, (newTitle) => {
  // formData.value.slug = generateSlug(newTitle) 
})
*/

// Final Zip
const generateFinalZip = async () => {
    if (!formData.value.testcases || formData.value.testcases.length === 0) return null
    // We only zip if it's NEW data, e.g., if any of them has `input` instead of `inputUrl`
    const hasLocalContent = formData.value.testcases.some(tc => tc.input !== undefined)
    if (!hasLocalContent) return null

    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    
    formData.value.testcases.forEach(tc => {
        const name = tc.name || `testcase_${tc.id}`
        if (tc.input !== undefined) zip.file(`${name}.in`, tc.input)
        if (tc.output !== undefined) zip.file(`${name}.out`, tc.output)
    })
    
    return await zip.generateAsync({ type: 'blob' })
}

const handleUpdate = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid, fields) => {
    if (valid) {
      if (formData.value.examples.length === 0) {
        ElMessage.warning('Please add at least one example')
        return
      }
      if (formData.value.templates.length === 0) {
        ElMessage.warning('Please add at least one code template')
        return
      }

      try {
        isSaving.value = true
        const id = route.params.id
        // 1. Update Problem Info (PUT)
        const { testcases, ...problemPayload } = formData.value
        
        await problemStore.updateProblem(id, problemPayload)
        
        // 2. Handle Testcases Upload if new ones exist
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
                
                await problemStore.uploadTestcasesZip(id, testcasesFD)
            }
        }
        
        router.push('/dashboard')
      } catch (error) {
        console.error('Failed to update problem:', error)
      } finally {
        isSaving.value = false
      }
    } else {
      ElMessage.error('Please check all required fields')
    }
  })
}

const handleCancel = () => {
  problemStore.clearUploadedImages()
  // Navigate back to the Manage Problems tab
  router.push({ path: '/dashboard', query: { tab: 'problems' } })
}

const handleBack = () => {
  // Navigate back to the Manage Problems tab
  router.push({ path: '/dashboard', query: { tab: 'problems' } })
}
</script>

<template>
  <div 
    v-loading="loading"
    element-loading-background="rgba(20, 20, 20, 0.9)"
    element-loading-text="Loading problem details..."
    class="create-problem-container custom-loading"
  >
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
            <h2 class="page-title">Edit Problem: {{ formData.title }}</h2>
         </div>
         <div class="header-right">
            <AppButton variant="text" @click="handleCancel" class="cancel-btn" :disabled="isSaving">Cancel</AppButton>
            <div class="divider-v"></div>
            <AppButton variant="primary" @click="handleUpdate" :loading="isSaving" :disabled="isSaving">Save Changes</AppButton>
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
                  mode="UPDATE"
                  :problemId="route.params.id"
               />
            </el-tab-pane>

         </el-tabs>
      </div>
    </el-form>
  </div>
</template>

<style scoped>
/* Copied from CreateProblemView */
.create-problem-container {
  height: calc(100vh - 64px); 
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

.fixed-header {
  padding: 16px 24px;
  background-color: #141414;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
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

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
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
  overflow: hidden; 
  display: flex;
  flex-direction: column;
}
:deep(.el-tab-pane) {
  height: 100%; 
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
}

/* Custom Loading Spinner Color override */
:deep(.custom-loading .el-loading-spinner .path) {
  stroke: #ffa116;
}
:deep(.custom-loading .el-loading-spinner .el-loading-text) {
  color: #ffa116;
}
</style>
