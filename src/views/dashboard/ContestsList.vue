<script setup>
import { ref } from 'vue'
import { Trophy, Edit, Trash2 } from 'lucide-vue-next'

const contests = ref([
  { id: 1, title: 'Weekly Contest 380', type: 'Weekly', participants: 12456, startTime: '2024-01-20 10:00', duration: '90 min', status: 'upcoming' },
  { id: 2, title: 'Biweekly Contest 120', type: 'Biweekly', participants: 8934, startTime: '2024-01-18 14:30', duration: '90 min', status: 'ongoing' },
  { id: 3, title: 'Weekly Contest 379', type: 'Weekly', participants: 13245, startTime: '2024-01-13 10:00', duration: '90 min', status: 'completed' },
])

const getContestTypeClass = (type) => {
  const classes = {
    'Weekly': 'contest-weekly',
    'Biweekly': 'contest-biweekly',
    'Special': 'contest-special'
  }
  return classes[type] || ''
}

const getStatusClass = (status) => {
  const classes = {
    'upcoming': 'status-upcoming',
    'ongoing': 'status-ongoing',
    'completed': 'status-completed'
  }
  return classes[status] || ''
}

const handleEdit = (row) => {
  console.log('Edit contest:', row)
}

const handleDelete = (row) => {
  console.log('Delete contest:', row)
}

</script>

<template>
  <div class="content-section">
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
            <el-tooltip content="Edit Contest" placement="top" effect="dark">
              <el-button link :icon="Edit" @click="handleEdit(row)" class="action-btn" />
            </el-tooltip>
            <el-tooltip content="Delete Contest" placement="top" effect="dark">
              <el-button link :icon="Trash2" @click="handleDelete(row)" class="action-btn action-danger" />
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
