<script setup>
/**
 * TableControls — Reusable search + sort + filter bar
 * Filter design matches ProblemListView (checkbox + operator select + value select)
 *
 * Props:
 *   modelValue         (String)  — search query (v-model)
 *   sortOptions        (Array)   — [{ label, value }]  — omit to hide sort btn
 *   currentSort        (String)  — current sort field value
 *   currentSortDir     (String)  — 'ASC' | 'DESC'
 *   filterConfig       (Array)   — [{ key, label, icon, options: [{label, value}] }]
 *   totalLabel         (String)  — e.g. '42 contests'
 *   searchPlaceholder  (String)
 *   filterTitle        (String)  — popover header text
 *
 * Emits:
 *   update:modelValue  (q)
 *   sort               (field)
 *   reset-sort         ()
 *   filter-change      ({ key, value })   — value is '' when filter deactivated
 *   reset-filters      ()
 */
import { ref, computed } from 'vue'
import {
  Search, ArrowUpDown, ArrowDownWideNarrow, ArrowUpNarrowWide,
  Filter, RotateCcw
} from 'lucide-vue-next'

const props = defineProps({
  modelValue:        { type: String, default: '' },
  sortOptions:       { type: Array,  default: () => [] },
  currentSort:       { type: String, default: '' },
  currentSortDir:    { type: String, default: 'DESC' },
  filterConfig:      { type: Array,  default: () => [] },
  totalElements:     { type: Number, default: undefined },
  itemName:          { type: String, default: 'records' },
  totalLabel:        { type: String, default: '' }, // Legacy support
  hideSearch:        { type: Boolean, default: false },
  searchPlaceholder: { type: String, default: 'Tìm kiếm...' },
  filterTitle:       { type: String, default: 'Bộ lọc' }
})

const emit = defineEmits([
  'update:modelValue', 'sort', 'reset-sort', 'filter-change', 'reset-filters'
])

// ── Filter state per key: { active, value }
const filterState = ref(
  Object.fromEntries(
    props.filterConfig.map(f => [f.key, { active: false, value: '' }])
  )
)

const hasActiveFilters = computed(() =>
  Object.values(filterState.value).some(s => s.active && s.value !== '')
)

const onActiveChange = (key, active) => {
  if (!active) {
    const config = props.filterConfig.find(f => f.key === key)
    filterState.value[key].value = config?.type === 'daterange' ? null : ''
    emit('filter-change', { key, value: null })
  }
}

const onValueChange = (key, value) => {
  emit('filter-change', { key, value: filterState.value[key].active ? value : '' })
}

const resetAllFilters = () => {
  props.filterConfig.forEach(f => {
    filterState.value[f.key] = { active: false, value: f.type === 'daterange' ? null : '' }
  })
  emit('reset-filters')
}

