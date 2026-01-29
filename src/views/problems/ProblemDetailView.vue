<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProblemStore } from '../../stores/problem'
import { ArrowLeft, Play, Send } from 'lucide-vue-next'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

// Configure Monaco Workers
self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
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
  { label: 'Go', value: 'go' }
]

const getDifficultyClass = (difficulty) => {
  const classes = {
    'EASY': 'difficulty-easy',
    'MEDIUM': 'difficulty-medium',
    'HARD': 'difficulty-hard'
  }
  return classes[difficulty] || ''
}

const initMonaco = () => {
  if (!editorContainer.value) return

  editorInstance = monaco.editor.create(editorContainer.value, {
    value: getInitialCode(),
    language: selectedLanguage.value,
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false }, // Keep minimap off for clean look, or enable if requested
    fontSize: 14,
    lineHeight: 24,
    padding: { top: 16, bottom: 16 },
    scrollBeyondLastLine: false,
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    fontLigatures: true,
    renderLineHighlight: 'all',
    bracketPairColorization: {
      enabled: true,
    },
    suggest: {
      showKeywords: true,
      showSnippets: true,
    },
    scrollbar: {
      vertical: 'visible',
      horizontal: 'visible',
      useShadows: false,
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10
    }
  })

  editorInstance.onDidChangeModelContent(() => {
    // Handle content change if needed
  })
}

const getInitialCode = () => {
  if (problem.value?.templates?.length > 0) {
    const template = problem.value.templates.find(t => t.language.toLowerCase() === selectedLanguage.value.toLowerCase())
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

onBeforeUnmount(() => {
  if (editorInstance) {
    editorInstance.dispose()
  }
})
</script>

<template>
  <div class="problem-view">
    <!-- Header -->
    <div class="problem-header">
      <div class="header-left">
        <el-button link @click="router.push('/')" class="back-btn">
          <ArrowLeft :size="18" />
          <span class="back-text">Problem List</span>
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

    <!-- Main Content -->
    <div v-else-if="problem" class="problem-content">
      <!-- Left Panel: Description -->
      <div class="left-panel">
        <div class="panel-tabs">
          <button 
            v-for="tab in ['Description', 'Editorial', 'Solutions', 'Submissions']"
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

          <!-- Other Tabs -->
          <div v-else class="placeholder-content">
            <div class="empty-state">
              <span class="empty-icon">🚧</span>
              <h3>{{ activeTab.charAt(0).toUpperCase() + activeTab.slice(1) }}</h3>
              <p>This content is coming soon.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel: Code Editor -->
      <div class="right-panel">
        <div class="editor-header">
          <div class="lang-selector">
            <span class="lang-label">Language:</span>
            <el-select v-model="selectedLanguage" size="small" class="lang-select">
              <el-option
                v-for="lang in languageOptions"
                :key="lang.value"
                :label="lang.label"
                :value="lang.value"
              />
            </el-select>
          </div>
          <div class="editor-tools">
            <!-- Add tools here if needed -->
          </div>
        </div>

        <div class="editor-container" ref="editorContainer"></div>

        <div class="testcase-panel">
          <div class="testcase-header">
            <span class="testcase-title">Testcase</span>
          </div>
          <div class="testcase-content custom-scrollbar">
            <div class="testcase-tabs">
              <button class="case-tab active">Case 1</button>
              <button class="case-tab">Case 2</button>
            </div>
            <div class="testcase-inputs">
              <!-- Placeholder for dynamic inputs -->
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
}

/* Header styling */
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

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  color: #a0a0a0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  padding: 0;
  height: auto;
  font-size: 13px;
}

.back-btn:hover {
  color: #fff;
}

.divider {
  width: 1px;
  height: 20px;
  background: #404040;
}

.nav-title {
  font-weight: 600;
  color: #fff;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-weight: 600;
  font-size: 13px;
  border-radius: 6px;
  padding: 0 16px;
  height: 32px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.run-btn {
  background: #333;
  border: 1px solid #404040;
  color: #e0e0e0;
}

.run-btn:hover {
  background: #404040;
  border-color: #505050;
  color: #fff;
}

.submit-btn {
  background: #ffa116;
  border: none;
  color: #fff; /* Changed to white for better contrast or stick to black if requested, usually white on orange is readable or black on orange */
}

/* User asked for orange theme, usually text is white or black. Previous was black. Let's keep black if it was legible, or white. LeetCode uses white on green submit, but orange theme usually uses white or black. Let's try white for better "premium" dark mode feel, or black for contrast. Let's stick to black for now to match other orange buttons, or check LeetCode styling. LeetCode submit is blue/green. We use orange. Black on Orange is high contrast. */
.submit-btn {
  background: #ffa116;
  border: none;
  color: #000;
}

.submit-btn:hover {
  background: #ffb347;
}

/* Layout */
.problem-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.left-panel {
  width: 50%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #333;
  background: #1a1a1a;
}

.right-panel {
  width: 50%;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
}

/* Tabs */
.panel-tabs {
  height: 48px;
  background: #262626;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 20px;
  border-bottom: 1px solid #333;
  flex-shrink: 0;
}

.tab-btn {
  background: transparent;
  border: none;
  color: #888;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 14px 0;
  position: relative;
  transition: color 0.2s;
}

.tab-btn:hover {
  color: #e0e0e0;
}

.tab-btn.active {
  color: #fff;
  font-weight: 600;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: #ffa116;
  border-radius: 2px 2px 0 0;
}

/* Panel Content */
.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 0; /* Reset padding here to handle it in inner wrapper */
  display: flex;
  flex-direction: column;
}

