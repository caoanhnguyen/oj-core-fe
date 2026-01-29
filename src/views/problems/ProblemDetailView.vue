<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProblemStore } from '../../stores/problem'
import { ArrowLeft, Play, Send, MoreVertical, Settings, ChevronUp, ChevronDown } from 'lucide-vue-next'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

// Configure Monaco Workers
self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') return new jsonWorker()
    if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker()
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker()
    if (label === 'typescript' || label === 'javascript') return new tsWorker()
    return new editorWorker()
  }
}

const route = useRoute()
const router = useRouter()
const problemStore = useProblemStore()

const problem = ref(null)
const loading = ref(true)
const activeTab = ref('description')
const selectedLanguage = ref('java')
const editorContainer = ref(null)
let editorInstance = null

const languageOptions = [
  { label: 'Java', value: 'java' },
  { label: 'C++', value: 'cpp' },
  { label: 'Python', value: 'python' },
  { label: 'JavaScript', value: 'javascript' }
]

const getDifficultyClass = (difficulty) => {
  const classes = {
    'EASY': 'difficulty-easy',
    'MEDIUM': 'difficulty-medium',
    'HARD': 'difficulty-hard'
  }
  return classes[difficulty] || ''
}

// Layout Resizing Logic
const leftWidth = ref(50) // Percentage
const isDraggingHorizontal = ref(false)
const rightTopHeight = ref(60) // Percentage of right panel
const isDraggingVertical = ref(false)

const startHorizontalDrag = () => { isDraggingHorizontal.value = true }
const startVerticalDrag = () => { isDraggingVertical.value = true }
const stopDrag = () => {
  isDraggingHorizontal.value = false
  isDraggingVertical.value = false
}

const handleMouseMove = (e) => {
  if (isDraggingHorizontal.value) {
    const containerWidth = window.innerWidth
    const newWidth = (e.clientX / containerWidth) * 100
    if (newWidth > 20 && newWidth < 80) {
      leftWidth.value = newWidth
      if (editorInstance) editorInstance.layout()
    }
  }
  if (isDraggingVertical.value) {
    // Relative to right panel height (approx window height - header)
    const containerHeight = window.innerHeight - 50
    const relativeY = e.clientY - 50 // Header offset
    const newHeight = (relativeY / containerHeight) * 100
    if (newHeight > 20 && newHeight < 90) {
      rightTopHeight.value = newHeight
      if (editorInstance) editorInstance.layout()
    }
  }
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', stopDrag)
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', stopDrag)
  if (editorInstance) editorInstance.dispose()
})

// Monaco & Template Logic
const initMonaco = () => {
  if (!editorContainer.value) return

  editorInstance = monaco.editor.create(editorContainer.value, {
    value: getInitialCode(),
    language: selectedLanguage.value,
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14,
    lineHeight: 24,
    padding: { top: 16, bottom: 16 },
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    fontLigatures: true,
    bracketPairColorization: { enabled: true },
    scrollBeyondLastLine: false,
    scrollbar: {
      vertical: 'visible',
      horizontal: 'visible',
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10
    }
  })
}

// Map frontend language value to backend ENUM key
const getBackendLangKey = (langValue) => {
  const map = {
    'java': 'JAVA',
    'cpp': 'CPP',
    'python': 'PYTHON',
    'javascript': 'JAVASCRIPT'
  }
  return map[langValue]
}

const getInitialCode = () => {
  if (problem.value?.templates?.length > 0) {
    const backendKey = getBackendLangKey(selectedLanguage.value)
    const template = problem.value.templates.find(t => t.language === backendKey)
    return template?.codeTemplate || '// Write your code here...'
  }
  return '// Write your code here...'
}

watch(selectedLanguage, (newLang) => {
  if (editorInstance) {
    const model = editorInstance.getModel()
    monaco.editor.setModelLanguage(model, newLang)
    editorInstance.setValue(getInitialCode())
  }
})

const handleSubmit = () => {
  const code = editorInstance?.getValue()
  console.log('Submit code:', code)
}

const handleRun = () => {
  const code = editorInstance?.getValue()
  console.log('Run code:', code)
}

onMounted(async () => {
  try {
    loading.value = true
    const slug = route.params.slug
    problem.value = await problemStore.fetchProblemBySlug(slug)
  } catch (error) {
    console.error('Failed to load problem:', error)
  } finally {
    loading.value = false
    nextTick(() => {
      initMonaco()
    })
  }
})
</script>

