import { defineStore } from 'pinia'
import { ref } from 'vue'
import { submissionAPI } from '@/api/submissions'
import { ElMessage } from 'element-plus'
import { handleApiError } from '@/utils/errorHandler'

export const useSubmissionStore = defineStore('submission', () => {

    const isLoading = ref(false)
    const activeRunToken = ref(null)
    const activeSubmissionId = ref(null)

    // Polling IDs
    let runCodePollingInterval = null
    let submissionPollingInterval = null

    const submitCode = async (payload) => {
        isLoading.value = true
        try {
            const submissionId = await submissionAPI.submitCode(payload)
            activeSubmissionId.value = submissionId
            return submissionId
        } catch (error) {
            handleApiError(error, 'Nộp bài thất bại')
            throw error
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
        } catch (error) {
            handleApiError(error, 'Yêu cầu chạy code thất bại')
            throw error
        } finally {
            isLoading.value = false
        }
    }

    const startPollingRunCode = (token, onResult, onError) => {
        if (runCodePollingInterval) clearInterval(runCodePollingInterval)

        // Timeout after 60 seconds
        let elapsed = 0
        const TOTAL_TIMEOUT = 60000
        const INTERVAL = 2000
        // Add initial delay: wait 1.5s before first poll to give Redis time to populate
        const INITIAL_DELAY = 1500

        const poll = async () => {
            elapsed += INTERVAL
            if (elapsed > TOTAL_TIMEOUT) {
                clearInterval(runCodePollingInterval)
                onError && onError(new Error("Run code timeout"))
                return
            }
            try {
                const result = await submissionAPI.getRunCodeResult(token)
                // Success: backend returned the result
                clearInterval(runCodePollingInterval)
                onResult && onResult(result)
            } catch (error) {
                const status = error.response?.status
                // 400, 404, 500 all mean "still processing" - keep polling
                if (status !== 400 && status !== 404 && status !== 500) {
                    clearInterval(runCodePollingInterval)
                    onError && onError(error)
                }
                // Otherwise silently continue polling
            }
        }

        // Wait INITIAL_DELAY before starting the interval
        setTimeout(() => {
            runCodePollingInterval = setInterval(poll, INTERVAL)
        }, INITIAL_DELAY)
    }

    const startPollingSubmission = (submissionId, onResult, onError) => {
        if (submissionPollingInterval) clearInterval(submissionPollingInterval)

        // Timeout after 60 seconds
        const timeout = setTimeout(() => {
            clearInterval(submissionPollingInterval)
            onError && onError(new Error("Submission checking timeout"))
        }, 60000)

        submissionPollingInterval = setInterval(async () => {
            try {
                const result = await submissionAPI.getSubmissionResult(submissionId)
                // A pending or null verdict means we should keep polling
                if (result.verdict && result.verdict !== 'PENDING') {
                    clearInterval(submissionPollingInterval)
                    clearTimeout(timeout)
                    onResult && onResult(result)
                }
            } catch (error) {
                clearInterval(submissionPollingInterval)
                clearTimeout(timeout)
                onError && onError(error)
            }
        }, 2000)
    }

    const stopPolling = () => {
        if (runCodePollingInterval) clearInterval(runCodePollingInterval)
        if (submissionPollingInterval) clearInterval(submissionPollingInterval)
    }

    const getProblemStatistics = async (problemId) => {
        try {
            return await submissionAPI.getProblemStatistics(problemId)
        } catch (error) {
            console.error('Failed to get problem statistics:', error)
            throw error
        }
    }

    const getAdminProblemStatistics = async (problemId) => {
        try {
            return await submissionAPI.getAdminProblemStatistics(problemId)
        } catch (error) {
            console.error('Failed to get admin problem statistics:', error)
            throw error
        }
    }

    const getSubmissions = async (params) => {
        try {
            return await submissionAPI.getSubmissions(params)
        } catch (error) {
            console.error('Failed to get submissions:', error)
            throw error
        }
    }

    const getAllSubmissions = async (params) => {
        try {
            return await submissionAPI.getAllSubmissions(params)
        } catch (error) {
            console.error('Failed to get all submissions:', error)
            throw error
        }
    }

    const getSubmissionResult = async (id, isAdmin = false) => {
        try {
            if (isAdmin) {
                return await submissionAPI.getAdminSubmissionResult(id)
            }
            return await submissionAPI.getSubmissionResult(id)
        } catch (error) {
            console.error('Failed to load submission:', error)
            throw error
        }
    }

    const getLatestSubmissionSourceCode = async (problemId, languageKey) => {
        try {
            return await submissionAPI.getLatestSubmissionSourceCode(problemId, languageKey)
        } catch (error) {
            console.error('Failed to load latest submission source code:', error)
            throw error
        }
    }

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
        getLatestSubmissionSourceCode
    }
})
