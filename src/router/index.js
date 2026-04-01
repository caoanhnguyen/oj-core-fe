import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useContestSessionStore } from '../stores/contestSession'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/problems',
      name: 'problems',
      component: () => import('../views/problems/ProblemListView.vue')
    },
    {
      path: '/topics/:slug',
      name: 'topic-detail',
      component: () => import('../views/topics/TopicDetailView.vue')
    },
    {
      path: '/problems/:slug',
      redirect: to => `/problems/${to.params.slug}/description`
    },
    {
      path: '/problems/:slug/:tab',
      name: 'problem-detail',
      component: () => import('../views/problems/ProblemDetailView.vue')
    },
    {
      path: '/rankings/:type',
      name: 'rankings',
      component: () => import('../views/rankings/RankingView.vue'),
      props: true
    },
    {
      path: '/contests',
      name: 'contests',
      component: () => import('../views/contests/ContestsListView.vue')
    },
    {
      path: '/contests/:id',
      name: 'contest-detail',
      component: () => import('../views/contests/ContestDetailView.vue')
    },
    {
      path: '/submissions',
      name: 'submissions',
      component: () => import('../views/submissions/SubmissionsList.vue'),
    },
    {
      path: '/submissions/:id',
      name: 'submission-detail',
      component: () => import('../views/submissions/SubmissionDetailView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/LoginView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/auth/RegisterView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('../views/auth/ForgotPasswordView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('../views/auth/ResetPasswordView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/oauth/callback',
      name: 'oauth-callback',
      component: () => import('../views/auth/OAuthCallback.vue'),
    },
    {
      path: '/verify-email',
      name: 'verify-email',
      component: () => import('../views/auth/VerifyEmailView.vue'),
    },
    {
      path: '/profile/:idOrUsername?',
      name: 'profile',
      component: () => import('../views/profile/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile/edit',
      name: 'edit-profile',
      component: () => import('../views/profile/EditProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/dashboard',
      component: () => import('../views/dashboard/DashboardView.vue'),
      meta: { requiresAuth: true, requiresAdminOrMod: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('../views/dashboard/DashboardContent.vue')
        },
        {
          path: 'create-problem',
          name: 'create-problem',
          component: () => import('../views/dashboard/CreateProblemView.vue')
        },
        {
          path: 'update-problem/:id',
          name: 'update-problem',
          component: () => import('../views/dashboard/UpdateProblemView.vue')
        },
        {
          path: 'users',
          name: 'user-management',
          component: () => import('../views/dashboard/UsersList.vue')
        },
        {
          path: 'contests',
          name: 'admin-contests',
          component: () => import('../views/dashboard/ContestsList.vue')
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue')
    }
  ],
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  try {
    const authStore = useAuthStore()
    const sessionStore = useContestSessionStore()

    // 🏆 SESSION GUARD & EXAM MODE LOGIC
    if (sessionStore.isExamMode) {
      const contestId = sessionStore.activeSession.contestId
      const isGoingToContest = to.path.includes(`/contests/${contestId}`)

      if (to.path === '/problems') {
        return next({ name: 'contest-detail', params: { id: contestId } })
      }
      if (to.path === '/submissions') {
        return next({ name: 'contest-detail', params: { id: contestId }, query: { tab: 'submissions' } })
      }

      const isProblemInContest = (to.path.startsWith('/problems/') && to.query.contestId === contestId)
      const isSubmissionInContest = (to.path.startsWith('/submissions/')) // Cho phép xem log nộp bài thoải mái
      
      if (!isGoingToContest && !isProblemInContest && !isSubmissionInContest && to.name !== 'login' && to.name !== 'not-found') {
        const confirmExit = window.confirm('Bạn đang trong một phiên thi đấu. Thời gian vẫn sẽ tiếp tục trôi. Bạn có chắc chắn muốn rời khỏi trang này không?')
        if (!confirmExit) return next(false)
      }
    }

    if (!window.__authInitialized) {
      window.__authInitialized = true
      const hasToken = !!localStorage.getItem('token')
      if (hasToken) {
        try {
          await authStore.getCurrentUser()
        } catch (err) {
          console.warn("Chưa đăng nhập hoặc phiên hết hạn")
          localStorage.removeItem('token')
        }
      }
    }

    const user = authStore.user
    const isAuthenticated = !!user
    const isAdminOrMod = user?.roles?.some(role => ['ROLE_ADMIN', 'ROLE_MODERATOR'].includes(role))

    if (to.matched.some(record => record.meta.requiresGuest) && isAuthenticated) {
      return next(isAdminOrMod ? '/dashboard' : '/')
    }

    if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
      return next('/login')
    }

    if (to.matched.some(record => record.meta.requiresAdminOrMod) && !isAdminOrMod) {
      return next('/')
    }

    next()
  } catch (error) {
    console.error("Lỗi nghiêm trọng tại Router Guard:", error)
    next('/login')
  }
})

export default router
