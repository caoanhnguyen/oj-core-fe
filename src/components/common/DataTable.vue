<script setup>
import { Edit, Trash2, Eye, Ban } from 'lucide-vue-next'

const props = defineProps({
  columns: {
    type: Array,
    required: true,
    // Example: [{ key: 'id', label: 'ID', width: '60px' }, { key: 'title', label: 'Title', flex: true }]
  },
  data: {
    type: Array,
    required: true
  },
  actions: {
    type: Array,
    default: () => []
    // Example: [{ type: 'edit', handler: (row) => {} }, { type: 'delete', handler: (row) => {} }]
  }
})

const emit = defineEmits(['row-click'])

const handleRowClick = (row) => {
  emit('row-click', row)
}

const getActionIcon = (type) => {
  const icons = {
    edit: Edit,
    delete: Trash2,
    view: Eye,
    ban: Ban
  }
  return icons[type] || Edit
}

const getActionClass = (type) => {
  const classes = {
    delete: 'action-danger',
    ban: 'action-danger'
  }
  return classes[type] || 'action-default'
}
</script>

<template>
  <div class="data-table-container">
    <div class="data-table">
      <!-- Header -->
      <div class="table-header">
        <div
          v-for="column in columns"
          :key="column.key"
          class="col"
          :class="column.align ? `col-${column.align}` : ''"
          :style="{
            width: column.width,
            flex: column.flex ? 1 : undefined,
            minWidth: column.minWidth,
            justifyContent: column.align === 'center' ? 'center' : column.align === 'right' ? 'flex-end' : 'flex-start'
          }"
        >
          {{ column.label }}
        </div>
        <div v-if="actions.length > 0" class="col col-actions">
          Actions
        </div>
      </div>

      <!-- Rows -->
      <div
        v-for="row in data"
        :key="row.id"
        class="table-row"
        @click="handleRowClick(row)"
      >
        <div
          v-for="column in columns"
          :key="column.key"
          class="col"
          :class="column.align ? `col-${column.align}` : ''"
          :style="{
            width: column.width,
            flex: column.flex ? 1 : undefined,
            minWidth: column.minWidth,
            justifyContent: column.align === 'center' ? 'center' : column.align === 'right' ? 'flex-end' : 'flex-start'
          }"
        >
          <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">
            {{ row[column.key] }}
          </slot>
        </div>

        <!-- Actions Column -->
        <div v-if="actions.length > 0" class="col col-actions" @click.stop>
          <button
            v-for="action in actions"
            :key="action.type"
            class="action-btn"
            :class="getActionClass(action.type)"
            :title="action.label || action.type"
            @click="action.handler(row)"
          >
            <component :is="getActionIcon(action.type)" :size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-table-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.data-table {
  width: 100%;
}

.table-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-primary);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table-row {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-secondary);
  cursor: pointer;
  transition: background 0.15s ease;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: var(--bg-tertiary);
}

.col {
  display: flex;
  align-items: center;
  color: var(--text-primary);
  font-size: 14px;
}

.col-center {
  justify-content: center;
}

.col-right {
  justify-content: flex-end;
}

.col-actions {
  width: 100px;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}

/* Action Buttons */
.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(255, 161, 22, 0.1);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.action-btn.action-danger:hover {
  background: rgba(239, 71, 67, 0.1);
  border-color: var(--error);
  color: var(--error);
}

/* Responsive */
@media (max-width: 768px) {
  .data-table-container {
    overflow-x: auto;
  }

  .data-table {
    min-width: 800px;
  }
}
</style>
