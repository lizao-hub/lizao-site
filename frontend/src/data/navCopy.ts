import type { Locale } from '@/composables/useLocale'

export const navCopy: Record<Locale, Record<string, string>> = {
  zh: {
    brand: '李枣的自留地',
    notes: '笔记',
    projects: '项目',
    about: '关于',
    friends: 'TA 们',
    toLight: '切换到浅色模式',
    toDark: '切换到深色模式',
    switchLanguage: '切换到 English',
  },
  en: {
    brand: "Lizao's Plot",
    notes: 'Notes',
    projects: 'Projects',
    about: 'About',
    friends: 'Friends',
    toLight: 'Switch to light mode',
    toDark: 'Switch to dark mode',
    switchLanguage: '切换到中文',
  },
}
