<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Plus, Edit, Trash2, RotateCcw } from 'lucide-vue-next'
import { useTopicStore } from '@/stores/topic'
import { ElMessageBox, ElMessage } from 'element-plus'
import { handleApiError } from '@/utils/errorHandler'
import { useBadge } from '@/composables/useBadge'
import TopicFormDialog from '@/components/topics/TopicFormDialog.vue'
import TableControls from '@/components/common/TableControls.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import DataTable from '@/components/common/DataTable.vue'
import DarkPagination from '@/components/common/DarkPagination.vue'
import AppButton from '@/components/common/AppButton.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const topicStore = useTopicStore()
const { estatusClass } = useBadge()

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

import { debounce } from 'lodash'
const handleSearch = debounce(() => {
  pagination.value.page = 0
  loadTopics()
}, 400)

const handlePageChange = (page) => {
  pagination.value.page = page - 1
  loadTopics()
}

const handleSizeChange = (size) => {
  pagination.value.size = size
  pagination.value.page = 0
  loadTopics()
}

const handleRowClick = (row) => {
  if (row.slug) {
    router.push(`/topics/${row.slug}`)
  }
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
    handleApiError(error, t('admin_topics.msg_load_fail'))
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
      t('admin_topics.confirm_del_msg', { name: row.name }),
      t('admin_topics.confirm_del_title'),
      {
        confirmButtonText: t('common.delete') || 'Xóa',
        cancelButtonText: t('common.cancel') || 'Hủy',
        type: 'warning',
        customClass: 'dark-message-box',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    const idToDelete = row.topicId || row.topicID
    await topicStore.deleteTopic(idToDelete)
    loadTopics()
  } catch (error) {
    if (error !== 'cancel') {
        handleApiError(error, t('admin_topics.msg_del_fail'))
    }
  }
}

const handleRestore = async (row) => {
  try {
    await ElMessageBox.confirm(
      t('admin_topics.confirm_restore_msg', { name: row.name }),
      t('admin_topics.confirm_restore_title'),
      {
        confirmButtonText: t('admin_problems.action_restore') || 'Khôi phục',
        cancelButtonText: t('common.cancel') || 'Hủy',
        customClass: 'dark-message-box',
        type: 'info'
      }
    )
    
    const idToRestore = row.topicId || row.topicID
    await topicStore.restoreTopic(idToRestore)
    loadTopics()
  } catch (error) {
    if (error !== 'cancel') {
        handleApiError(error, t('admin_topics.msg_restore_fail'))
    }
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
  <div class="admin-layout-container">
    <PageHeader 
      :title="$t('admin_topics.page_title')" 
      :subtitle="$t('admin_topics.page_subtitle')"
    >
      <AppButton variant="primary" :icon="Plus" @click="openCreateDialog">
        {{ $t('admin_topics.btn_add_topic') }}
      </AppButton>
    </PageHeader>

    <TableControls
      v-model="searchQuery"
      @update:modelValue="handleSearch"
      :search-placeholder="$t('admin_topics.search_placeholder')" 
      :total-elements="pagination.totalElements"
      :item-name="$t('admin_topics.item_name')"
      :sort-options="[]" 
    />

    <DataTable 
      :data="topics" 
      :columns="[
        { key: 'index', label: '#', width: 60, align: 'center' },
        { key: 'name', label: $t('admin_topics.col_name'), minWidth: 100 },
        { key: 'slug', label: $t('admin_topics.col_slug'), minWidth: 100 },
        { key: 'createdBy', label: $t('admin_topics.col_created_by'), width: 200, align: 'center' },
        { key: 'updatedDate', label: $t('admin_topics.col_updated_date'), width: 200, align: 'center' },
        { key: 'status', label: $t('admin_topics.col_status'), width: 100, align: 'center' }
      ]"
      :action-width="120"
      :action-label="$t('admin_topics.col_actions')"
      :loading="loading" 
      :empty-text="$t('admin_topics.empty_text')"
      @row-click="handleRowClick"
    >
      <template #cell-index="{ index }">
        <span class="cell-index">{{ pagination.page * pagination.size + index + 1 }}</span>
      </template>
      <template #cell-name="{ row }">
        <router-link :to="`/topics/${row.slug}`" class="cell-title topic-link" @click.stop>
          {{ row.name }}
        </router-link>
      </template>
      <template #cell-slug="{ row }">
        <span class="cell-text">{{ row.slug }}</span>
      </template>
      <template #cell-createdBy="{ row }">
        <router-link :to="`/profile/${row.createdBy}`" class="cell-link" @click.stop>
          {{ row.createdBy }}
        </router-link>
      </template>
      <template #cell-updatedDate="{ row }">
        <span class="cell-date">{{ formatDate(row.updatedDate) }}</span>
      </template>
      <template #cell-status="{ row }">
         <span :class="['oj-badge', estatusClass(row.status)]">
           {{ row.status }}
         </span>
      </template>
      <template #actions="{ row }">
        <div class="action-buttons">
          <el-tooltip v-if="row.status === 'ACTIVE'" :content="$t('admin_topics.tooltip_edit')" placement="top" effect="dark" :hide-after="0" :show-after="200">
            <el-button link :icon="Edit" @click.stop="openEditDialog(row)" class="action-btn" />
          </el-tooltip>
          
          <el-tooltip v-if="row.status === 'ACTIVE'" :content="$t('admin_topics.tooltip_delete')" placement="top" effect="dark" :hide-after="0" :show-after="200">
            <el-button link :icon="Trash2" @click.stop="handleDelete(row)" class="action-btn action-danger" />
          </el-tooltip>
          
          <el-tooltip v-else :content="$t('admin_topics.tooltip_restore')" placement="top" effect="dark" :hide-after="0" :show-after="200">
            <el-button link :icon="RotateCcw" @click.stop="handleRestore(row)" class="action-btn action-success" />
          </el-tooltip>
        </div>
      </template>
    </DataTable>

    <DarkPagination
      v-if="pagination.totalElements > 0"
      :current-page="pagination.page + 1"
      :page-size="pagination.size"
      :total="pagination.totalElements"
      @size-change="handleSizeChange"
      @current-change="handlePageChange"
    />

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


.cell-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 13px;
  transition: all 0.2s;
}
.cell-link:hover {
  color: var(--accent-primary);
  text-decoration: underline;
}
/* EStatus badges → global badges.css */

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

</style>
