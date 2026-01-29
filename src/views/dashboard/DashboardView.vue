<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LayoutDashboard, FileText, MessageSquare, Users, Trophy } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const menuItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'problems', label: 'Problems', icon: FileText },
  { id: 'contests', label: 'Contests', icon: Trophy },
  { id: 'discussions', label: 'Discussions', icon: MessageSquare },
  { id: 'users', label: 'Users', icon: Users },
]

const activeTab = ref('overview')

// Handle tab click
const handleTabClick = (tabId) => {
  activeTab.value = tabId
  // Navigate to dashboard root when clicking tabs
  if (route.path !== '/dashboard') {
    router.push('/dashboard')
  }
}

// Watch route changes to reset activeTab when leaving create-problem
watch(() => route.path, (newPath) => {
  if (newPath === '/dashboard') {
    // Keep current activeTab
  } else if (newPath.startsWith('/dashboard/')) {
    // On nested routes, don't change activeTab
  }
})
</script>

<template>
  <div class="dashboard-layout">
    <!-- Sidebar -->
    <aside class="dashboard-sidebar">
      <div class="sidebar-header">
        <LayoutDashboard :size="24" class="sidebar-logo" />
        <h2 class="sidebar-title">Admin Panel</h2>
      </div>

      <nav class="sidebar-nav">
        <button
          v-for="item in menuItems"
          :key="item.id"
          class="nav-item"
          :class="{ 'is-active': activeTab === item.id }"
          @click="handleTabClick(item.id)"
        >
          <component :is="item.icon" :size="20" />
          <span>{{ item.label }}</span>
        </button>
      </nav>
    </aside>

    <!-- Main Content - Router View -->
    <main class="dashboard-main">
      <router-view :active-tab="activeTab" @update:active-tab="activeTab = $event" />
    </main>
  </div>
</template>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: calc(100vh - 56px);
  background: var(--bg-primary);
}

/* Sidebar */
.dashboard-sidebar {
  width: 260px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-primary);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 56px;
  height: calc(100vh - 56px);
  overflow-y: auto;
  flex-shrink: 0;
}

.sidebar-header {
  padding: var(--spacing-2xl) var(--spacing-xl);
  border-bottom: 1px solid var(--border-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.sidebar-logo {
  color: var(--accent-primary);
  flex-shrink: 0;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.sidebar-nav {
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background: transparent;
  border: none;
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
}

.nav-item:hover {
  background: rgba(255, 161, 22, 0.1);
  color: var(--accent-primary);
}

.nav-item.is-active {
  background: linear-gradient(135deg, rgba(255, 161, 22, 0.15) 0%, rgba(255, 136, 0, 0.15) 100%);
  color: var(--accent-primary);
  box-shadow: 0 2px 8px rgba(255, 161, 22, 0.2);
}

/* Main Content */
.dashboard-main {
  flex: 1;
  overflow-y: auto;
  min-width: 0;
}

/* Responsive */
@media (max-width: 1024px) {
  .dashboard-sidebar {
    width: 220px;
  }
}

@media (max-width: 768px) {
  .dashboard-layout {
    flex-direction: column;
  }

  .dashboard-sidebar {
    width: 100%;
    height: auto;
    position: static;
    border-right: none;
    border-bottom: 1px solid var(--border-primary);
  }

  .sidebar-nav {
    flex-direction: row;
    overflow-x: auto;
  }

  .nav-item {
    flex-shrink: 0;
  }
}
</style>
