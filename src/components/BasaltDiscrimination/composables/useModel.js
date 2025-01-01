import * as tf from '@tensorflow/tfjs'
import { ref } from 'vue'

export function useModel() {
  const model = ref(null)

  // L2正则化器类定义
  class L2Regularizer extends tf.serialization.Serializable {
    constructor(config) {
      super()
      this.l2 = config.l2
    }

    apply(weights) {
      return tf.tidy(() => {
        const l2 = tf.scalar(this.l2)
        return tf.mul(l2, tf.sum(tf.square(weights)))
      })
    }

    getConfig() {
      return { l2: this.l2 }
    }

    static className = 'L2'
    
    static fromConfig(cls, config) {
      return new cls(config)
    }
  }

  // 注册正则化器
  tf.serialization.registerClass(L2Regularizer)

  // 加载模型
  const loadModel = async () => {
    try {
      const modelResponse = await fetch('/model/model.json')
      if (!modelResponse.ok) {
        throw new Error(`HTTP error! status: ${modelResponse.status}`)
      }
      const modelJSON = await modelResponse.json()
      console.log('model.json 内容:', modelJSON)

      model.value = await tf.loadLayersModel('/model/model.json')
      console.log('模型加载成功')
      return true
    } catch (error) {
      console.error('模型加载失败:', error)
      return false
    }
  }

  return {
    model,
    loadModel
  }
} 