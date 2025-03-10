import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const base = command === 'serve' 
    ? '/' 
    : '/basalt_tectnoic_setting_discrimination/'

  return {
    base,
    plugins: [vue()],
    publicDir: 'public',
    server: {
      // 添加这些配置以查看更详细的网络请求信息
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    }
  }
})
