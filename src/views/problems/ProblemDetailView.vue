<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProblemStore } from '../../stores/problem'
import { useAuthStore } from '../../stores/auth'
import { ArrowLeft, Play, Send, MoreVertical, RotateCcw, History, ChevronUp, ChevronDown, Tag, Copy, Check, Plus, X, Lightbulb, LogIn, User, Globe, Award } from 'lucide-vue-next'
import { ElMessage, ElNotification } from 'element-plus'
import * as monaco from 'monaco-editor'
import { useSubmissionStore } from '../../stores/submission'
import StatisticsTab from '../../components/problems/StatisticsTab.vue'
import SubmissionsTab from '../../components/problems/SubmissionsTab.vue'
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
const submissionStore = useSubmissionStore()

const executionLoading = ref(false)
const executionResult = ref(null)

const problem = ref(null)
const loading = ref(true)
const selectedLanguage = ref('java')
const editorContainer = ref(null)
const submissionsTabRef = ref(null)
const isTopicsExpanded = ref(false)
const isHintExpanded = ref(false)

// Tab is driven by the URL: /problems/:slug/:tab
const VALID_TABS = ['description', 'submissions', 'statistics']
const activeTab = computed(() => {
  const t = route.params.tab
  return VALID_TABS.includes(t) ? t : 'description'
})

const switchTab = (tab) => {
  router.push({ name: 'problem-detail', params: { slug: route.params.slug, tab } })
}

const authStore = useAuthStore()

const scrollToTopics = () => {
  isTopicsExpanded.value = true
  nextTick(() => {
    const el = document.getElementById('topics-section')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  })
}

const scrollToHint = () => {
  isHintExpanded.value = true
  nextTick(() => {
    const el = document.getElementById('hint-section')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  })
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
let editorInstance = null

// Testcase Logic
const activeTestcaseIndex = ref(0)
const sampleTestcases = ref([])

const copiedStates = ref({}) 
const copyToClipboard = async (text, key) => {
   try {
       await navigator.clipboard.writeText(text || '')
       copiedStates.value[key] = true
       setTimeout(() => { copiedStates.value[key] = false }, 2000)
   } catch(e) {
       console.error('Failed to copy', e)
   }
}

watch(problem, (newProb) => { 
    if (newProb?.examples) {
        sampleTestcases.value = JSON.parse(JSON.stringify(newProb.examples)).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
    } else {
        sampleTestcases.value = []
    }
    activeTestcaseIndex.value = 0 
})

const addCustomTestcase = () => {
    const maxCustom = (problem.value?.examples?.length || 0) + 3
    if (sampleTestcases.value.length >= maxCustom) {
        ElMessage.warning('You can only create up to 3 custom testcases.')
        return
    }
    sampleTestcases.value.push({
        id: 'custom-' + Date.now(),
        rawInput: '',
        rawOutput: '',
        isCustom: true
    })
    activeTestcaseIndex.value = sampleTestcases.value.length - 1
}

const removeCustomTestcase = (index) => {
    sampleTestcases.value.splice(index, 1)
    if (activeTestcaseIndex.value >= sampleTestcases.value.length) {
        activeTestcaseIndex.value = Math.max(0, sampleTestcases.value.length - 1)
    } else if (activeTestcaseIndex.value > index) {
        activeTestcaseIndex.value--
    }
}

// Fetch content if needed when active index changes
watch(activeTestcaseIndex, async (newIndex) => {
    if (!sampleTestcases.value[newIndex]) return
    await loadTestcaseContent(sampleTestcases.value[newIndex])
})

const loadTestcaseContent = async (tc) => {
    return;
    
    // Initialize state
    testcaseContent.value[tc.id] = { input: tc.inputData, output: tc.outputData, loading: false }
    
    // If data is already there, done.
    if (tc.inputData && tc.outputData) return

    testcaseContent.value[tc.id].loading = true
    try {
        // Fetch Input if missing
        if (!tc.inputData && tc.inputUrl) {
            // Note: user said inputUrl is raw key, need to use FileController
            // Endpoint: /api/files/view?key={key}
            // Use axios directly or store helper? Axios is fine here.
            // We need to import axios instance.
            // Assuming we can use fetch for now or import axios.
            // Let's use the existing axios instance if available, or fetch.
            // Since we don't have axios imported in <script setup>, let's import it.
            // Actually, we can use fetch with authentication header if needed?
            // FileController /view is public? Let's check... YES, no @PreAuthorize on viewFile.
            
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/files/view?key=${encodeURIComponent(tc.inputUrl)}`)
            if (res.ok) {
                testcaseContent.value[tc.id].input = await res.text()
            }
        }
        
        // Fetch Output if missing
        if (!tc.outputData && tc.outputUrl) {
             const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/files/view?key=${encodeURIComponent(tc.outputUrl)}`)
            if (res.ok) {
                testcaseContent.value[tc.id].output = await res.text()
            }
        }
    } catch (e) {
        console.error('Failed to load testcase content', e)
        testcaseContent.value[tc.id].error = true
    } finally {
        testcaseContent.value[tc.id].loading = false
    }
}

