import * as echarts from 'echarts'
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { TECTONIC_SETTINGS_MAP } from '../constants'

export function useCharts() {
  const { t } = useI18n()
  const pieChartRef = ref(null)
  const barChartRef = ref(null)
  let pieChart = null
  let barChart = null

  const initCharts = () => {
    if (pieChartRef.value && barChartRef.value) {
      pieChart = echarts.init(pieChartRef.value)
      barChart = echarts.init(barChartRef.value)
    }
  }

  const updateCharts = (predictions) => {
    if (!pieChart || !barChart) return

    const counts = {}
    predictions.forEach(pred => {
      // 找到中文名称对应的英文键
      const englishKey = Object.entries(TECTONIC_SETTINGS_MAP)
        .find(([key, value]) => value === pred)?.[0] || pred
      counts[englishKey] = (counts[englishKey] || 0) + 1
    })

    const chartData = Object.entries(counts).map(([key, value]) => ({
      name: t(`settings.${key}`),
      value
    }))

    // 按value值降序排序
    const sortedData = chartData.sort((a, b) => b.value - a.value)
    // 提取标签数组
    const labels = sortedData.map(item => item.name)
    // 提取数值数组
    const values = sortedData.map(item => item.value)

    const pieOption = {
      title: { 
        text: t('charts.distribution'), 
        left: 'center',
        textStyle: {
          fontSize: 20,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        textStyle: {
          fontSize: 16
        }
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        textStyle: {
          fontSize: 16
        },
        itemWidth: 25,
        itemHeight: 14
      },
      series: [
        {
          name: t('charts.distribution'),
          type: 'pie',
          radius: '50%',
          data: sortedData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            show: true,
            formatter: '{b}',
            fontSize: 14
          }
        }
      ]
    }

    const barOption = {
      title: { 
        text: t('charts.statistics'), 
        left: 'center',
        textStyle: {
          fontSize: 20,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        textStyle: {
          fontSize: 16
        }
      },
      grid: {
        left: '3%',
        right: '8%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: t('preview.count'),
        nameTextStyle: {
          fontSize: 16
        },
        axisLabel: {
          fontSize: 14
        }
      },
      yAxis: {
        type: 'category',
        data: labels.reverse(),
        axisLabel: {
          fontSize: 16,
          width: 200,   // 增加宽度
          color: '#333',
          // formatter: function(value) {
          //   return value.length > 20 ? value.substring(0, 20) + '...' : value
          // }
        }
      },
      series: [
        {
          type: 'bar',
          data: values.reverse(),
          label: {
            show: true,
            position: 'right',
            fontSize: 16
          }
        }
      ]
    }

    pieChart.setOption(pieOption)
    barChart.setOption(barOption)
  }

  const handleResize = () => {
    pieChart?.resize()
    barChart?.resize()
  }

  onMounted(() => {
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    pieChart?.dispose()
    barChart?.dispose()
  })

  return {
    pieChartRef,
    barChartRef,
    initCharts,
    updateCharts
  }
} 