<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import usersApi from '@/api/users'
import { ElMessage } from 'element-plus'
import { handleApiError } from '@/utils/errorHandler'
import { 
  User, Mail, Phone, MapPin, School, BookOpen, 
  Github, Linkedin, Globe, Camera, Save, ArrowLeft
} from 'lucide-vue-next'
import AppButton from '@/components/common/AppButton.vue'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

const loading = ref(false)
const saving = ref(false)
const activeTab = ref('basic')

const form = ref({
  fullName: '',
  gender: 'OTHER',
  bio: '',
  phoneNumber: '',
  address: '',
  city: '',
  country: '',
  school: '',
  major: '',
  githubUrl: '',
  linkedInUrl: '',
  website: ''
})

const loadProfile = async () => {
  try {
    loading.value = true
    const response = await usersApi.getCurrentUser()
    const data = response.data.data
    // Map data to form
    Object.keys(form.value).forEach(key => {
      if (data[key] !== undefined) {
        form.value[key] = data[key]
      }
    })
  } catch (error) {
    handleApiError(error, t('profile.msg_load_fail'))
    router.push('/profile')
  } finally {
    loading.value = false
  }
}

const handleUpdateProfile = async () => {
  try {
    saving.value = true
    await usersApi.updateProfile(form.value)
    ElMessage.success(t('profile.msg_update_success'))
    // Update auth store as well
    await authStore.getCurrentUser()
    // Redirect back to profile
    router.push('/profile')
  } catch (error) {
    handleApiError(error, t('profile.msg_update_fail'))
  } finally {
    saving.value = false
  }
}

const beforeAvatarUpload = (rawFile) => {
  if (rawFile.type !== 'image/jpeg' && rawFile.type !== 'image/png') {
    ElMessage.error(t('profile.msg_avatar_format'))
    return false
  } else if (rawFile.size / 1024 / 1024 > 5) {
    ElMessage.error(t('profile.msg_avatar_size'))
    return false
  }
  return true
}

