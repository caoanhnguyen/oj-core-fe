import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import './style.css'
import './assets/badges.css'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import 'katex/dist/katex.min.css'

// Register katex globally so Quill's built-in formula blot can render math formulas
import katex from 'katex'
window.katex = katex

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)
app.use(ElementPlus)
app.component('QuillEditor', QuillEditor)

app.mount('#app')

