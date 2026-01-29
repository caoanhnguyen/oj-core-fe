<script setup>
import { ref, onBeforeUnmount, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import { Plus, X, Upload, FileCode, AlertCircle, UploadCloud, FileArchive, ChevronDown, ChevronRight } from 'lucide-vue-next'
import { useProblemStore } from '../../stores/problem'
import { createQuillImageHandler } from '../../utils/quillImageUpload'
import CodeEditor from '@/components/common/CodeEditor.vue'
import AppButton from '@/components/common/AppButton.vue'
import { ElMessage } from 'element-plus'

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
  examples: [
    { inputData: '', outputData: '', explanation: '', orderIndex: 0, expanded: true }
  ],
  templates: [],
  testcasesFile: null
})

// Tab State
const activeTab = ref('general')

const difficultyOptions = [
  { label: 'Easy', value: 'EASY' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Hard', value: 'HARD' }
]

const languageOptions = [
  { label: 'Java', value: 'JAVA' },
  { label: 'C++', value: 'CPP' },
  { label: 'Python', value: 'PYTHON' },
  { label: 'JavaScript', value: 'JAVASCRIPT' }
]

const getDifficultyClass = (difficulty) => {
   if (difficulty === 'EASY') return 'difficulty-easy'
   if (difficulty === 'MEDIUM') return 'difficulty-medium'
   if (difficulty === 'HARD') return 'difficulty-hard'
   return ''
}

// Validation Rules
const rules = reactive({
  title: [{ required: true, message: 'Title is required', trigger: 'blur' }],
  difficulty: [{ required: true, message: 'Difficulty is required', trigger: 'change' }],
  description: [{ required: true, message: 'Description is required', trigger: 'blur' }],
  constraints: [{ required: true, message: 'Constraints are required', trigger: 'blur' }]
})

const formRef = ref(null)
const testcaseFileRef = ref(null)

// Logic
const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-')   // Replace multiple - with single -
}

watch(() => formData.value.title, (newTitle) => {
  formData.value.slug = generateSlug(newTitle)
})

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
        const payload = { ...formData.value, status }
        await problemStore.createProblem(payload)
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

// Example Logic
const addExample = () => {
  formData.value.examples.push({
    inputData: '',
    outputData: '',
    explanation: '',
    orderIndex: formData.value.examples.length,
    expanded: true // Default expanded
  })
}

const removeExample = (index) => {
  formData.value.examples.splice(index, 1)
  formData.value.examples.forEach((ex, idx) => ex.orderIndex = idx)
}

const toggleExample = (index) => {
   if (formData.value.examples[index].expanded === undefined) {
      formData.value.examples[index].expanded = false
   } else {
      formData.value.examples[index].expanded = !formData.value.examples[index].expanded
   }
}

// Template Logic
const addTemplate = () => {
  const usedLangs = formData.value.templates.map(t => t.language)
  const availableLang = languageOptions.find(opt => !usedLangs.includes(opt.value))
  
  if (!availableLang) {
    ElMessage.warning('All supported languages have been added')
    return
  }

  formData.value.templates.push({
    language: availableLang.value,
    codeTemplate: getDefaultTemplate(availableLang.value),
    expanded: true // Default expanded
  })
}

const removeTemplate = (index) => {
  formData.value.templates.splice(index, 1)
}

const toggleTemplate = (index) => {
   formData.value.templates[index].expanded = !formData.value.templates[index].expanded
}

const getAvailableLanguages = (currentLang) => {
  const usedLangs = formData.value.templates.map(t => t.language)
  return languageOptions.filter(opt => opt.value === currentLang || !usedLangs.includes(opt.value))
}

const getDefaultTemplate = (lang) => {
  const templates = {
    'JAVA': `import java.io.*;\nimport java.util.*;\n\nclass Solution {\n    public void solve() {\n        // Write your code here\n    }\n}`,
    'CPP': `#include <iostream>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve() {\n        // Write your code here\n    }\n};`,
    'PYTHON': `class Solution:\n    def solve(self):\n        # Write your code here\n        pass`,
    'JAVASCRIPT': `/**\n * @param {any} args\n * @return {void}\n */\nvar solve = function(args) {\n    // Write your code here\n};`
  }
  return templates[lang] || '// Write your code here'
}

