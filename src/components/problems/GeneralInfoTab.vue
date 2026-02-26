<script setup>
import { defineProps } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const props = defineProps({
    modelValue: {
        type: Object,
        required: true
    }
})

// Helper logic if needed, otherwise parent handles title->slug watcher
// We assume parent passes reactive object

const getDifficultyClass = (difficulty) => {
   if (difficulty === 'EASY') return 'difficulty-easy'
   if (difficulty === 'MEDIUM') return 'difficulty-medium'
   if (difficulty === 'HARD') return 'difficulty-hard'
   return ''
}
</script>

<template>
   <div class="tab-content-wrapper full-width">
      <div class="form-section mb-6">
         <el-row :gutter="32">
            <el-col :span="18">
               <el-form-item label="Problem Title" prop="title">
                  <el-input 
                     v-model="modelValue.title" 
                     placeholder="e.g. Two Sum" 
                     size="large"
                     class="custom-input title-input"
                  />
               </el-form-item>
            </el-col>
            <el-col :span="6">
               <el-form-item label="Difficulty" prop="difficulty">
                  <el-select 
                     v-model="modelValue.difficulty" 
                     placeholder="Select difficulty" 
                     size="large"
                     class="custom-select w-full"
                     :class="getDifficultyClass(modelValue.difficulty)"
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
                   v-model:content="modelValue.description" 
                   theme="snow" 
                   toolbar="full" 
                   contentType="html"
                   placeholder="Describe the problem statement here..."
                />
             </div>
          </el-form-item>
      </div>
   </div>
</template>

<style scoped>
/* Reuse styles from CreateProblemView or allow global css */
/* Assuming global css or parent provided styles works, but better ensuring scoping */
/* For now rely on scoped styles being available where components are used, OR migrate CSS */
/* The user asked to split components. I'll rely on the existing style architecture or scoped here if necessary */
/* Since it's Vue scoped, we might need to copy essential styles or assume parent passes deep styles? */
/* Actually, Element Plus styles are global. Custom classes like .custom-input need to be ensured. */
/* I will copy relevant small styles to be safe. */

.full-width { width: 100%; height: 100%; display: flex; flex-direction: column; }
.form-section { background: rgba(255, 255, 255, 0.02); padding: 24px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05); }
.mb-6 { margin-bottom: 24px; }
.w-full { width: 100%; }

/* Input Styles - Force Dark Theme */
:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  background-color: #1a1a1a !important;
  box-shadow: 0 0 0 1px #333 inset !important;
}

:deep(.el-input__inner) {
  color: #e0e0e0 !important;
  font-family: 'Inter', sans-serif;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #666 inset !important;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #ffa116 inset !important;
}

/* Select/Combobox Styles - Force Dark Theme */
:deep(.el-select .el-input__wrapper),
:deep(.el-select .el-select__wrapper),
:deep(.el-select__wrapper) {
  background-color: #1a1a1a !important;
  box-shadow: 0 0 0 1px #333 inset !important;
}

:deep(.el-select .el-input__inner),
:deep(.el-select__selected-item) {
  color: #e0e0e0 !important;
}

:deep(.el-select .el-input.is-focus .el-input__wrapper),
:deep(.el-select .el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px #ffa116 inset !important;
}

/* Difficulty Colors */
.difficulty-easy :deep(.el-input__inner) { color: #2cbb5d !important; font-weight: 600; }
.difficulty-medium :deep(.el-input__inner) { color: #ffb800 !important; font-weight: 600; }
.difficulty-hard :deep(.el-input__inner) { color: #ef4444 !important; font-weight: 600; }

.quill-wrapper { 
  background-color: #1a1a1a; 
  border-radius: 8px; 
  border: 1px solid #333; 
  overflow: hidden; 
  display: flex; 
  flex-direction: column;
  height: 500px;
  width: 100%; /* Force full width */
}
.main-quill { height: 100%; }

:deep(.ql-toolbar) { 
  border: none !important; 
  border-bottom: 1px solid #333 !important; 
  background: #262626; 
}
:deep(.ql-container) { 
  border: none !important; 
  color: #e0e0e0; 
  font-size: 14px; 
  font-family: 'Inter', sans-serif; 
  flex: 1; 
  overflow-y: auto; 
}
:deep(.ql-editor) { 
  padding: 24px; 
  min-height: 100%; 
}
/* Placeholder Color Fix */
:deep(.ql-editor.ql-blank::before) {
  color: #a0a0a0 !important; 
  font-style: italic;
}
</style>
