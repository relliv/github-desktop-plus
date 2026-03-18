import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { vLenis } from './directives/lenis'
import { perf } from './shared/perf'

// Forward renderer perf logs to main process terminal
perf.configure({
  log: (msg) => {
    console.log(msg)
    // Also send to main process so it appears in the terminal
    window.ipcRenderer?.send('main-process-message', msg)
  }
})

perf.mark('renderer:script-start')

import 'lenis/dist/lenis.css'
import './style.css'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

import './demos/ipc'
// If you want use Node.js, the`nodeIntegration` needs to be enabled in the Main process.
// import './demos/node'

perf.mark('renderer:imports-done')

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.directive('lenis', vLenis)

perf.mark('renderer:vue-configured')

app.mount('#app')
  .$nextTick(() => {
    perf.mark('renderer:first-tick-after-mount')
    postMessage({ payload: 'removeLoading' }, '*')
  })