const handleFileUpload = (event, templateIndex) => {
  const file = event.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    formData.value.templates[templateIndex].codeTemplate = e.target.result
  }
  reader.readAsText(file)
  event.target.value = ''
}

// Testcase Logic
const handleTestcaseFile = (event) => {
   const file = event.target.files[0]
   if (file) {
      if (!file.name.endsWith('.zip')) {
          ElMessage.error('Only .zip files are allowed')
          return
      }
      formData.value.testcasesFile = file
      ElMessage.success(`Selected: ${file.name}`)
   }
}

const handleTestcaseDrop = (event) => {
  const file = event.dataTransfer.files[0]
  if (file && (file.type === 'application/zip' || file.type === 'application/x-zip-compressed' || file.name.endsWith('.zip'))) {
     formData.value.testcasesFile = file
     ElMessage.success(`Selected: ${file.name}`)
  } else {
     ElMessage.error('Please upload a ZIP file')
  }
}

onBeforeUnmount(() => {
  problemStore.clearUploadedImages()
})
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
            
            <!-- TAB 1: GENERAL INFO (Title, Difficulty, Description) -->
            <el-tab-pane label="General Info" name="general">
               <div class="tab-content-wrapper full-width">
                  <div class="form-section mb-6">
                     <el-row :gutter="32">
                        <el-col :span="18">
                           <el-form-item label="Problem Title" prop="title">
                              <el-input 
                                 v-model="formData.title" 
                                 placeholder="e.g. Two Sum" 
                                 size="large"
                                 class="custom-input title-input"
                              />
                           </el-form-item>
                        </el-col>
                        <el-col :span="6">
                           <el-form-item label="Difficulty" prop="difficulty">
                              <el-select 
                                 v-model="formData.difficulty" 
                                 placeholder="Select difficulty" 
                                 size="large"
                                 class="custom-select w-full"
                                 :class="getDifficultyClass(formData.difficulty)"
                              >
                                 <el-option label="Easy" value="EASY" />
                                 <el-option label="Medium" value="MEDIUM" />
                                 <el-option label="Hard" value="HARD" />
                              </el-select>
                           </el-form-item>
                        </el-col>
                     </el-row>
                  </div>

                  <div class="form-section">
                      <el-form-item label="Description" prop="description">
                         <div class="quill-wrapper main-quill">
                            <QuillEditor 
                               v-model:content="formData.description" 
                               theme="snow" 
                               toolbar="full" 
                               contentType="html"
                               placeholder="Describe the problem statement here..."
                            />
                         </div>
                      </el-form-item>
                  </div>
               </div>
            </el-tab-pane>

            <!-- TAB 2: CONSTRAINTS (Limits, Constraints) -->
            <el-tab-pane label="Constraints" name="constraints">
               <div class="tab-content-wrapper full-width">
                   <div class="form-section mb-6">
                     <el-row :gutter="32">
                        <el-col :span="12">
                           <el-form-item label="Time Limit (ms)" prop="timeLimitMs">
                              <el-input-number 
                                 v-model="formData.timeLimitMs" 
                                 :min="100" 
                                 :step="100" 
                                 controls-position="right"
                                 class="custom-number-input w-full" 
                                 size="large"
                              />
                           </el-form-item>
                        </el-col>
                        <el-col :span="12">
                           <el-form-item label="Memory Limit (KB)" prop="memoryLimitKb">
                              <el-input-number 
                                 v-model="formData.memoryLimitKb" 
                                 :min="1024" 
                                 :step="1024" 
                                 controls-position="right"
                                 class="custom-number-input w-full" 
                                 size="large"
                              />
                           </el-form-item>
                        </el-col>
                     </el-row>
                   </div>
                   
                   <div class="form-section">
                      <el-form-item label="Constraints Details" prop="constraints">
                         <div class="quill-wrapper main-quill">
                            <QuillEditor 
                               v-model:content="formData.constraints" 
                               theme="snow" 
                               toolbar="essential" 
                               contentType="html"
                               placeholder="e.g. 1 <= n <= 100"
                            />
                         </div>
                      </el-form-item>
                   </div>
               </div>
            </el-tab-pane>
            
            <!-- TAB 3: EXAMPLES -->
            <el-tab-pane label="Examples" name="examples">
                <div class="tab-content-wrapper full-width">
                   <div class="examples-header-row mb-6">
                      <h3 class="section-title">Test Cases Examples</h3>
                      <AppButton variant="primary" :icon="Plus" @click="addExample">Add Example</AppButton>
                   </div>

                   <div v-if="formData.examples.length === 0" class="empty-state">
                      <span>No examples added yet. Click "Add Example" to creating one.</span>
                   </div>

                   <div class="examples-grid">
                      <div v-for="(example, index) in formData.examples" :key="index" class="example-card">
                         
                         <!-- Collapsible Header -->
                         <div class="card-header-row clickable-header" @click="toggleExample(index)">
                            <div class="header-left">
                                <component :is="example.expanded !== false ? ChevronDown : ChevronRight" :size="20" class="text-gray" />
                                <span class="card-badge">Example {{ index + 1 }}</span>
                            </div>
                            <AppButton variant="text" size="small" :icon="X" @click.stop="removeExample(index)" style="color: var(--error)">Remove</AppButton>
                         </div>
                         
                         <div v-show="example.expanded !== false" class="example-body">
                            <el-row :gutter="24">
                              <el-col :span="12">
                                <el-form-item label="Input">
                                  <div class="quill-wrapper small-quill">
                                    <QuillEditor 
                                      v-model:content="example.inputData" 
                                      contentType="text"
                                      theme="snow" 
                                      :toolbar="[['code-block'], ['clean']]"
                                      placeholder="Input data..." 
                                    />
                                  </div>
                                </el-form-item>
                              </el-col>
                              <el-col :span="12">
                                <el-form-item label="Output">
                                  <div class="quill-wrapper small-quill">
                                    <QuillEditor 
                                      v-model:content="example.outputData" 
                                      contentType="text"
                                      theme="snow" 
                                      :toolbar="[['code-block'], ['clean']]"
                                      placeholder="Expected output..." 
                                    />
                                  </div>
                                </el-form-item>
                              </el-col>
                            </el-row>
                            
                            <el-form-item label="Explanation (Optional)" class="mt-4">
                               <div class="quill-wrapper medium-quill">
                                  <QuillEditor 
                                     v-model:content="example.explanation" 
                                     contentType="html" 
                                     theme="snow" 
                                     :toolbar="['bold', 'italic', 'code-block', 'clean']"
                                     placeholder="Explain the logic..." 
                                  />
                               </div>
                            </el-form-item>
                         </div>
                      </div>
                   </div>
                </div>
            </el-tab-pane>

            <!-- TAB 4: CODE TEMPLATES -->
            <el-tab-pane label="Code Templates" name="templates">
               <div class="tab-content-wrapper full-width">
                  <div class="examples-header-row mb-6">
                     <h3 class="section-title">Code Templates</h3>
                     <AppButton variant="primary" :icon="Plus" @click="addTemplate">Add Template</AppButton>
                  </div>

                  <div v-if="formData.templates.length === 0" class="empty-state">
                     <span>Add code templates for supported languages.</span>
                  </div>

                  <div v-for="(template, index) in formData.templates" :key="index" class="template-card full-card">
                     <!-- Collapsible Header -->
                     <div class="card-header-row clickable-header" @click="toggleTemplate(index)">
                        <div class="template-header-left">
                           <component :is="template.expanded ? ChevronDown : ChevronRight" :size="20" class="text-gray" />
                           <el-select 
                              v-model="template.language" 
                              size="default" 
                              style="width: 200px" 
                              class="custom-select"
                              @click.stop
                           >
                              <el-option 
                                v-for="l in getAvailableLanguages(template.language)" 
                                :key="l.value" 
                                :label="l.label" 
                                :value="l.value" 
                              />
                           </el-select>
                           
                           <div class="file-upload-trigger" @click.stop>
                              <input 
                                 type="file" 
                                 :id="`file-upload-${index}`" 
                                 class="hidden-input" 
                                 accept=".java,.cpp,.py,.go,.js,.ts"
                                 @change="(e) => handleFileUpload(e, index)"
                              >
                              <label :for="`file-upload-${index}`" class="upload-label">
                                 <Upload :size="16" />
                                 <span>Upload Code File</span>
                              </label>
                           </div>
                        </div>
                        <AppButton variant="text" size="small" :icon="X" @click.stop="removeTemplate(index)" style="color: var(--error)">Remove</AppButton>
                     </div>
                     
                     <div v-show="template.expanded" class="template-body">
                        <el-form-item class="no-label-item">
                           <CodeEditor 
                             v-model="template.codeTemplate" 
                             :language="template.language.toLowerCase()" 
                             height="500px" 
                           />
                        </el-form-item>
                     </div>
                  </div>
               </div>
            </el-tab-pane>


            <!-- TAB 5: TEST CASES -->
            <el-tab-pane label="Test Cases" name="testcases">
              <div class="tab-content-wrapper full-width centered-content">
                 <div class="testcase-upload-area wide-area">
                    <div class="upload-zone" @click="testcaseFileRef?.click()" @drop.prevent="handleTestcaseDrop" @dragover.prevent>
                       <input 
                          type="file" 
                          ref="testcaseFileRef"
                          class="hidden-input"
                          accept=".zip"
                          @change="handleTestcaseFile"
                       >
                       <div class="upload-content" v-if="!formData.testcasesFile">
                          <div class="upload-icon-circle large-icon">
                             <UploadCloud :size="48" />
                          </div>
                          <h3>Upload Testcases Archive</h3>
                          <p class="upload-hint">Drag & drop your .zip file here, or click to browse</p>
                          <p class="upload-specs">Supported format: .zip (containing input/output files)</p>
                       </div>
                       <div class="upload-content file-selected" v-else>
                          <div class="file-icon">
                             <FileArchive :size="48" class="text-primary" />
                          </div>
                          <div class="file-info">
                             <span class="file-name large-text">{{ formData.testcasesFile.name }}</span>
                             <span class="file-size">{{ (formData.testcasesFile.size / 1024).toFixed(2) }} KB</span>
                          </div>
                          <AppButton variant="text" size="medium" @click.stop="formData.testcasesFile = null" class="remove-file-btn">
                             Remove File
                          </AppButton>
                       </div>
                    </div>
                 </div>
              </div>
            </el-tab-pane>

         </el-tabs>
      </div>
    </el-form>
  </div>
