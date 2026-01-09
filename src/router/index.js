import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProblemView from '../views/ProblemView.vue'
import { authAPI } from '../api/auth'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
        },
        {
            path: '/problems/:id',
            name: 'problem',
            component: ProblemView,
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('../views/LoginView.vue'),
            meta: { requiresGuest: true }
        },
        {
            path: '/register',
            name: 'register',
            component: () => import('../views/RegisterView.vue'),
            meta: { requiresGuest: true }
        },
        {
            path: '/forgot-password',
            name: 'forgot-password',
            component: () => import('../views/ForgotPasswordView.vue'),
            meta: { requiresGuest: true }
        },
        {
            path: '/reset-password',
            name: 'reset-password',
            component: () => import('../views/ResetPasswordView.vue'),
            meta: { requiresGuest: true }
        },
        {
            path: '/oauth/callback',
            name: 'oauth-callback',
            component: () => import('../views/OAuthCallback.vue'),
        },
        {
            path: '/profile',
            name: 'profile',
            component: () => import('../views/ProfileView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/debug',
            name: 'debug',
            component: () => import('../views/DebugView.vue')
        },
    ],
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const userStr = localStorage.getItem('user')
  let isAuthenticated = !!userStr

  // Nếu route cần auth mà localStorage chưa có user, thử fetch /users/me (cookie)
  if (to.meta.requiresAuth && !isAuthenticated) {
    try {
      const me = await authAPI.getCurrentUser()
      if (me) {
        localStorage.setItem('user', JSON.stringify(me))
        isAuthenticated = true
      }
    } catch {
      // ignore
    }
  }

  if (to.meta.requiresGuest && isAuthenticated) {
    next('/')
  } else if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router
