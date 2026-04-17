<script setup>
import { ref, defineProps, defineEmits, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AlertCircle, UploadCloud, FileArchive, X } from 'lucide-vue-next'
import AppButton from '@/components/common/AppButton.vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  testcaseFile: {
    type: File,
    default: null
  },
  existingDir: {
    type: String,
    default: null // The folder name existing in the server
  },
  mode: {
    type: String,
    default: 'CREATE' // 'CREATE' or 'UPDATE'
  }
})

const emit = defineEmits(['update:file'])

const { t } = useI18n()

const testcaseFileRef = ref(null)

const handleTestcaseUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (file.type !== 'application/zip' && !file.name.endsWith('.zip')) {
    ElMessage.error(t('admin_problems.msg_only_zip'))
    return
  }

  emit('update:file', file)
  event.target.value = '' 
}

const clearFile = () => {
  emit('update:file', null)
}
</script>

<template>
  <div class="tab-content-wrapper full-width centered-content">
      <div class="wide-area">
        
        <!-- Rules Alert -->
        <div class="rules-box">
           <div class="rules-title">
              <AlertCircle :size="18" />
              <span>{{ $t('admin_problems.title_testcase_rules') }}</span>
           </div>
           <ul class="rules-list">
              <li v-html="$t('admin_problems.rule_1')"></li>
              <li v-html="$t('admin_problems.rule_2')"></li>
              <li v-html="$t('admin_problems.rule_3')"></li>
              <li v-html="$t('admin_problems.rule_4')"></li>
              <li v-if="mode === 'UPDATE'" class="text-warning" v-html="$t('admin_problems.rule_5')"></li>
           </ul>
        </div>

        <!-- Current File State Display -->
        <div v-if="existingDir && !testcaseFile" class="existing-state">
           <p><strong>{{ $t('admin_problems.current_dir') }}</strong> {{ existingDir }}</p>
           <p class="hint-text">{{ $t('admin_problems.hint_replace') }}</p>
        </div>

        <!-- Selected File Banner -->
        <div v-if="testcaseFile" class="selected-file-banner">
           <div class="file-info">
             <FileArchive :size="24" class="file-icon" />
             <div class="file-details">
                <span class="file-name">{{ testcaseFile.name }}</span>
                <span class="file-size">{{ (testcaseFile.size / 1024 / 1024).toFixed(2) }} MB</span>
             </div>
           </div>
           <button class="clear-btn" @click="clearFile" :title="$t('admin_problems.tooltip_remove')">
             <X :size="18" />
           </button>
        </div>

        <!-- Upload Zone -->
        <div v-if="!testcaseFile"
          class="upload-zone"
          @click="testcaseFileRef.click()"
        >
          <UploadCloud :size="48" class="upload-icon" />
          <div class="upload-text">
            <p class="primary-text">{{ $t('admin_problems.text_drop_zip') }}</p>
            <p class="secondary-text">{{ $t('admin_problems.text_support_zip') }}</p>
          </div>
        </div>
        
        <input 
            type="file" 
            ref="testcaseFileRef" 
            class="hidden-input" 
            accept=".zip,application/zip"
            @change="handleTestcaseUpload"
          />

      </div>
  </div>
</template>

<style scoped>
.centered-content { display: flex; justify-content: center; height: 100%; overflow-y: auto; }
.wide-area { width: 100%; max-width: 900px; padding: 0 0 40px 0; }
.rules-box {
  background-color: rgba(255, 161, 22, 0.1);
  border: 1px solid rgba(255, 161, 22, 0.2);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}
.rules-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #ffa116;
  margin-bottom: 8px;
  font-size: 14px;
}
.rules-list {
  padding-left: 24px;
  margin: 0;
  color: #d1d5db;
  font-size: 13px;
}
.rules-list li { margin-bottom: 4px; }
.text-warning { color: #ef4444; margin-top: 8px; font-weight: 500;}

.existing-state {
  margin-bottom: 24px;
  padding: 16px;
  border-radius: 8px;
  background-color: #1a1a1a;
  border: 1px solid #333;
}
.existing-state p { margin: 0 0 4px 0; color: #e0e0e0; }
.hint-text { font-size: 13px; color: #888; }

.selected-file-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(44, 187, 93, 0.1);
  border: 1px solid rgba(44, 187, 93, 0.3);
  border-radius: 8px;
  margin-bottom: 24px;
}
.file-info {
  display: flex;
  align-items: center;
  gap: 16px;
}
.file-icon { color: #2cbb5d; }
.file-details { display: flex; flex-direction: column; gap: 4px; }
.file-name { color: #e0e0e0; font-weight: 500; font-size: 15px;}
.file-size { color: #a0a0a0; font-size: 13px; }
.clear-btn {
  background: transparent;
  border: none;
  color: #a0a0a0;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.clear-btn:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }

.upload-zone {
  border: 2px dashed #404040;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  transition: all 0.3s ease;
  background-color: #1a1a1a;
  cursor: pointer;
}
.upload-zone:hover, .upload-zone.is-dragover {
  border-color: #ffa116;
  background-color: rgba(255, 161, 22, 0.05);
}
.upload-icon { color: #666; margin-bottom: 16px; }
.primary-text { font-size: 16px; font-weight: 500; color: #e0e0e0; margin-bottom: 4px; }
.secondary-text { font-size: 13px; color: #666; }
.hidden-input { display: none; }
</style>
