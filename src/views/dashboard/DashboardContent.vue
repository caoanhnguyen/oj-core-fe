<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { FileText, MessageSquare, Users, Trophy, TrendingUp, CheckCircle, Edit, Trash2, Eye, Ban } from 'lucide-vue-next'
import { useProblemStore } from '../../stores/problem'
import { ElMessageBox } from 'element-plus'

const props = defineProps({
  activeTab: {
    type: String,
    default: 'overview'
  }
})

const emit = defineEmits(['update:activeTab'])

const router = useRouter()
const problemStore = useProblemStore()

// Use activeTab from props
const currentTab = computed(() => props.activeTab)

// Mock data for dashboard overview
const stats = ref([
  { label: 'Total Problems', value: '1,234', change: '+12%', trend: 'up', icon: FileText },
  { label: 'Active Users', value: '8,456', change: '+23%', trend: 'up', icon: Users },
  { label: 'Active Contests', value: '12', change: '+3', trend: 'up', icon: Trophy },
  { label: 'Discussions', value: '3,789', change: '+8%', trend: 'up', icon: MessageSquare },
])

// Real problems data from store
const problems = computed(() => problemStore.problems)

// Mock data for other tabs
const contests = ref([
  { id: 1, title: 'Weekly Contest 380', type: 'Weekly', participants: 12456, startTime: '2024-01-20 10:00', duration: '90 min', status: 'upcoming' },
  { id: 2, title: 'Biweekly Contest 120', type: 'Biweekly', participants: 8934, startTime: '2024-01-18 14:30', duration: '90 min', status: 'ongoing' },
  { id: 3, title: 'Weekly Contest 379', type: 'Weekly', participants: 13245, startTime: '2024-01-13 10:00', duration: '90 min', status: 'completed' },
])

const discussions = ref([
  { id: 1, title: 'How to approach dynamic programming problems?', author: 'john_doe', replies: 45, views: 1234, category: 'General', createdAt: '2024-01-15' },
  { id: 2, title: 'Best practices for solving graph problems', author: 'jane_smith', replies: 32, views: 892, category: 'Algorithms', createdAt: '2024-01-14' },
])

const users = ref([
  { id: 1, username: 'john_doe', email: 'john@example.com', role: 'USER', problemsSolved: 234, joinedAt: '2023-06-15', status: 'active' },
  { id: 2, username: 'jane_smith', email: 'jane@example.com', role: 'USER', problemsSolved: 189, joinedAt: '2023-07-20', status: 'active' },
])

// Helper functions
const getDifficultyClass = (difficulty) => {
  const classes = {
    'EASY': 'difficulty-easy',
    'MEDIUM': 'difficulty-medium',
    'HARD': 'difficulty-hard',
    'Easy': 'difficulty-easy',
    'Medium': 'difficulty-medium',
    'Hard': 'difficulty-hard'
  }
  return classes[difficulty] || ''
}

const getStatusClass = (status) => {
  const classes = {
    'published': 'status-published',
    'draft': 'status-draft',
    'active': 'status-active',
    'inactive': 'status-inactive',
    'upcoming': 'status-upcoming',
    'ongoing': 'status-ongoing',
    'completed': 'status-completed'
  }
  return classes[status] || ''
}

const getContestTypeClass = (type) => {
  const classes = {
    'Weekly': 'contest-weekly',
    'Biweekly': 'contest-biweekly',
    'Special': 'contest-special'
  }
  return classes[type] || ''
}

