<script setup>
import { ref, onBeforeUnmount, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import { ArrowLeft, Plus, X, Upload, FileCode, AlertCircle } from 'lucide-vue-next'
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
    { inputData: '', outputData: '', explanation: '', orderIndex: 0 }
  ],
  templates: []
})

const activeNames = ref(['1', '2', '3', '4', '5', '6']) // Open all by default

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

// Validation Rules
const rules = reactive({
  title: [{ required: true, message: 'Title is required', trigger: 'blur' }],
  difficulty: [{ required: true, message: 'Difficulty is required', trigger: 'change' }],
  description: [{ required: true, message: 'Description is required', trigger: 'blur' }],
  constraints: [{ required: true, message: 'Constraints are required', trigger: 'blur' }]
})

const formRef = ref(null)

// Quill editor refs
const descriptionEditorRef = ref(null)
const constraintsEditorRef = ref(null)

// Quill editor options
const createEditorOptions = (placeholder) => ({
  theme: 'snow',
  modules: {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ 'header': 1 }, { 'header': 2 }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'color': [] }, { 'background': [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: createQuillImageHandler(
          (file) => problemStore.uploadImage(file),
          (imageData) => problemStore.trackUploadedImage(imageData)
        )
      }
    }
  },
  placeholder: placeholder || 'Enter content...'
})

const descriptionEditorOptions = ref(createEditorOptions('Describe the problem statement...'))
const constraintsEditorOptions = ref(createEditorOptions('Enter constraints (e.g. 1 <= n <= 10^5)...'))

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid, fields) => {
    if (valid) {
      // Custom validation for Arrays
      if (formData.value.examples.length === 0) {
        ElMessage.warning('Please add at least one example')
        return
      }
      if (formData.value.templates.length === 0) {
        ElMessage.warning('Please add at least one code template')
        return
      }

      try {
        await problemStore.createProblem(formData.value)
        router.push('/dashboard')
      } catch (error) {
        console.error('Failed to create problem:', error)
      }
    } else {
      ElMessage.error('Please check all required fields')
      // Auto expand to errors could go here
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
    orderIndex: formData.value.examples.length
  })
  if (!activeNames.value.includes('4')) activeNames.value.push('4')
}

const removeExample = (index) => {
  formData.value.examples.splice(index, 1)
  formData.value.examples.forEach((ex, idx) => ex.orderIndex = idx)
}

// Template Logic
const addTemplate = () => {
  // Find first unselected language
  const usedLangs = formData.value.templates.map(t => t.language)
  const availableLang = languageOptions.find(opt => !usedLangs.includes(opt.value))
  
  if (!availableLang) {
    ElMessage.warning('All supported languages have been added')
    return
  }

  formData.value.templates.push({
    language: availableLang.value,
    codeTemplate: getDefaultTemplate(availableLang.value)
  })
  if (!activeNames.value.includes('5')) activeNames.value.push('5')
}

const removeTemplate = (index) => {
  formData.value.templates.splice(index, 1)
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
  // Reset input
  event.target.value = ''
}

// Testcase Logic
const handleTestcaseUpload = (event) => {
   const file = event.target.files[0]
   if (file) {
      formData.value.testcasesFile = file
      ElMessage.success(`Selected file: ${file.name}`)
   }
}

const handleTestcaseDrop = (event) => {
  event.preventDefault()
  const file = event.dataTransfer.files[0]
  if (file && (file.type === 'application/zip' || file.type === 'application/x-zip-compressed' || file.name.endsWith('.zip'))) {
     formData.value.testcasesFile = file
     ElMessage.success(`Selected file: ${file.name}`)
  } else {
     ElMessage.error('Please upload a ZIP file')
  }
}

const removeTestcaseFile = () => {
   formData.value.testcasesFile = null
}

