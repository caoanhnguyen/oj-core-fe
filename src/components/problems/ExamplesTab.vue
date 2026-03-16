<script setup>
import { defineProps } from 'vue'
import { Plus, X, ChevronDown, ChevronRight } from 'lucide-vue-next'
import AppButton from '@/components/common/AppButton.vue'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

// Accepts the entire examples array prop (reactive)
const props = defineProps({
    examples: {
        type: Array,
        required: true
    }
})

const addExample = () => {
    props.examples.push({
        rawInput: '',
        rawOutput: '',
        explanation: '',
        orderIndex: props.examples.length,
        expanded: true 
    })
}

const removeExample = (index) => {
    props.examples.splice(index, 1)
    props.examples.forEach((ex, idx) => ex.orderIndex = idx)
}

const toggleExample = (index) => {
    if (props.examples[index].expanded === undefined) {
        props.examples[index].expanded = false
    } else {
        props.examples[index].expanded = !props.examples[index].expanded
    }
}
</script>

<template>
    <div class="tab-content-wrapper full-width">
        <div class="examples-header-row mb-6">
            <h3 class="section-title">Test Cases Examples</h3>
            <AppButton variant="primary" :icon="Plus" @click="addExample">Add Example</AppButton>
        </div>

        <div v-if="examples.length === 0" class="empty-state">
            <span>No examples added yet. Click "Add Example" to creating one.</span>
        </div>

        <div class="examples-grid">
            <div v-for="(example, index) in examples" :key="index" class="example-card">
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
                                <el-input 
                                    v-model="example.rawInput" 
                                    type="textarea"
                                    :rows="6"
                                    placeholder="Input data..." 
                                    class="custom-textarea monospace-textarea"
                                />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="Output">
                                <el-input 
                                    v-model="example.rawOutput" 
                                    type="textarea"
                                    :rows="6"
                                    placeholder="Expected output..." 
                                    class="custom-textarea monospace-textarea"
                                />
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
</template>

<style scoped>
.full-width { width: 100%; display: flex; flex-direction: column; }
.mb-6 { margin-bottom: 24px; }
.examples-header-row { display: flex; justify-content: space-between; align-items: center; }
.section-title { font-size: 16px; font-weight: 600; color: #fff; margin: 0; }
.empty-state { padding: 40px; text-align: center; color: #666; background: rgba(255, 255, 255, 0.02); border-radius: 8px; border: 1px dashed #333; }
.examples-grid { display: grid; gap: 24px; }
.example-card { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; overflow: hidden; }
.card-header-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #262626; cursor: pointer; border-bottom: 1px solid #333; }
.clickable-header:hover { background: #2a2a2a; }
.header-left { display: flex; align-items: center; gap: 12px; }
.text-gray { color: #888; }
.card-badge { font-size: 13px; font-weight: 600; color: #e0e0e0; background: rgba(255, 255, 255, 0.1); padding: 2px 8px; border-radius: 4px; }
.example-body { padding: 20px; }
.mt-4 { margin-top: 16px; }

.quill-wrapper { 
  background-color: #1a1a1a; 
  border-radius: 8px; 
  border: 1px solid #333; 
  overflow: hidden; 
  display: flex; 
  flex-direction: column;
  width: 100%; /* Fix width */
}
.small-quill { height: 200px; } /* Increased from 150px */
.medium-quill { height: 250px; } /* Increased from 200px */

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
  padding: 16px; 
  min-height: 100%; 
}
:deep(.ql-editor.ql-blank::before) {
  color: #a0a0a0 !important; 
  font-style: italic;
}

/* Monospace Textarea */
:deep(.monospace-textarea textarea) {
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 14px;
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: #1a1a1a !important;
  color: #e0e0e0 !important;
  box-shadow: 0 0 0 1px #333 inset !important;
  border: none;
  padding: 12px;
}
:deep(.monospace-textarea textarea:focus) {
  box-shadow: 0 0 0 1px #ffa116 inset !important;
}
</style>
