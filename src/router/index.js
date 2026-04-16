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
      path: '/contests/:id/:tab?',
      name: 'contest-detail',
      component: () => import('../views/contests/ContestDetailView.vue')
    },
    {
      path: '/contests/:contestKey/problems/:slug/:tab?',
      name: 'contest-problem-detail',
      component: () => import('../views/problems/ProblemDetailView.vue')
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
      meta: { requiresAuth: true, canAccessDashboard: true },
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
          component: () => import('../views/dashboard/contests/ContestsList.vue')
        },
        {
          path: 'contests/create',
          name: 'admin-contest-create',
          component: () => import('../views/dashboard/contests/ContestCreateView.vue')
        },
        {
          path: 'contests/:id/:tab?',
          name: 'admin-contest-detail',
          component: () => import('../views/dashboard/contests/ContestDetailView.vue')
        },
        {
          path: 'problems',
          name: 'admin-problems',
          component: () => import('../views/dashboard/ProblemsList.vue')
        },
        {
          path: 'topics',
          name: 'admin-topics',
          component: () => import('../views/dashboard/TopicsList.vue')
        },
        {
          path: 'discussions',
          name: 'admin-discussions',
          component: () => import('../views/dashboard/DiscussionsList.vue')
        },
        {
          path: 'submissions',
          name: 'admin-submissions',
          component: () => import('../views/dashboard/SubmissionsList.vue')
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
    const canAccessDashboard = user?.roles?.some(role => ['ROLE_ADMIN', 'ROLE_MODERATOR', 'ROLE_ASSESSOR'].includes(role))

    if (to.matched.some(record => record.meta.requiresGuest) && isAuthenticated) {
      return next(canAccessDashboard ? '/dashboard' : '/')
    }

    if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
      return next('/login')
    }

    if (to.matched.some(record => record.meta.canAccessDashboard) && !canAccessDashboard) {
      return next('/')
    }

    next()
  } catch (error) {
    console.error("Lỗi nghiêm trọng tại Router Guard:", error)
    next('/login')
  }
})

export default router
