<template>
  <el-dialog
    :model-value="visible"
    :title="t('upload.title')"
    @close="handleClose"
    width="30%"
  >
    <el-upload
      class="upload-demo"
      drag
      :auto-upload="false"
      :show-file-list="false"
      :on-change="handleUpload"
      accept=".csv,.xlsx,.xls"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        {{ t('upload.drag') }}
        <em>{{ t('upload.or') }}{{ t('upload.click') }}</em>
      </div>
      <template #tip>
        <div class="el-upload__tip">{{ t('upload.tip') }}</div>
      </template>
    </el-upload>
  </el-dialog>
</template>

<script setup>
import { UploadFilled, InfoFilled } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { COLUMNS_TO_EXTRACT } from '../constants'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:visible', 'file-processed'])
const { t } = useI18n()
const processingFile = ref(false)
const lastProcessedFile = ref(null)

const handleClose = () => {
  emit('update:visible', false)
}

const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = (e) => reject(e)
    reader.readAsText(file)
  })
}

const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = (e) => reject(e)
    reader.readAsArrayBuffer(file)
  })
}

const validateData = (data) => {
  if (!data || !data.length) return false
  
  const isValid = data.every(row => {
    if (!row || !Array.isArray(row)) return false
    return row.length >= COLUMNS_TO_EXTRACT.length
  })
  
  return isValid
}

const processFile = async (file) => {
  if (processingFile.value) return false
  if (lastProcessedFile.value === file) return false
  
  lastProcessedFile.value = file
  processingFile.value = true

  try {
    const fileExt = file.raw.name.toLowerCase().split('.').pop()
    let rawData = []

    if (fileExt === 'csv') {
      const text = await readFileAsText(file.raw)
      rawData = text.split('\n')
        .filter(line => line.trim())
        .map(line => line.split(',').map(cell => cell.trim()))
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      const buffer = await readFileAsArrayBuffer(file.raw)
      const workbook = XLSX.read(buffer, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      rawData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
    }

    const headers = rawData[0]
    const data = []
    
    const columnIndices = COLUMNS_TO_EXTRACT.map(col => headers.indexOf(col))
    
    if (columnIndices.some(index => index === -1)) {
      throw new Error('缺少必要的列')
    }

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i]
      if (row && row.length) {
        const extractedValues = columnIndices.map(index => {
          const val = parseFloat(row[index])
          return isNaN(val) ? 0 : val
        })
        data.push(extractedValues)
      }
    }

    if (!validateData(data)) {
      ElMessage.error(t('message.uploadFail'))
      return
    }

    emit('file-processed', data, file.raw.name)
    emit('update:visible', false)
    ElMessage.success(t('message.uploadSuccess'))
  } catch (error) {
    console.error('文件处理错误:', error)
    ElMessage.error(t('message.uploadError'))
  } finally {
    processingFile.value = false
    setTimeout(() => {
      lastProcessedFile.value = null
    }, 1000)
  }
}

const handleUpload = (file) => {
  processFile(file)
  return false
}
</script>

<style scoped>
.upload-dialog :deep(.el-dialog__header) {
  margin-right: 0;
  text-align: center;
  border-bottom: 1px solid #e4e7ed;
  padding: 20px;
}

.upload-dialog :deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.upload-demo {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.upload-demo :deep(.el-upload-dragger) {
  width: 400px;
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #c0c4cc;
  border-radius: 8px;
  transition: all 0.3s;
}

.upload-demo :deep(.el-upload-dragger:hover) {
  border-color: #409eff;
  background-color: #f5f7fa;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-icon {
  font-size: 48px;
  color: #909399;
}

.upload-text {
  text-align: center;
}

.upload-text h3 {
  font-size: 16px;
  color: #606266;
  margin-bottom: 8px;
}

.click-upload {
  color: #409eff;
  font-style: normal;
  cursor: pointer;
}

.upload-tip {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #909399;
  font-size: 14px;
}

.upload-tip .el-icon {
  color: #e6a23c;
}

.el-upload__text {
  font-size: 16px;
}

.el-upload__tip {
  font-size: 14px;
}
</style> 