<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

// Configure workers globally if not already configured
if (!self.MonacoEnvironment) {
  self.MonacoEnvironment = {
    getWorker(_, label) {
      if (label === 'json') return new jsonWorker()
      if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker()
      if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker()
      if (label === 'typescript' || label === 'javascript') return new tsWorker()
      return new editorWorker()
    }
  }
}

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'java'
  },
  height: {
    type: String,
    default: '300px'
  },
  readOnly: {
    type: Boolean,
    default: false
  },
  theme: {
    type: String,
    default: 'vs-dark'
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const editorContainer = ref(null)
let editorInstance = null

const initMonaco = () => {
  if (!editorContainer.value) return

  editorInstance = monaco.editor.create(editorContainer.value, {
    value: props.modelValue,
    language: props.language,
    theme: props.theme,
    automaticLayout: true,
    minimap: { enabled: true },
    fontSize: 14,
    lineHeight: 24,
    padding: { top: 16, bottom: 16 },
    scrollBeyondLastLine: false,
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    fontLigatures: true,
    readOnly: props.readOnly,
    renderLineHighlight: 'all',
    bracketPairColorization: { enabled: true },
    scrollbar: {
      vertical: 'visible',
      horizontal: 'visible',
      useShadows: false,
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10
    }
  })

  editorInstance.onDidChangeModelContent(() => {
    const value = editorInstance.getValue()
    emit('update:modelValue', value)
    emit('change', value)
  })
}

watch(() => props.language, (newLang) => {
  if (editorInstance) {
    const model = editorInstance.getModel()
    monaco.editor.setModelLanguage(model, newLang)
  }
})

watch(() => props.modelValue, (newValue) => {
  if (editorInstance && editorInstance.getValue() !== newValue) {
    editorInstance.setValue(newValue)
  }
})

onMounted(() => {
  nextTick(() => {
    initMonaco()
  })
})

onBeforeUnmount(() => {
  if (editorInstance) {
    editorInstance.dispose()
  }
})
</script>

<template>
  <div class="code-editor-wrapper" :style="{ height: height }">
    <div ref="editorContainer" class="monaco-container"></div>
  </div>
</template>

<style scoped>
.code-editor-wrapper {
  width: 100%;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--bg-primary); /* Match vs-dark bg usually */
}

.monaco-container {
  width: 100%;
  height: 100%;
}
</style>
