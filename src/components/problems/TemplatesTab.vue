<script setup>
import { defineProps, ref, onMounted } from 'vue'
import { Plus, X, Upload, ChevronDown, ChevronRight } from 'lucide-vue-next'
import AppButton from '@/components/common/AppButton.vue'
import CodeEditor from '@/components/common/CodeEditor.vue'
import { ElMessage } from 'element-plus'
import { systemAPI } from '@/api/system'

const props = defineProps({
    templates: {
        type: Array,
        required: true
    }
})

// Options
const languageOptions = ref([])

onMounted(async () => {
    try {
        const langs = await systemAPI.getLanguages()
        languageOptions.value = langs.map(l => ({
            label: l.displayName,
            value: l.languageKey
        }))
    } catch(e) {
        console.error("Failed to load languages:", e)
    }
})

const getAvailableLanguages = (currentLang) => {
  const usedLangs = props.templates.map(t => t.languageKey)
  return languageOptions.value.filter(opt => opt.value === currentLang || !usedLangs.includes(opt.value))
}

const getDefaultTemplate = (lang) => {
  const templates = {
    'JAVA': `import java.io.*;\nimport java.util.*;\n\nclass Solution {\n    public void solve() {\n        // Write your code here\n    }\n}`,
    'CPP': `#include <iostream>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve() {\n        // Write your code here\n    }\n};`,
    'PYTHON3': `class Solution:\n    def solve(self):\n        # Write your code here\n        pass`,
    'JS': `/**\n * @param {any} args\n * @return {void}\n */\nvar solve = function(args) {\n    // Write your code here\n};`
  }
  return templates[lang] || '// Write your code here'
}

const addTemplate = () => {
  const usedLangs = props.templates.map(t => t.languageKey)
  const availableLang = languageOptions.value.find(opt => !usedLangs.includes(opt.value))
  
  if (!availableLang) {
    ElMessage.warning('All supported languages have been added or options not loaded yet')
    return
  }

  props.templates.push({
    languageKey: availableLang.value,
    codeTemplate: getDefaultTemplate(availableLang.value),
    expanded: true 
  })
}

const removeTemplate = (index) => {
    props.templates.splice(index, 1)
}

const toggleTemplate = (index) => {
    props.templates[index].expanded = !props.templates[index].expanded
}

const handleFileUpload = (event, templateIndex) => {
  const file = event.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    props.templates[templateIndex].codeTemplate = e.target.result
  }
  reader.readAsText(file)
  event.target.value = ''
}
</script>

<template>
    <div class="tab-content-wrapper full-width">
       <div class="examples-header-row mb-6">
          <h3 class="section-title">Language & Template</h3>
          <AppButton variant="primary" :icon="Plus" @click="addTemplate">Add Template</AppButton>
       </div>

       <div v-if="templates.length === 0" class="empty-state">
          <span>Add code templates for supported languages.</span>
       </div>

       <div v-for="(template, index) in templates" :key="index" class="template-card full-card">
          <!-- Collapsible Header -->
          <div class="card-header-row clickable-header" @click="toggleTemplate(index)">
             <div class="template-header-left">
                <component :is="template.expanded ? ChevronDown : ChevronRight" :size="20" class="text-gray" />
                <el-select 
                   v-model="template.languageKey" 
                   size="default" 
                   style="width: 200px" 
                   class="custom-select"
                   @click.stop
                >
                   <el-option 
                     v-for="l in getAvailableLanguages(template.languageKey)" 
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
                  :language="template.languageKey.toLowerCase()" 
                  height="500px" 
                />
             </el-form-item>
          </div>
       </div>
    </div>
</template>

<style scoped>
.full-width { width: 100%; display: flex; flex-direction: column; }
.mb-6 { margin-bottom: 24px; }
.examples-header-row { display: flex; justify-content: space-between; align-items: center; }
.section-title { font-size: 16px; font-weight: 600; color: #fff; margin: 0; }
.empty-state { padding: 40px; text-align: center; color: #666; background: rgba(255, 255, 255, 0.02); border-radius: 8px; border: 1px dashed #333; }

.template-card { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; overflow: hidden; margin-bottom: 24px; }
.card-header-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #262626; cursor: pointer; border-bottom: 1px solid #333; }
.template-header-left { display: flex; align-items: center; gap: 16px; flex: 1; }
.text-gray { color: #888; }

/* Select Dark Theme Override */
.custom-select { width: 200px; }
.custom-select :deep(.el-input__wrapper),
.custom-select :deep(.el-select__wrapper) { 
  background-color: #333 !important; 
  border: none; 
  box-shadow: none !important; 
}
.custom-select :deep(.el-input__inner),
.custom-select :deep(.el-select__selected-item) { 
  color: #fff !important; 
  font-weight: 500; 
}
.custom-select :deep(.el-select__caret) { color: #fff; }

.file-upload-trigger { display: inline-block; }
.hidden-input { display: none; }
.upload-label { 
  display: inline-flex; 
  align-items: center; 
  gap: 8px; 
  background: rgba(255, 161, 22, 0.1); 
  border: 1px solid #ffa116; 
  color: #ffa116; 
  padding: 6px 12px; 
  border-radius: 4px; 
  cursor: pointer; 
  font-size: 13px; 
  font-weight: 500; 
  transition: all 0.2s; 
}
.upload-label:hover { background: rgba(255, 161, 22, 0.2); }

.code-editor-wrapper { height: 400px; border-top: 1px solid #333; }

.template-body { padding: 0; } 
/* Code Editor usually has its own padding or full width, removing padding here to let editor fill */
.no-label-item { margin-bottom: 0 !important; }

</style>
