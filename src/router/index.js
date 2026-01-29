import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProblemView from '../views/problems/ProblemView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/problems',
      name: 'problems',
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/problems/:slug',
      name: 'problem-detail',
      component: () => import('../views/problems/ProblemDetailView.vue'),
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
        }
      ]
    },
  ],
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  let isAuthenticated = authStore.isAuthenticated

  // Nếu route cần auth mà store chưa có user, thử fetch /users/me (từ cookie)
  if (to.meta.requiresAuth && !isAuthenticated) {
    try {
      await authStore.getCurrentUser()
      isAuthenticated = true
    } catch {
      // User không có cookie hợp lệ
    }
  }

  // Admin auto-redirect to dashboard
  if (isAuthenticated && authStore.isAdmin && to.path === '/') {
    next('/dashboard')
    return
  }

  if (to.meta.requiresGuest && isAuthenticated) {
    // Redirect admin to dashboard, others to home
    next(authStore.isAdmin ? '/dashboard' : '/')
  } else if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    // Nếu route cần admin mà user không phải admin, redirect về home
    next('/')
  } else {
    next()
  }
})

export default router
