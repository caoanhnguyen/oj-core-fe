import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { contestsAPI } from '@/api/contests'

export const useContestSessionStore = defineStore('contestSession', () => {
  const activeSession = ref(JSON.parse(localStorage.getItem('activeContestSession')) || null)
  const timeOffset = ref(parseInt(localStorage.getItem('contestTimeOffset') || '0', 10))
  const lastSyncServerTime = ref(0)
  const lastSyncLocalTime = ref(0)

  const isExamMode = computed(() => !!activeSession.value)

  const syncTime = (serverTimeStr) => {
    if (!serverTimeStr) return
    const normalized = serverTimeStr.includes('Z') || serverTimeStr.includes('+')
      ? serverTimeStr
      : `${serverTimeStr}Z`

    lastSyncServerTime.value = new Date(normalized).getTime()
    lastSyncLocalTime.value = performance.now()
    timeOffset.value = lastSyncServerTime.value - Date.now()
    localStorage.setItem('contestTimeOffset', timeOffset.value.toString())
  }

  const getServerNow = () => {
    if (lastSyncServerTime.value === 0) return new Date()
    const elapsed = performance.now() - lastSyncLocalTime.value
    return new Date(lastSyncServerTime.value + elapsed)
  }

  const setSession = (contestId, contestKey, endTime, title = 'Contest') => {
    const normalizedEndTime =
      endTime && !(endTime.includes('Z') || endTime.includes('+')) ? `${endTime}Z` : endTime

    const session = {
      contestId,
      contestKey,
      endTime: new Date(normalizedEndTime).getTime(),
      title,
    }

    activeSession.value = session
    localStorage.setItem('activeContestSession', JSON.stringify(session))
  }

  const clearSession = () => {
    activeSession.value = null
    localStorage.removeItem('activeContestSession')
  }

  const startSession = async (contestId, contestKey, title = 'Contest') => {
    const participation = await contestsAPI.start(contestKey)
    setSession(contestId, contestKey, participation.endTime, title)
    return participation
  }

  const finishSession = async (contestKey) => {
    const key = contestKey || activeSession.value?.contestKey
    if (!key) return

    try {
      await contestsAPI.finish(key)
      clearSession()
    } catch (error) {
      if (error.response?.status === 403 || error.response?.status === 400) {
        clearSession()
        return
      }
      throw error
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
    finishSession,
  }
})
