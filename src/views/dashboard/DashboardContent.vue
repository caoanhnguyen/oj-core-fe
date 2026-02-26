<script setup>
import { ref, computed } from 'vue'
import { FileText, MessageSquare, Users, Trophy, TrendingUp, CheckCircle } from 'lucide-vue-next'

import ProblemsList from './ProblemsList.vue'
import ContestsList from './ContestsList.vue'
import DiscussionsList from './DiscussionsList.vue'
import UsersList from './UsersList.vue'

const props = defineProps({
  activeTab: {
    type: String,
    default: 'overview'
  }
})

const emit = defineEmits(['update:activeTab'])

// Use activeTab from props
const currentTab = computed(() => props.activeTab)

// Mock data for dashboard overview
const stats = ref([
  { label: 'Total Problems', value: '1,234', change: '+12%', trend: 'up', icon: FileText },
  { label: 'Active Users', value: '8,456', change: '+23%', trend: 'up', icon: Users },
  { label: 'Active Contests', value: '12', change: '+3', trend: 'up', icon: Trophy },
  { label: 'Discussions', value: '3,789', change: '+8%', trend: 'up', icon: MessageSquare },
])
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
    <ProblemsList v-if="activeTab === 'problems'" />

    <!-- Contests Tab -->
    <ContestsList v-if="activeTab === 'contests'" />

    <!-- Discussions Tab -->
    <DiscussionsList v-if="activeTab === 'discussions'" />

    <!-- Users Tab -->
    <UsersList v-if="activeTab === 'users'" />
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

</style>
