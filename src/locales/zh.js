export default {
  title: '玄武岩构造环境判别系统',
  upload: {
    button: '首页',
    title: '上传数据文件',
    drag: '将文件拖到此处',
    or: '或',
    click: '点击上传',
    tip: '请上传包含玄武岩地球化学数据的CSV、XLSX或XLS文件'
  },
  preview: {
    title: '数据预览',
    empty: '暂无数据',
    predict: '开始预测',
    predicting: '预测中...',
    process: '处理数据',
    download: '下载结果',
    count: '数量',
    currentFile: '当前文件'
  },
  charts: {
    distribution: '构造环境分布',
    statistics: '构造环境统计',
    tooltip: {
      percentage: '{b}: {c}个样品 ({d}%)',
      count: '{b}: {c}个样品'
    }
  },
  settings: {
    'BACK-ARC_BASIN': '弧后盆地',
    'CONTINENTAL FLOOD BASALT': '大陆溢流玄武岩',
    'CONTINENTAL_RIFT': '大陆裂谷',
    'Continental arc': '大陆弧',
    'Intra-oceanic arc': '洋内弧',
    'Island arc': '岛弧',
    'OCEAN ISLAND': '洋岛',
    'OCEANIC PLATEAU': '洋底高原',
    'Mid-Oceanic Ridge': '扩张中心'
  },
  message: {
    modelNotLoaded: '模型未加载，请稍后重试',
    predictSuccess: '预测完成',
    predictFail: '预测失败，请重试',
    uploadSuccess: '文件上传成功',
    uploadFail: '文件处理失败，请检查文件格式和必要的列是否存在',
    uploadError: '文件读取失败',
    noValidData: '筛选后没有有效数据（缺失值过多）',
    dataFiltered: '共处理{total}个样本：{invalid}个无效，{duplicate}个重复，剩余{remaining}个',
    duplicatesFiltered: '已移除{count}个重复样本',
    noData: '没有可处理的数据',
    processing: '正在处理数据...',
    processSuccess: '数据处理完成',
    processFail: '数据处理失败',
    processDataFirst: '请先处理数据再进行预测',
    noResults: '没有可下载的预测结果',
    downloadSuccess: '结果下载成功',
    downloadFail: '结果下载失败',
    predicting: '正在预测构造环境...',
    pleaseWait: '请耐心等待数据处理完成',
    runningTime: '已运行时间'
  },
  welcome: {
    title: '欢迎使用玄武岩构造环境判别系统',
    description: '本系统使用深度学习技术，基于玄武岩样品的地球化学成分来识别其构造环境。',
    stepsTitle: '使用步骤',
    step1: '上传包含玄武岩地球化学数据的CSV文件',
    step2: '检查数据并点击"开始预测"进行分析',
    step3: '查看图表结果并下载',
    startButton: '开始使用',
    dataRequirements: {
      title: '数据要求',
      description: '请确保您的数据文件包含以下玄武岩样品的地球化学成分：',
      columnsTitle: '必需的数据列：'
    },
    sampleData: {
      title: '示例数据',
      description: '下载示例数据文件以查看所需格式：',
      example1: '示例1：弧后盆地样本',
      example2: '示例2：格陵兰岛Isua样本',
      example3: '示例3：Norseman&Kambalda样本'
    }
  }
} 