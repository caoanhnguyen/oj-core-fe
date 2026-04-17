<script setup>
import { computed } from 'vue'
import { Edit, Trash2, Eye, Ban, Settings, Info, Shield, Lock, Unlock } from 'lucide-vue-next'

const props = defineProps({
  columns: {
    type: Array,
    required: true,
    // Example: [{ key: 'id', label: 'ID', width: '60px', fixed: 'left' }, { key: 'title', label: 'Title', minWidth: '200px' }]
  },
  data: {
    type: Array,
    required: true
  },
  actions: {
    type: Array,
    default: () => []
    // Example: [{ type: 'edit', label: 'Sửa', handler: (row) => {} }]
  },
  actionWidth: {
    type: [Number, String],
    default: 150
  },
  actionLabel: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  },
  emptyText: {
    type: String,
    default: 'Không có dữ liệu'
  },
  rowClassName: {
    type: [String, Function],
    default: ''
  }
})

const emit = defineEmits(['row-click', 'selection-change'])

const handleRowClick = (row, column, event) => {
  emit('row-click', row, column, event)
}

const handleSelectionChange = (val) => {
  emit('selection-change', val)
}

const getActionIcon = (type) => {
  const icons = {
    edit: Edit,
    delete: Trash2,
    view: Eye,
    ban: Ban,
    settings: Settings,
    info: Info,
    shield: Shield,
    lock: Lock,
    unlock: Unlock
  }
  return icons[type] || Edit
}

const getActionClass = (type) => {
  const classes = {
    edit: 'action-btn-info',
    view: 'action-btn-info',
    info: 'action-btn-info',
    settings: 'action-btn-settings',
    shield: 'action-btn-shield',
    delete: 'action-btn-danger',
    ban: 'action-btn-danger',
    lock: 'action-btn-danger',
    unlock: 'action-btn-success'
  }
  return classes[type] || 'action-default'
}
</script>

<template>
  <div class="data-table-container">
    <el-table 
      :data="data" 
      v-loading="loading"
      class="dashboard-table leetcode-table sticky-table" 
      :class="{ 'is-empty': !data || data.length === 0 }"
      border
      style="width: 100%"
      :row-class-name="rowClassName"
      @row-click="handleRowClick"
      @selection-change="handleSelectionChange"
    >
      <template #empty>
        <el-empty :description="emptyText" />
      </template>

      <!-- Custom Columns -->
      <el-table-column
        v-for="(col, index) in columns"
        :key="col.key || index"
        :prop="col.key"
        :label="col.label"
        :width="col.width"
        :min-width="col.minWidth || col.width"
        :fixed="col.fixed"
        :align="col.align || 'center'"
        header-align="center"
        :type="col.type"
        :resizable="col.resizable !== false"
        :selectable="col.selectable"
      >
        <!-- Custom Header Slot -->
        <template #header="{ column, $index }">
          <slot :name="`header-${col.key}`" :column="column" :index="$index">
            {{ col.label }}
          </slot>
        </template>

        <!-- Custom Cell Slot for non-special columns -->
        <template v-if="!['selection', 'index', 'expand'].includes(col.type)" #default="{ row, $index }">
          <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]" :index="$index">
            <span class="cell-text">{{ row[col.key] || '—' }}</span>
          </slot>
        </template>
      </el-table-column>

      <!-- Actions Column -->
      <el-table-column 
        v-if="actions && actions.length > 0 || $slots.actions" 
        :label="actionLabel || $t('common.actions')" 
        :width="actionWidth" 
        align="center" 
        fixed="right"
        :resizable="false"
      >
        <template #default="{ row, $index }">
          <slot name="actions" :row="row" :index="$index">
            <div class="action-btns" @click.stop>
               <el-tooltip 
                  v-for="(action, idx) in actions" 
                  :key="idx" 
                  :content="action.label || action.type" 
                  placement="top" 
                  :hide-after="0"
                  :show-after="200"
                  :disabled="action.hideTooltip"
               >
                 <button 
                   v-if="!action.vIf || action.vIf(row)"
                   class="action-btn"
                   :class="getActionClass(action.type)"
                   @click.stop="action.handler(row)"
                   :disabled="action.disabled && action.disabled(row)"
                 >
                   <component :is="getActionIcon(action.type)" :size="15" />
                 </button>
               </el-tooltip>
            </div>
          </slot>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.data-table-container {
  width: 100%;
  overflow: hidden; /* Ensure el-table handles the scrolling, not the page */
  background: transparent;
}

