<template>
  <div class="basalt-container">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <h2>玄武岩构造环境判别系统</h2>
          <el-button type="primary" @click="showUploadDialog = true">
            上传新文件
          </el-button>
        </div>
      </template>

      <!-- 上传对话框 -->
      <el-dialog
        v-model="showUploadDialog"
        title="上传数据文件"
        width="500px"
        :close-on-click-modal="false"
      >
        <el-upload
          class="upload-demo"
          drag
          action=""
          :auto-upload="false"
          :on-change="handleFileChange"
          accept=".csv"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将CSV文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              请上传包含玄武岩地球化学数据的CSV文件
            </div>
          </template>
        </el-upload>
      </el-dialog>

      <!-- 数据预览表格 -->
      <div v-if="fileData.length" class="data-preview">
        <div class="table-header">
          <h3>数据预览</h3>
          <el-button type="success" @click="downloadResults">
            下载预测结果
          </el-button>
        </div>
        
        <!-- 添加图表展示区域 -->
        <div class="charts-container">
          <div class="chart-item">
            <div ref="pieChartRef" class="chart"></div>
          </div>
          <div class="chart-item">
            <div ref="barChartRef" class="chart"></div>
          </div>
        </div>

        <!-- 表格部分 -->
        <el-table :data="fileData" style="width: 100%" border height="calc(100vh - 500px)">
          <el-table-column
            v-for="(col, index) in COLUMNS_TO_EXTRACT"
            :key="index"
            :prop="'col' + index"
            :label="col"
            width="150"
          />
          <el-table-column 
            v-if="results.length"
            label="预测结果" 
            prop="prediction"
            width="200"
            fixed="right"
          />
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import * as tf from '@tensorflow/tfjs'
import * as echarts from 'echarts'

// 定义需要提取的列
const COLUMNS_TO_EXTRACT = [
  "NA2O(WT%)", "MGO(WT%)", "AL2O3(WT%)", "SIO2(WT%)", "P2O5(WT%)", "K2O(WT%)",
  "CAO(WT%)", "TIO2(WT%)", "MNO(WT%)", "FEOT(WT%)", "RB(PPM)", "V(PPM)",
  "CR(PPM)", "CO(PPM)", "NI(PPM)", "BA(PPM)", "SR(PPM)", "Y(PPM)", "ZR(PPM)",
  "NB(PPM)", "LA(PPM)", "CE(PPM)", "PR(PPM)", "ND(PPM)", "SM(PPM)", "EU(PPM)",
  "GD(PPM)", "TB(PPM)", "DY(PPM)", "HO(PPM)", "ER(PPM)", "YB(PPM)", "LU(PPM)",
  "HF(PPM)", "TA(PPM)", "TH(PPM)"
]

// 实现 L2 正则化器
class L2Regularizer extends tf.serialization.Serializable {  // 继承 Serializable
  constructor(config) {
    super();  // 调用父类构造函数
    this.l2 = config.l2;
  }

  apply(weights) {
    return tf.tidy(() => {
      const l2 = tf.scalar(this.l2);
      return tf.mul(l2, tf.sum(tf.square(weights)));
    });
  }

  getConfig() {
    return {
      l2: this.l2
    };
  }

  static className = 'L2';  // 保持与 Python 端一致
  
  // 添加工厂方法
  static fromConfig(cls, config) {
    return new cls(config);
  }
}

// 注册正则化器
tf.serialization.registerClass(L2Regularizer);
const fileData = ref([])
const results = ref([])
let model = null

// 添加图表引用
const pieChartRef = ref(null)
const barChartRef = ref(null)
let pieChart = null
let barChart = null

// 初始化图表
const initCharts = () => {
  if (pieChartRef.value && barChartRef.value) {
    pieChart = echarts.init(pieChartRef.value)
    barChart = echarts.init(barChartRef.value)
  }
}

