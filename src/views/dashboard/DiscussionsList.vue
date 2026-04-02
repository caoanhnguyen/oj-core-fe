<script setup>
import { ref } from 'vue'
import { MessageSquare, Eye, Trash2 } from 'lucide-vue-next'
import PageHeader from '@/components/common/PageHeader.vue'

const discussions = ref([
  { id: 1, title: 'How to approach dynamic programming problems?', author: 'john_doe', replies: 45, views: 1234, category: 'General', createdAt: '2024-01-15' },
  { id: 2, title: 'Best practices for solving graph problems', author: 'jane_smith', replies: 32, views: 892, category: 'Algorithms', createdAt: '2024-01-14' },
])

const handleView = (row) => {
  console.log('View discussion:', row)
}

const handleDelete = (row) => {
  console.log('Delete discussion:', row)
}

</script>

<template>
  <div class="admin-layout-container">
    <PageHeader 
      title="Manage Discussions" 
      subtitle="Monitor and moderate community discussions"
    >
      <el-button type="primary" class="add-button">
        <MessageSquare :size="16" style="margin-right: 8px;" />
        New Discussion
      </el-button>
    </PageHeader>

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
            <el-tooltip content="View Discussion" placement="top" effect="dark">
              <el-button link :icon="Eye" @click="handleView(row)" class="action-btn action-view" />
            </el-tooltip>
            <el-tooltip content="Delete Discussion" placement="top" effect="dark">
              <el-button link :icon="Trash2" @click="handleDelete(row)" class="action-btn action-danger" />
            </el-tooltip>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
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

.badge-category {
  background: rgba(255, 161, 22, 0.15);
  color: var(--accent-primary);
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

:deep(.action-btn.action-view:hover) {
  color: #0088ff;
  background: rgba(0, 136, 255, 0.1);
}

:deep(.action-btn.action-danger:hover) {
  color: var(--error);
  background: rgba(239, 71, 67, 0.1);
}

</style>
