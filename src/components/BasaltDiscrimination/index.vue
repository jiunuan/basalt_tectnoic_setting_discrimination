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
          <div class="welcome-main">
            <div class="welcome-left">
              <div class="welcome-header-left">
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
              <div class="welcome-image-container">
                <div class="image-section">
                  <img src="/tectonic.jpg" alt="Tectonic Settings" class="welcome-image" />
                </div>
                <div class="steps-section">
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
            <div class="welcome-right">
              <div class="data-requirements">
                <h4>
                  <el-icon class="info-icon"><info-filled /></el-icon>
                  {{ t('welcome.dataRequirements.title') }}
                </h4>
                <p>{{ t('welcome.dataRequirements.description') }}</p>
                <p class="columns-title">{{ t('welcome.dataRequirements.columnsTitle') }}</p>
                <div class="columns-grid">
                  <template v-for="(col, index) in COLUMNS_TO_EXTRACT" :key="index">
                    <span class="column-name">{{ col }}</span>
                  </template>
                </div>
              </div>

              <div class="sample-data">
                <h4>
                  <el-icon class="download-icon"><download /></el-icon>
                  {{ t('welcome.sampleData.title') }}
                </h4>
                <p>{{ t('welcome.sampleData.description') }}</p>
                <div class="sample-files">
                  <a :href="`${baseUrl}data/Back_arc_basin.csv`" class="sample-file-link" download="Back_arc_basin.csv">
                    <el-icon class="file-icon"><document /></el-icon>
                    {{ t('welcome.sampleData.example1') }}
                  </a>
                  <a :href="`${baseUrl}data/Isua.csv`" class="sample-file-link" download="Isua_sample.csv">
                    <el-icon class="file-icon"><document /></el-icon>
                    {{ t('welcome.sampleData.example2') }}
                  </a>
                  <a :href="`${baseUrl}data/Norseman&Kambalda.csv`" class="sample-file-link" download="Norseman&Kambalda.csv">
                    <el-icon class="file-icon"><document /></el-icon>
                    {{ t('welcome.sampleData.example3') }}
                  </a>
                </div>
              </div>
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

      <div v-show="predicting || processing" class="loading-overlay">
        <div class="loading-content">
          <div class="loading-spinner">
            <el-icon class="loading-icon"><loading /></el-icon>
          </div>
          <div class="loading-text">
            {{ predicting ? t('message.predicting') : t('message.processing') }}
          </div>
          <el-progress 
            :percentage="progressPercentage" 
            :stroke-width="10"
            :show-text="false"
            class="progress-bar"
          />
          <div class="progress-text">{{ progressPercentage }}%</div>
          <div class="loading-subtext">{{ t('message.pleaseWait') }}</div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import * as tf from '@tensorflow/tfjs'
import { normalizeData } from './composables/normalize';
import UploadDialog from './components/UploadDialog.vue'
import DataDisplay from './components/DataDisplay.vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import LangSwitch from '../LangSwitch.vue'
import { Loading, InfoFilled, Download, Document } from '@element-plus/icons-vue'

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

// 修改基础路径的计算属性
const baseUrl = computed(() => {
  const base = import.meta.env.BASE_URL || '/'
  return base === '/' ? base : base + '/'
})

// 添加保存CSV的函数
const saveDataToCSV = (data, filename) => {
  try {
    // 构建CSV内容
    const csvContent = []
    
    // 添加列名
    csvContent.push(COLUMNS_TO_EXTRACT.join(','))
    
    // 添加数据行
    data.forEach(row => {
      csvContent.push(row.join(','))
    })

    // 创建Blob对象
    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    // 设置下载文件名
    const date = new Date().toISOString().slice(0, 10)
    const baseFileName = filename.split('.').slice(0, -1).join('.')
    link.setAttribute('href', url)
    link.setAttribute('download', `${baseFileName}_processed_${date}.csv`)
    
    // 触发下载
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    ElMessage.success('原始数据已保存为CSV文件')
  } catch (error) {
    console.error('保存CSV文件失败:', error)
    ElMessage.error('保存CSV文件失败')
  }
}