// Initial load for first case
watch(sampleTestcases, (newVal) => {
    if (newVal.length > 0) {
        loadTestcaseContent(newVal[0])
    }
}, { immediate: true })

const languageOptions = ref([])

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
const getMonacoLang = (backendKey) => {
   const map = {
       'CPP': 'cpp',
       'C': 'c',
       'JAVA': 'java',
       'PYTHON3': 'python',
   }
   return map[backendKey] || 'plaintext'
}

const initMonaco = () => {
  if (!editorContainer.value) return

  editorInstance = monaco.editor.create(editorContainer.value, {
    value: getInitialCode(),
    language: getMonacoLang(selectedLanguage.value),
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
    },
    // Enhanced suggestions
    suggestOnTriggerCharacters: true,
    quickSuggestions: {
      other: true,
      comments: true,
      strings: true
    },
    wordBasedSuggestions: 'allDocuments',
    snippetSuggestions: 'top',
    suggestSelection: 'first',
    acceptSuggestionOnEnter: 'on',
    tabCompletion: 'on',
    formatOnType: true,
    formatOnPaste: true,
    suggest: {
      showWords: true,
      showSnippets: true,
      showFunctions: true,
      showVariables: true,
      showConstants: true,
      showClasses: true,
    }
  })
}

const getInitialCode = () => {
  if (problem.value?.templates?.length > 0) {
    const template = problem.value.templates.find(t => t.languageKey === selectedLanguage.value)
    return template?.codeTemplate || '// Write your code here...'
  }
  return '// Write your code here...'
}

watch(selectedLanguage, (newLangKey) => {
  if (editorInstance) {
    const model = editorInstance.getModel()
    monaco.editor.setModelLanguage(model, getMonacoLang(newLangKey))
    editorInstance.setValue(getInitialCode())
  }
})

const handleSubmit = async () => {
  if (!authStore.isAuthenticated) {
    ElMessage.warning('Vui lòng đăng nhập để nộp bài')
    router.push('/login')
    return
  }
  const code = editorInstance?.getValue()
  if (!code) {
      ElMessage.warning('Vui lòng nhập code trước khi nộp bài')
      return;
  }
  
  try {
     const payload = {
        problemId: problem.value.id,
        languageKey: selectedLanguage.value,
        sourceCode: code
     }
     
     ElMessage.info('Đang nộp bài...')
     const submissionId = await submissionStore.submitCode(payload)
     
     // Switch to submissions tab
     switchTab('submissions')
     
     submissionStore.startPollingSubmission(submissionId,
       (res) => {
          ElNotification({
            title: 'Chấm bài hoàn tất',
            message: `Kết quả: ${res.verdict}`,
            type: res.verdict === 'AC' ? 'success' : 'warning'
          })
          // Reload the submissions tab to show updated result
          submissionsTabRef.value?.loadSubmissions()
       },
       (err) => {
          ElMessage.error('Chấm bài thất bại hoặc quá thời gian chờ.')
       }
     )
  } catch (e) {
      console.error(e)
  }
}

