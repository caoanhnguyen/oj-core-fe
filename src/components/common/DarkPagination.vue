<template>
  <div class="pagination-container" v-if="total > 0">
    <el-pagination
      :current-page="currentPage"
      :page-size="pageSize"
      :page-sizes="pageSizes"
      :background="true"
      :layout="layout"
      :total="total"
      @size-change="handleSizeChange"
      @current-change="handlePageChange"
      class="dark-pagination"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  pageSize: {
    type: Number,
    required: true
  },
  pageSizes: {
    type: Array,
    default: () => [10, 20, 50, 100]
  },
  layout: {
    type: String,
    default: 'total, sizes, prev, pager, next, jumper'
  },
  total: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['update:currentPage', 'update:pageSize', 'size-change', 'current-change'])

const handleSizeChange = (val) => {
  emit('update:pageSize', val)
  emit('size-change', val)
}

const handlePageChange = (val) => {
  emit('update:currentPage', val)
  emit('current-change', val)
}
</script>

<style scoped>
.pagination-container {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

:deep(.dark-pagination .el-pagination__total),
:deep(.dark-pagination .el-pagination__jump) {
  color: #8a8a8a !important;
}
:deep(.dark-pagination .btn-prev),
:deep(.dark-pagination .btn-next),
:deep(.dark-pagination .el-pager li) {
  background-color: #282828 !important;
  color: #8a8a8a;
  border: 1px solid #3e3e3e;
}
:deep(.dark-pagination .el-pager li:hover) {
  color: var(--accent-primary) !important;
}
:deep(.dark-pagination .el-pager li.is-active) {
  background-color: var(--accent-primary) !important;
  color: #000 !important;
  border-color: var(--accent-primary) !important;
}
</style>
