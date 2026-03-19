<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

// Configure workers globally
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
  modelValue: { type: String, default: '' },
  language: { type: String, default: 'java' },
  readOnly: { type: Boolean, default: false },
  height: { type: String, default: '100%' },
  theme: { type: String, default: 'vs-dark' }
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
    automaticLayout: true, // Tự động resize
    minimap: { enabled: false }, // Tắt minimap cho gọn
    fontSize: 15,
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
    },
    
    // 🚀 TÍNH NĂNG GỢI Ý CODE (INTELLISENSE)
    quickSuggestions: { other: true, comments: true, strings: true },
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: 'on',
    wordBasedSuggestions: 'allDocuments',
    snippetSuggestions: 'inline',
    parameterHints: { enabled: true },
    formatOnType: true,
    formatOnPaste: true,
    matchBrackets: 'always',
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always'
  })

  // 🌟 CHẶN CTRL + S BẬT LƯU TRANG, ÉP FORMAT CODE
  editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    editorInstance.getAction('editor.action.formatDocument').run()
  })

  // Lắng nghe sự thay đổi text và update lên biến v-model
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

// 🌟 VŨ KHÍ BÍ MẬT: BỘ TỪ ĐIỂN GÕ TẮT CHO TẤT CẢ NGÔN NGỮ
const registerAllSnippets = () => {
  // Đảm bảo chỉ đăng ký 1 lần duy nhất trong suốt vòng đời của app
  if (window.hasRegisteredSnippets) return
  window.hasRegisteredSnippets = true

  // 1. ☕ JAVA SNIPPETS
  monaco.languages.registerCompletionItemProvider('java', {
    provideCompletionItems: (model, position) => {
      return {
        suggestions: [
          {
            label: 'sout',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'System.out.println(${1});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'In ra màn hình (Java)'
          },
          {
            label: 'psvm',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'public static void main(String[] args) {\n\t${1}\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Hàm main (Java)'
          },
          {
            label: 'fori',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t${3}\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Vòng lặp for (Java)'
          }
        ]
      }
    }
  })

  // 2. 🐍 PYTHON SNIPPETS
  monaco.languages.registerCompletionItemProvider('python', {
    provideCompletionItems: (model, position) => {
      return {
        suggestions: [
          {
            label: 'pr',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'print(${1})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'In ra màn hình (Python)'
          },
          {
            label: 'defm',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'def main():\n\t${1:pass}\n\nif __name__ == "__main__":\n\tmain()',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Khối main chuẩn (Python)'
          },
          {
            label: 'fori',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'for ${1:i} in range(${2:n}):\n\t${3:pass}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Vòng lặp for (Python)'
          }
        ]
      }
    }
  })

  // 3. ⚡ C++ SNIPPETS
  monaco.languages.registerCompletionItemProvider('cpp', {
    provideCompletionItems: (model, position) => {
      return {
        suggestions: [
          {
            label: 'cout',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'std::cout << ${1} << std::endl;',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'In ra màn hình (C++)'
          },
          {
            label: 'cin',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'std::cin >> ${1};',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Nhập dữ liệu (C++)'
          },
          {
            label: 'main',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '#include <iostream>\n\nint main() {\n\t${1}\n\treturn 0;\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Hàm main cơ bản (C++)'
          },
          {
            label: 'fori',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t${3}\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Vòng lặp for (C++)'
          }
        ]
      }
    }
  })
}

onMounted(() => {
  nextTick(() => {
    registerAllSnippets()
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
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>

<style scoped>
.code-editor-wrapper {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #333;
}
.editor-container {
  width: 100%;
  height: 100%;
}
/* Fix viền xanh khi focus */
:deep(.monaco-editor.focused) {
  outline: none !important;
}
</style>