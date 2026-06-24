import { defineStore } from 'pinia'
import { ref } from 'vue'
import { submissionAPI } from '@/api/submissions'

export const useSubmissionStore = defineStore('submission', () => {
  const isLoading = ref(false)
  const activeRunToken = ref(null)
  const activeSubmissionId = ref(null)

  let runCodePollingInterval = null
  let submissionPollingInterval = null
  let runCodePollingTimeout = null

  const submitCode = async (payload) => {
    isLoading.value = true
    try {
      const submissionId = await submissionAPI.submitCode(payload)
      activeSubmissionId.value = submissionId
      return submissionId
    } finally {
      isLoading.value = false
    }
  }

  const runCode = async (payload) => {
    isLoading.value = true
    try {
      const token = await submissionAPI.runCode(payload)
      activeRunToken.value = token
      return token
    } finally {
      isLoading.value = false
    }
  }

  const startPollingRunCode = (token, onResult, onError) => {
    if (runCodePollingInterval) clearInterval(runCodePollingInterval)
    if (runCodePollingTimeout) clearTimeout(runCodePollingTimeout)

    let elapsed = 0
    const totalTimeout = 60000
    const intervalMs = 2000
    const initialDelayMs = 1500

    const poll = async () => {
      elapsed += intervalMs
      if (elapsed > totalTimeout) {
        clearInterval(runCodePollingInterval)
        onError?.(new Error('Run code timeout'))
        return
      }

      try {
        const result = await submissionAPI.getRunCodeResult(token)
        if (result?.status === 'COMPLETED' || result?.status === 'FAILED') {
          clearInterval(runCodePollingInterval)
          if (runCodePollingTimeout) clearTimeout(runCodePollingTimeout)
          onResult?.(result)
        }
      } catch (error) {
        const status = error.response?.status
        if (status !== 400 && status !== 404) {
          clearInterval(runCodePollingInterval)
          if (runCodePollingTimeout) clearTimeout(runCodePollingTimeout)
          onError?.(error)
        }
      }
    }

    runCodePollingTimeout = setTimeout(() => {
      poll()
      runCodePollingInterval = setInterval(poll, intervalMs)
    }, initialDelayMs)
  }

  const startPollingSubmission = (submissionId, onResult, onError) => {
    if (submissionPollingInterval) clearInterval(submissionPollingInterval)

    const timeout = setTimeout(() => {
      clearInterval(submissionPollingInterval)
      onError?.(new Error('Submission checking timeout'))
    }, 60000)

    submissionPollingInterval = setInterval(async () => {
      try {
        const result = await submissionAPI.getSubmissionResult(submissionId)
        if (result.verdict && result.verdict !== 'PENDING') {
          clearInterval(submissionPollingInterval)
          clearTimeout(timeout)
          onResult?.(result)
        }
      } catch (error) {
        clearInterval(submissionPollingInterval)
        clearTimeout(timeout)
        onError?.(error)
      }
    }, 2000)
  }

  const stopPolling = () => {
    if (runCodePollingInterval) clearInterval(runCodePollingInterval)
    if (runCodePollingTimeout) clearTimeout(runCodePollingTimeout)
    if (submissionPollingInterval) clearInterval(submissionPollingInterval)
  }

  const getProblemStatistics = async (problemId) => submissionAPI.getProblemStatistics(problemId)
  const getAdminProblemStatistics = async (problemId) => submissionAPI.getAdminProblemStatistics(problemId)
  const getSubmissions = async (params) => submissionAPI.getSubmissions(params)
  const getAllSubmissions = async (params) => submissionAPI.getAllSubmissions(params)
  const getSubmissionResult = async (id, isAdmin = false) =>
    isAdmin ? submissionAPI.getAdminSubmissionResult(id) : submissionAPI.getSubmissionResult(id)
  const getLatestSubmissionSourceCode = async (problemId, languageKey) =>
    submissionAPI.getLatestSubmissionSourceCode(problemId, languageKey)

  return {
    isLoading,
    activeRunToken,
    activeSubmissionId,
    submitCode,
    runCode,
    startPollingRunCode,
    startPollingSubmission,
    stopPolling,
    getProblemStatistics,
    getAdminProblemStatistics,
    getSubmissions,
    getAllSubmissions,
    getSubmissionResult,
    getLatestSubmissionSourceCode,
  }
})
