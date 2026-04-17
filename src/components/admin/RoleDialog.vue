<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import usersApi from '@/api/users'
import { ElMessage } from 'element-plus'
import { Shield } from 'lucide-vue-next'
import { handleApiError } from '@/utils/errorHandler'
import AppButton from '@/components/common/AppButton.vue'

const props = defineProps({
  visible: Boolean,
  userId: String,
  username: String,
  initialRoles: Array
})

const emit = defineEmits(['update:visible', 'updated'])

const { t } = useI18n()
const loading = ref(false)
const selectedRoles = ref([])

// Available roles in the system
const availableRoles = computed(() => [
  { label: t('admin_users.role_admin'), value: 'ROLE_ADMIN' },
  { label: t('admin_users.role_moderator'), value: 'ROLE_MODERATOR' },
  { label: t('admin_users.role_assessor'), value: 'ROLE_ASSESSOR' },
  { label: t('admin_users.role_user'), value: 'ROLE_USER', disabled: true }
])

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
    ElMessage.success(t('admin_role.update_success', { username: props.username }))
    emit('updated')
    handleClose()
  } catch (error) {
    handleApiError(error, t('admin_role.update_fail'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-drawer
    :model-value="props.visible"
    @update:model-value="(val) => { if (val === false) handleClose() }"
    :title="$t('admin_role.title')"
    size="680px"
    :close-on-click-modal="true"
    @close="handleClose"
    class="role-drawer"
  >
    <div class="role-dialog-content">
      <div class="user-header">
        <Shield class="icon" :size="32" />
        <div class="meta">
          <span class="label">{{ $t('admin_role.meta_label') }}</span>
          <span class="value">@{{ props.username }}</span>
        </div>
      </div>

      <div class="role-selection">
        <p class="section-hint">{{ $t('admin_role.hint') }}</p>
        <el-checkbox-group v-model="selectedRoles" class="role-group">
          <div v-for="role in availableRoles" :key="role.value" class="role-item">
            <el-checkbox :label="role.value" :disabled="role.disabled">
              {{ role.label }}
            </el-checkbox>
            <span v-if="role.disabled" class="mandatory-hint">{{ $t('admin_role.mandatory') }}</span>
          </div>
        </el-checkbox-group>
      </div>

      <div class="dialog-tips">
        <p v-html="$t('admin_role.tip_user')"></p>
        <p v-html="$t('admin_role.tip_assessor')"></p>
        <p v-html="$t('admin_role.tip_moderator')"></p>
        <p v-html="$t('admin_role.tip_admin')"></p>
      </div>
    </div>
    
    <template #footer>
      <div class="role-dialog-footer">
        <AppButton variant="info" @click="handleClose">{{ $t('admin_role.btn_cancel') }}</AppButton>
        <AppButton variant="primary" :loading="loading" @click="handleUpdateRoles">{{ $t('admin_role.btn_update') }}</AppButton>
      </div>
    </template>
  </el-drawer>
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
</style>

<style>
/* Global styles for dark drawer component */
.role-drawer.el-drawer,
.el-overlay.role-drawer .el-drawer {
  background-color: var(--bg-surface, #1e1e1e) !important;
  color: var(--text-primary, #ffffff) !important;
  border-left: 1px solid var(--border-primary, #333333) !important;
}

.role-drawer .el-drawer__header {
  margin-bottom: 0 !important;
  padding: 20px 24px !important;
  border-bottom: 1px solid var(--border-primary, #333333) !important;
  color: var(--text-primary, #ffffff) !important;
  font-weight: 600;
  font-size: 18px;
}

.role-drawer .el-drawer__body {
  padding: 24px !important;
  background-color: var(--bg-surface, #1e1e1e) !important;
  overflow-y: auto !important;
}

.role-drawer .el-drawer__footer {
  border-top: 1px solid var(--border-primary, #333333) !important;
  padding: 16px 24px !important;
  background-color: var(--bg-secondary, #141414) !important;
}
</style>
