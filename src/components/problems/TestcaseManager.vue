<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import { AlertCircle, UploadCloud, Eye, EyeOff, Trash2 } from 'lucide-vue-next'
import AppButton from '@/components/common/AppButton.vue'
import { ElMessage } from 'element-plus'
import JSZip from 'jszip'

const props = defineProps({
  testcases: {
    type: Array,
    required: true,
    default: () => []
  },
  mode: {
    type: String,
    default: 'CREATE' // 'CREATE' or 'UPDATE'
  },
  problemId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:testcases'])

const isProcessingZip = ref(false)
const testcaseFileRef = ref(null)

// --- PROXY METHODS (Mutate prop directly if simple array, or emit) ---
// Since Vue props are shallow readonly, mutating objects inside array is fine, 
// but replacing array needs emit. For simple CRUD on array, we can emit update.

const handleTestcaseUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (file.type !== 'application/zip' && !file.name.endsWith('.zip')) {
    ElMessage.error('Only ZIP files are allowed')
    return
  }

  isProcessingZip.value = true
  try {
    const zip = new JSZip()
    const content = await zip.loadAsync(file)
    
    const files = {}
    
    // 1. Read all files
    for (const [relativePath, zipEntry] of Object.entries(content.files)) {
      if (!zipEntry.dir && !relativePath.includes('__MACOSX') && !relativePath.includes('.DS_Store')) {
        files[relativePath] = await zipEntry.async('string')
      }
    }

    // 2. Pair Input/Output
    const pairs = []
    const normalizedFiles = {} 
    Object.keys(files).forEach(path => {
       normalizedFiles[path.toLowerCase()] = path
    })

    Object.keys(normalizedFiles).forEach(lowerPath => {
       if (lowerPath.match(/\.in$|input/)) {
          let outputCandidates = []
          if (lowerPath.endsWith('.in')) {
             outputCandidates.push(lowerPath.replace(/\.in$/, '.out'))
             outputCandidates.push(lowerPath.replace(/\.in$/, '.ans'))
          } else if (lowerPath.includes('input')) {
             outputCandidates.push(lowerPath.replace('input', 'output'))
             outputCandidates.push(lowerPath.replace('input', 'answer'))
          }

          const matchKey = outputCandidates.find(key => normalizedFiles[key])
          
          if (matchKey) {
             const originalInputPath = normalizedFiles[lowerPath]
             const originalOutputPath = normalizedFiles[matchKey]
             
             pairs.push({
               input: files[originalInputPath],
               output: files[originalOutputPath],
               name: originalInputPath.replace(/\.in|input/gi, '').replace(/[^a-zA-Z0-9_\-]/g, ''),
               isHidden: true 
             })
          }
       }
    })

    if (pairs.length > 0) {
       // In both CREATE and UPDATE modes, we just preview the testcases first
       // by updating the UI list. The actual upload and save happens 
       // when clicking "Save Changes" or "Publish".
       pairs.slice(0, 2).forEach(p => p.isHidden = false)
       const newTestcases = pairs.map((p, idx) => ({
          ...p,
          id: Date.now() + idx
       }))
       // Emit Update
       emit('update:testcases', newTestcases)
       ElMessage.success(`Successfully loaded ${pairs.length} testcases`)
    } else {
       ElMessage.warning('No valid input/output pairs found in Zip')
    }

  } catch (error) {
    console.error(error)
    ElMessage.error('Failed to process Zip file')
  } finally {
    isProcessingZip.value = false
    event.target.value = '' 
  }
}

const toggleVisibility = (index) => {
    // We need to clone to avoid prop mutation warning if strict? 
    // Actually mutating object props is allowed in Vue 3 but strictly speaking we should emit.
    // However, for deep objects it's common to just mutate.
    const tc = props.testcases[index]
    tc.isHidden = !tc.isHidden
    // If UPDATE mode, call API?
    if (props.mode === 'UPDATE') {
        // callUpdateApi(tc)
    }
}

const removeTestcase = (index) => {
    const newList = [...props.testcases]
    newList.splice(index, 1)
    emit('update:testcases', newList)
     if (props.mode === 'UPDATE') {
        // callDeleteApi(tc.id)
    }
}

const clearAll = () => {
    emit('update:testcases', [])
}

</script>

<template>
  <div class="tab-content-wrapper full-width centered-content">
      <div class="wide-area">
        
        <!-- Rules Alert -->
        <div class="rules-box">
           <div class="rules-title">
              <AlertCircle :size="18" />
              <span>Testcase Rules</span>
           </div>
           <ul class="rules-list">
              <li>Upload a <strong>ZIP file</strong> containing paired input/output files.</li>
              <li>Naming: <strong>1.in / 1.out</strong> or <strong>input_1.txt / output_1.txt</strong>.</li>
              <li>System automatically pairs files and detects Sample/Hidden tests.</li>
           </ul>
        </div>

        <!-- Upload Zone -->
        <div 
          class="upload-zone"
          @click="testcaseFileRef.click()"
          :class="{ 'is-loading': isProcessingZip }"
        >
          <div v-if="isProcessingZip" class="loading-state">
             <div class="spinner"></div>
             <p>Processing Zip...</p>
          </div>
          <div v-else>
             <UploadCloud :size="48" class="upload-icon" />
             <div class="upload-text">
               <p class="primary-text">Drop ZIP file here or click to upload</p>
               <p class="secondary-text">Supports .zip containing .in/.out files</p>
             </div>
          </div>
          <input 
            type="file" 
            ref="testcaseFileRef" 
            class="hidden-input" 
            accept=".zip,application/zip"
            @change="handleTestcaseUpload"
          />
        </div>

        <!-- Testcase Table -->
        <div v-if="testcases && testcases.length > 0" class="testcase-list">
           <div class="list-header">
              <h3>Uploaded Testcases ({{ testcases.length }})</h3>
              <AppButton variant="danger" size="small" @click="clearAll">Clear All</AppButton>
           </div>

           <div class="custom-table">
              <div class="table-head">
                 <div class="col-id">ID</div>
                 <div class="col-name">Name</div>
                 <div class="col-io">Input Preview</div>
                 <div class="col-io">Output Preview</div>
                 <div class="col-status">Type</div>
                 <div class="col-action">Action</div>
              </div>
              <div class="table-body">
                 <div v-for="(tc, index) in testcases" :key="tc.id || index" class="table-row">
                    <div class="col-id">#{{ index + 1 }}</div>
                    <div class="col-name">{{ tc.name }}</div>
                    <div class="col-io code-preview" :title="tc.input">{{ tc.input ? tc.input.slice(0, 30) + '...' : (tc.inputUrl ? 'File URL' : 'Empty') }}</div>
                    <div class="col-io code-preview" :title="tc.output">{{ tc.output ? tc.output.slice(0, 30) + '...' : (tc.outputUrl ? 'File URL' : 'Empty') }}</div>
                    <div class="col-status">
                       <button 
                          type="button"
                          class="status-toggle" 
                          :class="{ 'is-hidden': tc.isHidden }"
                          @click="toggleVisibility(index)"
                       >
                          <component :is="tc.isHidden ? EyeOff : Eye" :size="14" />
                          <span>{{ tc.isHidden ? 'Hidden' : 'Sample' }}</span>
                       </button>
                    </div>
                    <div class="col-action">
                       <button type="button" class="icon-btn delete-btn" @click="removeTestcase(index)">
                          <Trash2 :size="16" />
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>

      </div>
  </div>
</template>

<style scoped>
.centered-content { display: flex; justify-content: center; height: 100%; overflow-y: auto; }
.wide-area { width: 100%; max-width: 900px; padding: 0 0 40px 0; }
.rules-box {
  background-color: rgba(255, 161, 22, 0.1);
  border: 1px solid rgba(255, 161, 22, 0.2);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}
.rules-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #ffa116;
  margin-bottom: 8px;
  font-size: 14px;
}
.rules-list {
  padding-left: 24px;
  margin: 0;
  color: #d1d5db;
  font-size: 13px;
}
.rules-list li { margin-bottom: 4px; }

