<script setup>
import { computed, ref } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import { imagesAPI } from '@/api/images'
import { createQuillImageHandler } from '@/utils/quillImageUpload'

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
        ['link', 'image'] 
      ],
      handlers: {
        image: myImageHandler
      }
    }
  }
})
</script>

<template>
  <div class="quill-wrapper">
    <QuillEditor 
      v-model:content="editorContent" 
      contentType="html" 
      :options="editorOptions" 
      :placeholder="placeholder"
      theme="snow"
    />
  </div>
</template>

<style scoped>
.quill-wrapper { 
  background-color: #1a1a1a; 
  border-radius: 8px; 
  border: 1px solid #333; 
  overflow: hidden; 
  display: flex; 
  flex-direction: column;
  width: 100%;
  height: 100%; 
}

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
  height: 100%;
}

:deep(.ql-editor.ql-blank::before) {
  color: #a0a0a0 !important; 
  font-style: italic;
}
</style>