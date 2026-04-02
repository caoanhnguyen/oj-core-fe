<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String, // 'primary', 'secondary', 'danger', 'outline', 'text', 'info', 'success', 'warning'
    default: 'primary'
  },
  size: {
    type: String, // 'small', 'default', 'large'
    default: 'default'
  },
  type: {
    type: String, // The native HTML button type: 'button', 'submit', 'reset'
    default: 'button'
  },
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  icon: {
    type: [Object, Function],
    default: null
  }
})

const emit = defineEmits(['click'])

const buttonClass = computed(() => {
  return [
    'app-btn',
    `btn-${props.variant}`,
    `btn-${props.size}`,
    { 'is-loading': props.loading }
  ]
})
</script>

<template>
  <button 
    :type="type"
    :class="buttonClass" 
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="spinner"></span>
    <component :is="icon" v-if="icon && !loading" class="btn-icon" />
    <slot></slot>
  </button>
</template>

<style scoped>
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid transparent;
  font-family: inherit;
  white-space: nowrap;
}

.app-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Sizes */
.btn-small {
  padding: 4px 12px;
  font-size: 13px;
  height: 32px;
}

.btn-default {
  padding: 8px 16px;
  font-size: 14px;
  height: 40px;
}

.btn-large {
  padding: 12px 24px;
  font-size: 16px;
  height: 48px;
}

/* Variants */
.btn-primary {
  background-color: rgba(255, 161, 22, 0.1);
  color: var(--accent-primary);
  border-color: rgba(255, 161, 22, 0.3);
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  background-color: rgba(255, 161, 22, 0.2);
  border-color: var(--accent-primary);
  color: var(--accent-hover);
  box-shadow: 0 0 16px rgba(255, 161, 22, 0.4);
  transform: translateY(-1px);
}

.btn-secondary {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--border-primary);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--bg-elevated);
  border-color: var(--text-tertiary);
}

.btn-danger {
  background-color: rgba(239, 71, 67, 0.1);
  color: var(--error);
  border-color: rgba(239, 71, 67, 0.3);
  transition: all 0.3s ease;
}

.btn-danger:hover:not(:disabled) {
  background-color: rgba(239, 71, 67, 0.2);
  border-color: var(--error);
  color: #ff6864;
  box-shadow: 0 0 16px rgba(239, 71, 67, 0.4);
  transform: translateY(-1px);
}

.btn-success {
  background-color: rgba(44, 187, 93, 0.1);
  color: #2cbb5d;
  border-color: rgba(44, 187, 93, 0.3);
  transition: all 0.3s ease;
}

.btn-success:hover:not(:disabled) {
  background-color: rgba(44, 187, 93, 0.2);
  border-color: #2cbb5d;
  color: #3fe076;
  box-shadow: 0 0 16px rgba(44, 187, 93, 0.4);
  transform: translateY(-1px);
}

.btn-warning {
  background-color: rgba(255, 192, 30, 0.1);
  color: #ffc01e;
  border-color: rgba(255, 192, 30, 0.3);
  transition: all 0.3s ease;
}

.btn-warning:hover:not(:disabled) {
  background-color: rgba(255, 192, 30, 0.2);
  border-color: #ffc01e;
  color: #ffd04f;
  box-shadow: 0 0 16px rgba(255, 192, 30, 0.4);
  transform: translateY(-1px);
}

.btn-info {
  background-color: rgba(138, 138, 138, 0.1);
  color: #8a8a8a;
  border-color: rgba(138, 138, 138, 0.3);
  transition: all 0.3s ease;
}

.btn-info:hover:not(:disabled) {
  background-color: rgba(138, 138, 138, 0.2);
  border-color: #8a8a8a;
  color: #b0b0b0;
  box-shadow: 0 0 16px rgba(138, 138, 138, 0.4);
  transform: translateY(-1px);
}

.btn-outline {
  background-color: transparent;
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}

.btn-outline:hover:not(:disabled) {
  background-color: rgba(255, 161, 22, 0.1);
}

.btn-text {
  background-color: transparent;
  color: var(--text-secondary);
  border-color: transparent;
  padding-left: 0;
  padding-right: 0;
}

.btn-text:hover:not(:disabled) {
  color: var(--text-primary);
}

.btn-icon {
  margin-right: 8px;
  width: 18px;
  height: 18px;
}

.btn-small .btn-icon {
  width: 14px;
  height: 14px;
  margin-right: 6px;
}

/* Spinner */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
