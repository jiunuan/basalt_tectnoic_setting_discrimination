import { createI18n } from 'vue-i18n'
import en from '../locales/en'
import zh from '../locales/zh'

// 从 localStorage 获取保存的语言设置，如果没有则使用英语
const savedLocale = localStorage.getItem('locale') || 'en'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: {
    en,
    zh
  }
})

export default i18n
