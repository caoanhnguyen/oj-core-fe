<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { ElMessage } from 'element-plus'

// ...existing code...

const authStore = useAuthStore()
const loading = ref(false)
const userProfile = ref(null)

const loadProfile = async () => {
  try {
    loading.value = true
    const data = await authStore.getCurrentUser()
    userProfile.value = data
    ElMessage.success('Tải thông tin thành công!')
  } catch (error) {
    const message = error.response?.data?.message || 'Không thể tải thông tin người dùng'
    ElMessage.error(message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <div class="profile-view">
    <div class="content-wrapper">
      <div class="profile-header">
        <h1>My Profile</h1>
        <el-button @click="loadProfile" :loading="loading" type="primary" round>
          <i class="el-icon-refresh"></i> Refresh
        </el-button>
      </div>

      <el-card v-loading="loading" class="profile-card">
        <template v-if="userProfile">
          <!-- Avatar and Basic Info Section -->
          <div class="profile-top">
            <div class="avatar-section">
              <el-avatar
                :size="150"
                :src="userProfile.avatarUrl || ''"
                class="profile-avatar"
              >
                <span class="avatar-fallback">{{ userProfile.username?.charAt(0).toUpperCase() || 'U' }}</span>
              </el-avatar>
              <div class="user-basic-info">
                <h2 class="user-name">{{ userProfile.fullName || userProfile.username }}</h2>
                <p class="user-username">@{{ userProfile.username }}</p>
                <p class="user-bio" v-if="userProfile.bio">{{ userProfile.bio }}</p>
                <div class="user-badges">
                  <el-tag
                    :type="userProfile.emailVerified ? 'success' : 'warning'"
                    size="small"
                    effect="plain"
                  >
                    {{ userProfile.emailVerified ? '✓ Email Verified' : '⚠ Email Not Verified' }}
                  </el-tag>
                  <el-tag type="info" size="small" effect="plain" v-if="userProfile.provider">
                    {{ userProfile.provider }}
                  </el-tag>
                  <el-tag
                    v-for="role in userProfile.roles"
                    :key="role"
                    type="primary"
                    size="small"
                    effect="plain"
                  >
                    {{ role }}
                  </el-tag>
                </div>
              </div>
            </div>

            <!-- Stats Cards -->
            <div class="stats-section">
              <div class="stat-card">
                <div class="stat-icon rating">⭐</div>
                <div class="stat-content">
                  <div class="stat-value">{{ userProfile.rating || 0 }}</div>
                  <div class="stat-label">Rating</div>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon solved">✓</div>
                <div class="stat-content">
                  <div class="stat-value">{{ userProfile.solvedCount || 0 }}</div>
                  <div class="stat-label">Solved</div>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon submission">📝</div>
                <div class="stat-content">
                  <div class="stat-value">{{ userProfile.submissionCount || 0 }}</div>
                  <div class="stat-label">Submissions</div>
                </div>
              </div>
            </div>
          </div>

          <el-divider />

          <!-- Contact Information -->
          <div class="profile-section">
            <h3><i class="el-icon-message"></i> Contact Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>Email</label>
                <span>{{ userProfile.email }}</span>
              </div>
              <div class="info-item" v-if="userProfile.phoneNumber">
                <label>Phone</label>
                <span>{{ userProfile.phoneNumber }}</span>
              </div>
              <div class="info-item" v-if="userProfile.address">
                <label>Address</label>
                <span>{{ userProfile.address }}</span>
              </div>
              <div class="info-item" v-if="userProfile.city">
                <label>City</label>
                <span>{{ userProfile.city }}</span>
              </div>
              <div class="info-item" v-if="userProfile.country">
                <label>Country</label>
                <span>{{ userProfile.country }}</span>
              </div>
            </div>
          </div>

          <el-divider v-if="userProfile.school || userProfile.major" />

          <!-- Education -->
          <div class="profile-section" v-if="userProfile.school || userProfile.major">
            <h3><i class="el-icon-school"></i> Education</h3>
            <div class="info-grid">
              <div class="info-item" v-if="userProfile.school">
                <label>School</label>
                <span>{{ userProfile.school }}</span>
              </div>
              <div class="info-item" v-if="userProfile.major">
                <label>Major</label>
                <span>{{ userProfile.major }}</span>
              </div>
            </div>
          </div>

          <el-divider v-if="userProfile.githubUrl || userProfile.linkedinUrl || userProfile.website" />

          <!-- Social Links -->
          <div class="profile-section" v-if="userProfile.githubUrl || userProfile.linkedinUrl || userProfile.website">
            <h3><i class="el-icon-link"></i> Social Links</h3>
            <div class="social-links">
              <a v-if="userProfile.githubUrl" :href="userProfile.githubUrl" target="_blank" class="social-link github">
                <svg height="24" viewBox="0 0 16 16" width="24"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
                GitHub
              </a>
              <a v-if="userProfile.linkedinUrl" :href="userProfile.linkedinUrl" target="_blank" class="social-link linkedin">
                <svg height="24" viewBox="0 0 24 24" width="24"><path fill="currentColor" d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"></path></svg>
                LinkedIn
              </a>
              <a v-if="userProfile.website" :href="userProfile.website" target="_blank" class="social-link website">
                <i class="el-icon-link"></i>
                Website
              </a>
            </div>
          </div>

          <el-divider />

          <!-- Account Details -->
          <div class="profile-section">
            <h3><i class="el-icon-info"></i> Account Details</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>User ID</label>
                <span class="monospace">{{ userProfile.id }}</span>
              </div>
              <div class="info-item">
                <label>Member Since</label>
                <span>{{ new Date(userProfile.createdDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
              </div>
            </div>
          </div>
        </template>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.profile-view {
  min-height: calc(100vh - 50px);
  background: var(--bg-primary);
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-2xl) var(--spacing-lg);
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
}

.profile-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.profile-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.profile-top {
  display: flex;
  gap: var(--spacing-2xl);
  margin-bottom: var(--spacing-xl);
}

.avatar-section {
  display: flex;
  gap: var(--spacing-xl);
  align-items: flex-start;
  flex: 1;
}

.profile-avatar {
  border: 4px solid var(--border-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.avatar-fallback {
  font-size: 60px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.user-basic-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.user-username {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-md) 0;
}

.user-bio {
  font-size: 14px;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-md) 0;
  line-height: 1.6;
}

.user-badges {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  min-width: 360px;
}

.stat-card {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.rating {
  background: linear-gradient(135deg, #FFA726 0%, #FB8C00 100%);
}

.stat-icon.solved {
  background: linear-gradient(135deg, #66BB6A 0%, #43A047 100%);
}

.stat-icon.submission {
  background: linear-gradient(135deg, #42A5F5 0%, #1E88E5 100%);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: var(--spacing-xs);
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.profile-section {
  margin-bottom: var(--spacing-lg);
}

.profile-section:last-child {
  margin-bottom: 0;
}

.profile-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-lg) 0;
  align-items: center;
  gap: var(--spacing-sm);
}

.profile-section h3 i {
  color: #667eea;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.info-item label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item span,
.info-item a {
  font-size: 15px;
  color: var(--text-primary);
}

.info-item .monospace {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  background: var(--bg-primary);
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.social-links {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.social-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: 8px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: transform 0.2s, box-shadow 0.2s;
}

.social-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.social-link.github {
  background: #24292e;
  color: #fff;
}

.social-link.linkedin {
  background: #0077b5;
  color: #fff;
}

.social-link.website {
  background: #667eea;
  color: #fff;
}

:deep(.el-card__body) {
  padding: var(--spacing-2xl);
}

:deep(.el-divider) {
  margin: var(--spacing-2xl) 0;
}

:deep(.el-avatar) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Responsive */
@media (max-width: 1024px) {
  .profile-top {
    flex-direction: column;
  }

  .stats-section {
    min-width: 100%;
  }
}

@media (max-width: 768px) {
  .content-wrapper {
    padding: var(--spacing-lg) var(--spacing-md);
  }

  .profile-header h1 {
    font-size: 24px;
  }

  .avatar-section {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .user-name {
    font-size: 24px;
  }

  .user-badges {
    justify-content: center;
  }

  .stats-section {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  :deep(.el-card__body) {
    padding: var(--spacing-lg);
  }
}
</style>

