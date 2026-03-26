<script setup>
import { computed, ref, onMounted } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import 'katex/dist/katex.min.css'
import { imagesAPI } from '@/api/images'
import { createQuillImageHandler } from '@/utils/quillImageUpload'
import MathFormulaModal from './MathFormulaModal.vue'

const props = defineProps({
  content: { type: String, default: '' },
  placeholder: { type: String, default: 'Nhập nội dung vào đây...' }
})

const emit = defineEmits(['update:content'])

const editorContent = computed({
  get: () => props.content,
  set: (val) => emit('update:content', val)
})

const myImageHandler = createQuillImageHandler(
  async (file) => await imagesAPI.uploadTemporary(file),
  () => {}
)

// ─── Quill instance ref ───
const quillEditorRef = ref(null)
const showMathModal = ref(false)
let quillInstance = null
let savedSelection = null

const onEditorReady = (quill) => {
  quillInstance = quill
}

const openMathModal = () => {
  if (quillInstance) {
    // Save current cursor position before modal opens
    savedSelection = quillInstance.getSelection()
  }
  showMathModal.value = true
}

/**
 * Insert formula into Quill at the saved cursor position.
 * Uses Quill's built-in 'formula' embed which renders via KaTeX.
 * Requires Quill.register to know about the formula blot (auto via quill 1.x built-ins).
 */
const onInsertFormula = (latex) => {
  if (!quillInstance || !latex.trim()) return

  // Restore selection
  const index = savedSelection?.index ?? quillInstance.getLength() - 1

  // 1. Focus Quill first so the blot can be inserted properly
  quillInstance.focus()

  // 2. Insert the formula embed
  quillInstance.insertEmbed(index, 'formula', latex, 'user')

  // 3. Move cursor AFTER the formula + add a space
  quillInstance.insertText(index + 1, ' ', 'user')
  quillInstance.setSelection(index + 2, 0)
}

const editorOptions = ref({
  modules: {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ 'header': 1 }, { 'header': 2 }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        [{ 'color': [] }, { 'background': [] }],
        ['clean'],
        ['link', 'image'],
      ],
      handlers: {
        image: myImageHandler,
      }
    }
  }
})
</script>

<template>
  <div class="quill-wrapper">
    <QuillEditor
      ref="quillEditorRef"
      v-model:content="editorContent"
      contentType="html"
      :options="editorOptions"
      :placeholder="placeholder"
      theme="snow"
      @ready="onEditorReady"
    />

    <!-- Formula button floats at top-right of toolbar -->
    <button
      class="formula-btn"
      type="button"
      title="Chèn công thức toán học (LaTeX)"
      @click="openMathModal"
    >
      <em>f(x)</em>
    </button>

    <!-- Math Formula Modal (separate component) -->
    <MathFormulaModal
      v-model="showMathModal"
      @insert="onInsertFormula"
    />
  </div>
</template>

<style scoped>
.quill-wrapper {
  background-color: #1a1a1a;
  border-radius: 8px;
  border: 1px solid #333;
  overflow: visible;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  position: relative;
}

/* Formula button */
.formula-btn {
  position: absolute;
  top: 8px;
  right: 10px;
  z-index: 10;
  background: transparent;
  border: 1px solid #444;
  border-radius: 5px;
  color: #c0c0c0;
  cursor: pointer;
  padding: 2px 9px;
  font-size: 13px;
  font-family: 'Georgia', serif;
  transition: all 0.2s;
  line-height: 1.6;
}
.formula-btn:hover {
  background: rgba(255, 161, 22, 0.12);
  border-color: rgba(255, 161, 22, 0.55);
  color: #ffa116;
}

:deep(.ql-toolbar) {
  border: none !important;
  border-bottom: 1px solid #333 !important;
  background: #262626;
  padding-right: 72px; /* space for formula button */
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
  height: 100%;
}

:deep(.ql-editor.ql-blank::before) {
  color: #a0a0a0 !important;
  font-style: italic;
}

/* Style Quill formula blots inside editor */
:deep(.ql-editor .ql-formula) {
  display: inline-block;
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(255, 161, 22, 0.06);
  border: 1px solid rgba(255, 161, 22, 0.18);
  cursor: default;
  user-select: none;
  vertical-align: middle;
}
:deep(.ql-editor .katex) {
  color: #e0e0e0;
}
</style>