.upload-zone {
  border: 2px dashed #404040;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  transition: all 0.3s ease;
  background-color: #1a1a1a;
  cursor: pointer;
}
.upload-zone:hover, .upload-zone.is-dragover {
  border-color: #ffa116;
  background-color: rgba(255, 161, 22, 0.05);
}.upload-zone.is-loading { pointer-events: none; opacity: 0.7; }
.upload-icon { color: #666; margin-bottom: 16px; }
.primary-text { font-size: 16px; font-weight: 500; color: #e0e0e0; margin-bottom: 4px; }
.secondary-text { font-size: 13px; color: #666; }
.hidden-input { display: none; }
.spinner { width: 32px; height: 32px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 12px; }

/* Table */
.testcase-list { margin-top: 32px; }
.list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.list-header h3 { font-size: 16px; font-weight: 600; color: #e0e0e0; margin: 0; }
.custom-table { border: 1px solid #333; border-radius: 8px; overflow: hidden; background: #1a1a1a; }
.table-head, .table-row { display: grid; grid-template-columns: 60px 1fr 1fr 1fr 100px 60px; gap: 12px; padding: 12px 16px; align-items: center; }
.table-head { background: #262626; border-bottom: 1px solid #333; font-size: 12px; font-weight: 600; color: #a0a0a0; text-transform: uppercase; letter-spacing: 0.5px; }
.table-row { border-bottom: 1px solid #333; transition: background 0.15s; }
.table-row:last-child { border-bottom: none; }
.table-row:hover { background: #222; }
.col-id { color: #666; font-family: monospace; }
.col-name { font-weight: 500; color: #e0e0e0; }
.col-io.code-preview { font-family: monospace; color: #888; font-size: 12px; background: #111; padding: 4px 8px; border-radius: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.col-status { display: flex; justify-content: center; }
.col-action { display: flex; justify-content: center; }
.status-toggle { display: flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 100px; border: 1px solid #333; background: transparent; color: #2cbb5d; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.status-toggle:hover { background: rgba(44, 187, 93, 0.1); }
.status-toggle.is-hidden { color: #a0a0a0; border-color: #333; }
.status-toggle.is-hidden:hover { background: #333; color: #fff; }
.icon-btn.delete-btn { color: #666; padding: 6px; border-radius: 4px; transition: all 0.2s; background: transparent; border: none; cursor: pointer; }
.icon-btn.delete-btn:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
</style>
