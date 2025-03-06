<template>
  <div class="data-display">
    <div class="table-header">
      <div class="header-left">
        <h3>{{ t('preview.title') }}</h3>
        <span v-if="filename" class="filename">{{ t('preview.currentFile') }}: {{ filename }}</span>
      </div>
      <div class="header-buttons">
        <el-button 
          type="primary" 
          @click="$emit('process')" 
          :loading="processing"
          :disabled="predictions.length > 0 || processedData"
          :icon="Histogram"
          size="large"
          class="action-button"
        >
          {{ processing ? t('message.processing') : t('preview.process') }}
        </el-button>
        <el-button 
          type="success" 
          @click="$emit('predict')" 
          :loading="predicting"
          :disabled="!processedData || predictions.length > 0"
          :icon="DataAnalysis"
          size="large"
          class="action-button"
        >
          {{ predicting ? t('preview.predicting') : t('preview.predict') }}
        </el-button>
        <el-button 
          type="warning" 
          @click="$emit('download')" 
          :disabled="!predictions.length"
          :icon="Download"
          size="large"
          class="action-button download-button"
        >
          {{ t('preview.download') }}
        </el-button>
      </div>
    </div>

    <el-table 
      :data="paginatedData" 
      style="width: 100%" 
      border 
      max-height="280"
      v-loading="processing || predicting"
    >
      <el-table-column
        v-for="(col, index) in COLUMNS_TO_EXTRACT"
        :key="index"
        :prop="'col' + index"
        :label="col"
        width="150"
        show-overflow-tooltip
      />
      <el-table-column 
        v-if="predictions.length"
        :label="t('preview.predict')"
        prop="prediction"
        width="200"
        fixed="right"
        show-overflow-tooltip
      />
    </el-table>
    
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="props.tableData.length || 0"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        background
      />
    </div>

    <div class="charts-container">
      <div class="chart-item">
        <div ref="pieChartRef" class="chart"></div>
      </div>
      <div class="chart-item">
        <div ref="barChartRef" class="chart"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { watch, onMounted, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Histogram, DataAnalysis, Download } from '@element-plus/icons-vue'
import { COLUMNS_TO_EXTRACT } from '../constants'
import { useCharts } from '../composables/useCharts'

const { t } = useI18n()

const props = defineProps({
  tableData: {
    type: Array,
    default: () => []
  },
  predictions: {
    type: Array,
    default: () => []
  },
  predicting: {
    type: Boolean,
    default: false
  },
  processing: {
    type: Boolean,
    default: false
  },
  processedData: {
    type: Array,
    default: () => []
  },
  filename: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['download', 'predict', 'process'])


const { pieChartRef, barChartRef, initCharts, updateCharts } = useCharts()

const paginatedData = computed(() => {
  return props.tableData.slice(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value
  )
})

const currentPage = ref(1)
const pageSize = ref(10)

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 监听预测结果变化，更新图表
watch(() => props.predictions, (newPredictions) => {
  if (newPredictions?.length) {
    updateCharts(newPredictions)
  }
}, { deep: true, immediate: false })

// 监听语言变化，更新图表
watch(() => t.value, () => {
  if (props.predictions?.length) {
    updateCharts(props.predictions)
  }
}, { immediate: false })

onMounted(() => {
  initCharts()
})
</script>

<style scoped>
.data-display {
  height: calc(100% - 60px);
  display: flex;
  flex-direction: column;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 0 10px;
}

.header-buttons {
  display: flex;
  gap: 15px;
}

.action-button {
  min-width: 140px;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.action-button:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-button :deep(.el-icon) {
  font-size: 18px;
  margin-right: 4px;
}

.charts-container {
  display: flex;
  margin-bottom: 20px;
  gap: 20px;
}

.chart-item {
  flex: 1;
  min-height: 300px;
  border-radius: 4px;
  padding: 10px;
  border: v-bind('predictions.length ? "1px solid #eee" : "none"');
}

.chart {
  width: 100%;
  height: 100%;
  min-height: 280px;
}

:deep(.el-table) {
  flex: 1;
  overflow: auto;
}

:deep(.el-table__body-wrapper) {
  overflow-y: auto;
}

.pagination-container {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filename {
  font-size: 14px;
  color: #606266;
}

.download-button {
  background: linear-gradient(145deg, #f7ba2c 0%, #ea942c 100%);
  border: none;
  color: white;
}

.download-button:hover:not(:disabled) {
  background: linear-gradient(145deg, #ea942c 0%, #f7ba2c 100%);
  border: none;
  color: white;
}

.download-button:disabled {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  color: #c0c4cc;
}
</style> 