const generateSlug = () => {
  if (formData.value.title) {
    formData.value.slug = formData.value.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
}

onBeforeUnmount(() => {
  problemStore.clearUploadedImages()
})
</script>

<template>
  <div class="page-container">
    <!-- Header -->
    <div class="page-header">
      <AppButton variant="text" @click="handleCancel" class="back-button" :icon="ArrowLeft">
        Back to Dashboard
      </AppButton>
      <div class="header-content">
        <div>
          <h1 class="page-title">Create Problem</h1>
          <p class="page-subtitle">Design a new challenge for the community</p>
        </div>
        <div class="header-actions">
           <AppButton variant="secondary" @click="handleCancel">Cancel</AppButton>
           <AppButton variant="primary" @click="handleSubmit" :loading="problemStore.loading">
             Create Problem
           </AppButton>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="form-container">
      <el-form 
         ref="formRef"
         :model="formData" 
         :rules="rules"
         label-position="top" 
         class="problem-form"
         hide-required-asterisk
      >
        
        <el-collapse v-model="activeNames" class="custom-collapse">
          
          <!-- Basic Info -->
          <el-collapse-item name="1">
            <template #title>
               <div class="collapse-header">
                 <span class="step-num">1</span>
                 <span class="header-title">Basic Information</span>
               </div>
            </template>
            <div class="section-content">
              <el-row :gutter="24">
                <el-col :span="16">
                  <el-form-item label="Problem Title" prop="title">
                    <el-input 
                      v-model="formData.title" 
                      placeholder="e.g. Two Sum"
                      size="large"
                      @blur="generateSlug"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="Difficulty" prop="difficulty">
                    <el-select 
                      v-model="formData.difficulty" 
                      size="large" 
                      style="width: 100%"
                      class="custom-select"
                    >
                      <el-option
                        v-for="opt in difficultyOptions"
                        :key="opt.value"
                        :label="opt.label"
                        :value="opt.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <!-- Hidden Slug -->
            </div>
          </el-collapse-item>

          <!-- Description -->
          <el-collapse-item name="2">
             <template #title>
               <div class="collapse-header">
                 <span class="step-num">2</span>
                 <span class="header-title">Description</span>
               </div>
            </template>
            <div class="section-content">
               <el-form-item prop="description" class="no-label-item">
                 <div class="quill-wrapper">
                    <QuillEditor
                      ref="descriptionEditorRef"
                      v-model:content="formData.description"
                      :options="descriptionEditorOptions"
                      content-type="html"
                    />
                 </div>
               </el-form-item>
            </div>
          </el-collapse-item>

          <!-- Constraints -->
          <el-collapse-item name="3">
            <template #title>
               <div class="collapse-header">
                 <span class="step-num">3</span>
                 <span class="header-title">Constraints & Limits</span>
               </div>
            </template>
            <div class="section-content">
               <el-form-item prop="constraints" class="no-label-item">
                 <div class="quill-wrapper small-quill">
                    <QuillEditor
                      ref="constraintsEditorRef"
                      v-model:content="formData.constraints"
                      :options="constraintsEditorOptions"
                      content-type="html"
                    />
                 </div>
               </el-form-item>
               
               <el-divider />

               <el-row :gutter="24">
                 <el-col :span="12">
                   <el-form-item label="Time Limit (ms)">
                     <el-input-number v-model="formData.timeLimitMs" :min="100" :step="100" size="large" style="width: 100%" />
                   </el-form-item>
                 </el-col>
                 <el-col :span="12">
                   <el-form-item label="Memory Limit (KB)">
                     <el-input-number v-model="formData.memoryLimitKb" :min="64" :step="64" size="large" style="width: 100%" />
                   </el-form-item>
                 </el-col>
               </el-row>
            </div>
          </el-collapse-item>

          <!-- Examples -->
          <el-collapse-item name="4">
            <template #title>
               <div class="collapse-header">
                 <span class="step-num">4</span>
                 <span class="header-title">Examples</span>
               </div>
            </template>
            <div class="section-content">
               <div v-for="(example, index) in formData.examples" :key="index" class="example-card">
                  <div class="card-header-row">
                     <span class="card-label">Example {{ index + 1 }}</span>
                     <AppButton variant="text" size="small" :icon="X" @click="removeExample(index)" style="color: var(--error)">Remove</AppButton>
                  </div>
                  
                  <el-row :gutter="24">
                    <el-col :span="12">
                      <el-form-item label="Input">
                        <div class="quill-wrapper mini-quill">
                           <QuillEditor 
                              v-model:content="example.inputData" 
                              content-type="text"
                              theme="snow"
                              :toolbar="[['code-block'], ['clean']]"
                              placeholder="Enter input data..."
                           />
                        </div>
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                       <el-form-item label="Output">
                        <div class="quill-wrapper mini-quill">
                           <QuillEditor 
                              v-model:content="example.outputData" 
                              content-type="text"
                              theme="snow"
                              :toolbar="[['code-block'], ['clean']]"
                              placeholder="Enter expected output..."
                           />
                        </div>
                      </el-form-item>
                    </el-col>
                  </el-row>
                  
                  <el-form-item label="Explanation (Optional)">
                     <div class="quill-wrapper mini-quill">
                        <QuillEditor
                          v-model:content="example.explanation"
                          theme="snow"
                          content-type="html"
                          :toolbar="[['bold', 'italic', 'code-block'], ['link', 'image'], ['clean']]"
                          placeholder="Explain this test case..."
                        />
                     </div>
                  </el-form-item>
               </div>

               <AppButton variant="primary" type="button" :icon="Plus" class="w-full" @click="addExample">
                 Add Example
               </AppButton>
            </div>
          </el-collapse-item>

          <!-- Templates -->
          <el-collapse-item name="5">
            <template #title>
               <div class="collapse-header">
                 <span class="step-num">5</span>
                 <span class="header-title">Code Templates</span>
               </div>
            </template>
             <div class="section-content">
               <div v-for="(template, index) in formData.templates" :key="index" class="template-card">
                  <div class="card-header-row">
                     <div class="template-header-left">
                        <el-select v-model="template.language" size="default" style="width: 160px" class="custom-select">
                           <el-option 
                             v-for="l in getAvailableLanguages(template.language)" 
                             :key="l.value" 
                             :label="l.label" 
                             :value="l.value" 
                           />
                        </el-select>
                        
                        <div class="file-upload-trigger">
                           <input 
                              type="file" 
                              :id="`file-upload-${index}`" 
                              class="hidden-input" 
                              accept=".java,.cpp,.py,.go,.js,.ts"
                              @change="(e) => handleFileUpload(e, index)"
                           >
                           <label :for="`file-upload-${index}`" class="upload-label">
                              <Upload :size="14" />
                              <span>Upload Code</span>
                           </label>
                        </div>
                     </div>
                     <AppButton variant="text" size="small" :icon="X" @click="removeTemplate(index)" style="color: var(--error)">Remove</AppButton>
                  </div>
                  
                  <el-form-item class="no-label-item">
                     <CodeEditor 
                       v-model="template.codeTemplate" 
                       :language="template.language.toLowerCase()" 
                       height="400px" 
                     />
                  </el-form-item>
               </div>

               <AppButton variant="primary" type="button" :icon="Plus" class="w-full" @click="addTemplate">
                 Add Template
               </AppButton>
            </div>
          </el-collapse-item>
          
          <!-- Testcases (UI ONLY) -->
          <el-collapse-item name="6">
            <template #title>
               <div class="collapse-header">
                 <span class="step-num">6</span>
                 <span class="header-title">Testcases (Beta)</span>
               </div>
            </template>
            <div class="section-content">
               <div 
                  class="upload-zone" 
                  @dragover.prevent 
                  @drop="handleTestcaseDrop"
                  :class="{ 'has-file': formData.testcasesFile }"
               >
                  <div v-if="!formData.testcasesFile" class="upload-placeholder">
                     <div class="icon-circle">
                        <Upload :size="24" />
                     </div>
                     <div class="upload-text">
                        <p class="primary-text">Drag & Drop ZIP file here</p>
                        <p class="secondary-text">or <span class="click-text">browse</span> to upload</p>
                     </div>
                     <input type="file" class="hidden-input-full" accept=".zip" @change="handleTestcaseUpload">
                  </div>
                  
                  <div v-else class="file-preview">
                     <div class="file-icon">
                        <FileCode :size="32" color="var(--accent-primary)" />
                     </div>
                     <div class="file-info">
                        <span class="file-name">{{ formData.testcasesFile.name }}</span>
                        <span class="file-size">{{ (formData.testcasesFile.size / 1024).toFixed(2) }} KB</span>
                     </div>
                     <AppButton variant="text" size="small" :icon="X" @click="removeTestcaseFile" />
                  </div>
               </div>
               
               <div class="upload-info">
                  <AlertCircle :size="16" />
                  <span>Upload a ZIP file containing inputs and outputs organized in folders or naming convention.</span>
               </div>
            </div>
          </el-collapse-item>

        </el-collapse>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 24px;
}

