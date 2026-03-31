import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useContestSessionStore } from '@/stores/contestSession'

/**
 * Hook xử lý đếm ngược thời gian dựa trên thời gian thực thế giới thực đã đồng bộ server
 */
export function useSyncedTimer(targetTimeMs, onTimesUp) {
  const sessionStore = useContestSessionStore()
  const timeLeft = ref(0)
  let timer = null
  const isExpired = ref(false)

  const formattedTime = computed(() => {
    if (timeLeft.value <= 0) return '00:00:00'
    const s = Math.floor(timeLeft.value / 1000)
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  })

  const updateTimer = () => {
    if (!targetTimeMs.value) {
      timeLeft.value = 0
      return
    }

    const now = sessionStore.getServerNow().getTime()
    const diff = targetTimeMs.value - now
    
    if (diff <= 0) {
      timeLeft.value = 0
      if (!isExpired.value) {
        isExpired.value = true
        clearInterval(timer)
        if (onTimesUp) onTimesUp()
      }
    } else {
      timeLeft.value = diff
      isExpired.value = false
    }
  }

  onMounted(() => {
    updateTimer()
    timer = setInterval(updateTimer, 1000)
  })

  watch(() => targetTimeMs.value, () => {
    updateTimer()
    if (targetTimeMs.value && (targetTimeMs.value - sessionStore.getServerNow().getTime() > 0)) {
        if (!timer) timer = setInterval(updateTimer, 1000)
    }
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return {
    timeLeft,
    formattedTime,
    isExpired
  }
}