// 更新图表数据
const updateCharts = (predictions) => {
  if (!pieChart || !barChart) return

  // 统计各环境的数量
  const counts = {}
  predictions.forEach(pred => {
    counts[pred] = (counts[pred] || 0) + 1
  })

  const chartData = Object.entries(counts).map(([name, value]) => ({ name, value }))

  // 饼图配置
  const pieOption = {
    title: {
      text: '构造环境分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle'
    },
    series: [{
      type: 'pie',
      radius: '50%',
      data: chartData,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }

  // 柱状图配置
  const barOption = {
    title: {
      text: '构造环境数量统计',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: Object.keys(counts),
      axisLabel: {
        interval: 0,
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '样品数量'
    },
    series: [{
      data: Object.values(counts),
      type: 'bar',
      showBackground: true,
      backgroundStyle: {
        color: 'rgba(180, 180, 180, 0.2)'
      }
    }]
  }

  pieChart.setOption(pieOption)
  barChart.setOption(barOption)
}

// 监听窗口大小变化
window.addEventListener('resize', () => {
  pieChart?.resize()
  barChart?.resize()
})

// 在组件加载时加载模型
onMounted(async () => {
  console.log('开始加载模型...')
  try {
    // 先尝试获取 model.json 文件
    const modelResponse = await fetch('/model/model.json')
    if (!modelResponse.ok) {
      throw new Error(`HTTP error! status: ${modelResponse.status}`)
    }
    const modelJSON = await modelResponse.json()
    console.log('model.json 内容:', modelJSON)

    // 加载模型
    model = await tf.loadLayersModel('/model/model.json')
    console.log('模型加载成功')
  } catch (error) {
    console.error('模型加载失败，详细错误:', error)
    console.error('错误堆栈:', error.stack)
  }
})

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

const showUploadDialog = ref(false)

// 修改 handleFileChange 函数
const handleFileChange = (file) => {
  const reader = new FileReader()
  reader.onload = async (e) => {
    const text = e.target.result
    const lines = text.split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    const data = []
    
    // 获取需要提取的列的索引
    const columnIndices = COLUMNS_TO_EXTRACT.map(col => headers.indexOf(col))
    
    // 处理数据行
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line) {
        const values = line.split(',')
        // 只提取需要的列的数据
        const extractedValues = columnIndices.map(index => {
          const val = parseFloat(values[index])
          return isNaN(val) ? 0 : val // 将NaN替换为0
        })
        data.push(extractedValues)
      }
    }

    console.log('原始数据:', data)
    
    // 转换为图像数组格式
    const imageData = convertToImageArray(data)
    console.log('转换后的图像数据:', imageData)
    
    // 构建表格数据
    fileData.value = data.map(row => {
      const rowData = {}
      row.forEach((val, index) => {
        rowData['col' + index] = val
      })
      return rowData
    })
    
    // 关闭上传对话框
    showUploadDialog.value = false
    
    // 如果模型已加载，进行预测
    if (model) {
      await makePredictions(imageData)
    }
  }
  reader.readAsText(file.raw)
}

const makePredictions = async (data) => {
  if (!model) {
    console.error('模型未加载')
    return
  }

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

    // 更新图表
    updateCharts(results.value)

    // 清理张量
    inputData.dispose()
    predictions.dispose()
  } catch (error) {
    console.error('预测过程出错:', error)
    console.error('错误详情:', error.stack)
  }
}

// 根据预测结果确定构造环境
const getTectonicSetting = (prediction) => {
  const tectonic_settings = [
    'BACK-ARC_BASIN',
    'CONTINENTAL FLOOD BASALT',
    'CONTINENTAL_RIFT',
    'Continental arc',
    'Intra-oceanic arc',
    'Island arc',
    'OCEAN ISLAND',
    'OCEANIC PLATEAU',
    'SPREADING_CENTER'
  ]
  
  // 获取最大概率的索引
  const maxIndex = prediction.indexOf(Math.max(...prediction))
  
  // 将英文环境名称转换为中文显示
  const tectonic_settingsMap = {
    'BACK-ARC_BASIN': '弧后盆地',
    'CONTINENTAL FLOOD BASALT': '大陆溢流玄武岩',
    'CONTINENTAL_RIFT': '大陆裂谷',
    'Continental arc': '大陆弧',
    'Intra-oceanic arc': '洋内弧',
    'Island arc': '岛弧',
    'OCEAN ISLAND': '洋岛',
    'OCEANIC PLATEAU': '洋底高原',
    'SPREADING_CENTER': '扩张中心'
  }

  const englishEnvironment = tectonic_settings[maxIndex]
  return tectonic_settingsMap[englishEnvironment] || englishEnvironment
}

// 添加下载结果功能
const downloadResults = () => {
  // 构建CSV内容
  const headers = [...COLUMNS_TO_EXTRACT, '预测结果']
  const csvContent = [
    headers.join(','),
    ...fileData.value.map(row => {
      const values = COLUMNS_TO_EXTRACT.map(col => row[col])
      return [...values, row.prediction].join(',')
    })
  ].join('\n')

  // 创建下载链接
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = '玄武岩构造环境预测结果.csv'
  link.click()
}
</script>

<style scoped>
.basalt-container {
  padding: 20px;
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

.data-preview {
  display: flex;
  flex-direction: column;
  height: calc(100% - 60px);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.upload-demo {
  display: flex;
  justify-content: center;
}

:deep(.el-table) {
  margin-top: 20px;
}

.result-item {
  margin-bottom: 10px;
}

.charts-container {
  display: flex;
  margin-bottom: 20px;
  gap: 20px;
}

.chart-item {
  flex: 1;
  min-height: 400px;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 10px;
}

.chart {
  width: 100%;
  height: 100%;
  min-height: 380px;
}

.el-table {
  flex: 1;
  margin-top: 20px;
}
</style> 