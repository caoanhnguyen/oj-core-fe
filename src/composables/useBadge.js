/**
 * useBadge — Centralized badge class resolver
 *
 * Provides helper functions that map enum values → global CSS class names
 * defined in src/assets/badges.css.
 *
 * Usage:
 *   import { useBadge } from '@/composables/useBadge'
 *   const { estatusClass, difficultyClass, verdictClass } = useBadge()
 */

export function useBadge() {
  /**
   * EStatus: ACTIVE | INACTIVE | DELETED
   * → 'status-active' | 'status-inactive' | 'status-deleted'
   */
  const estatusClass = (status) => {
    switch ((status || '').toUpperCase()) {
      case 'ACTIVE':    return 'status-active'
      case 'INACTIVE':  return 'status-inactive'
      case 'DELETED':   return 'status-deleted'
      default:          return 'status-inactive'
    }
  }

  /**
   * Problem visibility: PUBLISHED | DRAFT
   * → 'status-published' | 'status-draft'
   */
  const problemStatusClass = (status) => {
    return (status || '').toUpperCase() === 'PUBLISHED'
      ? 'status-published'
      : 'status-draft'
  }

  /**
   * User account lock: accountNonLocked boolean
   * true  → 'status-active'
   * false → 'status-locked'
   */
  const accountStatusClass = (accountNonLocked) => {
    return accountNonLocked === false ? 'status-locked' : 'status-active'
  }

  /**
   * Difficulty: EASY | MEDIUM | HARD
   * → 'difficulty-easy' | 'difficulty-medium' | 'difficulty-hard'
   */
  const difficultyClass = (difficulty) => {
    switch ((difficulty || '').toUpperCase()) {
      case 'EASY':   return 'difficulty-easy'
      case 'MEDIUM': return 'difficulty-medium'
      case 'HARD':   return 'difficulty-hard'
      default:       return ''
    }
  }

  /**
   * Difficulty label (short): EASY → 'Easy', MEDIUM → 'Med', HARD → 'Hard'
   */
  const difficultyLabel = (difficulty) => {
    switch ((difficulty || '').toUpperCase()) {
      case 'EASY':   return 'Easy'
      case 'MEDIUM': return 'Med'
      case 'HARD':   return 'Hard'
      default:       return difficulty || ''
    }
  }

  /**
   * Rule type: ACM | OI → 'rule-acm' | 'rule-oi'
   */
  const ruleTypeClass = (ruleType) => {
    return (ruleType || '').toUpperCase() === 'OI' ? 'rule-oi' : 'rule-acm'
  }

  /**
   * Contest lifecycle: ONGOING | UPCOMING | ENDED
   * → 'status-ongoing' | 'status-upcoming' | 'status-ended'
   */
  const contestStatusClass = (status) => {
    switch ((status || '').toUpperCase()) {
      case 'ONGOING':  return 'status-ongoing'
      case 'UPCOMING': return 'status-upcoming'
      case 'ENDED':    return 'status-ended'
      default:         return 'status-ended'
    }
  }

  /**
   * Verdict: AC | WA | TLE | MLE | RE | CE | SE | PENDING
   * → 'verdict-ac' | 'verdict-wa' | ...
   */
  const verdictClass = (verdict) => {
    return `verdict-${(verdict || 'pending').toLowerCase()}`
  }

  /**
   * Role: ROLE_ADMIN | ROLE_MODERATOR | ROLE_ASSESSOR | ROLE_USER | ROLE_DEVELOPER
   * → 'role-admin' | 'role-moderator' | ...
   */
  const roleClass = (role) => {
    return `role-${(role || '').replace('ROLE_', '').toLowerCase()}`
  }

  /**
   * Contest visibility: PUBLIC | PRIVATE
   * → 'visibility-public' | 'visibility-private'
   */
  const visibilityClass = (visibility) => {
    return (visibility || '').toUpperCase() === 'PUBLIC' ? 'visibility-public' : 'visibility-private'
  }

  /**
   * Scoreboard visibility: VISIBLE | HIDDEN_PERMANENTLY | FROZEN
   * → 'sb-visible' | 'sb-hidden'
   */
  const scoreboardClass = (visibility) => {
    return (visibility || '').toUpperCase() === 'VISIBLE' ? 'sb-visible' : 'sb-hidden'
  }

  return {
    estatusClass,
    problemStatusClass,
    accountStatusClass,
    difficultyClass,
    difficultyLabel,
    ruleTypeClass,
    contestStatusClass,
    verdictClass,
    roleClass,
    scoreboardClass,
    visibilityClass
  }
}
