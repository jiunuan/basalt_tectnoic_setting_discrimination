<template>
  <div class="basalt-container">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <h2>{{ t('title') }}</h2>
          <div class="header-actions">
            <lang-switch />
            <el-button type="primary" @click="goHome">
              {{ t('upload.button') }}
            </el-button>
          </div>
        </div>
      </template>

      <upload-dialog v-model:visible="showUploadDialog" @file-processed="handleFileProcessed" />

      <div v-if="!fileData.length" class="welcome-container">
        <div class="welcome-content">
          <div class="welcome-header">
            <h3>{{ t('welcome.title') }}</h3>
            <p>{{ t('welcome.description') }}</p>
            <div class="start-button-container">
              <el-button type="primary" size="large" class="start-button pulse-button" @click="showUploadDialog = true">
                <i class="el-icon-upload" />
                {{ t('welcome.startButton') }}
                <div class="button-effect"></div>
              </el-button>
            </div>
          </div>
          <div class="welcome-main">
            <img src="/tectonic.jpg" alt="Tectonic Settings" class="welcome-image" />
            <div class="welcome-steps">
              <div class="step-title">{{ t('welcome.stepsTitle') }}</div>
              <ul>
                <li>
                  <span class="step-number">1</span>
                  <span class="step-text">{{ t('welcome.step1') }}</span>
                </li>
                <li>
                  <span class="step-number">2</span>
                  <span class="step-text">{{ t('welcome.step2') }}</span>
                </li>
                <li>
                  <span class="step-number">3</span>
                  <span class="step-text">{{ t('welcome.step3') }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <data-display 
        v-else 
        :table-data="fileData" 
        :predictions="results" 
        :predicting="predicting"
        :processing="processing"
        :processed-data="processedData"
        :filename="currentFileName"
        @download="downloadResults" 
        @predict="handlePredict"
        @process="handleProcessData"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as tf from '@tensorflow/tfjs'
import { normalizeData } from './composables/normalize';
import UploadDialog from './components/UploadDialog.vue'
import DataDisplay from './components/DataDisplay.vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import LangSwitch from '../LangSwitch.vue'

import { COLUMNS_TO_EXTRACT, TECTONIC_SETTINGS, TECTONIC_SETTINGS_MAP } from './constants'

const { t } = useI18n()

const showUploadDialog = ref(false)
const fileData = ref([])
const results = ref([])
const predicting = ref(false)
let model = null

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
    const modelResponse = await fetch('./model/model.json')
    if (!modelResponse.ok) {
      throw new Error(`HTTP error! status: ${modelResponse.status}`)
    }
    const modelJSON = await modelResponse.json()
    console.log('model.json 内容:', modelJSON)

    model = await tf.loadLayersModel('./model/model.json');
    console.log('模型加载成功')
  } catch (error) {
    console.error('模型加载失败:', error)
  }
}

onMounted(async () => {
  console.log('onMounted')
  await loadModel()
  // console.log(model)
})

const currentFileName = ref('')

const handleFileProcessed = async (data, filename) => {
  currentFileName.value = filename
  fileData.value = data.map(row => {
    const rowData = {}
    row.forEach((val, index) => {
      rowData['col' + index] = val
    })
    return rowData
  })
}

const handlePredict = async () => {
  if (!model) {
    ElMessage.error(t('message.modelNotLoaded'))
    return
  }
  
  predicting.value = true
  try {
    if (!processedData.value) {
      ElMessage.error(t('message.processDataFirst'))
      return
    }

    const imageData = convertToImageArray(processedData.value)
    await makePredictions(imageData)
    ElMessage.closeAll()
  } catch (error) {
    console.error('预测过程出错:', error)
    ElMessage.error(t('message.predictFail'))
  } finally {
    predicting.value = false
  }
}

