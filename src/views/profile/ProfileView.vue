<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import usersApi from '@/api/users'
import { ElMessage } from 'element-plus'
import { 
  User, Mail, Phone, MapPin, School, BookOpen, 
  Github, Linkedin, Globe, Calendar, CheckCircle,
  Trophy, Send, Award, Edit3, Settings
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const userProfile = ref(null)
const idOrUsername = computed(() => route.params.idOrUsername)
const isMyProfile = computed(() => {
  if (!idOrUsername.value) return true
  if (!userProfile.value || !authStore.user) return false
  return userProfile.value.id === authStore.user.id || userProfile.value.username === authStore.user.username
})

const loadProfile = async () => {
  try {
    loading.value = true
    let response
    if (!idOrUsername.value) {
      // Load current user
      response = await usersApi.getCurrentUser()
    } else {
      // Try by ID first, then by username if needed (API handles it if we have separate endpoints)
      // Actually, if it's a UUID, call getUserProfileById, else ByUsername
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrUsername.value)
      if (isUuid) {
        response = await usersApi.getUserProfileById(idOrUsername.value)
      } else {
        response = await usersApi.getUserProfileByUsername(idOrUsername.value)
      }
    }
    userProfile.value = response.data.data
  } catch (error) {
    console.error(error)
    ElMessage.error('Không thể tải thông tin người dùng')
    if (!idOrUsername.value) router.push('/login')
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

watch(() => route.params.idOrUsername, loadProfile)

onMounted(loadProfile)
</script>

<template>
  <div class="profile-page">
    <div class="profile-container" v-loading="loading">
      <template v-if="userProfile">
        <!-- Header / Cover Section -->
        <div class="profile-header-card">
          <div class="cover-bg"></div>
          <div class="header-content">
            <div class="avatar-wrapper">
              <el-avatar :size="140" :src="userProfile.avatarUrl" class="main-avatar">
                <User :size="60" />
              </el-avatar>
              <div v-if="isMyProfile" class="avatar-edit-hint">
                <router-link to="/profile/edit"><Settings :size="16" /></router-link>
              </div>
            </div>
            
            <div class="user-meta">
              <div class="name-row">
                <h1 class="full-name">{{ userProfile.fullName || userProfile.username }}</h1>
                <el-button v-if="isMyProfile" type="primary" plain round size="small" @click="router.push('/profile/edit')">
                  <Edit3 :size="14" style="margin-right: 4px;" /> Sửa hồ sơ
                </el-button>
              </div>
              <p class="username">@{{ userProfile.username }}</p>
              <div class="badges">
                <el-tag v-for="role in userProfile.roles" :key="role" size="small" effect="dark" class="role-badge">
                  {{ role }}
                </el-tag>
                <el-tag v-if="userProfile.emailVerified" type="success" size="small" class="verified-badge">
                  <CheckCircle :size="12" /> Đã xác thực
                </el-tag>
              </div>
              <p class="bio" v-if="userProfile.bio">{{ userProfile.bio }}</p>
            </div>
          </div>
          
          <!-- Quick Stats Row -->
          <div class="stats-overview">
            <div class="stat-item">
              <Trophy class="stat-icon solved" :size="20" />
              <div class="stat-info">
                <span class="stat-value">{{ userProfile.solvedCount || 0 }}</span>
                <span class="stat-label">Solved</span>
              </div>
            </div>
            <div class="stat-item">
              <Award class="stat-icon ac" :size="20" />
              <div class="stat-info">
                <span class="stat-value">{{ userProfile.acCount || 0 }}</span>
                <span class="stat-label">Accepted</span>
              </div>
            </div>
            <div class="stat-item">
              <Send class="stat-icon submission" :size="20" />
              <div class="stat-info">
                <span class="stat-value">{{ userProfile.submissionCount || 0 }}</span>
                <span class="stat-label">Submissions</span>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon score-icon">Σ</div>
              <div class="stat-info">
                <span class="stat-value">{{ userProfile.totalScore || 0 }}</span>
                <span class="stat-label">Points</span>
              </div>
            </div>
          </div>
        </div>

        <div class="profile-grid">
          <!-- Left Column: Info -->
          <div class="info-column">
            <div class="info-card">
              <h3 class="card-title">Thông tin chi tiết</h3>
              <div class="info-list">
                <div class="info-entry" v-if="userProfile.email && isMyProfile">
                  <Mail :size="16" class="entry-icon" />
                  <div class="entry-content">
                    <label>Email</label>
                    <span>{{ userProfile.email }}</span>
                  </div>
                </div>
                <div class="info-entry" v-if="userProfile.school">
                  <School :size="16" class="entry-icon" />
                  <div class="entry-content">
                    <label>Trường học</label>
                    <span>{{ userProfile.school }}</span>
                  </div>
                </div>
                <div class="info-entry" v-if="userProfile.major">
                  <BookOpen :size="16" class="entry-icon" />
                  <div class="entry-content">
                    <label>Chuyên ngành</label>
                    <span>{{ userProfile.major }}</span>
                  </div>
                </div>
                <div class="info-entry" v-if="userProfile.address || userProfile.city || userProfile.country">
                  <MapPin :size="16" class="entry-icon" />
                  <div class="entry-content">
                    <label>Vị trí</label>
                    <span>{{ [userProfile.address, userProfile.city, userProfile.country].filter(Boolean).join(', ') }}</span>
                  </div>
                </div>
                <div class="info-entry">
                  <Calendar :size="16" class="entry-icon" />
                  <div class="entry-content">
                    <label>Ngày tham gia</label>
                    <span>{{ formatDate(userProfile.createdDate) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="info-card social-card" v-if="userProfile.githubUrl || userProfile.linkedinUrl || userProfile.website">
              <h3 class="card-title">Liên kết mạng xã hội</h3>
              <div class="social-grid">
                <a v-if="userProfile.githubUrl" :href="userProfile.githubUrl" target="_blank" class="social-btn github">
                  <Github :size="18" /> GitHub
                </a>
                <a v-if="userProfile.linkedinUrl" :href="userProfile.linkedinUrl" target="_blank" class="social-btn linkedin">
                  <Linkedin :size="18" /> LinkedIn
                </a>
                <a v-if="userProfile.website" :href="userProfile.website" target="_blank" class="social-btn website">
                  <Globe :size="18" /> Website
                </a>
              </div>
            </div>
          </div>

          <!-- Right Column: Activity / Placeholder -->
          <div class="activity-column">
            <div class="info-card activity-card">
              <h3 class="card-title">Hoạt động gần đây</h3>
              <div class="empty-activity">
                 <p>Tính năng lịch sử hoạt động đang được phát triển...</p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: calc(100vh - 56px);
  background: var(--bg-primary);
  padding: 40px 20px;
}

.profile-container {
  max-width: 1100px;
  margin: 0 auto;
}

/* Header Card */
.profile-header-card {
  background: var(--bg-secondary);
  border-radius: 16px;
  border: 1px solid var(--border-primary);
  overflow: hidden;
  margin-bottom: 24px;
}

.cover-bg {
  height: 120px;
  background: linear-gradient(135deg, #2c3e50, #000000);
  opacity: 0.6;
}

.header-content {
  display: flex;
  padding: 0 40px 30px;
  margin-top: -60px;
  gap: 30px;
  align-items: flex-end;
}

.avatar-wrapper {
  position: relative;
}

.main-avatar {
  border: 4px solid var(--bg-secondary);
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  background: #282828;
}

.avatar-edit-hint {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: var(--accent-primary);
  color: #000;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 2px solid var(--bg-secondary);
}

.user-meta {
  flex: 1;
}

.name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.full-name {
  font-size: 32px;
  font-weight: 800;
  color: #fff;
  margin: 0;
}

.username {
  font-size: 18px;
  color: #8a8a8a;
  margin: 4px 0 12px;
}

.badges {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.role-badge {
  background: rgba(64, 158, 255, 0.2);
  border: 1px solid #409eff;
  color: #409eff;
}

.verified-badge {
  display: flex;
  align-items: center;
  gap: 4px;
}

.bio {
  color: #eff2f6;
  font-size: 14px;
  line-height: 1.5;
  max-width: 600px;
}

/* Stats Row */
.stats-overview {
  display: flex;
  border-top: 1px solid var(--border-primary);
  background: rgba(255,255,255,0.02);
}

.stat-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 40px;
  border-right: 1px solid var(--border-primary);
}

.stat-item:last-child {
  border-right: none;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.solved { background: rgba(255, 161, 22, 0.1); color: #ffa116; }
.stat-icon.ac { background: rgba(44, 187, 93, 0.1); color: #2cbb5d; }
.stat-icon.submission { background: rgba(64, 158, 255, 0.1); color: #409eff; }
.stat-icon.score-icon { 
  background: rgba(138, 138, 138, 0.1); 
  color: #eff2f6;
  font-size: 20px;
  font-weight: bold;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}

.stat-label {
  font-size: 12px;
  color: #8a8a8a;
  text-transform: uppercase;
}

/* Grid Layout */
.profile-grid {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 24px;
}

.info-card {
  background: var(--bg-secondary);
  border-radius: 16px;
  border: 1px solid var(--border-primary);
  padding: 24px;
  margin-bottom: 24px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #eff2f6;
  margin: 0 0 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-primary);
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-entry {
  display: flex;
  gap: 12px;
}

.entry-icon {
  color: #8a8a8a;
  flex-shrink: 0;
}

.entry-content {
  display: flex;
  flex-direction: column;
}

.entry-content label {
  font-size: 11px;
  text-transform: uppercase;
  color: #8a8a8a;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.entry-content span {
  font-size: 14px;
  color: #eff2f6;
}

.social-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.social-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.social-btn.github { background: #24292e; color: #fff; }
.social-btn.linkedin { background: #0077b5; color: #fff; }
.social-btn.website { background: #409eff; color: #fff; }

.social-btn:hover { opacity: 0.8; transform: translateX(4px); }

.empty-activity {
  padding: 40px;
  text-align: center;
  color: #8a8a8a;
  font-style: italic;
}

/* Responsive */
@media (max-width: 900px) {
  .profile-grid { grid-template-columns: 1fr; }
  .header-content { flex-direction: column; align-items: center; text-align: center; }
  .name-row { flex-direction: column; gap: 10px; }
  .stats-overview { flex-wrap: wrap; }
  .stat-item { border-bottom: 1px solid var(--border-primary); border-right: none; }
}

@media (max-width: 600px) {
  .stat-item { flex: 0 0 50%; }
}
</style>
