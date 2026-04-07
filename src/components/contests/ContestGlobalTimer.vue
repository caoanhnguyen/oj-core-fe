<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useContestSessionStore } from '@/stores/contestSession'
import { useSyncedTimer } from '@/composables/useSyncedTimer'
import { Clock, LogOut, Zap, ChevronUp, ChevronDown, CheckCircle, Move } from 'lucide-vue-next'
import { ElMessageBox, ElMessage } from 'element-plus'
import AppButton from '@/components/common/AppButton.vue'

const router = useRouter()
const sessionStore = useContestSessionStore()

const isCollapsed = ref(false)
const widgetRef = ref(null)

// --- Drag Logic ---
const pos = ref({ x: window.innerWidth - 344, y: window.innerHeight - 200 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
let hasMoved = false

onMounted(() => {
  const savedPos = localStorage.getItem('contestWidgetPos')
  if (savedPos) {
    try {
      const parsed = JSON.parse(savedPos)
      pos.value = { 
        x: Math.min(Math.max(20, parsed.x), window.innerWidth - 340), 
        y: Math.min(Math.max(20, parsed.y), window.innerHeight - 80) 
      }
    } catch (e) {}
  }
})

const onMouseDown = (e) => {
  if (e.target.closest('.cw-actions') || e.target.closest('.cw-toggle-btn')) return
  isDragging.value = true
  hasMoved = false
  dragStart.value = {
    x: e.clientX - pos.value.x,
    y: e.clientY - pos.value.y
  }
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

const onMouseMove = (e) => {
  if (!isDragging.value) return
  hasMoved = true // Đã có di chuyển, không tính là click
  
  let newX = e.clientX - dragStart.value.x
  let newY = e.clientY - dragStart.value.y

  // Giới hạn trong màn hình
  const widgetWidth = widgetRef.value?.offsetWidth || 320
  const widgetHeight = widgetRef.value?.offsetHeight || 60
  
  newX = Math.max(20, Math.min(newX, window.innerWidth - widgetWidth - 20))
  newY = Math.max(20, Math.min(newY, window.innerHeight - widgetHeight - 20))

  pos.value = { x: newX, y: newY }
}

const onMouseUp = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  localStorage.setItem('contestWidgetPos', JSON.stringify(pos.value))
}

const handleHeaderClick = (e) => {
  if (hasMoved) {
    hasMoved = false // Reset
    return // Nếu vừa drag xong thì không toggle collapse
  }
  isCollapsed.value = !isCollapsed.value
}
// ------------------

const targetTime = computed(() => {
  if (!sessionStore.activeSession) return null
  return sessionStore.activeSession.endTime
})

const contestId = computed(() => sessionStore.activeSession?.contestId)
const contestTitle = computed(() => sessionStore.activeSession?.title || 'Cuộc thi')

const { formattedTime, isExpired } = useSyncedTimer(targetTime, () => {
  if (sessionStore.activeSession) {
    ElMessage.warning('Đã hết thời gian làm bài!')
    sessionStore.finishSession(sessionStore.activeSession.contestId)
  }
})

const handleLeave = () => {
  ElMessageBox.confirm(
    'Đồng hồ vẫn sẽ tiếp tục chạy ngầm phía Server. Lần tới quay lại bạn sẽ mất đi thời gian đã trôi qua. Bạn có chắc chắn muốn rời phòng thi không?',
    'Rời phòng thi',
    {
      confirmButtonText: 'Rời đi',
      cancelButtonText: 'Ở lại',
      type: 'warning'
    }
  ).then(() => {
    sessionStore.clearSession()
    router.push('/contests')
  }).catch(() => {})
}

const handleFinishEarly = () => {
  ElMessageBox.confirm(
    'Bạn có chắc chắn muốn nộp bài sớm? Hành động này không thể hoàn tác.',
    'Nộp bài sớm',
    {
      confirmButtonText: 'Nộp bài',
      cancelButtonText: 'Hủy',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await sessionStore.finishSession(contestId.value)
      ElMessage.success('Đã nộp bài thành công!')
      router.push(`/contests/${contestId.value}`)
    } catch (e) {
      console.error(e)
    }
  }).catch(() => {})
}

const returnToContest = (e) => {
  e.stopPropagation() // Chặn sự kiện click header
  router.push(`/contests/${contestId.value}`)
}
</script>

<template>
  <div v-if="sessionStore.isExamMode && formattedTime" 
       ref="widgetRef"
       class="contest-widget-wrapper" 
       :class="{ 'is-collapsed': isCollapsed, 'is-dragging': isDragging }"
       :style="{ transform: `translate(${pos.x}px, ${pos.y}px)` }">
    
    <!-- HEADER (Always visible) -->
    <div class="cw-header" @mousedown="onMouseDown" @click="handleHeaderClick">
      <div class="cw-header-left">
        <Zap class="gt-icon pulse-icon" :size="16" />
        <!-- title_click returns to contest -->
        <span class="cw-title" @click.stop="returnToContest">{{ contestTitle }}</span>
      </div>
      <div class="cw-header-right">
        <span class="cw-small-time" v-if="isCollapsed" :class="{ 'time-warning': formattedTime.startsWith('00:') && parseInt(formattedTime.split(':')[1]) < 10 }">
          {{ formattedTime }}
        </span>
        <button class="cw-toggle-btn" @click.stop="isCollapsed = !isCollapsed">
          <ChevronUp v-if="isCollapsed" :size="16"/>
          <ChevronDown v-else :size="16"/>
        </button>
      </div>
    </div>

    <!-- BODY (Expanded state) -->
    <div class="cw-body" v-if="!isCollapsed">
      <div class="cw-time-display" @click="returnToContest">
        <Clock :size="24" class="clock-icon" />
        <span class="gt-time" :class="{ 'time-warning': formattedTime.startsWith('00:') && parseInt(formattedTime.split(':')[1]) < 10 }">
          {{ formattedTime }}
        </span>
      </div>

      <div class="cw-actions">
        <AppButton variant="danger" :icon="CheckCircle" @click="handleFinishEarly">
          Nộp bài sớm
        </AppButton>
        <AppButton variant="secondary" :icon="LogOut" @click="handleLeave">
          Rời phòng
        </AppButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contest-widget-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 380px; /* Dài ra một chút */
  background: rgba(22, 22, 22, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 161, 22, 0.3);
  border-radius: 8px; /* Border radius nhỏ hơn */
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
  z-index: 9999;
  overflow: hidden;
  will-change: transform;
}

