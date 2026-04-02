<script setup>
import { ref, onMounted, reactive, watch, computed } from 'vue'
import usersApi from '@/api/users'
import { ElMessage, ElMessageBox } from 'element-plus'
import DarkPagination from '@/components/common/DarkPagination.vue'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import TableControls from '@/components/common/TableControls.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import DataTable from '@/components/common/DataTable.vue'
import RoleDialog from '@/components/admin/RoleDialog.vue'
import { useRouter } from 'vue-router'
import { 
  Search, Info, Shield, Lock, Unlock, 
  Users, CheckSquare, RotateCcw, Filter, ShieldCheck,
  ArrowUpDown, ArrowDownWideNarrow, ArrowUpNarrowWide
} from 'lucide-vue-next'
import { handleApiError } from '@/utils/errorHandler'

const router = useRouter()
const loading = ref(false)
const users = ref([])
const totalElements = ref(0)
const selectedUsers = ref([])

const currentSortField = ref('')
const currentSortDirection = ref('ASC')

const handleSort = (field) => {
  if (currentSortField.value === field) {
    if (currentSortDirection.value === 'ASC') {
      currentSortDirection.value = 'DESC'
    } else {
      currentSortField.value = ''
      currentSortDirection.value = 'ASC'
    }
  } else {
    currentSortField.value = field
    currentSortDirection.value = 'ASC'
  }
}

const resetSort = () => {
  currentSortField.value = ''
  currentSortDirection.value = 'ASC'
}

watch([currentSortField, currentSortDirection], () => {
  filter.page = 0
  fetchUsers()
})

const filter = reactive({
  keyword: '',
  isLocked: { active: false, value: null },
  role: { active: false, value: null },
  page: 0,
  size: 20
})

const filterConfig = computed(() => [
  {
    type: 'select',
    label: 'Trạng thái',
    active: filter.isLocked.active,
    value: filter.isLocked.value,
    options: [
      { label: 'Hoạt động', value: true },
      { label: 'Bị khóa', value: false }
    ],
    onUpdateActive: (val) => filter.isLocked.active = val,
    onUpdateValue: (val) => filter.isLocked.value = val
  },
  {
    type: 'select',
    label: 'Vai trò',
    active: filter.role.active,
    value: filter.role.value,
    options: [
      { label: 'ADMIN', value: 'ROLE_ADMIN' },
      { label: 'MODERATOR', value: 'ROLE_MODERATOR' },
      { label: 'USER', value: 'ROLE_USER' }
    ],
    onUpdateActive: (val) => filter.role.active = val,
    onUpdateValue: (val) => filter.role.value = val
  }
])

const handleFilterChange = () => {
  handleSearch()
}

const roleDialog = reactive({
  visible: false,
  userId: null,
  username: '',
  roles: []
})

const fetchUsers = async () => {
  try {
    loading.value = true
    const params = {
      keyword: filter.keyword || undefined,
      isLocked: (filter.isLocked.active && filter.isLocked.value !== null) ? filter.isLocked.value : undefined,
      role: (filter.role.active && filter.role.value) ? filter.role.value : undefined,
      page: filter.page,
      size: filter.size
    }
    
    if (currentSortField.value) {
      params.sort = `${currentSortField.value},${currentSortDirection.value}`
    }
    
    const response = await usersApi.adminGetUsers(params)
    users.value = response.data.data.content
    totalElements.value = response.data.data.totalElements
  } catch (error) {
    handleApiError(error, 'Không thể tải danh sách người dùng')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  filter.page = 0
  fetchUsers()
}

const handlePageChange = (p) => {
  filter.page = p - 1
  fetchUsers()
}

const handleSizeChange = (s) => {
  filter.size = s
  filter.page = 0
  fetchUsers()
}

const handleSelectionChange = (val) => {
  selectedUsers.value = val
}

const canLockSelected = computed(() => {
  return selectedUsers.value.some(u => u.accountNonLocked !== false)
})

const canUnlockSelected = computed(() => {
  return selectedUsers.value.some(u => u.accountNonLocked === false)
})

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const handleToggleLock = async (user) => {
  const isLocked = user.accountNonLocked === false;
  const actionName = isLocked ? 'mở khóa' : 'khóa';
  const newLockStatus = isLocked ? true : false;
  
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn ${actionName} người dùng ${user.username}?`,
      'Xác nhận',
      { type: 'warning', confirmButtonText: 'Đồng ý', cancelButtonText: 'Hủy' }
    )
    
    await usersApi.adminBulkToggleLock({
      userIds: [user.id],
      accountNonLocked: newLockStatus
    })
    
    ElMessage.success(`${user.username} đã được ${actionName} thành công!`)
    fetchUsers()
  } catch (error) { 
    if (error !== 'cancel') {
        handleApiError(error, `Thực hiện ${actionName} thất bại`)
    }
  }
}

const handleBulkLock = async (isToLock) => {
  if (selectedUsers.value.length === 0) return
  const actionName = isToLock ? 'khóa' : 'mở khóa'
  const newLockStatus = isToLock ? false : true;
  
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn ${actionName} ${selectedUsers.value.length} người dùng đã chọn?`,
      'Xác nhận hàng loạt',
      { type: 'warning', confirmButtonText: 'Đồng ý', cancelButtonText: 'Hủy' }
    )
    
    await usersApi.adminBulkToggleLock({
      userIds: selectedUsers.value.map(u => u.id),
      accountNonLocked: newLockStatus
    })
    
    ElMessage.success(`Đã ${actionName} ${selectedUsers.value.length} người dùng!`)
    fetchUsers()
  } catch (error) { 
    if (error !== 'cancel') {
        handleApiError(error, `Thực hiện ${actionName} hàng loạt thất bại`)
    }
  }
}

