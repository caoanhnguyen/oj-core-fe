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
      const hasToken = !!localStorage.getItem('token')
      if (hasToken) {
        try {
          await authStore.getCurrentUser()
        } catch (err) {
          // Nuốt lỗi an toàn
          console.warn("Chưa đăng nhập hoặc phiên hết hạn")
          // Clear token if getCurrentUser fails with 401/expired
          localStorage.removeItem('token')
        }
      }
    }

    // 🌟 Rút biến ra để đảm bảo lấy trạng thái mới nhất sau khi await
    const user = authStore.user
    const isAuthenticated = !!user
    const isAdminOrMod = user?.roles?.some(role => ['ROLE_ADMIN', 'ROLE_MODERATOR'].includes(role))

    // 1. Chặn người dùng đã đăng nhập vào các trang auth (Login/Register/...)
    if (to.matched.some(record => record.meta.requiresGuest) && isAuthenticated) {
      // console.log('Already logged in, redirecting away from auth page...')
      return next(isAdminOrMod ? '/dashboard' : '/')
    }

    // 2. Chặn người dùng chưa đăng nhập vào các trang bảo mật
    if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
      // console.log('Not logged in, redirecting to login...')
      return next('/login')
    }

    // 3. Chặn người dùng không có quyền quản trị/moderator vào dashboard
    if (to.matched.some(record => record.meta.requiresAdminOrMod) && !isAdminOrMod) {
      // console.log('Unauthorized access to admin/mod page...')
      return next('/')
    }

    // Nếu mọi thứ ổn, cho phép tiếp tục
    next()
  } catch (error) {
    console.error("Lỗi nghiêm trọng tại Router Guard:", error)
    // Nếu sập Router, ép về một trang public để không bị trắng màn hình
    next('/login')
  }
})

export default router