const getRoleClass = (role) => {
  const classes = {
    'ADMIN': 'role-admin',
    'MODERATOR': 'role-moderator',
    'USER': 'role-user'
  }
  return classes[role] || ''
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// Actions
const handleEdit = (row, type) => {
  console.log(`Edit ${type}:`, row)
}

const handleDelete = async (row, type) => {
  if (type === 'problem') {
    try {
      await ElMessageBox.confirm(
        `Are you sure you want to delete "${row.title}"? This action cannot be undone.`,
        'Confirm Delete',
        {
          confirmButtonText: 'Delete',
          cancelButtonText: 'Cancel',
          type: 'warning',
          confirmButtonClass: 'el-button--danger'
        }
      )
      
      await problemStore.deleteProblem(row.id)
    } catch (error) {
      if (error !== 'cancel') {
        console.error('Delete failed:', error)
      }
    }
  } else {
    console.log(`Delete ${type}:`, row)
  }
}

const handleView = (row) => {
  console.log('View discussion:', row)
}

const handleBan = (row) => {
  console.log('Ban user:', row)
}

const handleAddProblem = () => {
  router.push('/dashboard/create-problem')
}

// Fetch problems on mount
onMounted(async () => {
  await problemStore.fetchProblems({ page: 0, size: 10 })
})
</script>

<template>
  <div class="dashboard-content">
    <!-- Overview Tab -->
    <div v-if="currentTab === 'overview'" class="content-section">
      <div class="section-header">
        <h1 class="section-title">Dashboard Overview</h1>
        <p class="section-subtitle">Welcome back! Here's what's happening with your platform.</p>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div v-for="stat in stats" :key="stat.label" class="stat-card">
          <div class="stat-icon">
            <component :is="stat.icon" :size="24" />
          </div>
          <div class="stat-content">
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-change" :class="stat.trend === 'up' ? 'trend-up' : 'trend-down'">
              <TrendingUp :size="14" />
              <span>{{ stat.change }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="quick-stats">
        <div class="quick-stat-card">
          <h3 class="quick-stat-title">Recent Activity</h3>
          <div class="activity-list">
            <div class="activity-item">
              <CheckCircle :size="16" class="activity-icon success" />
              <span>New problem "Binary Tree Traversal" published</span>
              <span class="activity-time">2 hours ago</span>
            </div>
            <div class="activity-item">
              <Users :size="16" class="activity-icon info" />
              <span>125 new users registered today</span>
              <span class="activity-time">5 hours ago</span>
            </div>
            <div class="activity-item">
              <Trophy :size="16" class="activity-icon warning" />
              <span>Weekly Contest 380 starting soon</span>
              <span class="activity-time">8 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Problems Tab -->
    <div v-if="activeTab === 'problems'" class="content-section">
      <div class="section-header">
        <div>
          <h1 class="section-title">Manage Problems</h1>
          <p class="section-subtitle">Create, edit, and manage coding problems</p>
        </div>
        <el-button type="primary" @click="handleAddProblem" class="add-button">
          <FileText :size="16" style="margin-right: 8px;" />
          Add Problem
        </el-button>
      </div>

      <el-table :data="problems" class="dashboard-table" v-loading="problemStore.loading">
        <el-table-column prop="id" label="ID" width="280" align="center">
          <template #default="{ row }">
            <span class="cell-id">{{ row.id }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="title" label="Title" min-width="250">
          <template #default="{ row }">
            <span class="cell-title">{{ row.title }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="difficulty" label="Difficulty" width="120" align="center">
          <template #default="{ row }">
            <span class="badge" :class="getDifficultyClass(row.difficulty)">{{ row.difficulty }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="createdDate" label="Created" width="130" align="center">
          <template #default="{ row }">
            <span class="cell-date">{{ formatDate(row.createdDate) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="Actions" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button link :icon="Edit" @click="handleEdit(row, 'problem')" class="action-btn" />
              <el-button link :icon="Trash2" @click="handleDelete(row, 'problem')" class="action-btn action-danger" />
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Contests Tab -->
    <div v-if="activeTab === 'contests'" class="content-section">
      <div class="section-header">
        <div>
          <h1 class="section-title">Manage Contests</h1>
          <p class="section-subtitle">Create and manage coding contests</p>
        </div>
        <el-button type="primary" class="add-button">
          <Trophy :size="16" style="margin-right: 8px;" />
          Create Contest
        </el-button>
      </div>

      <el-table :data="contests" class="dashboard-table">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="title" label="Title" min-width="200" />
        <el-table-column prop="type" label="Type" width="120" align="center">
          <template #default="{ row }">
            <span class="badge" :class="getContestTypeClass(row.type)">{{ row.type }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="Status" width="120" align="center">
          <template #default="{ row }">
            <span class="badge" :class="getStatusClass(row.status)">{{ row.status }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="120" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button link :icon="Edit" @click="handleEdit(row, 'contest')" class="action-btn" />
              <el-button link :icon="Trash2" @click="handleDelete(row, 'contest')" class="action-btn action-danger" />
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Discussions Tab -->
    <div v-if="activeTab === 'discussions'" class="content-section">
      <div class="section-header">
        <div>
          <h1 class="section-title">Manage Discussions</h1>
          <p class="section-subtitle">Monitor and moderate community discussions</p>
        </div>
        <el-button type="primary" class="add-button">
          <MessageSquare :size="16" style="margin-right: 8px;" />
          New Discussion
        </el-button>
      </div>

      <el-table :data="discussions" class="dashboard-table">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="title" label="Title" min-width="250" />
        <el-table-column prop="author" label="Author" width="150" />
        <el-table-column prop="category" label="Category" width="120" align="center">
          <template #default="{ row }">
            <span class="badge badge-category">{{ row.category }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="120" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button link :icon="Eye" @click="handleView(row)" class="action-btn" />
              <el-button link :icon="Trash2" @click="handleDelete(row, 'discussion')" class="action-btn action-danger" />
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Users Tab -->
    <div v-if="activeTab === 'users'" class="content-section">
      <div class="section-header">
        <div>
          <h1 class="section-title">Manage Users</h1>
          <p class="section-subtitle">View and manage user accounts</p>
        </div>
        <el-button type="primary" class="add-button">
          <Users :size="16" style="margin-right: 8px;" />
          Add User
        </el-button>
      </div>

      <el-table :data="users" class="dashboard-table">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="username" label="Username" width="150" />
        <el-table-column prop="email" label="Email" min-width="200" />
        <el-table-column prop="role" label="Role" width="120" align="center">
          <template #default="{ row }">
            <span class="badge" :class="getRoleClass(row.role)">{{ row.role }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="120" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button link :icon="Edit" @click="handleEdit(row, 'user')" class="action-btn" />
              <el-button link :icon="Ban" @click="handleBan(row)" class="action-btn action-danger" />
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.dashboard-content {
  width: 100%;
}

.content-section {
  padding: var(--spacing-2xl);
  max-width: 1400px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--spacing-2xl);
  gap: var(--spacing-lg);
}

.section-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.section-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

/* Add Button - Orange theme */
.add-button {
  background: var(--accent-primary) !important;
  border-color: var(--accent-primary) !important;
  color: #000 !important;
  font-weight: 600;
}

.add-button:hover {
  background: #ff8800 !important;
  border-color: #ff8800 !important;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.stat-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  transition: all 0.2s ease;
}

.stat-card:hover {
  border-color: var(--accent-primary);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(255, 161, 22, 0.1);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  background: rgba(255, 161, 22, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-primary);
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
}

.trend-up {
  color: var(--success);
}

/* Quick Stats */
.quick-stats {
  display: grid;
  gap: var(--spacing-lg);
}

.quick-stat-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
}

.quick-stat-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-lg) 0;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.activity-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
  font-size: 14px;
  color: var(--text-secondary);
}

.activity-icon {
  flex-shrink: 0;
}

.activity-icon.success {
  color: var(--success);
}

.activity-icon.info {
  color: var(--info);
}

.activity-icon.warning {
  color: var(--warning);
}

.activity-time {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
}

/* Element Plus Table - FIXED HOVER */
:deep(.dashboard-table) {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

:deep(.dashboard-table .el-table__header-wrapper) {
  background: var(--bg-tertiary);
}

:deep(.dashboard-table .el-table__header th) {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border-primary);
}

:deep(.dashboard-table .el-table__body tr) {
  background: var(--bg-secondary);
  transition: background 0.15s ease;
}

/* FIXED: Hover giống /problems - màu tối hơn */
:deep(.dashboard-table .el-table__body tr:hover > td) {
  background: var(--bg-tertiary) !important;
}

:deep(.dashboard-table .el-table__body td) {
  border-bottom: 1px solid var(--border-secondary);
  color: var(--text-primary);
}

:deep(.dashboard-table .el-table__body tr:last-child td) {
  border-bottom: none;
}

/* Cell Styles */
.cell-id {
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 12px;
}

.cell-title {
  font-weight: 500;
}

.cell-date {
  color: var(--text-secondary);
  font-size: 13px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: var(--spacing-xs);
  justify-content: center;
}

:deep(.action-btn) {
  padding: 6px;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

:deep(.action-btn:hover) {
  color: var(--accent-primary);
  background: rgba(255, 161, 22, 0.1);
}

:deep(.action-btn.action-danger:hover) {
  color: var(--error);
  background: rgba(239, 71, 67, 0.1);
}

/* Badges */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
  white-space: nowrap;
}

.difficulty-easy {
  background: rgba(0, 184, 163, 0.15);
  color: var(--success);
}

.difficulty-medium {
  background: rgba(255, 192, 30, 0.15);
  color: var(--warning);
}

.difficulty-hard {
  background: rgba(239, 71, 67, 0.15);
  color: var(--error);
}

.status-published,
.status-active {
  background: rgba(0, 184, 163, 0.15);
  color: var(--success);
}

.status-upcoming {
  background: rgba(255, 192, 30, 0.15);
  color: var(--warning);
}

.status-ongoing {
  background: rgba(0, 184, 163, 0.15);
  color: var(--success);
}

.status-completed {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
}

.contest-weekly {
  background: rgba(255, 161, 22, 0.15);
  color: var(--accent-primary);
}

.contest-biweekly {
  background: rgba(0, 184, 163, 0.15);
  color: var(--success);
}

.contest-special {
  background: rgba(239, 71, 67, 0.15);
  color: var(--error);
}

.badge-category {
  background: rgba(255, 161, 22, 0.15);
  color: var(--accent-primary);
}

.role-admin {
  background: rgba(239, 71, 67, 0.15);
  color: var(--error);
}

.role-moderator {
  background: rgba(255, 192, 30, 0.15);
  color: var(--warning);
}

.role-user {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
}

/* Responsive */
@media (max-width: 768px) {
  .content-section {
    padding: var(--spacing-lg);
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