.page-header {
  max-width: 1200px;
  margin: 0 auto 32px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: 16px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: 4px;
}
.header-actions {
  display: flex;
  gap: 12px;
}

.back-button {
  color: var(--text-secondary);
  padding: 0;
  height: auto;
  font-weight: 500;
  font-size: 14px;
}
.back-button:hover {
  color: var(--text-primary);
}

.form-container {
  max-width: 1200px;
  margin: 0 auto 100px;
}

/* Custom Collapse Style */
.custom-collapse {
  border: none;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

:deep(.el-collapse-item__header) {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: 0 24px;
  height: 64px;
  transition: all 0.2s;
}

:deep(.el-collapse-item__header.is-active) {
  border-bottom-color: transparent;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  background: var(--bg-secondary);
}

:deep(.el-collapse-item__wrap) {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-top: none;
  border-bottom-left-radius: var(--radius-lg);
  border-bottom-right-radius: var(--radius-lg);
  overflow: visible; 
}

:deep(.el-collapse-item__content) {
  padding: 24px;
  padding-top: 0;
  color: var(--text-primary);
}

.collapse-header {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.step-num {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid var(--border-primary);
  transition: all 0.2s;
}

:deep(.el-collapse-item.is-active) .step-num {
  background: var(--accent-primary);
  color: #000;
  border-color: var(--accent-primary);
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

/* Quill Fix */
.quill-wrapper {
   background: var(--bg-primary);
   border: 1px solid var(--border-primary);
   border-radius: var(--radius-md);
   overflow: hidden;
   width: 100%; /* Force full width */
   display: flex;
   flex-direction: column;
}

:deep(.ql-toolbar) {
  background: var(--bg-tertiary);
  border: none !important;
  border-bottom: 1px solid var(--border-primary) !important;
  width: 100%;
  box-sizing: border-box; /* Ensure padding doesn't increase width */
}

:deep(.ql-container) {
  border: none !important;
  font-family: inherit;
  font-size: 14px;
  min-height: 300px;
  width: 100%;
}
.small-quill :deep(.ql-container) {
  min-height: 150px;
}
.mini-quill :deep(.ql-container) {
  min-height: 120px;
}

:deep(.ql-editor) {
  min-height: 100%;
  color: var(--text-primary);
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
}

/* Ensure Form Items take full width */
:deep(.el-form-item__content) {
  width: 100%;
  flex: 1; /* Allow flex expansion */
}

/* Example & Template Cards */
.example-card, .template-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: 20px;
  margin-bottom: 20px;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-label {
  font-weight: 600;
  color: var(--accent-primary);
  font-size: 14px;
}

.template-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* File Upload Button */
.file-upload-trigger {
  position: relative;
}
.hidden-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}
.upload-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 4px;
  background: rgba(255,255,255,0.05);
  transition: all 0.2s;
}
.upload-label:hover {
  background: rgba(255,255,255,0.1);
  color: var(--text-primary);
}

/* Upload Zone for Testcases */
.upload-zone {
  border: 2px dashed var(--border-primary);
  border-radius: var(--radius-lg);
  background: rgba(255,255,255,0.02);
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.2s;
}
.upload-zone:hover, .upload-zone.has-file {
  border-color: var(--accent-primary);
  background: rgba(255, 161, 22, 0.05);
}

.upload-placeholder {
  text-align: center;
  pointer-events: none; /* Let input handle clicks */
}
.hidden-input-full {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.icon-circle {
  width: 48px;
  height: 48px;
  background: var(--bg-elevated);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  color: var(--accent-primary);
}

.upload-text p {
  margin: 0;
}
.primary-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}
.secondary-text {
  font-size: 13px;
  color: var(--text-tertiary);
}
.click-text {
  color: var(--accent-primary);
  text-decoration: underline;
}

.file-preview {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border: 1px solid var(--accent-primary);
  z-index: 10;
}
.file-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 161, 22, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.file-info {
  display: flex;
  flex-direction: column;
}
.file-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}
.file-size {
  font-size: 12px;
  color: var(--text-secondary);
}