<template>
  <div class="problem-view" :class="{ 'is-dragging': isDraggingHorizontal || isDraggingVertical }">
    <!-- Header -->
    <div class="problem-header">
      <div class="header-left">
        <el-button link @click="router.push('/')" class="back-btn">
          <ArrowLeft :size="18" />
          <span class="back-text">All Problems</span>
        </el-button>
        <div class="divider"></div>
        <div class="problem-nav-info" v-if="problem">
          <span class="nav-title">{{ problem.title }}</span>
        </div>
      </div>
      <div class="header-right">
        <el-button class="action-btn run-btn" @click="handleRun">
          <Play :size="14" fill="currentColor" />
          Run
        </el-button>
        <el-button class="action-btn submit-btn" type="primary" @click="handleSubmit">
          Submit
        </el-button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loader"></div>
    </div>

    <!-- Main Content (Resizable) -->
    <div v-else-if="problem" class="problem-content">
      
      <!-- Left Panel: Content -->
      <div class="left-panel" :style="{ width: `${leftWidth}%` }">
        <div class="panel-tabs">
          <button 
            v-for="tab in ['Description', 'Editorial', 'Solutions']"
            :key="tab"
            class="tab-btn" 
            :class="{ active: activeTab === tab.toLowerCase() }"
            @click="activeTab = tab.toLowerCase()"
          >
            {{ tab }}
          </button>
        </div>

        <div class="panel-content custom-scrollbar">
          <!-- Description Tab -->
          <div v-if="activeTab === 'description'" class="description-wrapper">
            <div class="problem-title-section">
              <h1 class="problem-title">{{ problem.title }}</h1>
              <div class="problem-meta">
                <span class="badge" :class="getDifficultyClass(problem.difficulty)">
                  {{ problem.difficulty }}
                </span>
              </div>
            </div>

            <div class="rich-content" v-html="problem.description"></div>

            <!-- Examples -->
            <div v-if="problem.examples && problem.examples.length > 0" class="examples-section">
              <div v-for="(example, index) in problem.examples" :key="index" class="example-card">
                <div class="example-header">Example {{ index + 1 }}</div>
                <div class="example-body">
                  <div class="io-group">
                    <span class="io-label">Input:</span>
                    <code class="io-content">{{ example.inputData }}</code>
                  </div>
                  <div class="io-group">
                    <span class="io-label">Output:</span>
                    <code class="io-content">{{ example.outputData }}</code>
                  </div>
                  <div v-if="example.explanation" class="io-group explanation">
                    <span class="io-label">Explanation:</span>
                    <div class="explanation-content" v-html="example.explanation"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Constraints -->
            <div class="constraints-section">
              <h3 class="section-title">Constraints</h3>
              <div class="rich-content constraints-content" v-html="problem.constraints"></div>
            </div>
          </div>
          
          <div v-else class="placeholder-content">
            <div class="empty-state">
              <span>Coming Soon</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Horizontal Splitter -->
      <div class="h-splitter" @mousedown.prevent="startHorizontalDrag">
        <div class="splitter-handle"></div>
      </div>

      <!-- Right Panel: Code + Testcase -->
      <div class="right-panel" :style="{ width: `calc(${100 - leftWidth}% - 6px)` }">
        
        <!-- Editor Part -->
        <div class="editor-section" :style="{ height: `${rightTopHeight}%` }">
          <div class="editor-header">
            <div class="code-lang-wrapper">
               <span class="code-icon">&lt;/&gt;</span>
               <span class="code-label">Code</span>
            </div>
            <div class="lang-selector">
              <el-select v-model="selectedLanguage" size="small" class="lang-select">
                <el-option
                  v-for="lang in languageOptions"
                  :key="lang.value"
                  :label="lang.label"
                  :value="lang.value"
                />
              </el-select>
              <button class="icon-btn"><Settings :size="14" /></button>
            </div>
          </div>
          <div class="editor-container" ref="editorContainer"></div>
        </div>

        <!-- Vertical Splitter -->
        <div class="v-splitter" @mousedown.prevent="startVerticalDrag">
             <div class="splitter-dots">...</div>
        </div>

        <!-- Testcase Part -->
        <div class="testcase-panel" :style="{ height: `calc(${100 - rightTopHeight}% - 6px)` }">
          <div class="testcase-header">
            <div class="testcase-title-group">
               <span class="testcase-icon">☑</span>
               <span class="testcase-title">Testcase</span>
            </div>
            <button class="icon-btn" @click="rightTopHeight = rightTopHeight > 90 ? 60 : 96">
               <component :is="rightTopHeight > 90 ? ChevronUp : ChevronDown" :size="14"/>
            </button>
          </div>
          <div class="testcase-content custom-scrollbar">
             <!-- Static for now as requested UI only -->
            <div class="testcase-tabs">
              <button class="case-tab active">Case 1</button>
              <button class="case-tab">Case 2</button>
            </div>
            <div class="testcase-inputs">
              <div class="input-group">
                <label>Input</label>
                <div class="input-display">nums = [2,7,11,15], target = 9</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.problem-view {
  height: calc(100vh - 56px);
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
  color: #e0e0e0;
  user-select: none; /* Prevent text selection during drag */
}