const handleAvatarUpload = async (file) => {
  try {
    loading.value = true
    const res = await usersApi.uploadAvatar(file.file)
    ElMessage.success(t('profile.msg_avatar_success'))
    authStore.getCurrentUser()
    loadProfile()
  } catch (error) {
    handleApiError(error, t('profile.msg_avatar_fail'))
  } finally {
    loading.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <div class="edit-profile-page">
    <div class="edit-container" v-loading="loading">
      <div class="header">
        <AppButton variant="text" :icon="ArrowLeft" @click="router.back()">
          {{ $t('profile.btn_back') }}
        </AppButton>
        <h1>{{ $t('profile.title_edit') }}</h1>
      </div>

      <div class="edit-grid">
        <!-- Sidebar -->
        <div class="edit-sidebar">
          <div class="avatar-edit">
            <el-upload
              class="avatar-uploader"
              action="#"
              :show-file-list="false"
              :auto-upload="true"
              :http-request="handleAvatarUpload"
              :before-upload="beforeAvatarUpload"
            >
              <el-avatar :size="120" :src="authStore.user?.avatarUrl" class="editor-avatar">
                <User :size="60" />
              </el-avatar>
              <div class="camera-overlay">
                <Camera :size="20" />
                <span>{{ $t('profile.btn_change_avatar') }}</span>
              </div>
            </el-upload>
            <h2 class="sidebar-username">@{{ authStore.user?.username }}</h2>
          </div>

          <div class="edit-nav">
             <button :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">
               <User :size="18" /> {{ $t('profile.tab_basic') }}
             </button>
             <button :class="{ active: activeTab === 'education' }" @click="activeTab = 'education'">
               <School :size="18" /> {{ $t('profile.tab_education') }}
             </button>
             <button :class="{ active: activeTab === 'social' }" @click="activeTab = 'social'">
               <Globe :size="18" /> {{ $t('profile.tab_social') }}
             </button>
          </div>
        </div>

        <!-- Main Form Area -->
        <div class="edit-main">
          <el-form :model="form" label-position="top" class="dark-form">
            
            <div v-show="activeTab === 'basic'" class="form-section">
              <div class="grid-2">
                <el-form-item :label="$t('profile.label_fullname')">
                  <el-input v-model="form.fullName" :placeholder="$t('profile.placeholder_fullname')" />
                </el-form-item>
                <el-form-item :label="$t('profile.label_gender')">
                  <el-select v-model="form.gender" style="width: 100%">
                    <el-option :label="$t('profile.gender_male')" value="MALE" />
                    <el-option :label="$t('profile.gender_female')" value="FEMALE" />
                    <el-option :label="$t('profile.gender_other')" value="OTHER" />
                  </el-select>
                </el-form-item>
              </div>
              <el-form-item :label="$t('profile.label_phone')">
                <el-input v-model="form.phoneNumber" :placeholder="$t('profile.placeholder_phone')" />
              </el-form-item>
              <el-form-item :label="$t('profile.label_bio')">
                <div class="bio-editor-container">
                  <QuillEditor 
                    v-model:content="form.bio" 
                    contentType="html"
                    theme="snow"
                    :placeholder="$t('profile.placeholder_bio')"
                    class="dark-quill-editor"
                  />
                </div>
              </el-form-item>
            </div>

            <div v-show="activeTab === 'education'" class="form-section">
              <div class="grid-2">
                <el-form-item :label="$t('profile.label_school')">
                  <el-input v-model="form.school" :placeholder="$t('profile.placeholder_school')" />
                </el-form-item>
                <el-form-item :label="$t('profile.label_major')">
                  <el-input v-model="form.major" :placeholder="$t('profile.placeholder_major')" />
                </el-form-item>
              </div>
              <el-form-item :label="$t('profile.label_address')">
                <el-input v-model="form.address" :placeholder="$t('profile.placeholder_address')" />
              </el-form-item>
              <div class="grid-2">
                <el-form-item :label="$t('profile.label_city')">
                  <el-input v-model="form.city" :placeholder="$t('profile.placeholder_city')" />
                </el-form-item>
                <el-form-item :label="$t('profile.label_country')">
                  <el-input v-model="form.country" :placeholder="$t('profile.placeholder_country')" />
                </el-form-item>
              </div>
            </div>

            <div v-show="activeTab === 'social'" class="form-section">
              <el-form-item :label="$t('profile.label_github')">
                <el-input v-model="form.githubUrl" :placeholder="$t('profile.placeholder_github')" />
              </el-form-item>
              <el-form-item :label="$t('profile.label_linkedin')">
                <el-input v-model="form.linkedInUrl" :placeholder="$t('profile.placeholder_linkedin')" />
              </el-form-item>
              <el-form-item :label="$t('profile.label_website')">
                <el-input v-model="form.website" :placeholder="$t('profile.placeholder_website')" />
              </el-form-item>
            </div>

            <div class="form-actions">
              <AppButton variant="primary" :icon="Save" :loading="saving" :disabled="saving" @click="handleUpdateProfile">
                {{ saving ? $t('profile.btn_saving') : $t('profile.btn_save') }}
              </AppButton>
            </div>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.edit-profile-page {
  min-height: calc(100vh - 56px);
  background: var(--bg-primary);
  padding: 40px 20px;
}

.edit-container {
  max-width: 1000px;
  margin: 0 auto;
}

.header {
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.edit-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 40px;
}

/* Sidebar Styling */
.edit-sidebar {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.avatar-edit {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 16px;
  padding: 30px;
  text-align: center;
}

.avatar-uploader {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 16px;
  display: block;
}

.editor-avatar {
  border: 2px solid var(--border-primary);
}

.camera-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(0,0,0,0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s;
}

.avatar-uploader:hover .camera-overlay { opacity: 1; }

.camera-overlay span { font-size: 11px; margin-top: 4px; }

.sidebar-username {
  font-size: 18px;
  color: #eff2f6;
  margin: 0;
}

.edit-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-nav button {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 12px 16px;
  color: #8a8a8a;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.edit-nav button:hover {
  background: rgba(255,255,255,0.05);
  color: #fff;
}

.edit-nav button.active {
  background: rgba(255, 161, 22, 0.1);
  color: #ffa116;
  border-color: rgba(255, 161, 22, 0.3);
}

/* Main Form Area */
.edit-main {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 16px;
  padding: 30px;
}

.form-section {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-actions {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--border-primary);
  display: flex;
  justify-content: flex-end;
}



/* Dark Form Styles Overrides */
:deep(.el-form-item__label) {
  color: #8a8a8a !important;
  font-weight: 600;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-select__wrapper) {
  background-color: #141414 !important;
  border: 1px solid #333 !important;
  box-shadow: none !important;
}

:deep(.el-input__inner) {
  color: #eff2f6 !important;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-select__wrapper.is-focused) {
  border-color: #ffa116 !important;
}

@media (max-width: 850px) {
  .edit-grid { grid-template-columns: 1fr; }
  .grid-2 { grid-template-columns: 1fr; }
}

.bio-editor-container {
  background: #141414;
  border-radius: 8px;
  border: 1px solid #333;
  overflow: hidden;
  width: 100%;
}

:deep(.bio-editor-container .ql-toolbar.ql-snow) {
  background: #1a1a1a;
  border-color: #333 !important;
  border-width: 0 0 1px 0 !important;
}

:deep(.bio-editor-container .ql-container.ql-snow) {
  border: none !important;
  min-height: 200px;
  font-family: inherit;
  display: flex;
  flex-direction: column;
}

:deep(.bio-editor-container .ql-editor) {
  color: #eff2f6;
  font-size: 14px;
  flex: 1;
  padding: 15px 20px;
  min-height: 200px;
}

:deep(.bio-editor-container .ql-stroke) {
  stroke: #8a8a8a;
}

:deep(.bio-editor-container .ql-fill) {
  fill: #8a8a8a;
}

:deep(.bio-editor-container .ql-picker) {
  color: #8a8a8a;
}
</style>