const handleRun = async () => {
  if (!authStore.isAuthenticated) {
    ElMessage.warning('Vui lòng đăng nhập để chạy thử code')
    router.push('/login')
    return
  }
  const code = editorInstance?.getValue()
  if (!code) {
      ElMessage.warning('Vui lòng nhập code trước khi chạy thử')
      return;
  }
  
  try {
     const payload = {
        problemId: problem.value.id,
        languageKey: selectedLanguage.value,
        sourceCode: code,
        customInputs: sampleTestcases.value.map(tc => ({ rawInput: tc.rawInput }))
     }
     
     const token = await submissionStore.runCode(payload)
     
     activeTestcaseIndex.value = -1 
     executionLoading.value = true
     executionResult.value = null
     rightTopHeight.value = 60
     
     submissionStore.startPollingRunCode(token, 
       (res) => {
          executionLoading.value = false
          executionResult.value = res
       },
       (err) => {
          executionLoading.value = false
          ElMessage.error(err.message || 'Chạy code thất bại hoặc quá thời gian chờ.')
       }
     )
  } catch (e) {
      console.error(e)
  }
}

const handleBack = () => {
  router.push('/problems')
}

// Reset editor to the problem's default template for current language
const handleResetCode = () => {
  if (editorInstance) {
    editorInstance.setValue(getInitialCode())
    ElMessage.success('Code đã được reset về mặc định')
  }
}

