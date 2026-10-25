import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en'
import fa from './fa'

const saved = localStorage.getItem('lang')
const initial = saved === 'en' || saved === 'fa' ? saved : 'fa'

function applyDir(lng: string) {
  document.documentElement.lang = lng
  document.documentElement.dir = lng === 'fa' ? 'rtl' : 'ltr'
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, fa: { translation: fa } },
  lng: initial,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

applyDir(initial)
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('lang', lng)
  applyDir(lng)
})

export default i18n
