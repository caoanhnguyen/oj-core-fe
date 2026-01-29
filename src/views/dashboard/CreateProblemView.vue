<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import { ArrowLeft, Plus, X, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { useProblemStore } from '../../stores/problem'
import { createQuillImageHandler } from '../../utils/quillImageUpload'
import CodeEditor from '@/components/common/CodeEditor.vue'
import AppButton from '@/components/common/AppButton.vue'

const router = useRouter()
const problemStore = useProblemStore()

// Form Data
const formData = ref({
  title: '',
  slug: '',
  difficulty: 'EASY',
// ... (rest of script remains similar, I will replace the Button usage in template)
  description: '',
  constraints: '',
  timeLimitMs: 1000,
  memoryLimitKb: 256,
  examples: [
    { inputData: '', outputData: '', explanation: '', orderIndex: 0 }
  ],
  templates: []
})

const activeNames = ref(['1', '2', '3', '4', '5']) // Open all by default

const difficultyOptions = [
  { label: 'Easy', value: 'EASY' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Hard', value: 'HARD' }
]

const languageOptions = [
  { label: 'Java', value: 'JAVA' },
  { label: 'C++', value: 'CPP' },
  { label: 'Python', value: 'PYTHON' },
  { label: 'Go', value: 'GO' },
  { label: 'JavaScript', value: 'JAVASCRIPT' }
]

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
  try {
    if (!formData.value.title || !formData.value.slug || !formData.value.description) {
       // Basic validation
       // In real app use ElForm validation
       return
    }
    await problemStore.createProblem(formData.value)
    router.push('/dashboard')
  } catch (error) {
    console.error('Failed to create problem:', error)
  }
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
  // Auto open the examples section if it's not open
  if (!activeNames.value.includes('4')) activeNames.value.push('4')
}

const removeExample = (index) => {
  formData.value.examples.splice(index, 1)
  formData.value.examples.forEach((ex, idx) => ex.orderIndex = idx)
}

// Template Logic
const addTemplate = () => {
  formData.value.templates.push({
    language: 'JAVA',
    codeTemplate: '',
    driverCode: ''
  })
  if (!activeNames.value.includes('5')) activeNames.value.push('5')
}

const removeTemplate = (index) => {
  formData.value.templates.splice(index, 1)
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
        Back
      </AppButton>
      <div class="header-content">
        <div>
          <h1 class="page-title">Create Problem</h1>
          <p class="page-subtitle">Add a new challenge to the repository</p>
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
      <el-form :model="formData" label-position="top" class="problem-form">
        
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
                  <el-form-item label="Problem Title" required>
                    <el-input 
                      v-model="formData.title" 
                      placeholder="e.g. Two Sum"
                      size="large"
                      @blur="generateSlug"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="Difficulty" required>
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
              <!-- Slug is now auto-generated and hidden -->
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
               <div class="quill-wrapper">
                  <QuillEditor
                    ref="descriptionEditorRef"
                    v-model:content="formData.description"
                    :options="descriptionEditorOptions"
                    content-type="html"
                  />
               </div>
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
               <div class="quill-wrapper small-quill">
                  <QuillEditor
                    ref="constraintsEditorRef"
                    v-model:content="formData.constraints"
                    :options="constraintsEditorOptions"
                    content-type="html"
                  />
               </div>
               
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
                        <CodeEditor 
                           v-model="example.inputData" 
                           language="plaintext" 
                           height="120px" 
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                       <el-form-item label="Output">
                        <CodeEditor 
                           v-model="example.outputData" 
                           language="plaintext" 
                           height="120px" 
                        />
                      </el-form-item>
                    </el-col>
                  </el-row>
                  
                  <el-form-item label="Explanation (Optional)">
                     <el-input v-model="example.explanation" type="textarea" :rows="2" />
                  </el-form-item>
               </div>

               <AppButton variant="primary" :icon="Plus" class="w-full" @click="addExample">
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
                     <div class="bg-gray">
                        <el-select v-model="template.language" size="small" style="width: 140px" class="custom-select">
                           <el-option v-for="l in languageOptions" :key="l.value" :label="l.label" :value="l.value" />
                        </el-select>
                     </div>
                     <AppButton variant="text" size="small" :icon="X" @click="removeTemplate(index)" style="color: var(--error)">Remove</AppButton>
                  </div>
                  
                  <el-form-item label="Starter Code">
                     <!-- Map template language to monaco language -->
                     <CodeEditor 
                       v-model="template.codeTemplate" 
                       :language="template.language.toLowerCase()" 
                       height="250px" 
                     />
                  </el-form-item>
                  
                  <el-form-item label="Driver Code (Hidden from user)">
                     <CodeEditor 
                       v-model="template.driverCode" 
                       :language="template.language.toLowerCase()" 
                       height="200px" 
                     />
                  </el-form-item>
               </div>

               <AppButton variant="primary" :icon="Plus" class="w-full" @click="addTemplate">
                 Add Template
               </AppButton>
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
  max-width: 900px;
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
}
.back-button:hover {
  color: var(--text-primary);
}

.form-container {
  max-width: 900px;
  margin: 0 auto 100px;
}

/* Custom Collapse Style */
.custom-collapse {
  border: none;
  display: flex;
  flex-direction: column;
  gap: 16px;
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
}

:deep(.el-collapse-item__wrap) {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-top: none;
  border-bottom-left-radius: var(--radius-lg);
  border-bottom-right-radius: var(--radius-lg);
  overflow: visible; /* Important for Select dropdowns */
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
}

:deep(.ql-toolbar) {
  background: var(--bg-tertiary);
  border: none !important;
  border-bottom: 1px solid var(--border-primary) !important;
}

:deep(.ql-container) {
  border: none !important;
  font-family: inherit;
  font-size: 14px;
  min-height: 300px;
}
.small-quill :deep(.ql-container) {
  min-height: 150px;
}

:deep(.ql-editor) {
  min-height: 100%;
  color: var(--text-primary);
  padding: 16px;
}
:deep(.ql-editor.ql-blank::before) {
  color: var(--text-tertiary);
  font-style: normal;
}

/* Example & Template Cards */
.example-card, .template-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 16px;
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
</style>
