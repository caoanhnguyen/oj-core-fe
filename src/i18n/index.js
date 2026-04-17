import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import vi from './locales/vi.json'

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: localStorage.getItem('locale') || 'vi', // Default locale is Vietnamese since it's a Vietnamese project 
  fallbackLocale: 'en',
  messages: {
    en,
    vi
  }
})

export default i18n
// trigger HMR
