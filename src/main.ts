import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { vLenis } from './directives/lenis'

import 'lenis/dist/lenis.css'
import './style.css'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

import './demos/ipc'
// If you want use Node.js, the`nodeIntegration` needs to be enabled in the Main process.
// import './demos/node'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.directive('lenis', vLenis)

app.mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })
