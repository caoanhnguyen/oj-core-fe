<script setup>
import { defineProps, ref, onMounted } from 'vue'
import { topicsAPI } from '@/api/topics'
// 🌟 Chỉ cần import Component Editor xịn xò vào là đủ
import RichTextEditor from '@/components/common/RichTextEditor.vue'

const props = defineProps({
   modelValue: {
      type: Object,
      required: true
   }
})

// Helper logic
const getDifficultyClass = (difficulty) => {
   if (difficulty === 'EASY') return 'difficulty-easy'
   if (difficulty === 'MEDIUM') return 'difficulty-medium'
   if (difficulty === 'HARD') return 'difficulty-hard'
   return ''
}

const activeTopics = ref([])
const loadingTopics = ref(false)
const topicPage = ref(0)
const topicSize = 100
const hasMoreTopics = ref(true)

const loadActiveTopics = async (loadMore = false) => {
   if (loadingTopics.value) return
   if (loadMore && !hasMoreTopics.value) return

   if (!loadMore) {
      topicPage.value = 0
   }

   try {
      loadingTopics.value = true
      const response = await topicsAPI.getAllActiveTopics({ page: topicPage.value, size: topicSize })
      
      const content = response.content || []
      const totalPages = response.totalPages || 1

      if (loadMore) {
         activeTopics.value = [...activeTopics.value, ...content]
      } else {
         activeTopics.value = content
      }

      topicPage.value++
      hasMoreTopics.value = topicPage.value < totalPages
   } catch (error) {
      console.error('Failed to load active topics', error)
   } finally {
      loadingTopics.value = false
   }
}

onMounted(() => {
   loadActiveTopics()
})

const handleDropdownVisibleChange = (visible) => {
   if (visible) {
      setTimeout(() => {
         const popoverWrap = document.querySelector('.topic-dropdown-popover .el-select-dropdown__wrap')
         if (popoverWrap && !popoverWrap.hasAttribute('data-scroll-bound')) {
            popoverWrap.setAttribute('data-scroll-bound', 'true')
            popoverWrap.addEventListener('scroll', () => {
               if (popoverWrap.scrollHeight - popoverWrap.scrollTop <= popoverWrap.clientHeight + 20) {
                  loadActiveTopics(true)
               }
            })
         }
      }, 50)
   }
}
</script>

<template>
   <div class="tab-content-wrapper full-width">
      <div class="form-section mb-6">
         <el-row :gutter="32">
            <el-col :span="12">
               <el-form-item label="Problem Title" prop="title">
                  <el-input 
                     v-model="modelValue.title" 
                     placeholder="e.g. Two Sum" 
                     size="large"
                     class="custom-input title-input"
                  />
               </el-form-item>
            </el-col>

            <el-col :span="6">
               <el-form-item label="Topics" prop="topicIds">
                  <el-select 
                     v-model="modelValue.topicIds" 
                     multiple
                     collapse-tags
                     :max-collapse-tags="3"
                     collapse-tags-tooltip
                     effect="dark"
                     placeholder="Select topics" 
                     size="large"
                     filterable
                     class="custom-select w-full"
                     popper-class="topic-dropdown-popover"
                     :loading="loadingTopics"
                     loading-text="Loading topics..."
                     @visible-change="handleDropdownVisibleChange"
                  >
                     <el-option
                        v-for="topic in activeTopics"
                        :key="topic.topicId || topic.id"
                        :label="topic.name"
                        :value="topic.topicId || topic.id"
                     />
                  </el-select>
               </el-form-item>
            </el-col>

            <el-col :span="6">
               <el-form-item label="Difficulty" prop="difficulty">
                  <el-select 
                     v-model="modelValue.difficulty" 
                     placeholder="Select difficulty" 
                     size="large"
                     class="custom-select w-full"
                     :class="getDifficultyClass(modelValue.difficulty)"
                  >
                     <el-option label="Easy" value="EASY" />
                     <el-option label="Medium" value="MEDIUM" />
                     <el-option label="Hard" value="HARD" />
                  </el-select>
               </el-form-item>
            </el-col>
         </el-row>
      </div>

      <div class="form-section mb-6">
         <el-row :gutter="32">
            <el-col :span="8">
               <el-form-item label="Rule Type" prop="ruleType">
                  <el-select 
                     v-model="modelValue.ruleType" 
                     placeholder="Select rule type" 
                     size="large"
                     class="custom-select w-full"
                  >
                     <el-option label="ACM (Pass all = Accept)" value="ACM" />
                     <el-option label="OI (Partial scoring)" value="OI" />
                  </el-select>
               </el-form-item>
            </el-col>

            <el-col :span="8">
               <el-form-item label="Total Score (Optional)" prop="totalScore">
                  <el-input-number 
                     v-model="modelValue.totalScore" 
                     :min="1" 
                     :max="1000"
                     placeholder="100"
                     size="large"
                     class="custom-input-number w-full"
                  />
               </el-form-item>
            </el-col>

            <el-col :span="8">
               <el-form-item label="Source / Original Author" prop="source">
                  <el-input 
                     v-model="modelValue.source" 
                     placeholder="e.g. Codeforces, LeetCode" 
                     size="large"
                     class="custom-input"
                  />
               </el-form-item>
            </el-col>
         </el-row>
      </div>

      <div class="form-section mb-6">
         <el-form-item label="Description" prop="description">
            <div style="height: 500px; width: 100%;">
               <RichTextEditor 
                  v-model:content="modelValue.description" 
                  placeholder="Describe the problem statement here..."
               />
            </div>
         </el-form-item>
      </div>
       
      <div class="form-section mb-6">
         <el-form-item label="Author Hint (Optional)" prop="hint">
            <div style="height: 300px; width: 100%;">
               <RichTextEditor 
                  v-model:content="modelValue.hint" 
                  placeholder="Give a small hint to the user if they get stuck..." 
               />
            </div>
         </el-form-item>
      </div>
   </div>
