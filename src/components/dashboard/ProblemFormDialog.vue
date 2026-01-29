<script setup>
import { ref, watch } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const dialogVisible = ref(props.modelValue)

const formData = ref({
  title: '',
  slug: '',
  difficulty: 'Easy',
  description: '',
  inputFormat: '',
  outputFormat: '',
  constraints: '',
  timeLimit: 1000,
  memoryLimit: 256,
  tags: [],
  examples: [
    { input: '', output: '', explanation: '' }
  ]
})

const tagInput = ref('')

const difficultyOptions = [
  { label: 'Easy', value: 'Easy' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Hard', value: 'Hard' }
]

// Quill editor options
const editorOptions = {
  theme: 'snow',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['clean'],
      ['link', 'image']
    ]
  },
  placeholder: 'Enter problem description...'
}

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
})

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
  if (!val) {
    resetForm()
  }
})

const handleClose = () => {
  dialogVisible.value = false
}

const handleSubmit = () => {
  emit('submit', formData.value)
  dialogVisible.value = false
}

const resetForm = () => {
  formData.value = {
    title: '',
    slug: '',
    difficulty: 'Easy',
    description: '',
    inputFormat: '',
    outputFormat: '',
    constraints: '',
    timeLimit: 1000,
    memoryLimit: 256,
    tags: [],
    examples: [
      { input: '', output: '', explanation: '' }
    ]
  }
  tagInput.value = ''
}

const addExample = () => {
  formData.value.examples.push({ input: '', output: '', explanation: '' })
}

const removeExample = (index) => {
  formData.value.examples.splice(index, 1)
}

const handleAddTag = () => {
  if (tagInput.value && !formData.value.tags.includes(tagInput.value)) {
    formData.value.tags.push(tagInput.value)
    tagInput.value = ''
  }
}

const handleRemoveTag = (tag) => {
  const index = formData.value.tags.indexOf(tag)
  if (index > -1) {
    formData.value.tags.splice(index, 1)
  }
}

// Auto-generate slug from title
watch(() => formData.value.title, (val) => {
  if (val) {
    formData.value.slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
})
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="Add New Problem"
    width="900px"
    :before-close="handleClose"
    class="problem-dialog"
  >
    <el-form :model="formData" label-position="top" class="problem-form">
      <!-- Basic Info -->
      <div class="form-section">
        <h3 class="section-title">Basic Information</h3>
        
        <el-row :gutter="16">
          <el-col :span="16">
            <el-form-item label="Title" required>
              <el-input v-model="formData.title" placeholder="e.g., Two Sum" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Difficulty" required>
              <el-select v-model="formData.difficulty" style="width: 100%">
                <el-option
                  v-for="option in difficultyOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Slug" required>
          <el-input v-model="formData.slug" placeholder="Auto-generated from title" />
        </el-form-item>
      </div>

      <!-- Description -->
      <div class="form-section">
        <h3 class="section-title">Problem Description</h3>
        
        <el-form-item label="Description" required>
          <QuillEditor
            v-model:content="formData.description"
            :options="editorOptions"
            content-type="html"
            class="quill-editor"
          />
        </el-form-item>
      </div>

      <!-- Input/Output Format -->
      <div class="form-section">
        <h3 class="section-title">Format & Constraints</h3>
        
        <el-form-item label="Input Format">
          <el-input
            v-model="formData.inputFormat"
            type="textarea"
            :rows="3"
            placeholder="Describe the input format..."
          />
        </el-form-item>

        <el-form-item label="Output Format">
          <el-input
            v-model="formData.outputFormat"
            type="textarea"
            :rows="3"
            placeholder="Describe the output format..."
          />
        </el-form-item>

        <el-form-item label="Constraints">
          <el-input
            v-model="formData.constraints"
            type="textarea"
            :rows="3"
            placeholder="e.g., 1 <= nums.length <= 10^4"
          />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Time Limit (ms)">
              <el-input-number v-model="formData.timeLimit" :min="100" :step="100" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Memory Limit (MB)">
              <el-input-number v-model="formData.memoryLimit" :min="64" :step="64" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- Examples -->
      <div class="form-section">
        <div class="section-header">
          <h3 class="section-title">Examples</h3>
          <el-button size="small" @click="addExample">Add Example</el-button>
        </div>

        <div v-for="(example, index) in formData.examples" :key="index" class="example-item">
          <div class="example-header">
            <span class="example-label">Example {{ index + 1 }}</span>
            <el-button
              v-if="formData.examples.length > 1"
              link
              type="danger"
              size="small"
              @click="removeExample(index)"
            >
              Remove
            </el-button>
          </div>

          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="Input">
                <el-input
                  v-model="example.input"
                  type="textarea"
                  :rows="3"
                  placeholder="Input data..."
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Output">
                <el-input
                  v-model="example.output"
                  type="textarea"
                  :rows="3"
                  placeholder="Expected output..."
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="Explanation (Optional)">
            <el-input
              v-model="example.explanation"
              type="textarea"
              :rows="2"
              placeholder="Explain the example..."
            />
          </el-form-item>
        </div>
      </div>

      <!-- Tags -->
      <div class="form-section">
        <h3 class="section-title">Tags</h3>
        
        <el-form-item>
          <div class="tags-input">
            <el-input
              v-model="tagInput"
              placeholder="Add tags (e.g., Array, Hash Table)"
              @keyup.enter="handleAddTag"
            >
              <template #append>
                <el-button @click="handleAddTag">Add</el-button>
              </template>
            </el-input>
          </div>
          
          <div v-if="formData.tags.length > 0" class="tags-list">
            <el-tag
              v-for="tag in formData.tags"
              :key="tag"
              closable
              @close="handleRemoveTag(tag)"
              class="tag-item"
            >
              {{ tag }}
            </el-tag>
          </div>
        </el-form-item>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">Cancel</el-button>
        <el-button type="primary" @click="handleSubmit">Create Problem</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.problem-form {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 12px;
}

.form-section {
  margin-bottom: var(--spacing-2xl);
  padding-bottom: var(--spacing-xl);
  border-bottom: 1px solid var(--border-primary);
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-lg) 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
}