.contest-widget-wrapper.is-collapsed {
  width: auto;
  min-width: 300px;
  max-width: 500px;
}

.contest-widget-wrapper.is-dragging {
  opacity: 0.8;
  cursor: grabbing !important;
  transition: opacity 0.2s;
}

/* HEADER */
.cw-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px; /* Đảm bảo khoảng cách an toàn */
  padding: 12px 16px;
  cursor: grab;
  user-select: none;
  background: rgba(255, 161, 22, 0.05);
  border-bottom: 1px solid transparent;
}
.cw-header:active {
  cursor: grabbing;
}
.contest-widget-wrapper:not(.is-collapsed) .cw-header {
  border-bottom-color: rgba(255, 255, 255, 0.05);
}

.cw-header:hover {
  background: rgba(255, 161, 22, 0.1);
}

.cw-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ffa116;
  flex: 1;
  min-width: 0;
}

.cw-title {
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 260px; /* Cho title nhiều không gian hơn */
  cursor: pointer;
  transition: color 0.2s;
}
.cw-title:hover {
  color: #fff;
  text-decoration: underline;
}

.cw-header-right {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.cw-small-time {
  font-size: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #eff2f6;
  letter-spacing: 0.5px;
}

.cw-toggle-btn {
  background: transparent;
  border: none;
  color: #8a8a8a;
  display: flex;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
}
.cw-toggle-btn:hover { background: rgba(255,255,255,0.1); }

/* BODY */
.cw-body {
  padding: 20px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cw-time-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  padding: 10px;
  border-radius: 8px;
  transition: background 0.2s;
}
.cw-time-display:hover {
  background: rgba(255, 255, 255, 0.03);
}

.clock-icon { color: #8a8a8a; }

.gt-time {
  font-size: 36px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: 1px;
  color: #eff2f6;
  line-height: 1;
}

/* ACTIONS */
.cw-actions {
  display: flex;
  gap: 12px;
}
.cw-actions > * {
  flex: 1;
}

/* UTILS */
.pulse-icon {
  animation: gt-pulse 1.5s infinite;
}
@keyframes gt-pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}

.time-warning { color: #ef4743; animation: blink 1s infinite alternate; }
@keyframes blink { from { opacity: 1; } to { opacity: 0.5; } }
</style>