</template>

<style scoped>
/* Global Layout Fix */
.create-problem-container {
  height: calc(100vh - 64px); /* Fixed: Account for Navbar height */
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: #141414;
  color: #e0e0e0;
}

/* Form needs to be Flex too to pass height down */
.problem-form {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* Page Header */
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

/* Tabs */
.tabs-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Constrain children */
  padding: 0 24px 24px;
  background-color: #141414;
}

/* Make Tabs Flex & Scroll Content Only */
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
  font-size: 15px; /* Slightly larger */
  height: 52px;
  line-height: 52px;
  font-weight: 500;
}

:deep(.ql-editor.ql-blank::before) {
  color: #a0a0a0; /* Fixed: Lighter color for visibility */
  font-style: normal;
  left: 16px;
}

:deep(.el-tabs__active-bar) {
  background-color: #ffa116;
  height: 3px;
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow-y: auto; /* FIXED: Scroll ONLY this part */
  padding-right: 12px; /* Prevent scrollbar covering content */
  padding-bottom: 24px;
}

/* CONTENT WRAPPERS - FULL WIDTH */
.tab-content-wrapper {
  margin: 0;
}
.tab-content-wrapper.full-width {
  width: 100%;
  max-width: none; /* UNLIMITED WIDTH */
}

/* FORM SECTIONS */
.form-section {
  background: #1f1f1f;
  padding: 24px; /* Reduced from 32px */
  border-radius: 12px;
  border: 1px solid #333;
}

