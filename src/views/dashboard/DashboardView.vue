<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LayoutDashboard, FileText, MessageSquare, Users, Trophy, ChevronLeft, ChevronRight, Tag } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const isCollapsed = ref(false)

const menuItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'problems', label: 'Problems', icon: FileText },
  { id: 'topics', label: 'Topics', icon: Tag },
  { id: 'contests', label: 'Contests', icon: Trophy },
  { id: 'discussions', label: 'Discussions', icon: MessageSquare },
  { id: 'users', label: 'Users', icon: Users },
]

const activeTab = ref(route.query.tab || 'overview')

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// Handle tab click
const handleTabClick = (tabId) => {
  activeTab.value = tabId
  router.push({ path: '/dashboard', query: { tab: tabId } })
}

// Watch route and query changes
watch(
  () => [route.path, route.query.tab],
  ([newPath, newTab]) => {
    if (newPath === '/dashboard') {
      activeTab.value = newTab || 'overview'
    }
  }
)
</script>

<template>
  <div class="dashboard-layout">
    <!-- Sidebar -->
    <aside class="dashboard-sidebar" :class="{ 'is-collapsed': isCollapsed }">
      <div class="sidebar-header">
        <LayoutDashboard :size="28" class="sidebar-logo" />
        <h2 class="sidebar-title" v-show="!isCollapsed">Admin Panel</h2>
      </div>

      <nav class="sidebar-nav">
        <button
          v-for="item in menuItems"
          :key="item.id"
          class="nav-item"
          :class="{ 'is-active': activeTab === item.id }"
          @click="handleTabClick(item.id)"
          :title="isCollapsed ? item.label : ''"
        >
          <component :is="item.icon" :size="22" class="nav-icon" />
          <span class="nav-label" v-show="!isCollapsed">{{ item.label }}</span>
        </button>
      </nav>

      <!-- Collapse Toggle -->
      <div class="sidebar-footer">
        <button class="collapse-btn" @click="toggleCollapse">
          <component :is="isCollapsed ? ChevronRight : ChevronLeft" :size="20" />
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="dashboard-main">
      <router-view :active-tab="activeTab" @update:active-tab="handleTabClick" />
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
  flex-shrink: 0;
  transition: width 0.3s ease;
  overflow: hidden; /* Hide overflow during transition */
}

.dashboard-sidebar.is-collapsed {
  width: 72px; /* Collapsed width */
}

/* Header */
.sidebar-header {
  height: 70px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid var(--border-primary);
  gap: 16px;
  white-space: nowrap; /* Prevent title wrapping */
  overflow: hidden;
}

.dashboard-sidebar.is-collapsed .sidebar-header {
  padding: 0;
  justify-content: center;
}

.sidebar-logo {
  color: var(--accent-primary);
  flex-shrink: 0;
  transition: all 0.3s;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  opacity: 1;
  transition: opacity 0.2s;
}

/* Navigation */
.sidebar-nav {
  flex: 1; /* Push footer down */
  padding: 24px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
  white-space: nowrap;
}

.dashboard-sidebar.is-collapsed .nav-item {
  padding: 12px 0;
  justify-content: center;
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

.nav-icon {
  flex-shrink: 0;
}

/* Footer / Collapse Toggle */
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--border-primary);
  display: flex;
  justify-content: flex-end;
}
.dashboard-sidebar.is-collapsed .sidebar-footer {
  justify-content: center;
}

.collapse-btn {
  background: transparent;
  border: 1px solid var(--border-primary);
  color: var(--text-secondary);
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.collapse-btn:hover {
  background: var(--bg-primary);
  color: #fff;
  border-color: #666;
}

/* Main Content */
.dashboard-main {
  flex: 1;
  overflow-y: auto;
  min-width: 0;
}

/* Responsive Overrides */
@media (max-width: 768px) {
  .dashboard-layout { flex-direction: column; }
  .dashboard-sidebar { width: 100% !important; height: auto; position: static; border-right: none; }
  .sidebar-nav { flex-direction: row; overflow-x: auto; padding: 12px; }
  .sidebar-header, .sidebar-footer { display: none; } /* Simplify mobile */
  .nav-item { width: auto; flex-direction: column; gap: 4px; padding: 8px; font-size: 11px; }
  .nav-icon { margin-bottom: 2px; }
}
</style>
