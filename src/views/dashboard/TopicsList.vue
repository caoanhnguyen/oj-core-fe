<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Plus, Edit, Trash2, RotateCcw } from 'lucide-vue-next'
import { useTopicStore } from '@/stores/topic'
import { ElMessageBox, ElMessage } from 'element-plus'
import TopicFormDialog from '@/components/topics/TopicFormDialog.vue'
import TableSkeleton from '@/components/common/TableSkeleton.vue'

const topicStore = useTopicStore()

// State
const searchQuery = ref('')
const dialogVisible = ref(false)
const dialogType = ref('create') // 'create' or 'edit'

const formData = ref({
  topicId: null,
  name: '',
  slug: '',
  description: ''
})

// Computed
const topics = computed(() => topicStore.adminTopics)
const loading = computed(() => topicStore.loading)
const pagination = computed(() => topicStore.pagination)

// Actions
const loadTopics = async () => {
  await topicStore.fetchAdminTopics({
    page: pagination.value.page,
    size: pagination.value.size,
    name: searchQuery.value
  })
}

const handleSearch = () => {
  pagination.value.page = 0
  loadTopics()
}

const handlePageChange = (page) => {
  pagination.value.page = page - 1
  loadTopics()
}

const handleSizeChange = (size) => {
  pagination.value.size = size
  pagination.value.page = 0
  loadTopics()
}

const openCreateDialog = () => {
  dialogType.value = 'create'
  formData.value = { topicId: null, name: '', slug: '', description: '' }
  dialogVisible.value = true
}

const openEditDialog = async (row) => {
  try {
    const idToFetch = row.topicId
    const topicDetails = await topicStore.getAdminTopicById(idToFetch)
    // debugger
    dialogType.value = 'edit'
    formData.value = { 
      topicId: topicDetails.topicId,
      name: topicDetails.name,
      slug: topicDetails.slug, 
      description: topicDetails.description || '' 
    }
    dialogVisible.value = true
  } catch (error) {
    console.error('Failed to load topic details for edit', error)
  }
}