// 添加数据筛选函数
const filterData = (data) => {
  // 存储已经出现过的数据的哈希值
  const seen = new Set()
  let duplicateCount = 0
  let invalidCount = 0
  
  const filteredData = data.filter((sample, index) => {
    // 检查无效值
    // const zeroCount = sample.filter(val => val === 0 || val === null || isNaN(val)).length
    // if (zeroCount > 16) {
    //   console.log(`样本 ${index + 1} 有 ${zeroCount} 个无效值，已被过滤`)
    //   invalidCount++
    //   return false
    // }
    
    // 检查重复值
    const sampleHash = sample.join(',')
    if (seen.has(sampleHash)) {
      console.log(`样本 ${index + 1} 是重复数据，已被过滤`)
      duplicateCount++
      return false
    }
    
    seen.add(sampleHash)
    return true
  })

  // 如果有重复数据被过滤，显示提示信息
  if (duplicateCount > 0) {
    ElMessage({
      message: t('message.duplicatesFiltered', {
        count: duplicateCount
      }),
      type: 'warning',
      duration: 3000
    })
  }

  return {
    data: filteredData,
    stats: {
      total: data.length,
      invalid: invalidCount,
      duplicate: duplicateCount,
      remaining: filteredData.length
    }
  }
}

const processedData = ref(null)
const processing = ref(false)

// 添加数据处理函数
const handleProcessData = async () => {
  if (!fileData.value.length) {
    ElMessage.error(t('message.noData'))
    return
  }

  processing.value = true
  const loadingMessage = ElMessage({
    message: t('message.processing'),
    type: 'info',
    duration: 0
  })

  try {
    // 获取原始数据
    const originalData = fileData.value.map(row =>
      COLUMNS_TO_EXTRACT.map(col => row['col' + COLUMNS_TO_EXTRACT.indexOf(col)])
    )

    // 先进行数据筛选
    const { data: filteredData, stats } = filterData(originalData)

    // 检查筛选结果
    if (filteredData.length === 0) {
      loadingMessage.close()
      ElMessage.error(t('message.noValidData'))
      return
    }

    // 显示筛选结果
    if (stats.invalid > 0 || stats.duplicate > 0) {
      ElMessage({
        message: t('message.dataFiltered', {
          total: stats.total,
          invalid: stats.invalid,
          duplicate: stats.duplicate,
          remaining: stats.remaining
        }),
        type: 'warning',
        duration: 3000
      })
    }

    // 对筛选后的数据进行标准化
    const normalizedData = await processData(filteredData)
    processedData.value = normalizedData

    // 更新表格数据，显示处理后的数据
    fileData.value = filteredData.map((row, index) => {
      const rowData = {}
      row.forEach((val, colIndex) => {
        rowData['col' + colIndex] = val
      })
      return rowData
    })

    loadingMessage.close()
    ElMessage.success(t('message.processSuccess'))
  } catch (error) {
    console.error('数据处理错误:', error)
    loadingMessage.close()
    ElMessage.error(t('message.processFail'))
  } finally {
    processing.value = false
  }
}

const processData = async (data) => {
  try {
    const normalizedData = await normalizeData(data, COLUMNS_TO_EXTRACT);
    return normalizedData
  } catch (error) {
    console.error('数据标准化失败:', error);
  }
}

// 添加数据转换函数
const convertToImageArray = (data) => {
  const imageShape = [6, 6] // 6x6 的图像形状
  const numSamples = data.length
  const images = new Array(numSamples)

  for (let i = 0; i < numSamples; i++) {
    // 创建 6x6x1 的图像数组
    const imageData = new Array(36).fill(0)
    for (let j = 0; j < Math.min(data[i].length, 36); j++) {
      imageData[j] = data[i][j]
    }

    // 直接除以255进行归一化
    const normalizedData = imageData.map(val => val / 255.0)
    images[i] = normalizedData
  }

  return images
}

// 添加预测函数
const makePredictions = async (data) => {
  if (!model) {
    console.error('模型未加载')
    return
  }

  console.log('当前 TensorFlow 后端:', tf.getBackend())
  console.log('模型状态:', model)

  try {
    // 将数据转换为正确的形状 [samples, 6, 6, 1]
    const inputData = tf.tensor4d(data.map(sample => {
      return Array.from(sample).map(val => [val]) // 添加通道维度
        .reduce((rows, val, index) => {
          const rowIndex = Math.floor(index / 6)
          if (!rows[rowIndex]) rows[rowIndex] = []
          rows[rowIndex].push(val)
          return rows
        }, [])
    }))

    // 进行预测
    const predictions = await model.predict(inputData)
    const predictionArray = await predictions.array()

    // 更新预测结果
    results.value = predictionArray.map(pred => getTectonicSetting(pred))

    // 更新表格数据
    fileData.value = fileData.value.map((row, index) => ({
      ...row,
      prediction: results.value[index]
    }))

    // 清理张量
    inputData.dispose()
    predictions.dispose()

    // 显示成功消息
    ElMessage({
      message: t('message.predictSuccess'),
      type: 'success',
      duration: 3000
    })
  } catch (error) {
    console.error('预测过程出错:', error)
    ElMessage.error(t('message.predictFail'))
  }
}

