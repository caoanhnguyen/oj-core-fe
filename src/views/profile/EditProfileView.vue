<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
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
    handleApiError(error, 'Không thể tải thông tin cá nhân')
    router.push('/profile')
  } finally {
    loading.value = false
  }
}

const handleUpdateProfile = async () => {
  try {
    saving.value = true
    await usersApi.updateProfile(form.value)
    ElMessage.success('Cập nhật thông tin thành công!')
    // Update auth store as well
    await authStore.getCurrentUser()
    // Redirect back to profile
    router.push('/profile')
  } catch (error) {
    handleApiError(error, 'Cập nhật thất bại')
  } finally {
    saving.value = false
  }
}

const beforeAvatarUpload = (rawFile) => {
  if (rawFile.type !== 'image/jpeg' && rawFile.type !== 'image/png') {
    ElMessage.error('Avatar must be JPG or PNG format!')
    return false
  } else if (rawFile.size / 1024 / 1024 > 5) {
    ElMessage.error('Dung lượng ảnh đại diện không được vượt quá 5MB!')
    return false
  }
  return true
}

const handleAvatarUpload = async (file) => {
  try {
    loading.value = true
    const res = await usersApi.uploadAvatar(file.file)
    ElMessage.success('Cập nhật ảnh đại diện thành công!')
    authStore.getCurrentUser()
    loadProfile()
  } catch (error) {
    handleApiError(error, 'Không thể tải ảnh đại diện')
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
          Quay lại
        </AppButton>
        <h1>Chỉnh sửa hồ sơ</h1>
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
                <span>Thay đổi</span>
              </div>
            </el-upload>
            <h2 class="sidebar-username">@{{ authStore.user?.username }}</h2>
          </div>

          <div class="edit-nav">
             <button :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">
               <User :size="18" /> Thông tin cơ bản
             </button>
             <button :class="{ active: activeTab === 'education' }" @click="activeTab = 'education'">
               <School :size="18" /> Giáo dục & Vị trí
             </button>
             <button :class="{ active: activeTab === 'social' }" @click="activeTab = 'social'">
               <Globe :size="18" /> Liên kết xã hội
             </button>
          </div>
        </div>

        <!-- Main Form Area -->
        <div class="edit-main">
          <el-form :model="form" label-position="top" class="dark-form">
            
            <div v-show="activeTab === 'basic'" class="form-section">
              <div class="grid-2">
                <el-form-item label="Họ và tên">
                  <el-input v-model="form.fullName" placeholder="Nhập họ tên của bạn..." />
                </el-form-item>
                <el-form-item label="Giới tính">
                  <el-select v-model="form.gender" style="width: 100%">
                    <el-option label="Nam" value="MALE" />
                    <el-option label="Nữ" value="FEMALE" />
                    <el-option label="Khác" value="OTHER" />
                  </el-select>
                </el-form-item>
              </div>
              <el-form-item label="Số điện thoại">
                <el-input v-model="form.phoneNumber" placeholder="Nhập số điện thoại..." />
              </el-form-item>
              <el-form-item label="Giới thiệu bản thân">
                <div class="bio-editor-container">
                  <QuillEditor 
                    v-model:content="form.bio" 
                    contentType="html"
                    theme="snow"
                    placeholder="Hãy giới thiệu một chút về bạn..."
                    class="dark-quill-editor"
                  />
                </div>
              </el-form-item>
            </div>

            <div v-show="activeTab === 'education'" class="form-section">
              <div class="grid-2">
                <el-form-item label="Trường học">
                  <el-input v-model="form.school" placeholder="Nhập tên trường..." />
                </el-form-item>
                <el-form-item label="Chuyên ngành">
                  <el-input v-model="form.major" placeholder="Nhập chuyên ngành..." />
                </el-form-item>
              </div>
              <el-form-item label="Địa chỉ">
                <el-input v-model="form.address" placeholder="Nhập địa chỉ của bạn..." />
              </el-form-item>
              <div class="grid-2">
                <el-form-item label="Thành phố">
                  <el-input v-model="form.city" placeholder="Nhập thành phố..." />
                </el-form-item>
                <el-form-item label="Quốc gia">
                  <el-input v-model="form.country" placeholder="Nhập quốc gia..." />
                </el-form-item>
              </div>
            </div>

            <div v-show="activeTab === 'social'" class="form-section">
              <el-form-item label="GitHub URL">
                <el-input v-model="form.githubUrl" placeholder="https://github.com/..." />
              </el-form-item>
              <el-form-item label="LinkedIn URL">
                <el-input v-model="form.linkedInUrl" placeholder="https://linkedin.com/in/..." />
              </el-form-item>
              <el-form-item label="Website cá nhân">
                <el-input v-model="form.website" placeholder="https://..." />
              </el-form-item>
            </div>

            <div class="form-actions">
              <AppButton variant="primary" :icon="Save" :loading="saving" :disabled="saving" @click="handleUpdateProfile">
                {{ saving ? 'Đang lưu...' : 'Lưu thay đổi' }}
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

:deep(.dark-quill-editor) {
  width: 100%;
}

:deep(.dark-quill-editor .ql-toolbar) {
  background: #1a1a1a;
  border-color: #333;
  border-top: none;
  border-left: none;
  border-right: none;
}

:deep(.dark-quill-editor .ql-container) {
  border: none;
  min-height: 200px; /* Increased height */
  font-family: inherit;
  display: flex;
  flex-direction: column;
}

:deep(.dark-quill-editor .ql-editor) {
  color: #eff2f6;
  font-size: 14px;
  flex: 1;
  padding: 15px 20px; /* Improved padding */
  min-height: 200px;
}

:deep(.dark-quill-editor .ql-stroke) {
  stroke: #8a8a8a;
}

:deep(.dark-quill-editor .ql-fill) {
  fill: #8a8a8a;
}

:deep(.dark-quill-editor .ql-picker) {
  color: #8a8a8a;
}
</style>
