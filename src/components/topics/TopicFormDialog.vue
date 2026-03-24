<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  dialogType: {
    type: String,
    default: 'create' // 'create' or 'edit'
  },
  initialData: {
    type: Object,
    default: () => ({
      topicId: null,
      name: '',
      slug: '',
      description: ''
    })
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const dialogVisible = ref(props.modelValue)
const formData = ref({ ...props.initialData })
const formRef = ref(null)

const rules = {
  name: [{ required: true, message: 'Vui lòng nhập tên chủ đề', trigger: 'blur' }],
  slug: [{ required: true, message: 'Vui lòng nhập đường dẫn (slug)', trigger: 'blur' }],
  description: [{ required: true, message: 'Vui lòng nhập mô tả chủ đề', trigger: 'blur' }]
}

// Sync visibility prop
watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
})

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
  if (!val && formRef.value) {
    formRef.value.clearValidate()
  }
})

// Sync initial data when dialog opens
watch(() => props.initialData, (newVal) => {
  formData.value = { ...newVal }
}, { deep: true })

const generateSlug = () => {
  if (props.dialogType === 'create' && !formData.value.slug && formData.value.name) {
    formData.value.slug = formData.value.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  }
}

const handleClose = () => {
  dialogVisible.value = false
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid) => {
    if (valid) {
      emit('submit', { ...formData.value })
    }
  })
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogType === 'create' ? 'Tạo chủ đề mới' : 'Chỉnh sửa chủ đề'"
    width="500px"
    class="dark-dialog custom-message-box-theme"
    :close-on-click-modal="false"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-position="top"
      class="dark-form"
    >
      <el-form-item label="Tên chủ đề" prop="name">
        <el-input 
          v-model="formData.name" 
          placeholder="vd: Quy hoạch động, Đồ thị..." 
          @blur="generateSlug"
        />
      </el-form-item>
      <el-form-item label="Đường dẫn (Slug)" prop="slug">
        <el-input 
          v-model="formData.slug" 
          placeholder="vd: quy-hoach-dong" 
        />
      </el-form-item>
      <el-form-item label="Mô tả" prop="description">
        <el-input 
          v-model="formData.description" 
          type="textarea"
          :rows="4"
          placeholder="Nhập mô tả cho chủ đề này..." 
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose" class="dark-btn-cancel">Hủy</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading" class="dark-btn-submit">
          {{ dialogType === 'create' ? 'Tạo mới' : 'Lưu thay đổi' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style>
/* Button Styles */


.dark-btn-cancel {
  background-color: transparent;
  border-color: #5c5c5c;
  color: #8a8a8a;
}
.dark-btn-cancel:hover {
  color: #eff2f6;
  border-color: #8a8a8a;
  background-color: rgba(255,255,255,0.05);
}
.dark-btn-submit {
  background-color: var(--accent-primary);
  border-color: var(--accent-primary);
  color: #000;
}
.dark-btn-submit:hover {
  background-color: #ff8800;
  border-color: #ff8800;
}
</style>