/* LABELS */
:deep(.el-form-item__label) {
   color: #ffffff !important;
   font-weight: 600; 
   font-size: 13px; /* Slightly smaller */
   opacity: 1 !important;
   margin-bottom: 8px;
   line-height: 1.4;
   text-transform: uppercase;
   letter-spacing: 0.5px;
   letter-spacing: 0.5px;
}

/* ERROR MESSAGE PADDING */
:deep(.el-form-item__error) {
  padding-top: 8px; /* Fixed: Add spacing for error msg */
  font-weight: 500;
}

/* INPUTS & SELECTS */
.custom-input :deep(.el-input__wrapper),
.custom-select :deep(.el-select__wrapper),
.custom-number-input :deep(.el-input__wrapper) {
  background-color: #2b2b2b;
  box-shadow: none !important;
  border: 1px solid #444;
  padding: 2px 12px; /* Compact padding */
}

.title-input :deep(.el-input__inner) { font-size: 16px; font-weight: 600; }

.custom-input :deep(.el-input__inner::placeholder) { color: #666; }

/* NUMBER INPUTS */
.custom-number-input :deep(.el-input-number__decrease),
.custom-number-input :deep(.el-input-number__increase) {
  background-color: #333;
  color: #fff;
  border-left: 1px solid #444;
  border-right: none;
}
.custom-number-input :deep(.el-input-number__increase) { border-left: none; border-bottom: 1px solid #444; }
.custom-number-input :deep(.el-input-number__decrease) { border-top: 1px solid #444; }
.custom-number-input :deep(.el-input-number__decrease:hover),
.custom-number-input :deep(.el-input-number__increase:hover) { color: #ffa116; background-color: #404040; }

/* DIFFICULTY COLORS - BRIGHTER & OVERRIDE */
.difficulty-easy :deep(.el-input__inner) { 
  color: #00e6cb !important; /* Brighter Teal */
  -webkit-text-fill-color: #00e6cb !important;
}
.difficulty-medium :deep(.el-input__inner) { 
  color: #ffcc00 !important; /* Brighter Yellow */
  -webkit-text-fill-color: #ffcc00 !important;
}
.difficulty-hard :deep(.el-input__inner) { 
  color: #ff5e5e !important; /* Brighter Red */
  -webkit-text-fill-color: #ff5e5e !important;
}

/* QUILL EDITORS */
.quill-wrapper {
  background: #2b2b2b;
  border: 1px solid #444;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100% !important; /* FIXED: Force full width */
}

/* Ensure Form Item Content expands */
:deep(.el-form-item__content) {
  width: 100%;
}

.main-quill { height: 400px; }
.medium-quill { height: 250px; }
.small-quill { height: 140px; }

:deep(.ql-toolbar) {
  background: #202020;
  border: none !important;
  border-bottom: 1px solid #444 !important;
  padding: 8px 12px;
}
:deep(.ql-toolbar button) { color: #aaa; }
:deep(.ql-toolbar button:hover), :deep(.ql-toolbar button.ql-active) { color: #ffa116; }
:deep(.ql-toolbar .ql-stroke) { stroke: #aaa; }
:deep(.ql-toolbar .ql-fill) { fill: #aaa; }
:deep(.ql-toolbar button:hover .ql-stroke), :deep(.ql-toolbar button.ql-active .ql-stroke) { stroke: #ffa116; }
:deep(.ql-toolbar button:hover .ql-fill), :deep(.ql-toolbar button.ql-active .ql-fill) { fill: #ffa116; }

:deep(.ql-container) {
  border: none !important;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px; /* Slightly smaller text */
  color: #e0e0e0;
  flex: 1; 
  overflow: hidden; 
  background: #2b2b2b;
}
:deep(.ql-editor) {
  color: #e0e0e0;
  height: 100%;
  overflow-y: auto;
  padding: 16px; /* Reduced from 20px */
}

/* EXAMPLE CARDS */
.examples-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.section-title { font-size: 18px; font-weight: 600; color: #fff; margin: 0; }

.example-card, .template-card {
  background: #1f1f1f;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #333;
  padding-bottom: 12px;
}
.card-badge { 
  font-weight: 700; color: #1f1f1f; font-size: 12px; text-transform: uppercase; 
}
/* Badge Redesign - Minimal Text */
.card-badge {
  color: #ffa116;
  font-weight: 700;
  font-size: 15px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  /* Removed heavy background pills */
}


/* TEMPLATES */
/* TEMPLATES */
.template-header-left { display: flex; align-items: center; gap: 12px; }

.header-left {
  display: flex;
  align-items: center;
  gap: 12px; /* Fix "dính vào nhau" */
}

/* Collapsible Header Redesign - Cleaner */
.clickable-header {
  cursor: pointer;
  background-color: #2b2b2b; /* Slightly lighter than bg */
  border: 1px solid #3d3d3d;
  padding: 14px 20px;
  border-radius: 8px; /* Fully rounded when collapsed */
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.clickable-header:hover {
  background-color: #323232;
  border-color: #555;
}

/* When Expanded: visually connect to body */
.template-card:has(.template-body[style*="display: block"]), 
.example-card:has(.example-body[style*="display: block"]) .clickable-header,
.template-card:has(.template-body:not([style*="display: none"])) .clickable-header,
/* Fallback */
.clickable-header.is-expanded {
   border-bottom-left-radius: 0;
   border-bottom-right-radius: 0;
   border-bottom-color: transparent; /* Merge with body */
   background-color: #2b2b2b;
}

/* Body Styling */
.example-body, .template-body {
  padding: 24px;
  border: 1px solid #3d3d3d;
  border-top: none;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  background: #1f1f1f; /* Darker body */
  margin-top: 0; 
}

.text-gray { color: #888; transition: color 0.2s; }
.clickable-header:hover .text-gray { color: #fff; }

/* Use absolute positioning to hide input but keep it functional */
.file-upload-trigger { position: relative; display: flex; align-items: center; }
.hidden-input { 
  position: absolute; 
  width: 0.1px; 
  height: 0.1px; 
  opacity: 0; 
  overflow: hidden; 
  z-index: -1;
}
.upload-label { 
  display: flex; align-items: center; gap: 8px; cursor: pointer; color: #a0a0a0; font-size: 14px; transition: color 0.2s; 
}
.upload-label:hover { color: #fff; }

/* TESTCASES AREA */
.centered-content { display: flex; justify-content: center; }
.wide-area { width: 100%; max-width: 800px; /* Only constrain testcase upload */ }

.upload-zone {
  border: 3px dashed #444;
  border-radius: 16px;
  padding: 80px 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #1f1f1f;
  width: 100%;
  /* Flex Center Fix */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.upload-zone:hover { border-color: #ffa116; background: #262626; }
.upload-icon-circle { 
  width: 64px; height: 64px; background: #2b2b2b; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: #a0a0a0; 
}
.upload-icon-circle.large-icon { width: 96px; height: 96px; margin-bottom: 24px; }
.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.upload-content h3 { font-size: 20px; margin: 0 0 12px; color: #fff; }
.upload-hint { color: #888; margin: 0 0 8px; font-size: 16px; }

.file-name.large-text { font-size: 18px; margin-top: 16px; }

/* UTILS */
.w-full { width: 100%; }
.mt-4 { margin-top: 16px; }
.mt-6 { margin-top: 24px; }
.mb-4 { margin-bottom: 16px; }
.mb-6 { margin-bottom: 24px; }
.empty-state { 
  text-align: center; color: #888; padding: 60px; 
  background: #1a1a1a; 
  border-radius: 12px; border: 2px dashed #333; 
  font-size: 16px;
}
.small-empty { padding: 24px; font-size: 13px; }
</style>
