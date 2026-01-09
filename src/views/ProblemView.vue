<script setup>
import ProblemDescription from '../components/ProblemDescription.vue'
import CodeEditor from '../components/CodeEditor.vue'
</script>

<template>
  <div class="problem-view-container">
    <div class="panel left">
      <ProblemDescription />
    </div>
    <div class="panel right">
      <CodeEditor />
    </div>
  </div>
</template>

<style scoped>
.problem-view-container {
  display: flex;
  height: calc(100vh - 60px); /* Subtract Navbar height */
  overflow: hidden;
}

.panel {
  flex: 1;
  overflow: hidden;
  padding: 8px;
}

.left {
  border-right: 1px solid var(--border-color);
  max-width: 50%; /* Default split */
}

@media (max-width: 768px) {
  .problem-view-container {
    flex-direction: column;
    height: auto;
    overflow-y: auto;
  }
  
  .panel {
    height: 600px;
    max-width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }
}
</style>