// TODO: Implement API call to retrieve last submitted code when BE is ready
const handleRetrieveLastCode = async () => {
  try {
    const sourceCode = await submissionStore.getLatestSubmissionSourceCode(problem.value.id, selectedLanguage.value)
    if (editorInstance) {
      editorInstance.setValue(sourceCode ? sourceCode : getInitialCode())
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('Lấy mã nguồn thất bại')
  }
}

const initPage = async () => {
  try {
    loading.value = true
    const slug = route.params.slug
    if (!slug) return

    problem.value = await problemStore.fetchProblemBySlug(slug)
    
    // Setup Languages
    if (problem.value && problem.value.allowedLanguages) {
        const displayMap = {
            'JAVA': 'Java',
            'CPP': 'C++',
            'PYTHON3': 'Python 3',
            'C': 'C',
            'JAVASCRIPT': 'JavaScript',
            'GO': 'Go'
        }
        
        languageOptions.value = problem.value.allowedLanguages.map(l => ({
            label: displayMap[l] || l,
            value: l
        }))
            
        if (languageOptions.value.length > 0) {
            // Only set if not already set or if current not in allowed
            if (!selectedLanguage.value || !problem.value.allowedLanguages.includes(selectedLanguage.value)) {
              selectedLanguage.value = languageOptions.value[0].value
            }
        }
    }
  } catch (error) {
    console.error('Failed to load problem:', error)
  } finally {
    loading.value = false
    nextTick(() => {
      if (editorInstance) {
        editorInstance.setValue(getInitialCode())
        const model = editorInstance.getModel()
        if (model) monaco.editor.setModelLanguage(model, getMonacoLang(selectedLanguage.value))
      } else {
        initMonaco()
      }
    })
  }
}

onMounted(initPage)

watch(() => route.params.slug, (newSlug, oldSlug) => {
  if (newSlug && newSlug !== oldSlug) {
    initPage()
  }
})
</script>

<template>
  <div class="problem-view" :class="{ 'is-dragging': isDraggingHorizontal || isDraggingVertical }">
    <!-- Header -->
    <div class="problem-header">
      <div class="header-left">
        <el-button link @click="handleBack" class="back-btn">
          <ArrowLeft :size="18" />
          <span class="back-text">All Problems</span>
        </el-button>
        <div class="divider"></div>
        <div class="problem-nav-info" v-if="problem">
          <span class="nav-title">{{ problem.title }}</span>
        </div>
      </div>
      <div class="header-right">
        <el-tooltip
          v-if="!authStore.isAuthenticated"
          content="Đăng nhập để chạy thử"
          placement="bottom"
          effect="dark"
        >
          <el-button class="action-btn run-btn guest-btn" @click="handleRun">
            <LogIn class="run-icon" :size="14" />
            Run
          </el-button>
        </el-tooltip>
        <el-button v-else class="action-btn run-btn" @click="handleRun">
          <Play class="run-icon" :size="14" fill="currentColor" />
          Run
        </el-button>

        <el-tooltip
          v-if="!authStore.isAuthenticated"
          content="Đăng nhập để nộp bài"
          placement="bottom"
          effect="dark"
        >
          <el-button class="action-btn submit-btn guest-btn" @click="handleSubmit">
            <LogIn class="run-icon" :size="14" />
            Submit
          </el-button>
        </el-tooltip>
        <el-button v-else class="action-btn submit-btn" type="primary" @click="handleSubmit">
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
            v-for="tab in ['description', 'submissions', 'statistics']"
            :key="tab"
            class="tab-btn" 
            :class="{ active: activeTab === tab }"
            @click="switchTab(tab)"
          >
            {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
          </button>
        </div>

        <div class="panel-content custom-scrollbar">
          <!-- Description Tab -->
          <div v-if="activeTab === 'description'" class="description-wrapper">
            <div class="problem-title-section">
              <h1 class="problem-title">{{ problem.title }}</h1>
              
              <div class="problem-meta-new">
                <!-- Row 1: Information (Author, Source, Score) -->
                <div class="meta-row info-row">
                  <div class="meta-item-wrap">
                    <User :size="14" class="meta-icon author-icon" />
                    <span class="meta-label">Author:</span>
                    <router-link :to="`/users/${problem.author?.userId}`" class="meta-link author-name">
                      {{ problem.author?.authorName }}
                    </router-link>
                  </div>

                  <div class="meta-item-wrap" v-if="problem.source">
                    <Globe :size="14" class="meta-icon source-icon" />
                    <span class="meta-label">Source:</span>
                    <span class="meta-text">{{ problem.source }}</span>
                  </div>

                  <div class="meta-item-wrap" v-if="problem.totalScore">
                    <Award :size="14" class="meta-icon score-icon" />
                    <span class="meta-label">Score:</span>
                    <span class="meta-text">{{ problem.totalScore }} Points</span>
                  </div>
                </div>

                <!-- Row 2: Badges & Interactions (Difficulty, Topics, Hint) -->
                <div class="meta-row badge-row">
                  <span class="badge" :class="getDifficultyClass(problem.difficulty)">
                    {{ problem.difficulty }}
                  </span>
                  
                  <button 
                    v-if="problem.topics && problem.topics.length > 0" 
                    class="meta-btn"
                    @click="scrollToTopics"
                  >
                    <Tag :size="12" />
                    Topics
                  </button>

                  <button 
                    v-if="problem.hint" 
                    class="meta-btn"
                    @click="scrollToHint"
                  >
                    <Lightbulb :size="12" />
                    Hint
                  </button>
                </div>
              </div>
            </div>

            <div class="rich-content" v-html="problem.description"></div>

            <!-- Input / Output Format -->
            <div v-if="problem.inputFormat || problem.outputFormat" class="format-section">
              <div v-if="problem.inputFormat" class="format-block">
                <h3 class="section-title">Input Format</h3>
                <div class="rich-content" v-html="problem.inputFormat"></div>
              </div>
              <div v-if="problem.outputFormat" class="format-block">
                <h3 class="section-title">Output Format</h3>
                <div class="rich-content" v-html="problem.outputFormat"></div>
              </div>
            </div>

            <!-- Examples -->
            <div v-if="problem.examples && problem.examples.length > 0" class="examples-section">
              <div v-for="(example, index) in problem.examples" :key="index" class="example-card">
                <div class="example-header">Example {{ index + 1 }}</div>
                <div class="example-body">
                  <div class="io-group">
                    <div class="io-header-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                      <span class="io-label">Input:</span>
                      <button class="icon-btn copy-btn" @click="copyToClipboard(example.rawInput, index + '-in')">
                        <component :is="copiedStates[index + '-in'] ? Check : Copy" :size="14" :color="copiedStates[index + '-in'] ? '#2cbb5d' : '#888'" />
                      </button>
                    </div>
                    <pre class="monospace-textarea io-pre bg-dark">{{ example.rawInput }}</pre>
                  </div>
                  <div class="io-group">
                    <div class="io-header-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                      <span class="io-label">Output:</span>
                      <button class="icon-btn copy-btn" @click="copyToClipboard(example.rawOutput, index + '-out')">
                        <component :is="copiedStates[index + '-out'] ? Check : Copy" :size="14" :color="copiedStates[index + '-out'] ? '#2cbb5d' : '#888'" />
                      </button>
                    </div>
                    <pre class="monospace-textarea io-pre bg-dark">{{ example.rawOutput }}</pre>
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

            <!-- Topics Section -->
            <div v-if="problem.topics && problem.topics.length > 0" id="topics-section" class="collapsible-section">
              <div class="collapsible-header" @click="isTopicsExpanded = !isTopicsExpanded">
                 <div class="collapsible-header-left">
                    <Tag :size="16" />
                    <span>Topics</span>
                 </div>
                 <component :is="isTopicsExpanded ? ChevronUp : ChevronDown" :size="16" />
              </div>
              <transition name="collapse">
                <div v-show="isTopicsExpanded" class="topic-tags">
                   <router-link 
                     v-for="topic in problem.topics" 
                     :key="topic.topicId" 
                     :to="`/topics/${topic.slug}`"
                     class="topic-tag clickable"
                   >
                      {{ topic.name }}
                   </router-link>
                </div>
              </transition>
            </div>

            <!-- Hints Section -->
            <div v-if="problem.hint" id="hint-section" class="collapsible-section">
              <div class="collapsible-header" @click="isHintExpanded = !isHintExpanded">
                 <div class="collapsible-header-left">
                    <Lightbulb :size="16" />
                    <span>Hint 1</span>
                 </div>
                 <component :is="isHintExpanded ? ChevronUp : ChevronDown" :size="16" />
              </div>
              <transition name="collapse">
                <div v-show="isHintExpanded" class="collapsible-content">
                  <div class="rich-content hint-content" v-html="problem.hint"></div>
                </div>
              </transition>
            </div>
          </div>

          <!-- Submissions Tab -->
          <div v-if="activeTab === 'submissions'" class="submissions-wrapper">
             <SubmissionsTab ref="submissionsTabRef" :problem-id="problem.id" />
          </div>
          
          <!-- Statistics Tab -->
          <div v-if="activeTab === 'statistics'" class="statistics-wrapper">
             <StatisticsTab :problem-id="problem.id" />
          </div>
          
          <div v-if="!['description', 'submissions', 'statistics'].includes(activeTab)" class="placeholder-content">
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
              <el-select 
                v-model="selectedLanguage" 
                size="small" 
                class="lang-select"
                placement="bottom-end"
                :fallback-placements="['bottom-end']" 
                :fit-input-width="false"
              >
                <el-option
                  v-for="lang in languageOptions"
                  :key="lang.value"
                  :label="lang.label"
                  :value="lang.value"
                />
              </el-select>
              <el-tooltip content="Reset to default code" placement="bottom" effect="dark" :hide-after="0">
                <button class="icon-btn" @click="handleResetCode">
                  <RotateCcw :size="14" />
                </button>
              </el-tooltip>
              <el-tooltip content="Retrieve last submitted code" placement="bottom" effect="dark" :hide-after="0">
                <button class="icon-btn" @click="handleRetrieveLastCode">
                  <History :size="14" />
                </button>
              </el-tooltip>
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
             <div v-if="sampleTestcases.length > 0">
                <!-- Tabs -->
                <div class="testcase-tabs-container" style="display: flex; gap: 8px; align-items: center; overflow-x: auto; margin-bottom: 12px; height: 32px;">
                  <div class="testcase-tabs" style="display: flex; gap: 4px; margin: 0;">
                    <div
                      class="case-tab-wrapper"
                      :class="{ 'active': activeTestcaseIndex === -1 }"
                      style="display: flex; align-items: center; position: relative;"
                    >
                      <button 
                        class="case-tab"
                        :class="{ active: activeTestcaseIndex === -1 }"
                        @click="activeTestcaseIndex = -1"
                      >
                        Result <span v-if="executionLoading" style="margin-left: 4px" class="loader-inline"></span>
                      </button>
                    </div>
                    <div
                      v-for="(tc, index) in sampleTestcases" 
                      :key="tc.id || index"
                      class="case-tab-wrapper"
                      :class="{ 'active': activeTestcaseIndex === index }"
                      style="display: flex; align-items: center; position: relative;"
                    >
                      <button 
                        class="case-tab"
                        :class="{ active: activeTestcaseIndex === index }"
                        @click="activeTestcaseIndex = index"
                      >
                        Case {{ index + 1 }}
                      </button>
                      <button v-if="tc.isCustom" class="icon-btn remove-case-btn" @click.stop="removeCustomTestcase(index)" title="Remove Testcase">
                        <X :size="10" />
                      </button>
                    </div>
                  </div>
                  <button class="icon-btn plus-btn" @click="addCustomTestcase" title="Add Custom Testcase">
                      <Plus :size="16" />
                  </button>
                </div>
                
                <!-- Content -->
                <div class="testcase-result" v-if="activeTestcaseIndex === -1">
                    <div v-if="executionLoading" style="padding: 20px; color: #888; text-align: center;">
                        <div class="loader" style="margin: 0 auto 10px; width: 24px; height: 24px;"></div>
                        Đang chờ kết quả từ máy chấm...
                    </div>
                    <div v-else-if="executionResult" class="result-display">
                        <div v-if="executionResult.status === 'FAILED'" style="color: #ef4743; font-family: monospace; white-space: pre-wrap; background: rgba(239, 71, 67, 0.1); padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                           <div style="font-weight: 600; margin-bottom: 8px;">Compile Error:</div>
                           {{ executionResult.compileMessage }}
                        </div>
                        <template v-else>
                            <div v-for="(res, idx) in executionResult.results" :key="idx" class="result-block" style="margin-bottom: 16px; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">
                               <div style="font-weight: 600; margin-bottom: 8px; font-size: 14px" :style="{ color: res.verdict === 'SUCCESS' ? '#2cbb5d' : '#ef4743' }">
                                   Testcase {{ idx + 1 }}: {{ res.verdict || res.status }}
                               </div>
                               <div style="display: flex; gap: 16px; font-size: 12px; color: #a0a0a0; margin-bottom: 8px;">
                                   <span>Time: {{ res.timeTakenMs || 0 }} ms</span>
                               </div>
                               <div v-if="res.errorMessage" style="color: #ef4743; font-family: monospace; white-space: pre-wrap; background: rgba(239, 71, 67, 0.1); padding: 8px; border-radius: 4px; margin-bottom: 8px;">{{ res.errorMessage }}</div>
                               
                               <!-- Display IO -->
                               <div style="display: flex; flex-direction: column; gap: 8px;">
                                   <div v-if="res.input">
                                       <div style="color: #888; font-size: 12px;">Input:</div>
                                       <div class="input-display">{{ res.input }}</div>
                                   </div>
                                   <div>
                                       <div style="color: #888; font-size: 12px;">Your Output:</div>
                                       <div class="input-display">{{ res.output || 'No output' }}</div>
                                   </div>
                                   <div v-if="res.expectedOutput">
                                       <div style="color: #888; font-size: 12px;">Expected:</div>
                                       <div class="input-display">{{ res.expectedOutput }}</div>
                                   </div>
                               </div>
                            </div>
                        </template>
                    </div>
                    <div v-else style="padding: 20px; color: #888; text-align: center;">
                        Chưa có kết quả. Hãy bấm Run để chạy thử.
                    </div>
                </div>

                <div class="testcase-inputs" v-if="activeTestcaseIndex >= 0 && sampleTestcases[activeTestcaseIndex]">
                  <div>
                      <div class="input-group">
                        <label style="margin-bottom: 8px; display: block; color: #a0a0a0; font-size: 13px; font-weight: 500;">Input =</label>
                        <el-input 
                          v-model="sampleTestcases[activeTestcaseIndex].rawInput" 
                          type="textarea"
                          :autosize="{ minRows: 2, maxRows: 15 }"
                          class="custom-textarea monospace-textarea"
                          placeholder="Enter your input here..."
                        />
                      </div>
                  </div>
                </div>
             </div>
             
             <div v-else class="empty-state">
                <span>No public testcases available</span>
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

.problem-view.is-dragging {
  cursor: col-resize;
  user-select: none;
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
.guest-btn { opacity: 0.6; cursor: pointer; }
.guest-btn:hover { opacity: 0.85; }
.run-icon { margin-right: 6px; }

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
/* Meta Section New Design */
.problem-meta-new {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
  padding-bottom: 20px;
  /* border-bottom: 1px solid rgba(255, 255, 255, 0.08); */
}

.meta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.info-row {
  opacity: 0.9;
}

.badge-row {
  gap: 10px;
}

.meta-item-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #a0a0a0;
}

.meta-icon {
  color: #888;
}

.score-icon { color: #ffa116; }
.author-icon { color: #00b8a3; }
.source-icon { color: #5c7cfa; }

.meta-label {
  font-weight: 500;
  color: #888;
}

.meta-text {
  color: #eff2f6;
}

.meta-link {
  color: var(--accent-primary);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
}

.meta-link:hover {
  text-decoration: underline;
  filter: brightness(1.2);
}

.problem-title {
 font-size: 20px; font-weight: 600; margin-bottom: 12px; }
.problem-meta { margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
.badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; background: rgba(255, 255, 255, 0.1); display: flex; align-items: center; justify-content: center;}
.difficulty-easy { color: #00b8a3; background: rgba(0, 184, 163, 0.15); }
.difficulty-medium { color: #ffc01e; background: rgba(255, 192, 30, 0.15); }
.difficulty-hard { color: #ef4743; background: rgba(239, 71, 67, 0.15); }

.meta-btn {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
  line-height: 1.6;
}
.meta-btn:hover { background: rgba(255, 255, 255, 0.15); }

.badge-score {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e0e0e0;
}

.problem-source {
  display: flex;
  align-items: center;
  gap: 4px;
}

.source-label {
  font-weight: 600;
}

.source-value {
  color: #e0e0e0;
}

.problem-author {
  display: flex;
  align-items: center;
  gap: 4px;
}

.author-label {
  font-weight: 600;
}

.author-value {
  color: #e0e0e0;
}

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
.io-group { margin-bottom: 16px; display: flex; flex-direction: column; width: 100%; }
.io-label { font-weight: 600; color: #888; font-size: 13px; }
.io-content { font-family: 'JetBrains Mono', monospace; color: #fff; font-size: 13px; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 6px; white-space: pre-wrap; word-wrap: break-word; }

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
.constraints-section { 
  margin: 32px 0;
 }
.section-title { font-size: 15px; font-weight: 600; color: #fff; margin-bottom: 16px; }
.constraints-content :deep(ul), .constraints-content :deep(ol) { 
  padding-left: 20px; 
  margin-left: 10px; /* Add margin to ensure bullets are visible */
}
.constraints-content :deep(li) { 
  margin-bottom: 8px; 
  color: #ccc;
}

/* Collapsible Sections (Topics, Hints, etc.) */
.collapsible-section {
  border-top: 1px solid #333;
  padding-top: 16px;
  margin-bottom: 16px; 
}
.collapsible-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  color: #fff;
  padding: 8px 0;
}
.collapsible-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}
.collapsible-content {
  margin-top: 8px;
  margin-left: 24px;
}
.topic-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  margin-left: 16px;
}
.topic-tag {
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 12px;
  color: #ccc;
}

/* Smooth Collapse Animation */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease-in-out;
  overflow: hidden;
  max-height: 200px; /* Adjust if topics section grows vertically significantly */
  opacity: 1;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
  padding-top: 0;
  padding-bottom: 0;
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
.lang-select { width: 140px; }
.icon-btn { background: transparent; border: none; color: #888; cursor: pointer; padding: 4px; border-radius: 4px; }
.icon-btn:hover { background: #333; color: #fff; }

.editor-container { flex: 1; overflow: hidden; }

/* Testcase Panel */
.testcase-panel { display: flex; flex-direction: column; background: #1e1e1e; min-height: 40px; } 
.testcase-header { height: 36px; background: #262626; display: flex; align-items: center; justify-content: space-between; padding: 0 12px; cursor: pointer; }
.testcase-title-group { display: flex; align-items: center; gap: 6px; color: #a0a0a0; font-size: 12px; font-weight: 600; }
.testcase-content { padding: 16px; flex: 1; overflow-y: auto; }
.testcase-tabs { display: flex; gap: 8px; margin-bottom: 12px; }
.case-tab-wrapper { background: rgba(255,255,255,0.05); border-radius: 4px; border: 1px solid transparent; }
.case-tab-wrapper.active { background: rgba(255,255,255,0.1); }
.case-tab { padding: 4px 12px; background: transparent !important; border: none; color: #888; font-size: 12px; cursor: pointer; }
.case-tab.active { color: #fff !important; }
.remove-case-btn { 
  position: absolute; 
  top: -4px; 
  right: -4px; 
  padding: 0; 
  border-radius: 50%; 
  color: #ddd; 
  background: rgba(0,0,0,0.8) !important; 
  border: 1px solid rgba(255,255,255,0.2);
  opacity: 0; 
  transition: opacity 0.2s, background 0.2s;
  display: flex !important;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
}
.case-tab-wrapper:hover .remove-case-btn { opacity: 1; }
.remove-case-btn:hover { background: rgba(239, 71, 67, 0.9) !important; color: #fff !important; }
.input-display { background: rgba(255,255,255,0.04); padding: 8px; border-radius: 4px; font-family: monospace; font-size: 13px; color: #ccc; margin-top: 4px; white-space: pre-wrap; word-break: break-all; }
.input-loading { color: #888; font-size: 13px; font-style: italic; padding: 10px; }

:deep(.el-select__wrapper) { background-color: #333 !important; box-shadow: none !important; border: none !important; }
:deep(.el-select__placeholder) { color: #e0e0e0 !important; font-size: 12px; }

/* Loading */
.loading-container { flex: 1; display: flex; justify-content: center; align-items: center; background: #1a1a1a; }
.loader { width: 32px; height: 32px; border: 3px solid #333; border-bottom-color: #ffa116; border-radius: 50%; animation: rotation 1s linear infinite; }
.loader-inline { display: inline-block; width: 10px; height: 10px; border: 2px solid #333; border-bottom-color: #ffa116; border-radius: 50%; animation: rotation 1s linear infinite; }
@keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
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

.plus-btn {
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.plus-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}
</style>
