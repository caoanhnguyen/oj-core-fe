<script setup>
import { ref } from 'vue'
import { Users, Edit, Ban } from 'lucide-vue-next'

const users = ref([
  { id: 1, username: 'john_doe', email: 'john@example.com', role: 'USER', problemsSolved: 234, joinedAt: '2023-06-15', status: 'active' },
  { id: 2, username: 'jane_smith', email: 'jane@example.com', role: 'USER', problemsSolved: 189, joinedAt: '2023-07-20', status: 'active' },
])

const getRoleClass = (role) => {
  const classes = {
    'ADMIN': 'role-admin',
    'MODERATOR': 'role-moderator',
    'USER': 'role-user'
  }
  return classes[role] || ''
}

const handleEdit = (row) => {
  console.log('Edit user:', row)
}

const handleBan = (row) => {
  console.log('Ban user:', row)
}

</script>

<template>
  <div class="content-section">
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
            <el-tooltip content="Edit User" placement="top" effect="dark">
              <el-button link :icon="Edit" @click="handleEdit(row)" class="action-btn" />
            </el-tooltip>
            <el-tooltip content="Ban User" placement="top" effect="dark">
              <el-button link :icon="Ban" @click="handleBan(row)" class="action-btn action-danger" />
            </el-tooltip>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
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

/* Element Plus Table */
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

/* Responsive */
@media (max-width: 768px) {
  .content-section {
    padding: var(--spacing-lg);
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
