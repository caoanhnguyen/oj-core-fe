<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from '@/components/common/AppButton.vue'
import { BookOpen, PenLine } from 'lucide-vue-next'
import { generateSlug as generateSlugUtil } from '@/utils/stringUtils'

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

const drawerVisible = ref(props.modelValue)
const formData = ref({ ...props.initialData })
const formRef = ref(null)

const { t } = useI18n()

const rules = computed(() => ({
  name: [{ required: true, message: t('admin_topics.validation.name_req'), trigger: 'blur' }],
  slug: [{ required: true, message: t('admin_topics.validation.slug_req'), trigger: 'blur' }],
  description: [{ required: true, message: t('admin_topics.validation.desc_req'), trigger: 'blur' }]
}))

const isSlugEdited = ref(false)

watch(() => props.modelValue, (val) => {
  drawerVisible.value = val
  if (val && props.dialogType === 'create') {
    isSlugEdited.value = false
  }
})

watch(drawerVisible, (val) => {
  emit('update:modelValue', val)
  if (!val && formRef.value) {
    formRef.value.clearValidate()
  }
})

watch(() => props.initialData, (newVal) => {
  formData.value = { ...newVal }
}, { deep: true })

const generateSlug = () => {
  if (props.dialogType === 'create' && formData.value.name && !isSlugEdited.value) {
    formData.value.slug = generateSlugUtil(formData.value.name)
  }
}

const handleClose = () => {
  drawerVisible.value = false
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (valid) emit('submit', { ...formData.value })
  })
}
</script>

<template>
  <el-drawer
    v-model="drawerVisible"
    size="720px"
    :close-on-click-modal="true"
    class="topic-drawer"
  >
    <template #header>
      <div class="drawer-header-content">
        <component :is="dialogType === 'create' ? BookOpen : PenLine" :size="20" class="drawer-header-icon" />
        <span>{{ dialogType === 'create' ? $t('admin_topics.dialog_title_create') : $t('admin_topics.dialog_title_edit') }}</span>
      </div>
    </template>

    <div class="drawer-body">
      <div class="info-banner">
        <span v-if="dialogType === 'create'">{{ $t('admin_topics.dialog_info_create') }}</span>
        <span v-else>{{ $t('admin_topics.dialog_info_edit') }}</span>
      </div>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-position="top"
        class="topic-form"
      >
        <el-form-item :label="$t('admin_topics.field_name')" prop="name">
          <el-input
            v-model="formData.name"
            :placeholder="$t('admin_topics.placeholder_name')"
            @input="generateSlug"
            size="large"
          />
        </el-form-item>
        <el-form-item :label="$t('admin_topics.field_slug')" prop="slug">
          <el-input
            v-model="formData.slug"
            :placeholder="$t('admin_topics.placeholder_slug')"
            @input="isSlugEdited = true"
            size="large"
          >
            <template #prepend>/topics/</template>
          </el-input>
        </el-form-item>
        <el-form-item :label="$t('admin_topics.field_desc')" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="5"
            :placeholder="$t('admin_topics.placeholder_desc')"
          />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <AppButton variant="info" @click="handleClose">{{ $t('admin_topics.btn_cancel') }}</AppButton>
        <AppButton variant="primary" :loading="loading" @click="handleSubmit">
          {{ dialogType === 'create' ? $t('admin_topics.btn_create') : $t('admin_topics.btn_save') }}
        </AppButton>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped>
.drawer-header-content {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #fff);
}
.drawer-header-icon {
  color: var(--accent-primary, #ffa116);
}
.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.info-banner {
  background: rgba(255, 161, 22, 0.08);
  border: 1px solid rgba(255, 161, 22, 0.2);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 13px;
  color: #d0d0d0;
  line-height: 1.6;
}
.topic-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>

<style>
/* Drawer global overrides */
.topic-drawer.el-drawer,
.el-overlay.topic-drawer .el-drawer {
  background-color: var(--bg-surface, #1e1e1e) !important;
  border-left: 1px solid var(--border-primary, #333) !important;
}
.topic-drawer .el-drawer__header {
  margin-bottom: 0 !important;
  padding: 20px 24px !important;
  border-bottom: 1px solid var(--border-primary, #333) !important;
}
.topic-drawer .el-drawer__body {
  padding: 24px !important;
  background-color: var(--bg-surface, #1e1e1e) !important;
  overflow-y: auto !important;
}
.topic-drawer .el-drawer__footer {
  border-top: 1px solid var(--border-primary, #333) !important;
  padding: 16px 24px !important;
  background-color: var(--bg-secondary, #141414) !important;
}
.topic-drawer .el-form-item__label {
  color: var(--text-secondary, #a0a0a0) !important;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
}
.topic-drawer .el-input__wrapper,
.topic-drawer .el-textarea__inner {
  background-color: #282828 !important;
  box-shadow: 0 0 0 1px #3e3e3e inset !important;
  border-radius: 8px;
}
.topic-drawer .el-input__wrapper:hover,
.topic-drawer .el-textarea__inner:hover {
  box-shadow: 0 0 0 1px #5c5c5c inset !important;
}
.topic-drawer .el-input__wrapper.is-focus,
.topic-drawer .el-textarea__inner:focus {
  box-shadow: 0 0 0 1px var(--accent-primary, #ffa116) inset !important;
}
.topic-drawer .el-input__inner,
.topic-drawer .el-textarea__inner {
  color: #eff2f6 !important;
}
.topic-drawer .el-input-group__prepend {
  background-color: #333 !important;
  border-color: #3e3e3e !important;
  color: #8a8a8a !important;
  font-size: 12px;
}
</style>