.cell-text {
  color: #eff2f6;
  font-size: 13px;
}

/* Force inner tables and scroll containers to fill 100% to prevent fixed-right tearing */
/* BUT only when it has data, to prevent infinite resize loop when rendering el-empty */
:deep(.el-table:not(.is-empty) .el-table__header-wrapper table),
:deep(.el-table:not(.is-empty) .el-table__body-wrapper table),
:deep(.el-table:not(.is-empty) .el-scrollbar__view) {
  min-width: 100% !important;
}
:deep(.el-table:not(.is-empty) .el-scrollbar__view) {
  display: block !important;
}

/* Base LeetCode Table Style */
:deep(.leetcode-table) {
  background: var(--bg-primary) !important;
  --el-table-border-color: #2a2a2a !important; /* Subtle dark color for cell borders */
}

/* Border layout */
:deep(.leetcode-table.el-table--border) {
  border-left: 1px solid #2a2a2a !important;
  border-top: 1px solid #2a2a2a !important;
}

/* Remove default wrappers background */
:deep(.leetcode-table .el-table__inner-wrapper::after),
:deep(.leetcode-table .el-table__inner-wrapper::before) {
  background-color: #2a2a2a !important;
}

/* Headers */
:deep(.leetcode-table th.el-table__cell) {
  background: var(--bg-primary) !important; /* Opaque header */
  border-bottom: 1px solid #2a2a2a !important;
  border-right: 1px solid #2a2a2a !important;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 13px;
  padding: 12px 0;
  text-transform: uppercase;
}

/* Body cells */
:deep(.leetcode-table td.el-table__cell) {
  border-bottom: 1px solid #2a2a2a !important;
  border-right: 1px solid #2a2a2a !important;
  padding: 12px 0;
  background-color: var(--bg-primary) !important; /* Opaque even rows */
  color: #eff2f6;
  font-size: 13px;
}

/* Striped rows & hover */
:deep(.leetcode-table tr) {
  background-color: var(--bg-primary) !important;
}

:deep(.leetcode-table tr:nth-child(odd) td.el-table__cell) {
  background-color: #111111 !important; /* Opaque odd rows */
}

:deep(.leetcode-table tr:hover td.el-table__cell) {
  background-color: #1e1e1e !important; /* Opaque hover */
}

/* Checkbox Style - accent color handled by global style.css */
:deep(.el-checkbox__inner) {
  background-color: var(--bg-secondary) !important;
  border-color: var(--border-primary) !important;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: var(--accent-primary) !important;
  border-color: var(--accent-primary) !important;
}

/* Clickable / Disabled Rows passed via rowClassName */
:deep(.clickable-row) {
  cursor: pointer;
}
:deep(.disabled-row) {
  cursor: default;
}


/* Action Buttons */
.action-btns {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
}

.action-btn {
  background: transparent;
  border: none;
  color: #8a8a8a;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn-info:hover {
  color: #409eff;
  background: rgba(64, 158, 255, 0.1) !important;
}

.action-btn-shield:hover {
  color: #a355f5;
  background: rgba(163, 85, 245, 0.1) !important;
}

.action-btn-danger:hover {
  color: var(--error, #ef4743);
  background: rgba(239, 71, 67, 0.1) !important;
}

.action-btn-success:hover {
  color: var(--success, #2cbb5d);
  background: rgba(44, 187, 93, 0.1) !important;
}

.action-btn-settings:hover {
  color: var(--accent-primary, #ffa116);
  background: rgba(255, 161, 22, 0.1) !important;
}

/* Resizable column header drag handle */
:deep(.leetcode-table .el-table__column-resize-proxy) { 
  border-left: 1px solid var(--accent-primary) !important; 
}
</style>
