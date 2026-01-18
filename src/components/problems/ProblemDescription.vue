<script setup>
import { computed } from 'vue'
import { ThumbsUp, ThumbsDown, Star, Share2 } from 'lucide-vue-next'

// Mock Data - In a real app this would come from a store or API
const problem = {
  id: 1,
  title: 'Two Sum',
  difficulty: 'Easy',
  description: `
    <p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return <em>indices of the two numbers such that they add up to <code>target</code></em>.</p>
    <p>You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the <em>same</em> element twice.</p>
    <p>You can return the answer in any order.</p>

    <div class="example">
      <p><strong>Example 1:</strong></p>
      <pre><strong>Input:</strong> nums = [2,7,11,15], target = 9
<strong>Output:</strong> [0,1]
<strong>Explanation:</strong> Because nums[0] + nums[1] == 9, we return [0, 1].</pre>
    </div>

    <div class="example">
      <p><strong>Example 2:</strong></p>
      <pre><strong>Input:</strong> nums = [3,2,4], target = 6
<strong>Output:</strong> [1,2]</pre>
    </div>

    <p><strong>Constraints:</strong></p>
    <ul>
      <li><code>2 <= nums.length <= 10<sup>4</sup></code></li>
      <li><code>-10<sup>9</sup> <= nums[i] <= 10<sup>9</sup></code></li>
      <li><code>-10<sup>9</sup> <= target <= 10<sup>9</sup></code></li>
    </ul>
  `
}
</script>

<template>
  <el-scrollbar height="100%">
    <div class="description-content">
      <div class="header">
        <div class="title-row">
          <h2>{{ problem.id }}. {{ problem.title }}</h2>
        </div>
        <div class="meta-row">
          <el-tag :type="problem.difficulty === 'Easy' ? 'success' : 'warning'" effect="dark">
            {{ problem.difficulty }}
          </el-tag>
          <div class="actions">
            <el-button circle size="small">
              <template #icon><ThumbsUp class="icon" /></template>
            </el-button>
            <el-button circle size="small">
              <template #icon><ThumbsDown class="icon" /></template>
            </el-button>
            <el-button circle size="small">
              <template #icon><Star class="icon" /></template>
            </el-button>
            <el-button circle size="small">
              <template #icon><Share2 class="icon" /></template>
            </el-button>
          </div>
        </div>
      </div>

      <div class="content" v-html="problem.description"></div>
    </div>
  </el-scrollbar>
</template>

<style scoped>
.description-content {
  padding: 16px;
}

.header {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 16px;
  margin-bottom: 16px;
}

.title-row h2 {
  font-size: 1.5rem;
  margin-bottom: 8px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.actions {
  display: flex;
  gap: 8px;
}

.icon {
  width: 14px;
  height: 14px;
}

/* Content Styling for HTML injection */
:deep(.content) {
  font-size: 0.95rem;
  line-height: 1.6;
}

:deep(.content p) { margin-bottom: 16px; }
:deep(.content code) {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.85em;
}

:deep(.content pre) {
  background: var(--bg-tertiary);
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 16px;
  font-family: var(--font-mono);
  font-size: 0.9em;
}

:deep(.content ul) {
  margin-left: 20px;
  margin-bottom: 16px;
}

:deep(.content strong) { font-weight: 600; }
</style>
