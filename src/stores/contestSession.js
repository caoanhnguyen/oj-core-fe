import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { contestsAPI } from '@/api/contests'
import { handleApiError } from '@/utils/errorHandler'

export const useContestSessionStore = defineStore('contestSession', () => {
  // Trạng thái phiên thi: { contestId, endTime, isFinished }
  const activeSession = ref(JSON.parse(localStorage.getItem('activeContestSession')) || null)
  const timeOffset = ref(parseInt(localStorage.getItem('contestTimeOffset') || '0')) 

  const isExamMode = computed(() => {
    if (!activeSession.value) return false
    return true
  })

  /** Đồng bộ thời gian với server */
  const syncTime = (serverTimeStr) => {
    const serverTime = new Date(serverTimeStr).getTime()
    const localTime = Date.now()
    timeOffset.value = serverTime - localTime
    localStorage.setItem('contestTimeOffset', timeOffset.value.toString())
  }

  /** Lấy đối tượng Date hiện tại đã được đồng bộ với server */
  const getServerNow = () => {
    return new Date(Date.now() + timeOffset.value)
  }

  const setSession = (contestId, endTime) => {
    const session = { 
      contestId, 
      endTime: new Date(endTime).getTime() 
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
    startSession,
    finishSession
  }
})
