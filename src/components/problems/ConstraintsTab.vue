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
</script>

<template>
   <div class="tab-content-wrapper full-width">
       <div class="form-section mb-6">
         <el-row :gutter="32">
            <el-col :span="12">
               <el-form-item label="Time Limit (ms)" prop="timeLimitMs">
                  <el-input-number 
                     v-model="modelValue.timeLimitMs" 
                     :min="100" 
                     :step="100" 
                     controls-position="right"
                     class="custom-number-input w-full" 
                     size="large"
                  />
               </el-form-item>
            </el-col>
            <el-col :span="12">
               <el-form-item label="Memory Limit (MB)" prop="memoryLimitMb">
                  <el-input-number 
                     v-model="modelValue.memoryLimitMb" 
                     :min="1" 
                     :step="1" 
                     controls-position="right"
                     class="custom-number-input w-full" 
                     size="large"
                  />
               </el-form-item>
            </el-col>
         </el-row>
       </div>
       
       <div class="form-section mb-6">
          <el-form-item label="Constraints Details" prop="constraints">
             <div class="quill-wrapper main-quill">
                <QuillEditor 
                   v-model:content="modelValue.constraints" 
                   theme="snow" 
                   toolbar="essential" 
                   contentType="html"
                   placeholder="e.g. 1 <= n <= 100"
                />
             </div>
          </el-form-item>
       </div>

       <div class="form-section mb-6">
          <el-row :gutter="32">
             <el-col :span="12">
                 <el-form-item label="Input Format (Optional)" prop="inputFormat">
                     <div class="quill-wrapper main-quill">
                        <QuillEditor 
                           v-model:content="modelValue.inputFormat" 
                           theme="snow" 
                           toolbar="essential" 
                           contentType="html"
                           placeholder="Describe the input format..." 
                        />
                     </div>
                 </el-form-item>
             </el-col>
             <el-col :span="12">
                 <el-form-item label="Output Format (Optional)" prop="outputFormat">
                     <div class="quill-wrapper main-quill">
                        <QuillEditor 
                           v-model:content="modelValue.outputFormat" 
                           theme="snow" 
                           toolbar="essential" 
                           contentType="html"
                           placeholder="Describe the output format..." 
                        />
                     </div>
                 </el-form-item>
             </el-col>
          </el-row>
       </div>
   </div>
</template>

<style scoped>
.full-width { width: 100%; height: 100%; display: flex; flex-direction: column; }
.form-section { background: rgba(255, 255, 255, 0.02); padding: 24px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05); }
.mb-6 { margin-bottom: 24px; }
.w-full { width: 100%; }

/* Input Styles - Force Dark Theme for Numbers */
:deep(.el-input__wrapper) {
  background-color: #1a1a1a !important;
  box-shadow: 0 0 0 1px #333 inset !important;
}
:deep(.el-input__inner) {
  color: #e0e0e0 !important;
  text-align: left;
}
:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #666 inset !important;
}
:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #ffa116 inset !important;
}

/* Number Input Controls */
:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  background-color: #262626 !important;
  border-left: 1px solid #333 !important;
  color: #a0a0a0 !important;
}
:deep(.el-input-number__decrease:hover),
:deep(.el-input-number__increase:hover) {
  color: #ffa116 !important;
}
:deep(.el-input-number__increase) {
  border-bottom: 1px solid #333 !important;
}
:deep(.el-input-number.is-controls-right .el-input__wrapper) {
    padding-left: 15px;
    padding-right: 50px;
}

.quill-wrapper { 
  background-color: #1a1a1a; 
  border-radius: 8px; 
  border: 1px solid #333; 
  overflow: hidden; 
  display: flex; 
  flex-direction: column; 
  height: 500px;
  width: 100%; /* Fix width */
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
:deep(.ql-editor.ql-blank::before) {
  color: #a0a0a0 !important; 
  font-style: italic;
}
</style>
