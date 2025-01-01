import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'
import App from './App.vue'
import i18n from './i18n'
import * as tf from '@tensorflow/tfjs'

// 初始化 TensorFlow.js
await tf.ready()
console.log('TensorFlow.js 初始化成功，后端:', tf.getBackend())

const app = createApp(App)
app.use(ElementPlus)
app.use(i18n)
app.mount('#app')
