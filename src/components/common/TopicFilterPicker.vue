<script setup>
/**
 * TopicFilterPicker — Reusable topic selector popover for filter bars
 *
 * Props:
 *   modelValue   (Array<String>)  — list of selected topic names (v-model)
 *   topics       (Array)          — [{ id?, name, slug }] list of available topics
 *   active       (Boolean)        — whether the filter is active (checkbox v-model)
 *   label        (String)         — label text (default: 'Chủ đề')
 *   placeholder  (String)         — search placeholder
 *
 * Emits:
 *   update:modelValue  (Array<String>)
 *   update:active      (Boolean)
 */
import { ref, computed } from 'vue'
import { Search, RotateCcw } from 'lucide-vue-next'

const props = defineProps({
  modelValue:  { type: Array,   default: () => [] },
  topics:      { type: Array,   default: () => [] },
  active:      { type: Boolean, default: false },
  label:       { type: String,  default: 'Chủ đề' },
  placeholder: { type: String,  default: 'Tìm chủ đề...' }
})

const emit = defineEmits(['update:modelValue', 'update:active'])

const topicSearch = ref('')

const filteredTopics = computed(() => {
  if (!topicSearch.value) return props.topics
  const q = topicSearch.value.toLowerCase()
  return props.topics.filter(t => t.name.toLowerCase().includes(q))
})

const displayValue = computed(() => {
  if (!props.modelValue.length) return ''
  if (props.modelValue.length === 1) return props.modelValue[0]
  return `${props.modelValue[0]} +${props.modelValue.length - 1}`
})

const toggleTopic = (name) => {
  const current = [...props.modelValue]
  const idx = current.indexOf(name)
  if (idx > -1) {
    current.splice(idx, 1)
  } else {
    current.push(name)
  }
  emit('update:modelValue', current)
  // Auto-activate filter when a topic is selected
  if (current.length > 0 && !props.active) {
    emit('update:active', true)
  } else if (current.length === 0) {
    emit('update:active', false)
  }
}

const onActiveChange = (val) => {
  emit('update:active', val)
  if (!val) {
    emit('update:modelValue', [])
    topicSearch.value = ''
  }
}

const reset = () => {
  emit('update:modelValue', [])
  emit('update:active', false)
  topicSearch.value = ''
}
</script>

<template>
  <div class="filter-row">
    <el-checkbox
      :model-value="active"
      class="dark-checkbox"
      @change="onActiveChange"
    />
    <span class="filter-label" :class="{ 'is-active': active }">
      <Tag :size="14" /> {{ label }}
    </span>

    <el-popover
      placement="right-start"
      :width="360"
      trigger="click"
      popper-class="tc-topic-popover"
      :hide-after="0"
      :persistent="true"
      :teleported="false"
      :disabled="!active"
    >
      <template #reference>
        <!-- Real el-select + invisible overlay — visually identical to other filter fields -->
        <div style="position: relative; flex: 1; min-width: 0;">
          <el-select
            size="small"
            class="dark-select value-select"
            :disabled="!active"
            :model-value="modelValue.length
              ? (modelValue.length === 1 ? modelValue[0] : `${modelValue[0]} +${modelValue.length - 1}`)
              : ''"
            placeholder="Select"
            style="width: 100%; pointer-events: none;"
          />
          <div
            :style="{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100%',
              cursor: active ? 'pointer' : 'not-allowed'
            }"
          />
        </div>
      </template>

      <!-- Popover content -->
      <div class="topic-picker-content" @click.stop>
        <div class="topic-picker-search">
          <Search :size="14" class="search-icon" />
          <input
            type="text"
            v-model="topicSearch"
            :placeholder="placeholder"
            class="search-input"
          />
        </div>

        <div class="topic-pills-wrap">
          <button
            v-for="t in filteredTopics"
            :key="t.id || t.name"
            class="topic-pill"
            :class="{ 'is-active': modelValue.includes(t.name) }"
            @click="toggleTopic(t.name)"
          >
            {{ t.name }}
          </button>
          <div v-if="filteredTopics.length === 0" class="no-topics">
            Không tìm thấy chủ đề
          </div>
        </div>

        <div class="topic-picker-footer">
          <el-button link class="reset-link" @click="reset">
            <RotateCcw :size="13" style="margin-right:5px" /> Đặt lại
          </el-button>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<style scoped>
/* No custom trigger CSS needed — el-select handles all disabled/enabled styling */
</style>

<!-- Global: popover teleports to body, cannot be scoped -->
<style>
.tc-topic-popover.el-popper {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
  padding: 0 !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
  color: #eff2f6 !important;
}
.tc-topic-popover .el-popper__arrow::before {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
}
.topic-picker-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
}
.topic-picker-search {
  position: relative;
  display: flex;
  align-items: center;
}
.topic-picker-search .search-icon {
  position: absolute;
  left: 10px;
  color: #8a8a8a;
  pointer-events: none;
}
.topic-picker-search .search-input {
  width: 100%;
  background: #333;
  border: 1px solid transparent;
  border-radius: 20px;
  padding: 5px 12px 5px 30px;
  color: #eff2f6;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}
.topic-picker-search .search-input:focus { border-color: #5c5c5c; }
.topic-picker-search .search-input::placeholder { color: #8a8a8a; }

.topic-pills-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  max-height: 200px;
  overflow-y: auto;
  padding-right: 2px;
}
.topic-pills-wrap::-webkit-scrollbar { width: 4px; }
.topic-pills-wrap::-webkit-scrollbar-thumb { background: #444; border-radius: 2px; }

.topic-pill {
  background: #3e3e3e;
  border: 1px solid transparent;
  color: #eff2f6;
  border-radius: 20px;
  padding: 3px 11px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.18s;
  line-height: 1.4;
}
.topic-pill:hover { background: #4a4a4a; }
.topic-pill.is-active {
  background: rgba(255,161,22,0.1);
  color: var(--accent-primary, #ffa116);
  border-color: rgba(255,161,22,0.3);
}

.no-topics {
  color: #8a8a8a;
  font-size: 12px;
  font-style: italic;
  width: 100%;
  text-align: center;
  padding: 8px 0;
}

.topic-picker-footer {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #3e3e3e;
  padding-top: 8px;
}
.reset-link { color: #8a8a8a !important; font-size: 12px !important; }
.reset-link:hover { color: #eff2f6 !important; }
</style>
