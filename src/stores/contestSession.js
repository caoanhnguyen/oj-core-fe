import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { contestsAPI } from '@/api/contests'
import { handleApiError } from '@/utils/errorHandler'

export const useContestSessionStore = defineStore('contestSession', () => {
  // Trạng thái phiên thi: { contestId, endTime, isFinished }
  const activeSession = ref(JSON.parse(localStorage.getItem('activeContestSession')) || null)
  const timeOffset = ref(parseInt(localStorage.getItem('contestTimeOffset') || '0')) 
  const lastSyncServerTime = ref(0)
  const lastSyncLocalTime = ref(0)

  const isExamMode = computed(() => {
    if (!activeSession.value) return false
    return true
  })

  /** Đồng bộ thời gian với server */
  const syncTime = (serverTimeStr) => {
    if (!serverTimeStr) return
    const cleanStr = serverTimeStr.includes('Z') || serverTimeStr.includes('+') ? serverTimeStr : serverTimeStr + 'Z'
    lastSyncServerTime.value = new Date(cleanStr).getTime()
    lastSyncLocalTime.value = performance.now()
    
    // Vẫn lưu offset cũ cho các mục đích legacy nếu cần
    timeOffset.value = lastSyncServerTime.value - Date.now()
    localStorage.setItem('contestTimeOffset', timeOffset.value.toString())
  }

  /** Lấy đối tượng Date hiện tại (Chống cheat đổi giờ máy tính) */
  const getServerNow = () => {
    if (lastSyncServerTime.value === 0) return new Date()
    const elapsed = performance.now() - lastSyncLocalTime.value
    return new Date(lastSyncServerTime.value + elapsed)
  }

  const setSession = (contestId, endTime) => {
    // Thêm Z nếu thiếu để đảm bảo parse đúng UTC (backend dùng LocalDateTime không có Z)
    const cleanEndTime = endTime && !(endTime.includes('Z') || endTime.includes('+')) ? endTime + 'Z' : endTime
    const session = { 
      contestId, 
      endTime: new Date(cleanEndTime).getTime() 
    }
    activeSession.value = session
    localStorage.setItem('activeContestSession', JSON.stringify(session))
  }

  const clearSession = () => {
    activeSession.value = null
    localStorage.removeItem('activeContestSession')
  }

  /** Bắt đầu phiên thi mới */
  const startSession = async (contestId) => {
    try {
      const participation = await contestsAPI.start(contestId)
      setSession(contestId, participation.endTime)
      return participation
    } catch (error) {
      handleApiError(error, 'Không thể bắt đầu phiên thi')
      throw error
    }
  }

  /** Kết thúc phiên thi */
  const finishSession = async (contestId) => {
    try {
      const id = contestId || activeSession.value?.contestId
      if (!id) return
      
      await contestsAPI.finish(id)
      clearSession()
    } catch (error) {
      if (error.response?.status === 403 || error.response?.status === 400) {
        clearSession()
      } else {
        handleApiError(error, 'Lỗi khi kết thúc phiên thi')
        throw error
      }
    }
  }

  return {
    activeSession,
    timeOffset,
    isExamMode,
    syncTime,
    getServerNow,
    setSession,
    clearSession,
    lastSyncServerTime,
    lastSyncLocalTime,
    startSession,
    finishSession
  }
})