const submitForm = async (data) => {
  try {
    if (dialogType.value === 'create') {
      await topicStore.createTopic({
        name: data.name,
        slug: data.slug,
        description: data.description
      })
    } else {
      const idToUpdate = data.topicId
      await topicStore.updateTopic(idToUpdate, {
        name: data.name,
        slug: data.slug,
        description: data.description
      })
    }
    dialogVisible.value = false
    loadTopics()
  } catch (error) {
    // Error handled in store
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete topic "${row.name}"?`,
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
        customClass: 'dark-message-box',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    const idToDelete = row.topicId || row.topicID
    await topicStore.deleteTopic(idToDelete)
    loadTopics()
  } catch (error) {
    if (error !== 'cancel') console.error(error)
  }
}

const handleRestore = async (row) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to restore topic "${row.name}"?`,
      'Confirm Restore',
      {
        confirmButtonText: 'Restore',
        cancelButtonText: 'Cancel',
        customClass: 'dark-message-box',
        type: 'info'
      }
    )
    
    const idToRestore = row.topicId || row.topicID
    await topicStore.restoreTopic(idToRestore)
    loadTopics()
  } catch (error) {
    if (error !== 'cancel') console.error(error)
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

onMounted(() => {
  loadTopics()
})
</script>

<template>
  <div class="content-section">
    <div class="section-header">
      <div>
        <h1 class="section-title">Manage Topics</h1>
        <p class="section-subtitle">Create and manage problem categories</p>
      </div>
      <el-button type="primary" @click="openCreateDialog" class="add-button">
        <Plus :size="16" style="margin-right: 8px;" />
        Add Topic
      </el-button>
    </div>

    <div class="table-controls">
      <div class="search-wrap">
        <Search class="search-icon" :size="16" />
        <input 
          type="text" 
          v-model="searchQuery" 
          @keyup.enter="handleSearch"
          placeholder="Search topics by name" 
          class="search-input" 
        />
      </div>
    </div>

    <TableSkeleton v-if="loading && topics.length === 0" :columns="6" :rows="10" />
    
    <el-table 
      v-else 
      :data="topics" 
      class="dashboard-table leetcode-table" 
      v-loading="loading" 
      :show-header="true"
    >
      <template #empty>
        <el-empty description="No topics found" />
      </template>

      <el-table-column width="60" align="center">
        <template #default="{ $index }">
          <span class="cell-index">{{ pagination.page * pagination.size + $index + 1 }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Name" min-width="100">
        <template #default="{ row }">
          <span class="cell-title">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Slug" min-width="100">
        <template #default="{ row }">
          <span class="cell-text">{{ row.slug }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Created By" width="200" align="center">
        <template #default="{ row }">
          <span class="cell-date">{{ row.createdBy }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Updated Date" width="200" align="center">
        <template #default="{ row }">
          <span class="cell-date">{{ formatDate(row.updatedDate) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Status" width="100" align="center">
        <template #default="{ row }">
           <span :class="['status-badge', row.status === 'DELETED' ? 'status-deleted' : 'status-active']">
             {{ row.status }}
           </span>
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="120" align="center" fixed="right">
        <template #default="{ row }">
          <div class="action-buttons">
            <el-tooltip v-if="row.status === 'ACTIVE'" content="Edit Topic" placement="top" effect="dark" :hide-after="0" :show-after="200">
              <el-button link :icon="Edit" @click="openEditDialog(row)" class="action-btn" />
            </el-tooltip>
            
            <el-tooltip v-if="row.status === 'ACTIVE'" content="Delete Topic" placement="top" effect="dark" :hide-after="0" :show-after="200">
              <el-button link :icon="Trash2" @click="handleDelete(row)" class="action-btn action-danger" />
            </el-tooltip>
            
            <el-tooltip v-else content="Restore Topic" placement="top" effect="dark" :hide-after="0" :show-after="200">
              <el-button link :icon="RotateCcw" @click="handleRestore(row)" class="action-btn action-success" />
            </el-tooltip>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container" v-if="pagination.totalElements > 0">
      <el-pagination
        :current-page="pagination.page + 1"
        :page-size="pagination.size"
        :page-sizes="[10, 20, 50, 100]"
        :background="true"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.totalElements"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        class="dark-pagination"
      />
    </div>

    <!-- Create/Edit Dialog Component -->
    <TopicFormDialog 
      v-model="dialogVisible" 
      :dialog-type="dialogType" 
      :initial-data="formData" 
      :loading="loading" 
      @submit="submitForm" 
    />
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

/* Add Button */
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

/* Table Controls CSS */
.table-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}
.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 14px;
  color: #8a8a8a;
}
.search-input {
  background-color: #282828;
  border: 1px solid transparent;
  border-radius: 20px;
  padding: 8px 16px 8px 40px;
  color: #eff2f6;
  font-size: 13px;
  width: 280px;
  outline: none;
  transition: all 0.2s;
}
.search-input:focus {
  border-color: #5c5c5c;
  background-color: #333;
}
.search-input::placeholder {
  color: #8a8a8a;
}
.spacer {
  flex: 1;
}
.solved-count {
  color: #8a8a8a;
  font-size: 13px;
  font-weight: 500;
}

/* LeetCode Table CSS Override */
:deep(.leetcode-table) {
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
}
:deep(.leetcode-table .el-table__inner-wrapper::before) {
  display: none;
}
:deep(.leetcode-table th.el-table__cell) {
  background: transparent !important;
  border-bottom: 1px solid #3e3e3e !important;
  color: #8a8a8a;
  font-weight: 500;
  font-size: 13px;
}
:deep(.leetcode-table td.el-table__cell) {
  border-bottom: none !important;
  padding: 12px 0;
  background: transparent !important;
}
:deep(.leetcode-table tr) {
  background: transparent !important;
}
/* Updated Zebra Backgrounds */
:deep(.leetcode-table tr:nth-child(odd) td.el-table__cell) {
  background: rgba(255, 255, 255, 0.05) !important;
}
:deep(.leetcode-table tr:hover td.el-table__cell) {
  background: rgba(255, 255, 255, 0.1) !important;
}
:deep(.leetcode-table .cell-index) {
  font-weight: 500;
  color: #8a8a8a;
  font-size: 13px;
}
:deep(.leetcode-table .cell-title) {
  font-size: 14px;
  font-weight: 500;
  color: #eff2f6;
}
:deep(.leetcode-table .cell-text) {
  font-size: 13px;
  color: #8a8a8a;
}
:deep(.leetcode-table .description-text) {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
:deep(.leetcode-table .cell-date) {
  font-size: 13px;
  color: #8a8a8a;
}
.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}
.status-active {
  background: rgba(0, 184, 163, 0.1);
  color: #00b8a3;
}
.status-deleted {
  background: rgba(239, 71, 67, 0.1);
  color: #ef4743;
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

:deep(.action-btn.action-success:hover) {
  color: #00b8a3;
  background: rgba(0, 184, 163, 0.1);
}

/* Pagination */
.pagination-container {
  margin-top: 24px;
  display: flex;
  justify-content: right;
}

:deep(.dark-pagination .el-pagination__total),
:deep(.dark-pagination .el-pagination__jump) {
  color: #8a8a8a;
}
:deep(.dark-pagination .btn-prev),
:deep(.dark-pagination .btn-next),
:deep(.dark-pagination .el-pager li) {
  background-color: #282828 !important;
  color: #8a8a8a;
  border: 1px solid #3e3e3e;
}
:deep(.dark-pagination .el-pager li:hover) {
  color: var(--accent-primary);
}
:deep(.dark-pagination .el-pager li.is-active) {
  background-color: var(--accent-primary) !important;
  color: #000;
  border-color: var(--accent-primary);
}

</style>
