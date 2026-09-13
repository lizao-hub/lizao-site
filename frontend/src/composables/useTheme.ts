import { ref, watch } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'lizao-theme'

function readStoredTheme(): Theme | null {
  const value = localStorage.getItem(STORAGE_KEY)
  if (value === 'light' || value === 'dark') return value
  return null
}

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const theme = ref<Theme>(readStoredTheme() ?? systemTheme())

function applyTheme(value: Theme) {
  document.documentElement.classList.toggle('dark', value === 'dark')
}

applyTheme(theme.value)

watch(theme, (value) => {
  applyTheme(value)
  localStorage.setItem(STORAGE_KEY, value)
})

export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return { theme, toggleTheme }
}
