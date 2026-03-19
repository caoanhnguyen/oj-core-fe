<!-- <script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Play, Send } from 'lucide-vue-next'
import loader from '@monaco-editor/loader'

const language = ref('javascript')
const editorContainer = ref(null)
let editor = null

const code = ref(`class Solution {
    /**
     * @param {number[]} nums
     * @param {number} target
     * @return {number[]}
     */
    twoSum(nums, target) {
        const map = new Map();
        for (let i = 0; i < nums.length; i++) {
            const complement = target - nums[i];
            if (map.has(complement)) {
                return [map.get(complement), i];
            }
            map.set(nums[i], i);
        }
        return [];
    }
}`)

onMounted(async () => {
  try {
    const monaco = await loader.init()
    
    // Define custom theme (Giữ nguyên của bro vì nó quá đẹp rồi)
    monaco.editor.defineTheme('leetcode-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1a1a1a',
        'editor.foreground': '#eff1f6bf',
        'editorLineNumber.foreground': '#eff1f64d',
        'editorLineNumber.activeForeground': '#eff1f680',
        'editor.selectionBackground': '#ffffff1a',
        'editor.inactiveSelectionBackground': '#ffffff0d',
        'editorCursor.foreground': '#ffa116',
        'editor.lineHighlightBackground': '#ffffff08',
        'editorWidget.background': '#262626',
        'editorWidget.border': '#ffffff1a',
        'input.background': '#262626',
        'input.border': '#ffffff1a',
      }
    })
    
    // Create editor instance với BỘ VŨ KHÍ BÍ MẬT INTELLISENSE
    editor = monaco.editor.create(editorContainer.value, {
      value: code.value,
      language: language.value,
      theme: 'leetcode-dark',
      minimap: { enabled: false },
      fontSize: 15, // Tăng lên 1 tí cho dễ nhìn giống VS Code
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
      fontLigatures: true, // Bật font ligatures (nối nét) cho code nhìn pro hơn
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 4,
      wordWrap: 'off',
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8,
      },
      padding: {
        top: 16,
        bottom: 16,
      },
      
      // BẮT ĐẦU BẬT TÍNH NĂNG GỢI Ý CODE (INTELLISENSE)
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true
      },
      suggestOnTriggerCharacters: true, // Nhấn dấu chấm (.) hoặc chữ cái là nó xổ gợi ý
      acceptSuggestionOnEnter: 'on', // Nhấn Enter để tự điền code
      wordBasedSuggestions: 'allDocuments', // Gợi ý dựa trên các từ đã gõ trong toàn bộ file
      snippetSuggestions: 'inline', // Cho phép gợi ý các snippet chuẩn của ngôn ngữ
      parameterHints: { enabled: true }, // Gợi ý tham số khi gõ hàm (Ví dụ gõ substring() nó hiện tham số)
      formatOnPaste: true, // Tự động format lề khi Ctrl+V
      formatOnType: true, // Tự động format lề khi gõ
      matchBrackets: 'always', // Bôi sáng ngoặc đóng/mở
      autoClosingBrackets: 'always', // Tự động đóng ngoặc
      autoClosingQuotes: 'always' // Tự động đóng nháy
    })
    
    // Thêm phím tắt Ctrl + S để Format Code thay vì tải trang web xuống
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      editor.getAction('editor.action.formatDocument').run()
    })

    // Listen to content changes
    editor.onDidChangeModelContent(() => {
      code.value = editor.getValue()
    })
  } catch (error) {
    console.error('Failed to initialize Monaco Editor:', error)
  }
})

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose()
  }
})

// Watch language changes
const handleLanguageChange = (newLang) => {
  if (editor) {
    const monaco = editor._monaco || window.monaco
    const model = editor.getModel()
    monaco.editor.setModelLanguage(model, newLang)
  }
}
</script>

<template>
  <div class="editor-container">
    <div class="editor-toolbar">
      <el-select 
        v-model="language" 
        size="small" 
        class="language-select"
        @change="handleLanguageChange"
      >
        <el-option label="JavaScript" value="javascript" />
        <el-option label="Python" value="python" />
        <el-option label="C++" value="cpp" />
        <el-option label="Java" value="java" />
      </el-select>
    </div>

    <div ref="editorContainer" class="editor-wrapper"></div>

    <div class="editor-actions">
      <div class="actions-left">
        <span class="action-hint">Ctrl + Enter to run</span>
      </div>
      <div class="actions-right">
        <el-button size="default" class="action-btn">
          <Play :size="16" />
          <span>Run</span>
        </el-button>
        <el-button type="success" size="default" class="action-btn submit-btn">
          <Send :size="16" />
          <span>Submit</span>
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-primary);
}

.editor-toolbar {
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-lg);
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-primary);
}

.language-select {
  width: 140px;
}

.editor-wrapper {
  flex: 1;
  overflow: hidden;
  background: #1a1a1a;
}

.editor-actions {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-primary);
}

.actions-left {
  display: flex;
  align-items: center;
}

.action-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}

.actions-right {
  display: flex;
  gap: var(--spacing-md);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 500;
}

.submit-btn {
  background: var(--success);
  border-color: var(--success);
  color: #fff;
}

.submit-btn:hover {
  background: #00a38f;
  border-color: #00a38f;
}

/* Element Plus Select Overrides */
:deep(.language-select .el-input__wrapper) {
  background: var(--bg-elevated);
  border: 1px solid var(--border-primary);
  box-shadow: none;
}

:deep(.language-select .el-input__wrapper:hover) {
  border-color: var(--border-secondary);
}

:deep(.language-select .el-input__inner) {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
}
</style> -->
