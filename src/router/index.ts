import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import Welcome from '../views/Welcome.vue'
import Repository from '../views/Repository.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Welcome',
        component: Welcome,
        meta: {
          title: 'Welcome - GitHub Desktop Plus'
        }
      },
      {
        path: 'repository',
        name: 'Repository',
        component: Repository,
        meta: {
          title: 'Repository - GitHub Desktop Plus'
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// Update window title on route change
router.beforeEach((to, from, next) => {
  document.title = to.meta.title as string || 'GitHub Desktop Plus'
  next()
})

export default router