.description-wrapper {
  padding: 24px 32px; /* Add more horizontal padding */
  max-width: 100%;
  box-sizing: border-box;
}

.problem-title {
  font-size: 24px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 12px 0;
  line-height: 1.3;
}

.problem-meta {
  margin-bottom: 24px;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  text-transform: capitalize;
  background: rgba(255, 255, 255, 0.1);
}

.difficulty-easy { color: #00b8a3; background: rgba(0, 184, 163, 0.15); }
.difficulty-medium { color: #ffc01e; background: rgba(255, 192, 30, 0.15); }
.difficulty-hard { color: #ef4743; background: rgba(239, 71, 67, 0.15); }

/* Rich Content Styling */
.rich-content {
  font-size: 14px;
  line-height: 1.6;
  color: #d0d0d0;
}

.rich-content :deep(p) { margin-bottom: 16px; }
.rich-content :deep(ul), 
.rich-content :deep(ol) {
  margin-bottom: 16px;
  padding-left: 24px; /* Ensure list bullets are inside */
}
.rich-content :deep(li) {
  margin-bottom: 8px;
}
.rich-content :deep(strong) { color: #fff; font-weight: 600; }
.rich-content :deep(code) {
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 5px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: #e0e0e0;
}
.rich-content :deep(pre) {
  background: rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
}
.rich-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 16px 0;
  display: block;
}

/* Examples */
.examples-section { margin: 32px 0; }
.example-card { margin-bottom: 24px; }
.example-header {
  font-weight: 600;
  color: #fff;
  margin-bottom: 12px;
  font-size: 14px;
}
.example-body {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 16px;
  border-left: 2px solid rgba(255, 255, 255, 0.1);
}

.io-group { margin-bottom: 8px; display: flex; gap: 8px; }
.io-group:last-child { margin-bottom: 0; }
.io-label { font-weight: 600; color: #a0a0a0; min-width: 50px; }
.io-content { color: #e0e0e0; font-family: 'JetBrains Mono', monospace; }
.explanation { flex-direction: column; gap: 4px; }

/* Constraints */
.constraints-section { margin-top: 32px; }
.section-title { font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 12px; }
.constraints-content :deep(ul) { padding-left: 20px; }
.constraints-content :deep(li) { margin-bottom: 8px; }

/* Code Editor Panel */
.editor-header {
  height: 48px;
  background: #262626;
  border-bottom: 1px solid #333;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
}

.lang-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lang-label {
  font-size: 12px;
  color: #888;
}

.lang-select {
  width: 120px;
}

.editor-container {
  flex: 1;
  overflow: hidden;
}

/* Testcase Panel */
.testcase-panel {
  height: 200px;
  background: #1e1e1e;
  border-top: 1px solid #333;
  display: flex;
  flex-direction: column;
}

.testcase-header {
  height: 36px;
  background: #262626;
  display: flex;
  align-items: center;
  padding: 0 16px;
}

.testcase-title {
  font-size: 12px;
  font-weight: 600;
  color: #a0a0a0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.testcase-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.testcase-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.case-tab {
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-radius: 6px;
  color: #a0a0a0;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.case-tab:hover { background: rgba(255, 255, 255, 0.1); color: #e0e0e0; }
.case-tab.active { background: rgba(255, 255, 255, 0.1); color: #fff; font-weight: 600; }

.input-group {
  margin-bottom: 12px;
}

.input-group label {
  display: block;
  font-size: 11px;
  color: #888;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.input-display {
  background: rgba(255, 255, 255, 0.05);
  padding: 10px;
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: #e0e0e0;
}

/* Scrollbar */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #404040; border-radius: 3px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #505050; }

/* Helper classes */
:deep(.el-select__wrapper) {
  background-color: #333 !important;
  box-shadow: none !important;
  border: 1px solid #404040 !important;
}

:deep(.el-select__wrapper:hover) {
  border-color: #666 !important;
}

:deep(.el-select__placeholder) {
  color: #e0e0e0 !important;
}

/* Loading */
.loading-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #1a1a1a;
}

.loader {
  width: 48px;
  height: 48px;
  border: 4px solid #333;
  border-bottom-color: #ffa116;
  border-radius: 50%;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 1024px) {
  .problem-content { flex-direction: column; }
  .left-panel, .right-panel { width: 100%; height: 50%; }
  .left-panel { border-right: none; border-bottom: 1px solid #333; }
}
</style>