// ── Date range helpers
const toDateInputVal = (d) => {
  if (!d) return ''
  const date = d instanceof Date ? d : new Date(d)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const onDateRangeChange = (key, idx, val) => {
  const current = filterState.value[key].value ? [...filterState.value[key].value] : [null, null]
  current[idx] = val ? new Date(val + 'T00:00:00') : null
  filterState.value[key].value = current
  if (current[0] && current[1]) {
    emit('filter-change', { key, value: current })
  }
}

// ── Sort
const sortLabel = computed(() => {
  if (!props.currentSort) return ''
  return props.sortOptions.find(o => o.value === props.currentSort)?.label || props.currentSort
})
</script>

<template>
  <div class="tc-bar">

    <!-- Search -->
    <div v-if="!hideSearch" class="tc-search-wrap">
      <Search class="tc-search-icon" :size="16" />
      <input
        type="text"
        :value="modelValue"
        :placeholder="searchPlaceholder"
        class="tc-search-input"
        @input="emit('update:modelValue', $event.target.value)"
      />
    </div>

    <!-- Sort (optional) -->
    <el-dropdown
      v-if="sortOptions.length"
      trigger="click"
      @command="(v) => emit('sort', v)"
      class="tc-dropdown-wrap"
    >
      <span class="el-dropdown-link">
        <button class="control-btn sort-btn" :class="{ active: currentSort, 'has-text': currentSort }">
          <ArrowUpNarrowWide  v-if="currentSort && currentSortDir === 'ASC'"  :size="16" style="transform:rotate(180deg)" />
          <ArrowDownWideNarrow v-else-if="currentSort"                        :size="16" />
          <ArrowUpDown         v-else                                          :size="16" />
          <span v-if="currentSort" class="sort-text">{{ sortLabel }}</span>
        </button>
      </span>
      <template #dropdown>
        <el-dropdown-menu class="dark-dropdown custom-sort-menu">
          <el-dropdown-item
            v-for="opt in sortOptions"
            :key="opt.value"
            :command="opt.value"
            :class="{ 'is-active': currentSort === opt.value }"
          >
            <div class="sort-menu-content">
              <span>{{ opt.label }}</span>
              <ArrowDownWideNarrow v-if="currentSort === opt.value && currentSortDir === 'DESC'" :size="16" class="sort-indicator" />
              <ArrowUpNarrowWide  v-if="currentSort === opt.value && currentSortDir === 'ASC'"  :size="16" class="sort-indicator" />
            </div>
          </el-dropdown-item>
          <div class="filter-footer sort-footer">
            <el-button link class="reset-filters" @click="emit('reset-sort')">
              <RotateCcw :size="14" style="margin-right:6px" /> Reset Sort
            </el-button>
          </div>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- Filter -->
    <el-popover
      v-if="filterConfig.length"
      placement="bottom-start"
      :width="420"
      trigger="click"
      popper-class="filter-popover"
      :hide-after="0"
      :persistent="true"
    >
      <template #reference>
        <div style="display:inline-block">
          <el-tooltip :content="filterTitle" placement="top" effect="dark" :hide-after="0">
            <button class="control-btn" :class="{ active: hasActiveFilters }">
              <Filter :size="16" />
            </button>
          </el-tooltip>
        </div>
      </template>

      <div class="filter-content">
        <div class="filter-header">
          <span>{{ filterTitle }}</span>
        </div>

        <div class="filter-list">
          <div v-for="f in filterConfig" :key="f.key" class="filter-row" :class="{ 'filter-row--full': f.type === 'daterange' }">
            <el-checkbox
              v-model="filterState[f.key].active"
              class="dark-checkbox"
              @change="(v) => onActiveChange(f.key, v)"
            />
            <span class="filter-label" :class="{ 'is-active': filterState[f.key].active }">
              <component v-if="f.icon" :is="f.icon" :size="14" />
              {{ f.label }}
            </span>

            <!-- Date range: two compact inputs filling the flex space like el-select -->
            <div v-if="f.type === 'daterange'" class="native-daterange-wrap">
              <input
                type="date"
                class="native-date-input"
                :disabled="!filterState[f.key].active"
                :value="filterState[f.key].value?.[0] ? toDateInputVal(filterState[f.key].value[0]) : ''"
                @change="(e) => onDateRangeChange(f.key, 0, e.target.value)"
              />
              <span class="date-sep">—</span>
              <input
                type="date"
                class="native-date-input"
                :disabled="!filterState[f.key].active"
                :value="filterState[f.key].value?.[1] ? toDateInputVal(filterState[f.key].value[1]) : ''"
                @change="(e) => onDateRangeChange(f.key, 1, e.target.value)"
              />
            </div>

            <el-select
              v-else
              v-model="filterState[f.key].value"
              size="small"
              class="dark-select value-select"
              :disabled="!filterState[f.key].active"
              :teleported="false"
              popper-class="dark-select-dropdown"
              @change="(v) => onValueChange(f.key, v)"
            >
              <el-option
                v-for="opt in f.options"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </div>
          <slot name="custom-filters"></slot>
        </div>

        <div class="filter-footer">
          <div class="spacer" />
          <el-button link class="reset-filters" @click="resetAllFilters">
            <RotateCcw :size="14" style="margin-right:6px" /> Reset All
          </el-button>
        </div>
      </div>
    </el-popover>

    <!-- Spacer -->
    <div class="spacer" />

    <!-- Total Elements Badge Native -->
    <div v-if="totalElements !== undefined" class="tc-total-badge">
      <div class="tc-circle-progress"></div>
      <span>{{ totalElements }} {{ itemName }}</span>
    </div>
    
    <!-- Custom Layout Space for overriding total badge -->
    <slot name="custom-total"></slot>

    <!-- Actions at the end -->
    <slot name="custom-actions"></slot>

    <!-- Legacy Total label -->
    <span v-if="totalLabel" class="tc-total">{{ totalLabel }}</span>
  </div>
</template>

<style scoped>
.tc-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

/* Search — matches ProblemListView exactly */
.tc-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.tc-search-icon {
  position: absolute;
  left: 14px;
  color: #8a8a8a;
  pointer-events: none;
}
.tc-search-input {
  background-color: #282828;
  border: 1px solid transparent;
  border-radius: 20px;
  height: 36px;
  padding: 0 16px 0 40px;
  color: #eff2f6;
  font-size: 13px;
  width: 240px;
  outline: none;
  transition: all 0.2s;
}
.tc-search-input:focus {
  border-color: #5c5c5c;
  background-color: #333;
}
.tc-search-input::placeholder { color: #8a8a8a; }

/* Control buttons — identical to Problems */
.control-btn {
  background-color: #282828;
  border: 1px solid transparent;
  color: #8a8a8a;
  border-radius: 20px;
  width: 36px; height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.control-btn:hover { background-color: #333; color: #eff2f6; }
.control-btn.active {
  background-color: rgba(255, 161, 22, 0.1);
  color: var(--accent-primary);
  border-color: rgba(255, 161, 22, 0.3);
}

/* Total Badge Support */
.tc-total-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8a8a8a;
  font-size: 13px;
  font-weight: 500;
  margin-left: 8px;
}
.tc-circle-progress {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #3e3e3e;
  border-top-color: #00b8a3;
  transform: rotate(-45deg);
}

/* Sort button with text */
.sort-btn.has-text {
  width: auto;
  padding: 0 16px;
  gap: 8px;
  border-radius: 20px;
}
.sort-text { font-size: 13px; font-weight: 500; }

/* Sort dropdown */
.sort-menu-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 140px;
  width: 100%;
}
.sort-indicator { color: var(--accent-primary, #ffa116); margin-left: 12px; }

.sort-footer {
  padding: 8px 12px 4px;
  border-top: 1px solid #3e3e3e;
  margin-top: 4px;
}

/* Spacer + total */
.spacer { flex: 1; }
.tc-total {
  font-size: 13px;
  color: #8a8a8a;
  font-weight: 500;
  white-space: nowrap;
}
</style>

<!-- Global styles — must NOT be scoped (popovers teleport outside component) -->
<style>
/* ── Filter Popover (matches ProblemListView exactly) ── */
.filter-popover.el-popper {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
  padding: 0 !important;
  border-radius: 8px !important;
  color: #eff2f6 !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
  width: 420px !important;
  min-width: 380px !important;
}
.filter-popover.el-popper .el-popper__arrow::before {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
}

.filter-content { display: flex; flex-direction: column; }

.filter-header {
  padding: 12px 16px;
  border-bottom: 1px solid #3e3e3e;
  font-size: 14px;
  font-weight: 600;
  color: #eff2f6;
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 0 !important;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dark-checkbox {
  --el-checkbox-checked-bg-color: var(--accent-primary, #ffa116);
  --el-checkbox-checked-input-border-color: var(--accent-primary, #ffa116);
}
.dark-checkbox .el-checkbox__inner {
  background-color: #333;
  border-color: #5c5c5c;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100px;
  color: #8a8a8a;
  font-size: 13px;
  flex-shrink: 0;
  transition: color 0.2s;
}
.filter-label.is-active { color: var(--accent-primary, #ffa116) !important; }

/* Select styling */
.dark-select .el-input__wrapper {
  background-color: #333 !important;
  box-shadow: 0 0 0 1px #3e3e3e inset !important;
  border-radius: 6px;
}
.dark-select .el-input__wrapper.is-focus {
  box-shadow: 0 0 0 1px #5c5c5c inset !important;
}
.dark-select .el-input__inner { color: #eff2f6 !important; font-size: 13px; }
.dark-select .el-input__suffix .el-select__caret { color: #8a8a8a; }
.dark-select.is-disabled .el-input__wrapper {
  background-color: #282828 !important;
  box-shadow: 0 0 0 1px #333 inset !important;
}
.dark-select.is-disabled .el-input__inner { color: #5c5c5c !important; }

.math-select { width: 65px; flex-shrink: 0; }
.value-select { flex: 1; min-width: 0; }

/* Date range — full-width inputs in same row, no wrapping */
.filter-row--full {
  align-items: center;
  flex-wrap: nowrap;
}
.filter-row--full .native-daterange-wrap {
  flex: 1;
  min-width: 0;
}

/* Native date range inputs — match el-select small size exactly */
.native-daterange-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
}
.native-date-input {
  background-color: #333;
  box-shadow: 0 0 0 1px #3e3e3e inset;
  border: none;
  border-radius: 6px;
  color: #eff2f6;
  font-size: 13px;
  padding: 0 6px;
  height: 24px;             /* matches el-select small */
  flex: 1;
  min-width: 0;
  width: 0;                 /* allow flex to shrink equally */
  outline: none;
  cursor: pointer;
  color-scheme: dark;
  transition: box-shadow 0.2s;
}
.native-date-input:hover:not(:disabled) {
  box-shadow: 0 0 0 1px #5c5c5c inset;
}
.native-date-input:focus {
  box-shadow: 0 0 0 1px var(--accent-primary, #ffa116) inset;
}
.native-date-input:disabled {
  background-color: #282828;
  box-shadow: 0 0 0 1px #333 inset;
  color: #5c5c5c;
  cursor: not-allowed;
  -webkit-text-fill-color: #5c5c5c;
}
.date-sep {
  color: #5c5c5c;
  font-size: 12px;
  flex-shrink: 0;
  user-select: none;
}

/* Select dropdown */
.dark-select-dropdown {
  background-color: #282828 !important;
  border: 1px solid #3e3e3e !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
}
.dark-select-dropdown .el-select-dropdown__item { color: #eff2f6 !important; padding: 0 12px; }
.dark-select-dropdown .el-select-dropdown__item.is-selected {
  color: var(--accent-primary, #ffa116) !important;
  background-color: rgba(255,161,22,0.1) !important;
  font-weight: 600;
}
.dark-select-dropdown .el-select-dropdown__item.is-hovering { background-color: #333 !important; }
.dark-select-dropdown .el-popper__arrow::before {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
}

.filter-footer {
  padding: 12px 16px;
  border-top: 1px solid #3e3e3e;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.reset-filters { color: #8a8a8a !important; font-size: 13px; }
.reset-filters:hover { color: #eff2f6 !important; }

/* Dark dropdown (for sort) */
.dark-dropdown.el-popper {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
}
.dark-dropdown .el-dropdown-menu__item { color: #eff2f6 !important; }
.dark-dropdown .el-dropdown-menu__item:hover,
.dark-dropdown .el-dropdown-menu__item.is-active {
  background: #333 !important;
  color: var(--accent-primary, #ffa116) !important;
}
.dark-dropdown.el-popper .el-popper__arrow::before {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
}

:deep(.filter-row .el-range-editor.dark-date-picker) {
  background-color: #282828 !important;
  border: 1px solid #3e3e3e !important;
  box-shadow: none !important;
}
:deep(.filter-row .el-range-editor.dark-date-picker .el-range-input) {
  background-color: transparent !important;
  color: #eff2f6 !important;
}
:deep(.filter-row .el-range-editor.dark-date-picker .el-range-separator) {
  color: #8a8a8a !important;
}
</style>

<style>
/* Global styles for date picker popovers */
.el-picker-panel.dark-date-picker-popper {
  background-color: #1e1e1e !important;
  border-color: #3e3e3e !important;
  color: #eff2f6 !important;
}
.el-picker-panel.dark-date-picker-popper .el-date-table td.in-range div {
  background-color: rgba(255, 136, 0, 0.1) !important;
}
.el-picker-panel.dark-date-picker-popper .el-date-table td.start-date span,
.el-picker-panel.dark-date-picker-popper .el-date-table td.end-date span {
  background-color: var(--accent-primary) !important;
  color: #000 !important;
}
</style>