.problem-view.is-dragging {
  cursor: col-resize;
}
.problem-view.is-dragging .left-panel, 
.problem-view.is-dragging .right-panel {
  pointer-events: none; /* Prevent iframe/editor interference */
}

/* Header */
.problem-header {
  height: 50px;
  background: #262626;
  border-bottom: 1px solid #333;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;
}
/* ... Header styles same as before mostly ... */
.header-left { display: flex; align-items: center; gap: 16px; }
.back-btn { color: #a0a0a0; font-weight: 500; font-size: 13px; }
.back-btn:hover { color: #fff; }
.divider { width: 1px; height: 20px; background: #404040; }
.nav-title { font-weight: 600; font-size: 14px; max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.header-right { display: flex; gap: 12px; }
.action-btn { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; font-size: 13px; border-radius: 6px; padding: 0 16px; height: 32px; transition: all 0.2s; border: none; }
.run-btn { background: #333; color: #e0e0e0; border: 1px solid #404040; }
.run-btn:hover { background: #404040; color: #fff; }
.submit-btn { background: #2cbb5d; color: #fff; }
.submit-btn:hover { background: #3ddc72; }

/* Layout */
.problem-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  height: calc(100vh - 106px);
}

.left-panel {
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
  min-width: 20%;
  max-width: 80%;
}

.right-panel {
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  min-width: 20%;
}

/* Splitters */
.h-splitter {
  width: 6px;
  background: #1a1a1a;
  cursor: col-resize;
  display: flex;
  justify-content: center;
  align-items: center;
  border-left: 1px solid #333;
  border-right: 1px solid #333;
  transition: background 0.2s;
}
.h-splitter:hover, .h-splitter:active { background: #ffa116; }

.v-splitter {
  height: 6px;
  background: #1e1e1e;
  cursor: row-resize;
  display: flex;
  justify-content: center;
  align-items: center;
  border-top: 1px solid #333;
  border-bottom: 1px solid #333;
  width: 100%;
}
.v-splitter:hover, .v-splitter:active { background: #ffa116; }
.splitter-dots { font-size: 10px; line-height: 2px; color: #666; letter-spacing: 2px; position: relative; top: -3px; }

/* Left Content */
.panel-tabs { height: 40px; background: #262626; display: flex; padding: 0 16px; gap: 20px; border-bottom: 1px solid #333; }
.tab-btn { background: transparent; border: none; color: #888; font-size: 13px; font-weight: 500; cursor: pointer; padding: 10px 0; position: relative; }
.tab-btn.active { color: #fff; font-weight: 600; }
.tab-btn.active::after { content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 2px; background: #ffa116; }

.panel-content { flex: 1; overflow-y: auto; }
.description-wrapper { padding: 20px 24px; }
.problem-title { font-size: 20px; font-weight: 600; margin-bottom: 12px; }
.problem-meta { margin-bottom: 20px; }
.badge { padding: 3px 10px; border-radius: 12px; font-size: 11px; background: rgba(255, 255, 255, 0.1); }
.difficulty-easy { color: #00b8a3; background: rgba(0, 184, 163, 0.15); }
.difficulty-medium { color: #ffc01e; background: rgba(255, 192, 30, 0.15); }
.difficulty-hard { color: #ef4743; background: rgba(239, 71, 67, 0.15); }

/* Rich Content - Unified Fonts */
.rich-content { font-size: 14px; line-height: 1.6; color: #d0d0d0; }
.rich-content :deep(pre), .rich-content :deep(code) { 
  font-family: 'JetBrains Mono', monospace; 
  background: rgba(255,255,255,0.07); 
  padding: 2px 4px; 
  border-radius: 4px; 
  font-size: 13px; /* Match Example font size */
}
.rich-content :deep(pre) { padding: 12px; overflow-x: auto; margin: 12px 0; }
.rich-content :deep(p) { margin-bottom: 12px; }
.rich-content :deep(ul), .rich-content :deep(ol) { 
  padding-left: 20px; 
  margin-left: 10px;
  margin-bottom: 12px;
}
.rich-content :deep(li) { margin-bottom: 6px; }
.rich-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 16px 0;
  display: block;
}

/* Examples */
.examples-section { margin: 24px 0; }
.example-card { margin-bottom: 24px; }
.example-header { font-weight: 600; margin-bottom: 12px; font-size: 14px; color: #e0e0e0; }
.example-body { 
  background: rgba(255, 255, 255, 0.04); 
  border-radius: 8px; 
  padding: 16px; 
  border-left: 2px solid rgba(255, 255, 255, 0.1); 
}
.io-group { margin-bottom: 12px; display: flex; gap: 8px; align-items: flex-start; }
.io-label { font-weight: 600; color: #888; min-width: 50px; font-size: 13px; margin-top: 2px; }
.io-content { font-family: 'JetBrains Mono', monospace; color: #fff; font-size: 13px; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; flex: 1; }

/* Explanation Fix */
.explanation { flex-direction: column; gap: 6px; }
.explanation-content { 
  font-size: 14px; 
  color: #d0d0d0; 
  background: transparent;
  padding: 0;
}
.explanation-content :deep(pre) { 
  background: rgba(255, 255, 255, 0.05); 
  padding: 12px; 
  border-radius: 6px; 
  overflow-x: auto;
  margin: 8px 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  white-space: pre-wrap; /* Wrap long text */
}

/* Constraints Fix */
.constraints-section { margin-top: 32px; }
.section-title { font-size: 15px; font-weight: 600; color: #fff; margin-bottom: 16px; }
.constraints-content :deep(ul), .constraints-content :deep(ol) { 
  padding-left: 20px; 
  margin-left: 10px; /* Add margin to ensure bullets are visible */
}
.constraints-content :deep(li) { 
  margin-bottom: 8px; 
  color: #ccc;
}

/* Right Panel specific */
.editor-section { display: flex; flex-direction: column; min-height: 100px; } 

.editor-header {
  height: 40px;
  background: #262626;
  border-bottom: 1px solid #333;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
}
.code-lang-wrapper { display: flex; align-items: center; gap: 6px; color: #2cbb5d; font-size: 13px; font-weight: 600; }
.lang-selector { display: flex; align-items: center; gap: 8px; }
.lang-select { width: 110px; }
.icon-btn { background: transparent; border: none; color: #888; cursor: pointer; padding: 4px; border-radius: 4px; }
.icon-btn:hover { background: #333; color: #fff; }

.editor-container { flex: 1; overflow: hidden; }

/* Testcase Panel */
.testcase-panel { display: flex; flex-direction: column; background: #1e1e1e; min-height: 40px; } 
.testcase-header { height: 36px; background: #262626; display: flex; align-items: center; justify-content: space-between; padding: 0 12px; cursor: pointer; }
.testcase-title-group { display: flex; align-items: center; gap: 6px; color: #a0a0a0; font-size: 12px; font-weight: 600; }
.testcase-content { padding: 16px; flex: 1; overflow-y: auto; }
.testcase-tabs { display: flex; gap: 8px; margin-bottom: 12px; }
.case-tab { padding: 4px 12px; background: rgba(255,255,255,0.05); border: none; border-radius: 4px; color: #888; font-size: 12px; cursor: pointer; }
.case-tab.active { background: rgba(255,255,255,0.1); color: #fff; }
.input-display { background: rgba(255,255,255,0.04); padding: 8px; border-radius: 4px; font-family: monospace; font-size: 13px; color: #ccc; margin-top: 4px; }

:deep(.el-select__wrapper) { background-color: #333 !important; box-shadow: none !important; border: none !important; }
:deep(.el-select__placeholder) { color: #e0e0e0 !important; font-size: 12px; }

/* Loading */
.loading-container { flex: 1; display: flex; justify-content: center; align-items: center; background: #1a1a1a; }
.loader { width: 32px; height: 32px; border: 3px solid #333; border-bottom-color: #ffa116; border-radius: 50%; animation: rotation 1s linear infinite; }
@keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
