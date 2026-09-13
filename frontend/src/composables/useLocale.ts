import { ref } from 'vue'

export type Locale = 'zh' | 'en'

const STORAGE_KEY = 'lizao-locale'

function readStoredLocale(): Locale | null {
  const value = localStorage.getItem(STORAGE_KEY)
  if (value === 'zh' || value === 'en') return value
  return null
}

function systemLocale(): Locale {
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

const locale = ref<Locale>(readStoredLocale() ?? systemLocale())

export function useLocale() {
  function toggleLocale() {
    locale.value = locale.value === 'zh' ? 'en' : 'zh'
    localStorage.setItem(STORAGE_KEY, locale.value)
    document.documentElement.lang = locale.value === 'zh' ? 'zh-CN' : 'en'
  }

  return { locale, toggleLocale }
}