/* Quill Editor Styling */
:deep(.quill-editor) {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

:deep(.quill-editor .ql-toolbar) {
  background: var(--bg-secondary);
  border: none;
  border-bottom: 1px solid var(--border-primary);
}

:deep(.quill-editor .ql-container) {
  border: none;
  font-size: 14px;
  min-height: 200px;
}

:deep(.quill-editor .ql-editor) {
  color: var(--text-primary);
  min-height: 200px;
}

:deep(.quill-editor .ql-editor.ql-blank::before) {
  color: var(--text-tertiary);
  font-style: normal;
}

:deep(.quill-editor .ql-stroke) {
  stroke: var(--text-secondary);
}

:deep(.quill-editor .ql-fill) {
  fill: var(--text-secondary);
}

:deep(.quill-editor .ql-picker-label) {
  color: var(--text-secondary);
}

:deep(.quill-editor .ql-toolbar button:hover),
:deep(.quill-editor .ql-toolbar button.ql-active) {
  color: var(--accent-primary);
}

:deep(.quill-editor .ql-toolbar button:hover .ql-stroke),
:deep(.quill-editor .ql-toolbar button.ql-active .ql-stroke) {
  stroke: var(--accent-primary);
}

:deep(.quill-editor .ql-toolbar button:hover .ql-fill),
:deep(.quill-editor .ql-toolbar button.ql-active .ql-fill) {
  fill: var(--accent-primary);
}

/* Examples */
.example-item {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.example-item:last-child {
  margin-bottom: 0;
}

.example-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.example-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-primary);
}

/* Tags */
.tags-input {
  margin-bottom: var(--spacing-md);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.tag-item {
  background: rgba(255, 161, 22, 0.15);
  color: var(--accent-primary);
  border: 1px solid rgba(255, 161, 22, 0.3);
}

/* Dialog Customization */
:deep(.problem-dialog .el-dialog) {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
}

:deep(.problem-dialog .el-dialog__header) {
  border-bottom: 1px solid var(--border-primary);
  padding: var(--spacing-xl);
}

:deep(.problem-dialog .el-dialog__title) {
  color: var(--text-primary);
  font-size: 20px;
  font-weight: 700;
}

:deep(.problem-dialog .el-dialog__body) {
  padding: var(--spacing-xl);
}

:deep(.problem-dialog .el-dialog__footer) {
  border-top: 1px solid var(--border-primary);
  padding: var(--spacing-lg) var(--spacing-xl);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}

/* Form Item Customization */
:deep(.el-form-item__label) {
  color: var(--text-primary);
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

:deep(.el-input__wrapper) {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  box-shadow: none;
}

:deep(.el-input__wrapper:hover) {
  border-color: var(--accent-primary);
}

:deep(.el-input__wrapper.is-focus) {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 1px rgba(255, 161, 22, 0.2);
}

:deep(.el-input__inner) {
  color: var(--text-primary);
}

:deep(.el-textarea__inner) {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  color: var(--text-primary);
}

:deep(.el-textarea__inner:hover) {
  border-color: var(--accent-primary);
}

:deep(.el-textarea__inner:focus) {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 1px rgba(255, 161, 22, 0.2);
}

:deep(.el-select .el-input__wrapper) {
  background: var(--bg-tertiary);
}

:deep(.el-input-number .el-input__wrapper) {
  background: var(--bg-tertiary);
}

/* Scrollbar */
.problem-form::-webkit-scrollbar {
  width: 6px;
}

.problem-form::-webkit-scrollbar-track {
  background: transparent;
}

.problem-form::-webkit-scrollbar-thumb {
  background: var(--border-primary);
  border-radius: 3px;
}

.problem-form::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}
</style>
