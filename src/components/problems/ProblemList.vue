<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  problems: {
    type: Array,
    required: true
  }
})

const router = useRouter()

const handleRowClick = (row) => {
  router.push('/problems/' + row.slug)
}

const getDifficultyClass = (difficulty) => {
  return difficulty.toLowerCase()
}
</script>

<template>
  <div class="problem-list-container">
    <div class="problem-list">
      <div class="list-header">
        <div class="col col-status">Status</div>
        <div class="col col-title">Title</div>
        <div class="col col-acceptance">Acceptance</div>
        <div class="col col-difficulty">Difficulty</div>
      </div>

      <div
        v-for="problem in problems"
        :key="problem.id"
        class="list-row"
        @click="handleRowClick(problem)"
      >
        <div class="col col-status">
          <div v-if="problem.status === 'solved'" class="status-icon solved">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div v-else class="status-icon todo">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
          </div>
        </div>

        <div class="col col-title">
          <span class="problem-number">{{ problem.id }}.</span>
          <span class="problem-title">{{ problem.title }}</span>
        </div>

        <div class="col col-acceptance">
          <span class="acceptance-value">{{ problem.acceptance }}%</span>
        </div>

        <div class="col col-difficulty">
          <span class="difficulty-badge" :class="getDifficultyClass(problem.difficulty)">
            {{ problem.difficulty }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.problem-list-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.problem-list {
  width: 100%;
}

.list-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-primary);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.list-row {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-secondary);
  cursor: pointer;
  transition: background 0.15s ease;
}

.list-row:last-child {
  border-bottom: none;
}

.list-row:hover {
  background: var(--bg-tertiary);
}

.col {
  display: flex;
  align-items: center;
}

.col-status {
  width: 60px;
  justify-content: center;
}

.col-title {
  flex: 1;
  gap: var(--spacing-sm);
}

.col-acceptance {
  width: 120px;
  justify-content: flex-end;
}

.col-difficulty {
  width: 120px;
  justify-content: flex-end;
}

.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.status-icon.solved {
  color: var(--success);
}

.status-icon.todo {
  color: var(--text-tertiary);
  opacity: 0.5;
}

.problem-number {
  color: var(--text-tertiary);
  font-size: 14px;
  font-weight: 500;
  min-width: 32px;
}

.problem-title {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  transition: color 0.15s ease;
}

.list-row:hover .problem-title {
  color: var(--accent-primary);
}

.acceptance-value {
  color: var(--text-secondary);
  font-size: 14px;
}

.difficulty-badge {
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
}

.difficulty-badge.easy {
  color: var(--success);
  background: var(--success-bg);
}

.difficulty-badge.medium {
  color: var(--warning);
  background: var(--warning-bg);
}

.difficulty-badge.hard {
  color: var(--error);
  background: var(--error-bg);
}
</style>
