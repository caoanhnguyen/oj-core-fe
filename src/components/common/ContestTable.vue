<script setup>
import TableSkeleton from '@/components/common/TableSkeleton.vue'

const props = defineProps({
  columns: { type: Array, required: true },
  data: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: 'Không có dữ liệu' },
  rowKey: { type: String, default: 'id' },
  // If true, cursor:pointer on rows
  clickable: { type: Boolean, default: true }
})

const emit = defineEmits(['row-click'])
</script>

<template>
  <div class="ct-wrapper">
    <TableSkeleton v-if="loading && !data.length" :columns="columns.length" :rows="8" />

    <el-table
      v-else
      :data="data"
      class="ct-table"
      style="width: 100%"
      v-loading="loading && data.length > 0"
      :row-class-name="clickable ? 'ct-clickable' : ''"
      @row-click="(row) => emit('row-click', row)"
    >
      <template #empty>
        <el-empty :description="emptyText" />
      </template>

      <el-table-column
        v-for="col in columns"
        :key="col.key"
        :label="col.label"
        :width="col.width"
        :min-width="col.minWidth"
        :align="col.align || 'left'"
      >
        <template #default="{ row, $index }">
          <slot :name="`cell-${col.key}`" :row="row" :index="$index" :value="row[col.key]">
            {{ row[col.key] }}
          </slot>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.ct-wrapper { width: 100%; }

:deep(.ct-table) {
  background: transparent !important;
  border: none !important;
}
:deep(.ct-table .el-table__inner-wrapper::before) { display: none; }
:deep(.ct-table .el-table__inner-wrapper),
:deep(.ct-table .el-table__body-wrapper),
:deep(.ct-table .el-scrollbar),
:deep(.ct-table .el-scrollbar__wrap) {
  overflow: visible !important;
  height: auto !important;
  max-height: none !important;
}
:deep(.ct-table th.el-table__cell) {
  background: transparent !important;
  border-bottom: 1px solid #2e2e2e !important;
  color: #8a8a8a;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 10px 12px;
  white-space: nowrap;
}
:deep(.ct-table td.el-table__cell) {
  border-bottom: none !important;
  padding: 12px;
  background: transparent !important;
}
:deep(.ct-table tr) { background: transparent !important; }
:deep(.ct-table tr:nth-child(odd) td.el-table__cell) {
  background: rgba(255,255,255,0.025) !important;
}
:deep(.ct-table tr.ct-clickable) { cursor: pointer; }
:deep(.ct-table tr.ct-clickable:hover td.el-table__cell) {
  background: rgba(255,255,255,0.06) !important;
}

/* Force flex centering on center-aligned cells so block/inline-flex children center properly */
:deep(.ct-table td.el-table__cell.is-center .cell),
:deep(.ct-table th.el-table__cell.is-center .cell) {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
