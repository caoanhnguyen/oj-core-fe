<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import usersApi from '@/api/users'
import { ElMessage } from 'element-plus'
import { 
  User, Mail, Phone, MapPin, School, BookOpen, 
  Github, Linkedin, Globe, Calendar, CheckCircle,
  Trophy, Send, Award, Edit3, Settings, 
  ExternalLink, ChevronRight, Info
} from 'lucide-vue-next'
import { submissionAPI } from '@/api/submissions'

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

// --- Heatmap & Solved Problems ---
const heatmapData = ref([])
const totalSubmissionsInYear = ref(0)
const solvedProblems = ref([])
const activitiesLoading = ref(false)

const fetchAdditionalData = async (userId) => {
  try {
    activitiesLoading.value = true
    const [heatmapRes, solvedRes] = await Promise.all([
      usersApi.getContributionHeatMap(userId),
      submissionAPI.getSubmissions({ 
        userId: userId, 
        submissionVerdict: 'AC', 
        size: 100, 
        sort: 'createdDate,DESC' 
      })
    ])
    
    heatmapData.value = heatmapRes.data.data.heatmapItems || []
    totalSubmissionsInYear.value = heatmapRes.data.data.totalSubmissions || 0
    
    // Deduplicate solved problems by problemId
    const seen = new Set()
    solvedProblems.value = solvedRes.content.filter(sub => {
      const duplicate = seen.has(sub.problemId)
      seen.add(sub.problemId)
      return !duplicate
    })
  } catch (error) {
    console.error('Failed to fetch user activities:', error)
  } finally {
    activitiesLoading.value = false
  }
}


const loadProfile = async () => {
  try {
    loading.value = true
    let response
    const isViewingOwnProfile = !idOrUsername.value || 
                              (authStore.user && (idOrUsername.value === authStore.user.id || idOrUsername.value === authStore.user.username))

    if (isViewingOwnProfile) {
      // Load current user with full private info
      response = await usersApi.getCurrentUser()
    } else {
      // Try by ID first, then by username
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrUsername.value)
      if (isUuid) {
        response = await usersApi.getUserProfileById(idOrUsername.value)
      } else {
        response = await usersApi.getUserProfileByUsername(idOrUsername.value)
      }
    }
    userProfile.value = response.data.data
    // Fetch heatmap and solved list after profile is loaded
    if (userProfile.value?.id) {
      fetchAdditionalData(userProfile.value.id)
    }
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

const formatDateShort = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    month: 'short',
    day: 'numeric'
  })
}

