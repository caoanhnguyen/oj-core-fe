<script setup>
import { ref, watch } from 'vue'
import usersApi from '@/api/users'
import { ElMessage } from 'element-plus'
import { Shield } from 'lucide-vue-next'

const props = defineProps({
  visible: Boolean,
  userId: String,
  username: String,
  initialRoles: Array
})

const emit = defineEmits(['update:visible', 'updated'])

const loading = ref(false)
const selectedRoles = ref([])

// Available roles in the system
const availableRoles = [
  { label: 'Administrator', value: 'ROLE_ADMIN' },
  { label: 'Moderator', value: 'ROLE_MODERATOR' },
  { label: 'User', value: 'ROLE_USER', disabled: true }
]

watch(() => props.visible, (val) => {
  if (val) {
    selectedRoles.value = [...props.initialRoles]
    // Ensure ROLE_USER role is always there
    if (!selectedRoles.value.includes('ROLE_USER')) {
      selectedRoles.value.push('ROLE_USER')
    }
  }
})

const handleClose = () => {
  emit('update:visible', false)
}

const handleUpdateRoles = async () => {
  try {
    loading.value = true
    await usersApi.adminUpdateRoles(props.userId, {
      roles: selectedRoles.value
    })
    ElMessage.success(`Đã cập nhật phân quyền cho ${props.username} thành công!`)
    emit('updated')
    handleClose()
  } catch (error) {
    ElMessage.error('Không thể cập nhật phân quyền')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-dialog
    v-model="props.visible"
    title="Phân quyền người dùng"
    width="400px"
    @close="handleClose"
    class="dark-dialog"
  >
    <div class="role-dialog-content">
      <div class="user-header">
        <Shield class="icon" :size="32" />
        <div class="meta">
          <span class="label">Đang phân quyền cho</span>
          <span class="value">@{{ props.username }}</span>
        </div>
      </div>

      <div class="role-selection">
        <p class="section-hint">Chọn các vai trò để gán cho người dùng:</p>
        <el-checkbox-group v-model="selectedRoles" class="role-group">
          <div v-for="role in availableRoles" :key="role.value" class="role-item">
            <el-checkbox :label="role.value" :disabled="role.disabled">
              {{ role.label }}
            </el-checkbox>
            <span v-if="role.disabled" class="mandatory-hint">(Bắt buộc)</span>
          </div>
        </el-checkbox-group>
      </div>

      <div class="dialog-tips">
        <p>* Quyền <strong>USER</strong> là quyền mặc định, không thể gỡ bỏ.</p>
        <p>* Quyền <strong>MODERATOR</strong> cho phép quản lý bài tập, chủ đề và thảo luận.</p>
        <p>* Quyền <strong>ADMIN</strong> cho phép truy cập đầy đủ vào trang quản trị.</p>
      </div>
    </div>
    
    <template #footer>
      <div class="role-dialog-footer">
        <button class="dialog-btn cancel-btn" @click="handleClose">Hủy bỏ</button>
        <button class="dialog-btn update-btn" :disabled="loading" @click="handleUpdateRoles">
            <span v-if="loading">Đang cập nhật...</span>
            <span v-else>Cập nhật</span>
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.role-dialog-content {
  padding: 10px 0;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255,161,22,0.1);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255,161,22,0.2);
  margin-bottom: 24px;
}

.user-header .icon { color: #ffa116; }

.meta { display: flex; flex-direction: column; }
.meta .label { font-size: 11px; color: #8a8a8a; text-transform: uppercase; letter-spacing: 0.5px; }
.meta .value { font-size: 18px; font-weight: 700; color: #fff; }

.section-hint {
  font-size: 14px;
  color: #eff2f6;
  margin-bottom: 16px;
}

.role-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.role-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #141414;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #333;
}

.mandatory-hint {
  font-size: 12px;
  color: #8a8a8a;
  font-style: italic;
}

.dialog-tips {
  margin-top: 24px;
  background: rgba(0,0,0,0.2);
  padding: 12px;
  border-radius: 8px;
}

.dialog-tips p {
  font-size: 12px;
  color: #8a8a8a;
  margin: 4px 0;
}

:deep(.el-checkbox) {
  --el-checkbox-checked-text-color: var(--accent-primary);
  --el-checkbox-checked-input-border-color: var(--accent-primary);
  --el-checkbox-checked-bg-color: var(--accent-primary);
}

.role-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 10px 0;
}

.dialog-btn {
  height: 36px;
  padding: 0 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: transparent;
  border: 1px solid #3e3e3e;
  color: #8a8a8a;
}
.cancel-btn:hover {
  background: rgba(255,255,255,0.05);
  color: #fff;
  border-color: #666;
}

.update-btn {
  background: var(--accent-primary);
  border: none;
  color: #000;
}
.update-btn:hover {
  background: #ff8800;
  transform: translateY(-1px);
}
.update-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
</style>
