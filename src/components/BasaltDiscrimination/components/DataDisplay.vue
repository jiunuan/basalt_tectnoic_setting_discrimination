<template>
  <div class="data-display">
    <div class="table-header">
      <h3>{{ t('preview.title') }}</h3>
      <div class="header-buttons">
        <el-button type="primary" @click="$emit('predict')" :loading="predicting">
          {{ predicting ? t('preview.predicting') : t('preview.predict') }}
        </el-button>
        <el-button type="success" @click="$emit('download')" :disabled="!predictions.length">
          {{ t('preview.download') }}
        </el-button>
      </div>
    </div>

    <el-table 
      :data="paginatedData" 
      style="width: 100%" 
      border 
      max-height="360"
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
  }
})

const emit = defineEmits(['download', 'predict'])

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
  console.log('DataDisplay')
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
  margin-bottom: 20px;
}

.charts-container {
  display: flex;
  margin-bottom: 20px;
  gap: 20px;
}

.chart-item {
  flex: 1;
  min-height: 300px;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 10px;
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
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.header-buttons {
  display: flex;
  gap: 10px;
}
</style> 