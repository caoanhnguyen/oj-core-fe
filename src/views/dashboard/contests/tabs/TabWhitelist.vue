<script setup>
import { ref, computed, onMounted } from 'vue'
import { contestsAPI } from '@/api/contests'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Save, Info, Plus, Trash2, Download } from 'lucide-vue-next'
import AppButton from '@/components/common/AppButton.vue'
import DataTable from '@/components/common/DataTable.vue'
import WhitelistAddDrawer from './WhitelistAddDrawer.vue'
import { exportStyledExcel } from '@/utils/excelExport'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  contestId:    { type: String, required: true },
  contestTitle: { type: String, default: '' },
  readonly:     { type: Boolean, default: false }
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

const handleAdd = (items) => {
  items.forEach(item => {
    const dup = whitelistItems.value.some(e => e.email.toLowerCase() === item.email.toLowerCase())
    if (!dup) whitelistItems.value.push(item)
  })
}

const removeItem = (index) => { whitelistItems.value.splice(index, 1) }

const exportExcel = async () => {
  if (whitelistItems.value.length === 0) { ElMessage.warning(t('admin_contests.tab_whitelist.msg_export_empty')); return }
  const headers = [
    t('admin_contests.tab_whitelist.excel_col_email'),
    t('admin_contests.tab_whitelist.excel_col_fullname'),
    t('admin_contests.tab_whitelist.excel_col_phone'),
    t('admin_contests.tab_whitelist.excel_col_note')
  ]
  const data = whitelistItems.value.map(i => [i.email, i.fullName || '', i.phoneNumber || '', i.note || ''])
  const baseName = props.contestTitle || props.contestId.substring(0, 8)
  const safeName = baseName.replace(/[\/\\?%*:|"<>]/g, '_').substring(0, 50)
  await exportStyledExcel({
    title: t('admin_contests.tab_whitelist.excel_title', { name: baseName }),
    filename: `Remaining_Candidates_${safeName}.xlsx`,
    sheetName: 'Candidates',
    headers, data,
    columnWidths: [35, 25, 18, 50]
  })
}

const saveWhitelist = async () => {
  try {
    saving.value = true
    if (whitelistItems.value.length === 0) {
      await ElMessageBox.confirm(
        t('admin_contests.tab_whitelist.confirm_clear_msg'),
        t('admin_contests.tab_whitelist.confirm_clear_title'),
        { type: 'warning' }
      )
    }
    await contestsAPI.adminSaveWhitelist(props.contestId, whitelistItems.value)
    ElMessage.success(t('admin_contests.tab_whitelist.msg_saved'))
    await load()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error(t('admin_contests.tab_whitelist.msg_save_fail', { error: err.message || '' }))
  } finally { saving.value = false }
}

const tableColumns = computed(() => {
  const cols = [
    { key: 'index',       label: t('admin_contests.tab_whitelist.col_num'),      width: 60,  align: 'center' },
    { key: 'email',       label: t('admin_contests.tab_whitelist.col_email'),     minWidth: 230 },
    { key: 'fullName',    label: t('admin_contests.tab_whitelist.col_fullname'),  minWidth: 170 },
    { key: 'phoneNumber', label: t('admin_contests.tab_whitelist.col_phone'),     minWidth: 130 },
    { key: 'note',        label: t('admin_contests.tab_whitelist.col_note'),      minWidth: 160 },
  ]
  if (!props.readonly) cols.push({ key: 'actions', label: '', width: 70, align: 'center' })
  return cols
})

onMounted(load)
</script>

<template>
  <div class="wl-container" v-loading="loading">
    <!-- Header -->
    <div class="wl-header">
      <div class="wl-title-area">
        <h3>{{ $t('admin_contests.tab_whitelist.title') }}</h3>
        <p class="wl-desc">{{ $t('admin_contests.tab_whitelist.description') }}</p>
      </div>
      <div class="wl-actions" v-if="!readonly">
        <AppButton variant="text" :icon="Download" @click="exportExcel">
          {{ $t('admin_contests.tab_whitelist.btn_export') }}
        </AppButton>
        <AppButton variant="secondary" :icon="Plus" @click="drawerOpen = true">
          {{ $t('admin_contests.tab_whitelist.btn_add') }}
        </AppButton>
        <AppButton variant="primary" :icon="Save" :disabled="saving" @click="saveWhitelist">
          {{ saving ? $t('admin_contests.tab_whitelist.btn_saving') : $t('admin_contests.tab_whitelist.btn_save') }}
        </AppButton>
      </div>
    </div>

    <!-- Info banner -->
    <div class="info-alert">
      <Info :size="15" />
      <span v-html="$t('admin_contests.tab_whitelist.info_note')" />
    </div>

    <!-- Table -->
    <DataTable
      :data="whitelistItems"
      :columns="tableColumns"
      :loading="loading"
      :empty-text="$t('admin_contests.tab_whitelist.empty')"
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

    <!-- Drawer -->
    <WhitelistAddDrawer
      v-model="drawerOpen"
      :existing-items="whitelistItems"
      @add="handleAdd"
    />
  </div>
</template>

<style scoped>
.wl-container { padding: 16px 0; }
.wl-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; gap: 16px; flex-wrap: wrap; }
.wl-title-area h3 { margin: 0 0 6px 0; font-size: 18px; color: var(--text-primary); }
.wl-desc { margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.5; max-width: 560px; }
.wl-actions { display: flex; gap: 10px; align-items: center; flex-shrink: 0; }

.info-alert { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: rgba(255,161,22,0.08); border: 1px solid rgba(255,161,22,0.2); border-radius: 8px; color: #ffa116; font-size: 13px; margin-bottom: 16px; }
.info-alert strong { font-weight: 700; }

.cell-index  { font-weight: 500; color: #8a8a8a; font-size: 13px; }
.cell-email  { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.cell-desc   { font-size: 13px; color: #8a8a8a; }
</style>
