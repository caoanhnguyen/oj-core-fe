import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

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
      path: '/submissions',
      name: 'submissions',
      component: () => import('../views/submissions/SubmissionsList.vue'),
    },
    {
      path: '/submissions/:id',
      name: 'submission-detail',
      component: () => import('../views/submissions/SubmissionDetailView.vue'), // To be created
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
      path: '/profile',
      name: 'profile',
      component: () => import('../views/profile/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/dashboard',
      component: () => import('../views/dashboard/DashboardView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
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

    if (!window.__authInitialized) {
      window.__authInitialized = true
      try {
        await authStore.getCurrentUser()
      } catch (err) {
        // Nuốt lỗi an toàn
        console.warn("Chưa đăng nhập hoặc phiên hết hạn")
      }
    }

    // 🌟 Rút biến ra để tránh việc chọc vào getter nhiều lần có thể gây lỗi
    const isAuthenticated = !!authStore.isAuthenticated
    const isAdmin = !!authStore.isAdmin


    // Removed admin auto-redirect to dashboard from home page so admins can view the landing page


    if (to.meta.requiresGuest && isAuthenticated) {
      // Redirect admin to dashboard, others to home
      return next(isAdmin ? '/dashboard' : '/')
    } else if (to.meta.requiresAuth && !isAuthenticated) {
      return next('/login')
    } else if (to.meta.requiresAdmin && !isAdmin) {
      // Nếu route cần admin mà user không phải admin, redirect về home
      return next('/')
    }

    next()
  } catch (error) {
    console.error("Lỗi nghiêm trọng tại Router Guard:", error)
    // Nếu sập Router, ép về một trang public để không bị trắng màn hình
    next('/login')
  }
})

export default router