const handleFileProcessed = async (data, filename) => {
  // console.log(data)
  currentFileName.value = filename
  
  // 保存原始数据为CSV
  // saveDataToCSV(data, filename)
  
  fileData.value = data.map(row => {
    const rowData = {}
    row.forEach((val, index) => {
      rowData['col' + index] = val
    })
    return rowData
  })
}

// 添加进度条相关的代码
const progressPercentage = ref(0)

// 修改 handlePredict 函数
const handlePredict = async () => {
  console.log('开始预测')
  progressPercentage.value = 0
  predicting.value = true
  
  if (!model) {
    ElMessage.error(t('message.modelNotLoaded'))
    predicting.value = false
    return
  }
  
  try {
    if (!processedData.value) {
      ElMessage.error(t('message.processDataFirst'))
      predicting.value = false
      return
    }

    const imageData = convertToImageArray(processedData.value)
    await makePredictions(imageData)
    ElMessage.success(t('message.predictSuccess'))
  } catch (error) {
    console.error('预测过程出错:', error)
    ElMessage.error(t('message.predictFail'))
  } finally {
    predicting.value = false
    progressPercentage.value = 0
  }
}

// 添加数据筛选函数
const filterData = (data) => {
  // 存储已经出现过的数据的哈希值
  const seen = new Set()
  let duplicateCount = 0
  let invalidCount = 0
  
  const filteredData = data.filter((sample, index) => {
    //检查无效值
    const zeroCount = sample.filter(val => val === 0 || val === null || isNaN(val)).length
    if (zeroCount > 16) {
      // console.log(`样本 ${index + 1} 有 ${zeroCount} 个无效值，已被过滤`)
      invalidCount++
      return false
    }
    
    // 检查重复值
    const sampleHash = sample.join(',')
    if (seen.has(sampleHash)) {
      // console.log(`样本 ${index + 1} 是重复数据，已被过滤`)
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
      duration: 1000
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

// 修改handleProcessData函数
const handleProcessData = async () => {
  if (!fileData.value.length) {
    ElMessage.error(t('message.noData'))
    return
  }

  processing.value = true
  progressPercentage.value = 0
  
  const loadingMessage = ElMessage({
    message: t('message.processing'),
    type: 'info',
    duration: 0
  })

  try {
    // 获取原始数据
    // console.log(fileData.value)
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
        duration: 1000
      })
    }

    // 在处理过程中更新进度
    progressPercentage.value = 30 // 数据筛选完成
    const normalizedData = await processData(filteredData)
    progressPercentage.value = 70 // 数据标准化完成
    processedData.value = normalizedData
    
    // 更新表格数据
    fileData.value = filteredData.map((row, index) => {
      const rowData = {}
      row.forEach((val, colIndex) => {
        rowData['col' + colIndex] = val
      })
      return rowData
    })
    progressPercentage.value = 100 // 处理完成

    loadingMessage.close()
    ElMessage.success(t('message.processSuccess'))
  } catch (error) {
    console.error('数据处理错误:', error)
    loadingMessage.close()
    ElMessage.error(t('message.processFail'))
  } finally {
    processing.value = false
    progressPercentage.value = 0
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

// 修改 makePredictions 函数
const makePredictions = async (data) => {
  if (!model) {
    console.error('模型未加载')
    return
  }

  try {
    const batchSize = Math.ceil(data.length / 100)
    // const batchSize = 1
    const predictions = []
    const totalBatches = Math.ceil(data.length / batchSize)
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batchData = data.slice(i, i + batchSize)
      
      const inputData = tf.tidy(() => {
        return tf.tensor4d(batchData.map(sample => {
          return Array.from(sample).map(val => [val])
            .reduce((rows, val, index) => {
              const rowIndex = Math.floor(index / 6)
              if (!rows[rowIndex]) rows[rowIndex] = []
              rows[rowIndex].push(val)
              return rows
            }, [])
        }))
      })

      const batchPredictions = await model.predict(inputData)
      const batchArray = await batchPredictions.array()
      predictions.push(...batchArray)

      inputData.dispose()
      batchPredictions.dispose()

      // 更新进度
      progressPercentage.value = Math.min(100, Math.round(((i + batchSize) / data.length) * 100))
    }

    // 更新预测结果
    results.value = predictions.map(pred => getTectonicSetting(pred))

    // 更新表格数据
    fileData.value = fileData.value.map((row, index) => ({
      ...row,
      prediction: results.value[index]
    }))

  } catch (error) {
    console.error('预测过程出错:', error)
    throw error
  }
}

// 添加构造环境判断函数
const getTectonicSetting = (prediction) => {
  const maxIndex = prediction.indexOf(Math.max(...prediction))
  const englishEnvironment = TECTONIC_SETTINGS[maxIndex]
  return englishEnvironment
  // return TECTONIC_SETTINGS_MAP[englishEnvironment] || englishEnvironment
}

// 修改下载结果函数
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
    // 从原始文件名中去除后缀
    const baseFileName = currentFileName.value.split('.').slice(0, -1).join('.')
    link.setAttribute('href', url)
    link.setAttribute('download', `${baseFileName}_tectonic_predictions_${date}.csv`)
    
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
  overflow: auto;
}

.main-card :deep(.el-card__body) {
  /* padding: 0; */
  padding-top: 0px;
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
  align-items: flex-start;
  padding: 20px;
  background-color: #f8f9fa;
  overflow: hidden;
}

.welcome-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.welcome-main {
  display: flex;
  gap: 40px;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.welcome-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.welcome-header-left {
  text-align: left;
}

.welcome-header-left h3 {
  font-size: 32px;
  color: #303133;
  margin-bottom: 20px;
  font-weight: 600;
}

.welcome-header-left p {
  font-size: 18px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 60px;
}

.welcome-image-container {
  display: flex;
  gap: 40px;
  margin-top: 60px;
}

.image-section {
  flex: 1;
  max-width: 60%;
}

.welcome-image {
  margin-top: 15px;
  width: 100%;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.steps-section {
  flex: 1;
  max-width: 40%;
}

.welcome-steps {
  background-color: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  height: 95%;
}

.step-title {
  font-size: 24px;
  color: #303133;
  margin-bottom: 60px;
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
  margin-bottom: 40px;
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
  margin-left: 60px;
  padding: 12px 36px;
  font-size: 18px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.start-button-container {
  margin-top: 30px;
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

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.loading-content {
  text-align: center;
  padding: 40px;
  border-radius: 16px;
  background-color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  min-width: 300px;
}

.loading-spinner {
  width: 80px;
  height: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(45deg, #409eff20, #36cf7c20);
  border-radius: 50%;
  padding: 16px;
}

.loading-icon {
  font-size: 48px;
  color: #409eff;
  animation: rotate 2s linear infinite;
}

.loading-text {
  font-size: 20px;
  color: #303133;
  font-weight: 600;
}

.loading-subtext {
  font-size: 18px;
  color: #909399;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.sample-data {
  height: 316.42px;
  background-color: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.sample-data h4 {
  color: #303133;
  font-size: 18px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.sample-data .download-icon {
  color: #409eff;
  font-size: 20px;
}

.sample-data p {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 16px;
}

.sample-files {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sample-file-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  text-decoration: none;
  color: #409eff;
  font-size: 14px;
  transition: all 0.3s ease;
}

.sample-file-link:hover {
  background-color: #ecf5ff;
  transform: translateX(4px);
  border-color: #409eff;
}

.file-icon {
  font-size: 18px;
  color: #409eff;
}

.welcome-right {
  width: 400px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: calc(100vh - 200px);
  /* overflow-y: auto; */
}

.data-requirements {
  background-color: #f4f9ff;
  border-left: 4px solid #409eff;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.data-requirements h4 {
  color: #303133;
  font-size: 18px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.data-requirements .info-icon {
  color: #409eff;
  font-size: 20px;
}

.data-requirements p {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 16px;
}

.columns-title {
  font-size: 15px;
  color: #303133;
  margin-bottom: 12px;
  font-weight: 500;
}

.columns-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  padding: 12px;
  background-color: #ffffff;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  margin-top: 10px;
  max-height: 150px;
  overflow-y: auto;
}

.column-name {
  font-size: 13px;
  color: #409eff;
  background-color: #ecf5ff;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #d9ecff;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.3s ease;
}

.column-name:hover {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
  transform: translateY(-1px);
}

.progress-bar {
  width: 300px;
  margin: 8px 0;
}

.progress-text {
  font-size: 16px;
  color: #409eff;
  font-weight: 600;
}
</style>