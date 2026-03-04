<template>
  <div class="table-skeleton">
    <el-skeleton animated>
      <template #template>
        <!-- Skeleton Header -->
        <div class="skeleton-header-row">
          <el-skeleton-item variant="rect" class="skeleton-header-cell" style="width: 5%" />
          <el-skeleton-item variant="rect" class="skeleton-header-cell" style="flex: 2" />
          <el-skeleton-item variant="rect" class="skeleton-header-cell" style="flex: 1" />
          <el-skeleton-item variant="rect" class="skeleton-header-cell" style="flex: 1" />
          <el-skeleton-item variant="rect" class="skeleton-header-cell" style="width: 15%" />
        </div>
        
        <!-- Skeleton Rows -->
        <div 
          class="skeleton-body-row" 
          v-for="row in rows" 
          :key="'r' + row"
        >
          <el-skeleton-item variant="text" class="skeleton-body-cell" style="width: 5%" />
          <el-skeleton-item variant="text" class="skeleton-body-cell" :style="{ flex: 2, marginRight: getRandomWidth() + 'px' }" />
          <el-skeleton-item variant="text" class="skeleton-body-cell" style="flex: 1" />
          <el-skeleton-item variant="text" class="skeleton-body-cell" style="flex: 1" />
          <el-skeleton-item variant="text" class="skeleton-body-cell" style="width: 15%" />
        </div>
      </template>
    </el-skeleton>
  </div>
</template>

<script setup>
defineProps({
  rows: {
    type: Number,
    default: 10
  }
})

const getRandomWidth = () => {
  return Math.floor(Math.random() * 40) + 10
}
</script>

<style scoped>
.table-skeleton {
  width: 100%;
  padding-top: 12px;
}

.skeleton-header-row {
  display: flex;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-primary);
  margin-bottom: 8px;
  gap: 20px;
}

.skeleton-header-cell {
  height: 20px;
  border-radius: 4px;
}

.skeleton-body-row {
  display: flex;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-primary);
  align-items: center;
  gap: 20px;
}

.skeleton-body-cell {
  height: 16px;
  border-radius: 4px;
}
</style>