</template>

<style scoped>
.full-width { width: 100%; height: 100%; display: flex; flex-direction: column; }
.form-section { background: rgba(255, 255, 255, 0.02); padding: 24px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05); }
.mb-6 { margin-bottom: 24px; }
.w-full { width: 100%; }

/* Input Styles - Force Dark Theme */
:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  background-color: #1a1a1a !important;
  box-shadow: 0 0 0 1px #333 inset !important;
}

:deep(.el-input__inner) {
  color: #e0e0e0 !important;
  font-family: 'Inter', sans-serif;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #666 inset !important;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px #ffa116 inset !important;
}

/* Input Number specific fix */
:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  background-color: #262626 !important;
  border-color: #333 !important;
  color: #a0a0a0 !important;
}
:deep(.el-input-number__decrease:hover),
:deep(.el-input-number__increase:hover) {
  color: #ffa116 !important;
}

/* Select/Combobox Styles - Force Dark Theme */
:deep(.el-select .el-input__wrapper),
:deep(.el-select .el-select__wrapper),
:deep(.el-select__wrapper) {
  background-color: #1a1a1a !important;
  box-shadow: 0 0 0 1px #333 inset !important;
}

:deep(.el-select .el-input__inner),
:deep(.el-select__selected-item) {
  color: #e0e0e0 !important;
}

:deep(.el-select .el-input.is-focus .el-input__wrapper),
:deep(.el-select .el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px #ffa116 inset !important;
}

/* Multiple Select Tags Dark Theme */
:deep(.el-select .el-tag) {
  background-color: #262626 !important;
  border-color: #404040 !important;
  color: #e0e0e0 !important;
}
:deep(.el-select .el-tag__close:hover) {
  background-color: #404040 !important;
  color: #fff !important;
}

/* Difficulty Colors */
.difficulty-easy :deep(.el-input__inner) { color: #2cbb5d !important; font-weight: 600; }
.difficulty-medium :deep(.el-input__inner) { color: #ffb800 !important; font-weight: 600; }
.difficulty-hard :deep(.el-input__inner) { color: #ef4444 !important; font-weight: 600; }
</style>

<style>
/* Global because el-select popovers are appended to body */
.topic-dropdown-popover.el-popper {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
  border-radius: 8px !important;
  padding: 8px !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
}

.topic-dropdown-popover.el-popper .el-popper__arrow::before {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
}

.topic-dropdown-popover .el-scrollbar__wrap {
  max-height: 250px !important;
}

.topic-dropdown-popover .el-select-dropdown__list {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 8px !important;
  padding: 4px !important;
  margin: 0 !important;
}

.topic-dropdown-popover .el-select-dropdown__item {
  background: #3e3e3e !important;
  border: 1px solid transparent !important;
  color: #eff2f6 !important;
  border-radius: 20px !important;
  padding: 4px 12px !important;
  font-size: 12px !important;
  height: auto !important;
  line-height: normal !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: auto !important; /* overrides el-option 100% width */
}

/* Hover effect */
.topic-dropdown-popover .el-select-dropdown__item:hover,
.topic-dropdown-popover .el-select-dropdown__item.hover {
  background: #5c5c5c !important;
  color: #eff2f6 !important;
}

/* Active/selected effect */
.topic-dropdown-popover .el-select-dropdown__item.selected {
  background: rgba(255, 161, 22, 0.1) !important;
  color: #ffa116 !important;
  border-color: rgba(255, 161, 22, 0.3) !important;
  font-weight: normal !important;
}

.topic-dropdown-popover .el-select-dropdown__item.selected::after {
  display: none !important; /* hide default checkmark */
}

/* Fix collapse-tags tooltip background when hovering +1 (Usually defaults to is-light) */
.el-popper.is-light {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
  color: #eff2f6 !important;
}

.el-popper.is-light .el-popper__arrow::before {
  background: #282828 !important;
  border: 1px solid #3e3e3e !important;
}

/* Fix the tags inside the tooltip popup so they match dark theme too */
.el-popper .el-tag {
  background-color: #3e3e3e !important;
  border-color: transparent !important;
  color: #eff2f6 !important;
  margin: 2px !important;
}

.el-popper .el-tag .el-tag__close:hover {
  background-color: #5c5c5c !important;
  color: #fff !important;
}
</style>