<script setup>
import { ref, computed, onMounted } from 'vue'
import { contestsAPI } from '@/api/contests'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Save, Info, Plus, Trash2, Download } from 'lucide-vue-next'
import AppButton from '@/components/common/AppButton.vue'
import DataTable from '@/components/common/DataTable.vue'
import WhitelistAddDrawer from './WhitelistAddDrawer.vue'
import { exportStyledExcel } from '@/utils/excelExport'

const props = defineProps({
  contestId: { type: String, required: true },
  contestTitle: { type: String, default: '' },
  readonly:  { type: Boolean, default: false }
})

const whitelistItems = ref([])
const loading        = ref(false)
const saving         = ref(false)
const drawerOpen     = ref(false)

const load = async () => {
  try {
    loading.value = true
    const list = await contestsAPI.adminGetWhitelist(props.contestId)
    whitelistItems.value = list && list.length > 0 ? list : []
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

// Called from drawer when user confirms adding entries
const handleAdd = (items) => {
  items.forEach(item => {
    const dup = whitelistItems.value.some(e => e.email.toLowerCase() === item.email.toLowerCase())
    if (!dup) whitelistItems.value.push(item)
  })
}

const removeItem = (index) => { whitelistItems.value.splice(index, 1) }

const exportExcel = async () => {
  if (whitelistItems.value.length === 0) { ElMessage.warning('Không có dữ liệu để xuất.'); return }
  const headers = ['Email', 'Họ và Tên', 'Số điện thoại', 'Ghi chú']
  const data = whitelistItems.value.map(i => [i.email, i.fullName || '', i.phoneNumber || '', i.note || ''])
  
  const baseName = props.contestTitle || props.contestId.substring(0, 8)
  const safeName = baseName.replace(/[\/\\?%*:|"<>]/g, '_').substring(0, 50)

  await exportStyledExcel({
    title: `Danh sách ứng viên còn lại - Contest: ${baseName}`,
    filename: `Remaining_Candidates_${safeName}.xlsx`,
    sheetName: 'Candidates',
    headers,
    data,
    columnWidths: [35, 25, 18, 50]
  })
}

const saveWhitelist = async () => {
  try {
    saving.value = true
    if (whitelistItems.value.length === 0) {
      await ElMessageBox.confirm('Danh sách đang trống. Xóa TOÀN BỘ ứng viên khỏi phòng thi?', 'Cảnh báo', { type: 'warning' })
    }
    await contestsAPI.adminSaveWhitelist(props.contestId, whitelistItems.value)
    ElMessage.success('Lưu cấu hình Whitelist thành công!')
    await load()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('Lưu lỗi: ' + (err.message || ''))
  } finally { saving.value = false }
}

const tableColumns = computed(() => {
  const cols = [
    { key: 'index',       label: 'STT',            width: 60,  align: 'center' },
    { key: 'email',       label: 'Email',           minWidth: 230 },
    { key: 'fullName',    label: 'Họ và tên',       minWidth: 170 },
    { key: 'phoneNumber', label: 'Số điện thoại',   minWidth: 130 },
    { key: 'note',        label: 'Ghi chú',         minWidth: 160 },
  ]
  if (!props.readonly) cols.push({ key: 'actions', label: '', width: 70, align: 'center' })
  return cols
})

onMounted(load)
</script>

<template>
  <div class="wl-container" v-loading="loading">
    <!-- ── Header ── -->
    <div class="wl-header">
      <div class="wl-title-area">
        <h3>Quản lý Whitelist</h3>
        <p class="wl-desc">Danh sách ứng viên được cấp quyền tham gia contest. Thí sinh hoàn thành bài thi sẽ tự động bị xóa khỏi danh sách này.</p>
      </div>
      <div class="wl-actions" v-if="!readonly">
        <AppButton variant="text" :icon="Download" @click="exportExcel">
          Xuất danh sách còn lại
        </AppButton>
        <AppButton variant="secondary" :icon="Plus" @click="drawerOpen = true">
          Thêm ứng viên
        </AppButton>
        <AppButton variant="primary" :icon="Save" :disabled="saving" @click="saveWhitelist">
          {{ saving ? 'Đang lưu...' : 'Lưu danh sách' }}
        </AppButton>
      </div>
    </div>

    <!-- ── Info banner ── -->
    <div class="info-alert">
      <Info :size="15" />
      <span><strong>Lưu ý:</strong> Hệ thống tự động xóa ứng viên khỏi danh sách sau khi họ nộp bài. Những người còn lại trong danh sách sau khi contest kết thúc là ứng viên chưa tham gia.</span>
    </div>

    <!-- ── Table ── -->
    <DataTable
      :data="whitelistItems"
      :columns="tableColumns"
      :loading="loading"
      empty-text="Chưa có ứng viên nào trong Whitelist"
    >
      <template #cell-index="{ index }">
        <span class="cell-index">{{ index + 1 }}</span>
      </template>
      <template #cell-email="{ row }">
        <span class="cell-email">{{ row.email }}</span>
      </template>
      <template #cell-fullName="{ row }">
        <span class="cell-desc">{{ row.fullName || '—' }}</span>
      </template>
      <template #cell-phoneNumber="{ row }">
        <span class="cell-desc">{{ row.phoneNumber || '—' }}</span>
      </template>
      <template #cell-note="{ row }">
        <span class="cell-desc">{{ row.note || '—' }}</span>
      </template>
      <template #cell-actions="{ index }">
        <el-button type="danger" link @click="removeItem(index)">
          <Trash2 :size="15" style="color: #ef4743" />
        </el-button>
      </template>
    </DataTable>

    <!-- ── Drawer ── -->
    <WhitelistAddDrawer
      v-model="drawerOpen"
      :existing-items="whitelistItems"
      @add="handleAdd"
    />
  </div>
</template>

<style scoped>
.wl-container { padding: 16px 0; }

.wl-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}
.wl-title-area h3 { margin: 0 0 6px 0; font-size: 18px; color: var(--text-primary); }
.wl-desc { margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.5; max-width: 560px; }
.wl-actions { display: flex; gap: 10px; align-items: center; flex-shrink: 0; }

.info-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(255, 161, 22, 0.08); /* Yellow background */
  border: 1px solid rgba(255, 161, 22, 0.2); /* Yellow border */
  border-radius: 8px;
  color: #ffa116; /* Yellow text */
  font-size: 13px;
  margin-bottom: 16px;
}
.info-alert strong { font-weight: 700; }

.cell-index  { font-weight: 500; color: #8a8a8a; font-size: 13px; }
.cell-email  { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.cell-desc   { font-size: 13px; color: #8a8a8a; }
</style>