.upload-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  color: var(--text-tertiary);
  font-size: 13px;
}

/* Quill Placeholder Visibility */
:deep(.ql-editor.ql-blank::before) {
  color: var(--text-secondary) !important;
  font-style: normal;
}

/* Validation Error Messages */
:deep(.el-form-item__error) {
  font-size: 14px;
  padding-top: 8px;
  font-weight: 500;
  position: relative;
  top: auto;
  left: auto;
  margin-bottom: 4px;
}

/* Input Overrides */
:deep(.el-input__wrapper), :deep(.el-textarea__inner) {
  background-color: var(--bg-primary);
  box-shadow: 0 0 0 1px var(--border-primary) inset;
  color: var(--text-primary);
}
:deep(.el-input__wrapper.is-focus), :deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px var(--accent-primary) inset !important;
}

/* Select Fix for Dark Theme */
:deep(.el-select) {
  --el-fill-color-blank: var(--bg-primary);
  --el-border-color: var(--border-primary);
  --el-border-color-hover: var(--accent-primary);
  --el-text-color-regular: var(--text-primary);
}

:deep(.el-select .el-input__wrapper) {
  background-color: var(--bg-primary) !important;
  box-shadow: 0 0 0 1px var(--border-primary) inset !important;
}

:deep(.el-select .el-input__inner) {
  color: var(--text-primary) !important;
  -webkit-text-fill-color: var(--text-primary) !important;
}

:deep(.el-select:hover .el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--accent-primary) inset !important;
  background-color: var(--bg-primary) !important;
}

:deep(.el-select .el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--accent-primary) inset !important;
  background-color: var(--bg-primary) !important;
}

/* Input Number dark buttons */
:deep(.el-input-number__decrease), :deep(.el-input-number__increase) {
  background: var(--bg-tertiary);
  border-color: var(--border-primary);
  color: var(--text-primary);
}
:deep(.el-input-number__decrease:hover), :deep(.el-input-number__increase:hover) {
  color: var(--accent-primary);
}

:deep(.el-form-item__label) {
  color: var(--text-secondary);
}
.w-full {
  width: 100%;
}
.no-label-item {
  margin-bottom: 0;
}
</style>