// 添加构造环境判断函数
const getTectonicSetting = (prediction) => {
  const maxIndex = prediction.indexOf(Math.max(...prediction))
  const englishEnvironment = TECTONIC_SETTINGS[maxIndex]
  return TECTONIC_SETTINGS_MAP[englishEnvironment] || englishEnvironment
}

// 添加下载结果函数
const downloadResults = () => {
  if (!results.value.length) {
    ElMessage.error(t('message.noResults'))
    return
  }

  try {
    // 准备CSV数据
    const csvContent = []
    
    // 添加表头
    const headers = [...COLUMNS_TO_EXTRACT, 'Predicted_Setting']
    csvContent.push(headers.join(','))

    // 添加数据行
    fileData.value.forEach((row, index) => {
      const rowData = COLUMNS_TO_EXTRACT.map(col => 
        row['col' + COLUMNS_TO_EXTRACT.indexOf(col)]
      )
      rowData.push(results.value[index])
      csvContent.push(rowData.join(','))
    })

    // 创建Blob对象
    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    // 设置下载文件名
    const date = new Date().toISOString().slice(0, 10)
    link.setAttribute('href', url)
    link.setAttribute('download', `tectonic_predictions_${date}.csv`)
    
    // 触发下载
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    ElMessage.success(t('message.downloadSuccess'))
  } catch (error) {
    console.error('下载结果失败:', error)
    ElMessage.error(t('message.downloadFail'))
  }
}

const goHome = () => {
  // 重置所有数据和状态
  fileData.value = []
  results.value = []
  predicting.value = false
  processing.value = false
  processedData.value = null
  currentFileName.value = ''
}
</script>

<style scoped>
.basalt-container {
  padding: 10px;
  height: 100vh;
  box-sizing: border-box;
}

.main-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-container {
  height: 100%;
  display: flex;
  justify-content: center;
  padding: 20px;
  background-color: #f8f9fa;
}

.welcome-content {
  max-width: 1200px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 40px;
  padding: 40px;
}

.welcome-header {
  text-align: center;
  margin: 0 auto;
  margin-bottom: 40px;
}

.welcome-header h3 {
  font-size: 32px;
  color: #303133;
  margin-bottom: 20px;
  font-weight: 600;
}

.welcome-header p {
  font-size: 18px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 30px;
}

.welcome-main {
  display: flex;
  gap: 60px;
  align-items: flex-start;
}

.welcome-image {
  width: 60%;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.welcome-steps {
  flex: 1;
  background-color: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.step-title {
  font-size: 24px;
  color: #303133;
  margin-bottom: 30px;
  font-weight: 600;
}

.welcome-steps ul {
  list-style: none;
  padding: 0;
  margin-bottom: 40px;
}

.welcome-steps li {
  font-size: 16px;
  color: #606266;
  margin-bottom: 24px;
  padding-left: 40px;
  position: relative;
  display: flex;
  align-items: center;
}

.step-number {
  position: absolute;
  left: 0;
  width: 28px;
  height: 28px;
  background-color: #409eff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.step-text {
  font-size: 16px;
  line-height: 1.6;
}

.start-button {
  padding: 12px 36px;
  font-size: 18px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.start-button-container {
  margin-top: 40px;
  position: relative;
  display: flex;
  justify-content: center;
}

.start-button {
  padding: 16px 48px;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  border: none;
  background: linear-gradient(45deg, #409eff, #36cf7c);
  box-shadow: 0 4px 15px rgba(64, 158, 255, 0.3);
}

.start-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.4);
  background: linear-gradient(45deg, #36cf7c, #409eff);
}

.start-button:active {
  transform: translateY(1px);
}

.button-effect {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 60%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.start-button:hover .button-effect {
  opacity: 1;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.4);
  }

  70% {
    box-shadow: 0 0 0 15px rgba(64, 158, 255, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0);
  }
}

.pulse-button {
  animation: pulse 2s infinite;
}

.pulse-button:hover {
  animation: none;
}

.el-icon-upload {
  margin-right: 8px;
  font-size: 24px;
  vertical-align: middle;
}
</style>