// --- Heatmap Logic ---
const heatmapWeeks = computed(() => {
  const weeks = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Create a map for quick lookup
  const dataMap = {}
  heatmapData.value.forEach(item => {
    const d = new Date(item.date)
    d.setHours(0, 0, 0, 0)
    dataMap[d.getTime()] = item.count
  })

  // We want to show 53 weeks (approx 1 year)
  // Find start date: most recent Sunday
  let current = new Date(today)
  current.setDate(current.getDate() - current.getDay()) // Back to Sun
  
  // Shift back 52 weeks
  const startDate = new Date(current)
  startDate.setDate(startDate.getDate() - (52 * 7))

  let runner = new Date(startDate)
  
  for (let w = 0; w < 53; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const time = runner.getTime()
      week.push({
        date: new Date(runner),
        count: dataMap[time] || 0,
        isFuture: runner > today
      })
      runner.setDate(runner.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
})

const getHeatColorClass = (count) => {
  if (count === 0) return 'color-level-0'
  if (count <= 2) return 'color-level-1'
  if (count <= 5) return 'color-level-2'
  if (count <= 10) return 'color-level-3'
  return 'color-level-4'
}

const getHeatTitle = (day) => {
  if (day.isFuture) return "Trong tương lai"
  return `${day.count} contributions on ${day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

// Logic to position month labels correctly above the first week of that month
const monthLabelPositions = computed(() => {
  const positions = []
  let lastMonth = -1
  heatmapWeeks.value.forEach((week, wIdx) => {
    const month = week[0].date.getMonth()
    if (month !== lastMonth) {
      positions.push(wIdx)
      lastMonth = month
    }
  })
  return positions
})

const getMonthName = (weekIdx) => {
  const date = heatmapWeeks.value[weekIdx][0].date
  return date.toLocaleString('en-US', { month: 'short' })
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
              <div class="bio" v-if="userProfile.bio" v-html="userProfile.bio"></div>
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

            <div class="info-card social-card" v-if="userProfile.githubUrl || userProfile.linkedInUrl || userProfile.website">
              <h3 class="card-title">Liên kết mạng xã hội</h3>
              <div class="social-grid">
                <a v-if="userProfile.githubUrl" :href="userProfile.githubUrl" target="_blank" class="social-btn github">
                  <Github :size="18" /> GitHub
                </a>
                <a v-if="userProfile.linkedInUrl" :href="userProfile.linkedInUrl" target="_blank" class="social-btn linkedin">
                  <Linkedin :size="18" /> LinkedIn
                </a>
                <a v-if="userProfile.website" :href="userProfile.website" target="_blank" class="social-btn website">
                  <Globe :size="18" /> Website
                </a>
              </div>
            </div>
          </div>

          <!-- Right Column: Activity -->
          <div class="activity-column">
            <!-- Heatmap Section -->
            <div class="info-card heatmap-card">
              <div class="card-header-with-action">
                <div class="card-title-group">
                  <h3 class="card-title">Lịch sử đóng góp</h3>
                  <span class="total-year-submissions" v-if="!activitiesLoading">{{ totalSubmissionsInYear }} lần nộp bài trong năm vừa qua</span>
                </div>
                <div class="heatmap-legend">
                  <span>Less</span>
                  <div class="legend-box color-level-0"></div>
                  <div class="legend-box color-level-1"></div>
                  <div class="legend-box color-level-2"></div>
                  <div class="legend-box color-level-3"></div>
                  <div class="legend-box color-level-4"></div>
                  <span>More</span>
                </div>
              </div>
              
              <div class="heatmap-container" v-if="!activitiesLoading">
                <div class="heatmap-scroll-wrapper">
                  <div class="month-labels">
                    <span v-for="wIdx in monthLabelPositions" :key="wIdx" class="month-label" :style="{ left: (wIdx * 13 + 35) + 'px' }">
                      {{ getMonthName(wIdx) }}
                    </span>
                  </div>
                  <div class="heatmap-grid">
                    <div class="day-labels">
                      <span>Mon</span>
                      <span>Wed</span>
                      <span>Fri</span>
                    </div>
                    <div v-for="(week, wIdx) in heatmapWeeks" :key="wIdx" class="heatmap-week">
                      <el-tooltip
                        v-for="(day, dIdx) in week" 
                        :key="dIdx"
                        :content="getHeatTitle(day)"
                        placement="top"
                        effect="dark"
                        :show-after="50"
                        :hide-after="0"
                        :enterable="false"
                      >
                        <div 
                          class="heat-box" 
                          :class="[getHeatColorClass(day.count), { 'is-future': day.isFuture }]"
                        ></div>
                      </el-tooltip>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="heatmap-skeleton"></div>
            </div>

            <!-- Solved Problems Section -->
            <div class="info-card solved-list-card">
              <h3 class="card-title">Bài tập đã giải ({{ userProfile.solvedCount || 0 }})</h3>
              
              <div class="solved-table-container" v-if="solvedProblems.length > 0">
                <div class="solved-item" v-for="problem in solvedProblems" :key="problem.problemId" @click="router.push(`/problems/${problem.problemSlug}`)">
                  <div class="solved-item-main">
                    <div class="status-icon-wrap">
                      <CheckCircle :size="16" class="ac-check" />
                    </div>
                    <span class="problem-title-link">{{ problem.problemTitle }}</span>
                  </div>
                  <div class="solved-item-meta">
                    <span class="solved-date">{{ formatDateShort(problem.createdDate) }}</span>
                    <ChevronRight :size="16" class="arrow-icon" />
                  </div>
                </div>
                
                <div v-if="solvedProblems.length >= 100" class="show-more-notice">
                  <Info :size="14" /> Chỉ hiển thị 100 bài gần nhất
                </div>
              </div>

              <div v-else-if="!activitiesLoading" class="empty-solved">
                 <p>Chưa có bài tập nào được giải.</p>
              </div>
              <div v-else-if="activitiesLoading" class="solved-skeleton"></div>
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
  max-width: 1200px; /* Tăng nhẹ để heatmap thoáng hơn */
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
  padding: 0 40px;
  margin-top: -60px;
  gap: 30px;
  align-items: flex-start;
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
  width: 32px; /* Increased slightly for better fit */
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 2px solid var(--bg-secondary);
  transition: all 0.2s;
}

.avatar-edit-hint:hover {
  background: #ff8800;
  transform: scale(1.1);
}

.avatar-edit-hint a {
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  width: 100%;
  height: 100%;
}

.user-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-top: 75px; /* Ensure name starts below cover edge (120px - 60px neg margin + buffer) */
  padding-bottom: 30px;
  min-height: 160px;
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
  line-height: 1.2;
}

.username {
  font-size: 18px;
  color: #8a8a8a;
  padding: 6px 0 10px;
  margin: 0;
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 5px 0 12px;
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
  background: rgba(44, 187, 93, 0.1) !important;
  border: 1px solid rgba(44, 187, 93, 0.3) !important;
  color: #2cbb5d !important;
}

.bio {
  color: #eff2f6;
  font-size: 14px;
  line-height: 1.6;
  max-width: 100%;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Stats Row */
.stats-overview {
  display: flex;
  border-top: 1px solid var(--border-primary);
  background: rgba(255,255,255,0.01);
  margin-top: 10px;
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
  grid-template-columns: 320px 1fr; /* Thu nhỏ cột trái 1 chút */
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
  min-width: 0; /* Cho phép con co giãn */
  flex: 1;
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
  word-break: break-word; /* Tự xuống dòng nếu quá dài (như email) */
  line-height: 1.4;
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

/* Heatmap & Activity */
.card-header-with-action {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border-primary);
}

.card-header-with-action .card-title {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0px;
}

.card-title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.total-year-submissions {
  font-size: 12px;
  color: #8a8a8a;
  font-weight: 400;
  margin-bottom: 12px;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #8a8a8a;
  padding-bottom: 12px;
}

.legend-box {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.heatmap-scroll-wrapper {
  overflow: hidden; /* Tuyệt đối không scroll */
  padding-bottom: 5px;
  position: relative;
  width: 100%;
}

.month-labels {
  position: relative;
  height: 20px;
  margin-bottom: 8px;
}

.month-label {
  position: absolute;
  font-size: 11px;
  color: #8a8a8a;
  white-space: nowrap;
}

.heatmap-grid {
  display: flex;
  gap: 3px;
  justify-content: flex-start;
}

.day-labels {
  display: flex;
  flex-direction: column;
  padding: 0;
  margin-right: 8px;
  height: 95px;
}

.day-labels span {
  font-size: 11px;
  color: #818181;
  line-height: 11px; /* Khớp với chiều cao ô */
}

/* Căn chỉnh chính xác theo hàng */
.day-labels span:nth-child(1) { margin-top: 14px; } /* Mon - Hàng 1 */
.day-labels span:nth-child(2) { margin-top: 17px; } /* Wed - Hàng 3 (3px x 2 gap + 11px box height) */
.day-labels span:nth-child(3) { margin-top: 17px; } /* Fri - Hàng 5 */


.heatmap-week {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.heat-box {
  width: 11px;
  height: 11px;
  border-radius: 2px;
  background: #2c2b2b; /* Màu xám sáng hơn để dễ nhìn ô trống */
  transition: all 0.2s;
  outline: 1px solid rgba(255, 255, 255, 0.03);
}

.heat-box:hover {
  transform: scale(1.2);
  z-index: 10;
  outline: 1px solid rgba(255,255,255,0.3);
}

.is-future {
  opacity: 0.1;
}

.color-level-0 { background: #2c2b2b; }
.color-level-1 { background: #0e4429; }
.color-level-2 { background: #006d32; }
.color-level-3 { background: #26a641; }
.color-level-4 { background: #39d353; }



/* Solved List */
.solved-table-container {
  display: flex;
  flex-direction: column;
}

.solved-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.solved-item:hover {
  background: rgba(255,255,255,0.04);
}

.solved-item-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(44, 187, 93, 0.1);
  border-radius: 50%;
}

.ac-check {
  color: #2cbb5d;
}

.problem-title-link {
  font-size: 14px;
  font-weight: 500;
  color: #eff2f6;
}

.solved-item-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.solved-date {
  font-size: 13px;
  color: #8a8a8a;
}

.arrow-icon {
  color: #434343;
  transition: transform 0.2s;
}

.solved-item:hover .arrow-icon {
  color: #8a8a8a;
  transform: translateX(3px);
}

.empty-solved {
  padding: 40px;
  text-align: center;
  color: #8a8a8a;
  font-style: italic;
}

.show-more-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 16px;
  font-size: 12px;
  color: #666;
}

/* Skeletons */
.heatmap-skeleton {
  height: 100px;
  background: rgba(255,255,255,0.03);
  border-radius: 8px;
  animation: pulse 2s infinite;
}

.solved-skeleton {
  height: 300px;
  background: rgba(255,255,255,0.03);
  border-radius: 8px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 0.3; }
  100% { opacity: 0.6; }
}

/* Responsive */
@media (max-width: 900px) {
  .profile-grid { grid-template-columns: 1fr; }
  .header-content { flex-direction: column; align-items: center; text-align: center; padding: 0 20px 40px; }
  .user-meta { padding-top: 10px; min-height: auto; }
  .name-row { flex-direction: column; gap: 10px; justify-content: center; }
  .badges { justify-content: center; }
  .stats-overview { flex-wrap: wrap; }
  .stat-item { border-bottom: 1px solid var(--border-primary); border-right: none; padding: 20px; }
}

@media (max-width: 600px) {
  .stat-item { flex: 0 0 50%; }
}
</style>