const showRoleDialog = (user) => {
  roleDialog.userId = user.id
  roleDialog.username = user.username
  roleDialog.roles = [...user.roles]
  roleDialog.visible = true
}

const resetFilter = () => {
  filter.isLocked.active = false
  filter.isLocked.value = null
  filter.role.active = false
  filter.role.value = null
  filter.page = 0
  fetchUsers()
}

onMounted(fetchUsers)
</script>

<template>
  <div class="admin-layout-container">
    <PageHeader 
      title="Quản lý người dùng" 
      subtitle="Xem và quản trị danh sách người dùng, phân quyền hệ thống"
    />

    <!-- Table Controls -->
    <TableControls
      v-model="filter.keyword"
      @update:modelValue="handleSearch"
      search-placeholder="Tìm kiếm người dùng..." 
      :total-elements="totalElements"
      item-name="Người dùng"
      :sort-options="[
        { label: 'Username', value: 'username' },
        { label: 'Họ tên', value: 'fullName' }
      ]"
      :current-sort="currentSortField"
      :current-sort-dir="currentSortDirection"
      @sort="handleSort"
      @reset-sort="resetSort"
      :filter-config="filterConfig"
      filter-title="Bộ lọc người dùng"
      @filter-change="handleFilterChange"
      @reset-filters="resetFilter"
    >
      <template #custom-actions>
        <div class="bulk-actions" v-if="selectedUsers.length > 0" style="margin-right: auto; padding-left: 12px;">
          <button 
            class="bulk-btn bulk-btn-lock" 
            @click="handleBulkLock(true)"
            :disabled="!canLockSelected"
            :class="{ 'is-disabled': !canLockSelected }"
          >
            <Lock :size="13" style="margin-right: 5px" /> Khóa
          </button>
          <button 
            class="bulk-btn bulk-btn-unlock" 
            @click="handleBulkLock(false)"
            :disabled="!canUnlockSelected"
            :class="{ 'is-disabled': !canUnlockSelected }"
          >
            <Unlock :size="13" style="margin-right: 5px" /> Mở khóa
          </button>
        </div>
      </template>
    </TableControls>

    <!-- Table Section -->
    <div class="table-container">
      <TableSkeleton v-if="loading && users.length === 0" :columns="8" :rows="10" />
      
      <el-table 
        v-else 
        :data="users" 
        class="dashboard-table leetcode-table sticky-table" 
        v-loading="loading"
        @selection-change="handleSelectionChange"
        border
        style="width: 100%"
      >
        <template #empty>
          <el-empty description="Không tìm thấy người dùng nào" />
        </template>
        <el-table-column type="selection" width="55" align="center" fixed="left" />
        
        <el-table-column label="#" width="60" align="center">
          <template #default="{ $index }">
            <span class="cell-index">{{ filter.page * filter.size + $index + 1 }}</span>
          </template>
        </el-table-column>

        <el-table-column label="ID" min-width="300" align="center">
          <template #default="{ row }">
            <span class="cell-text">{{ row.id || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Người dùng" min-width="220" align="center">
          <template #default="{ row }">
            <div class="user-cell">
               <router-link :to="`/profile/${row.username}`" class="cell-username">{{ row.username }}</router-link>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="fullName" label="Họ tên" min-width="220" align="center">
            <template #default="{ row }">
              <span class="cell-text">{{ row.fullName || '-' }}</span>
            </template>
        </el-table-column>

        <el-table-column prop="email" label="Email" min-width="320" align="center">
            <template #default="{ row }">
              <span class="cell-email">{{ row.email }}</span>
            </template>
        </el-table-column>

        <el-table-column label="Vai trò" min-width="200" align="center">
          <template #default="{ row }">
            <div class="role-tags">
              <span 
                v-for="role in row.roles" 
                :key="role" 
                :class="['role-pill', `role-${role.replace('ROLE_', '').toLowerCase()}`]"
              >
                {{ role.replace('ROLE_', '') }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Trạng thái" width="140" align="center">
          <template #default="{ row }">
            <span v-if="row.accountNonLocked === false" class="status-badge status-locked">BỊ KHÓA</span>
            <span v-else class="status-badge status-active">HOẠT ĐỘNG</span>
          </template>
        </el-table-column>

        <el-table-column label="Ngày gia nhập" width="160" align="center">
          <template #default="{ row }">
            <span class="cell-date">{{ formatDate(row.createdDate) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Ngày cập nhật" width="160" align="center">
          <template #default="{ row }">
            <span class="cell-date">{{ formatDate(row.updatedDate) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Hành động" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-btns">
               <el-tooltip content="Chi tiết" placement="top">
                 <button class="action-btn action-btn-info" @click="router.push(`/profile/${row.username}`)">
                   <Info :size="16" />
                 </button>
               </el-tooltip>
               <el-tooltip content="Quản lý vai trò" placement="top">
                 <button class="action-btn action-btn-shield" @click="showRoleDialog(row)">
                   <Shield :size="16" />
                 </button>
               </el-tooltip>
               <el-tooltip :content="row.accountNonLocked === false ? 'Mở khóa' : 'Khóa'" placement="top" :hide-after="0">
                 <button 
                   :class="['action-btn', row.accountNonLocked === false ? 'action-btn-unlock' : 'action-btn-lock']"
                   @click="handleToggleLock(row)"
                 >
                   <component :is="row.accountNonLocked === false ? Unlock : Lock" :size="16" />
                 </button>
               </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-footer">
        <DarkPagination
          :current-page="filter.page + 1"
          :page-size="filter.size"
          :total="totalElements"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Role Management Dialog -->
    <RoleDialog 
      v-model:visible="roleDialog.visible"
      :user-id="roleDialog.userId"
      :username="roleDialog.username"
      :initial-roles="roleDialog.roles"
      @updated="fetchUsers"
    />
  </div>
</template>

<style scoped>
.control-btn.active {
  background-color: rgba(255, 161, 22, 0.1);
  color: var(--accent-primary);
  border-color: rgba(255, 161, 22, 0.3);
}

.bulk-actions {
  display: flex;
  gap: 0;
}

.bulk-btn {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid;
}

.bulk-btn-lock {
  background-color: rgba(239, 71, 67, 0.08);
  color: #ef4743;
  border-color: rgba(239, 71, 67, 0.25);
  border-radius: 6px 0 0 6px;
}

.bulk-btn-lock:hover:not(:disabled) {
  background-color: rgba(239, 71, 67, 0.18);
}

.bulk-btn-unlock {
  background-color: rgba(44, 187, 93, 0.08);
  color: #2cbb5d;
  border-color: rgba(44, 187, 93, 0.25);
  border-radius: 0 6px 6px 0;
  margin-left: -1px;
}

.bulk-btn-unlock:hover:not(:disabled) {
  background-color: rgba(44, 187, 93, 0.18);
}

.bulk-btn:disabled, .bulk-btn.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(1);
}

.spacer { flex: 1; }

.count-display {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8a8a8a;
  font-size: 13px;
  font-weight: 500;
}

.circle-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #3e3e3e;
  border-top-color: var(--accent-primary);
  transform: rotate(-45deg);
}

/* LeetCode Table Style */
:deep(.leetcode-table) {
  background: var(--bg-primary) !important;
  --el-table-border-color: #2a2a2a !important; /* Subtle dark color for cell borders */
}

:deep(.leetcode-table.el-table--border) {
  border-left: 1px solid #2a2a2a !important;
  border-top: 1px solid #2a2a2a !important;
}

/* Fix Element Plus wrappers */
:deep(.leetcode-table .el-table__inner-wrapper::after),
:deep(.leetcode-table .el-table__inner-wrapper::before) {
  background-color: #2a2a2a !important;
}

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

:deep(.leetcode-table td.el-table__cell) {
  border-bottom: 1px solid #2a2a2a !important;
  border-right: 1px solid #2a2a2a !important;
  padding: 12px 0;
  background-color: var(--bg-primary) !important; /* Opaque even rows */
}

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

/* SELECT BOXES FIX */
:deep(.dark-styled-select .el-select__wrapper) {
  background-color: #1a1a1a !important;
  box-shadow: 0 0 0 1px #333 inset !important;
  border: none !important;
}

:deep(.dark-styled-select .el-select__placeholder) {
  color: #eff2f6 !important;
}

:deep(.dark-popper-dropdown) {
  background-color: #1a1a1a !important;
  border: 1px solid #333 !important;
}

:deep(.dark-popper-dropdown .el-select-dropdown__item) {
  color: #8a8a8a !important;
}

:deep(.dark-popper-dropdown .el-select-dropdown__item.hover),
:deep(.dark-popper-dropdown .el-select-dropdown__item:hover) {
  background-color: #282828 !important;
}

/* Cell Styles */
.user-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.cell-username {
  font-size: 14px;
  font-weight: 600;
  color: #eff2f6;
  text-decoration: none;
  transition: color 0.2s;
}

.cell-username:hover {
  color: var(--accent-primary);
}

.status-badge {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 4px;
    text-transform: uppercase;
}

.status-locked {
  color: #ef4743;
  background: rgba(239, 71, 67, 0.1);
}

.status-active {
  color: #2cbb5d;
  background: rgba(44, 187, 93, 0.1);
}

.cell-text, .cell-email, .cell-date, .cell-index {
  color: #8a8a8a;
  font-size: 13px;
}

.role-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
}

.role-pill {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.role-admin { background: rgba(239, 71, 67, 0.15); color: #ef4743; border: 1px solid rgba(239, 71, 67, 0.2); }
.role-moderator { background: rgba(163, 85, 245, 0.15); color: #a355f5; border: 1px solid rgba(163, 85, 245, 0.2); }
.role-user { background: rgba(44, 187, 93, 0.15); color: #2cbb5d; border: 1px solid rgba(44, 187, 93, 0.2); }
.role-developer { background: rgba(64, 158, 255, 0.15); color: #409eff; border: 1px solid rgba(64, 158, 255, 0.2); }

.action-btns {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.action-btn {
  background: transparent;
  border: none;
  color: #8a8a8a;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
}

.action-btn:hover {
  background: rgba(255,255,255,0.06);
}

.action-btn-info:hover {
  color: #409eff;
  background: rgba(64, 158, 255, 0.1) !important;
}

.action-btn-shield:hover {
  color: #a355f5;
  background: rgba(163, 85, 245, 0.1) !important;
}

.action-btn-lock:hover {
  color: #ef4743;
  background: rgba(239, 71, 67, 0.1);
}

.action-btn-unlock:hover {
  color: #2cbb5d;
  background: rgba(44, 187, 93, 0.1);
}

.pagination-footer {
  margin-top: 24px;
  padding: 0 10px;
}

/* Wide tables needs overflow */
.table-container {
    overflow: hidden;
    background: transparent;
}

/* User Sort UI styles */
.sort-dropdown {
  margin-left: 8px;
}
.sort-btn.has-text {
  width: auto;
  padding: 0 16px;
  gap: 8px;
  border-radius: 20px;
}
.sort-text {
  font-size: 13px;
  font-weight: 500;
}
.up-arrow {
  transform: rotate(180deg);
}

.custom-sort-menu .el-dropdown-menu__item {
  padding: 0 12px;
}

.sort-menu-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 140px;
  width: 100%;
}
.sort-indicator {
  color: var(--accent-primary);
  margin-left: 12px;
}
.sort-footer {
  padding: 8px 12px 4px 12px;
  border-top: 1px solid #3e3e3e;
  margin-top: 4px;
}
</style>
