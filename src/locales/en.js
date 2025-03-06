export default {
  title: 'Basalt Tectonic Setting Discrimination System',
  upload: {
    button: 'Home',
    title: 'Upload Data File',
    drag: 'Drag file here',
    or: 'or',
    click: 'click to upload',
    tip: 'Please upload a CSV, XLSX or XLS file containing basalt geochemical data'
  },
  preview: {
    title: 'Data Preview',
    empty: 'No data available',
    predict: 'Predict',
    predicting: 'Predicting...',
    process: 'Process Data',
    download: 'Download Results',
    count: 'Count',
    currentFile: 'Current File'
  },
  charts: {
    distribution: 'Distribution of Tectonic Settings',
    statistics: 'Statistics of Tectonic Settings',
    tooltip: {
      percentage: '{b}: {c} samples ({d}%)',
      count: '{b}: {c} samples'
    }
  },
  settings: {
    'BACK-ARC_BASIN': 'Back-arc Basin',
    'CONTINENTAL FLOOD BASALT': 'Continental Flood Basalt',
    'CONTINENTAL_RIFT': 'Continental Rift',
    'Continental arc': 'Continental Arc',
    'Intra-oceanic arc': 'Intra-oceanic Arc',
    'Island arc': 'Island Arc',
    'OCEAN ISLAND': 'Ocean Island',
    'OCEANIC PLATEAU': 'Oceanic Plateau',
    'Mid-Oceanic Ridge': 'Mid-Oceanic Ridge'
  },
  message: {
    modelNotLoaded: 'Model not loaded, please try again later',
    predictSuccess: 'Prediction completed',
    predictFail: 'Prediction failed, please try again',
    uploadSuccess: 'File uploaded successfully',
    uploadFail: 'File processing failed, please check the file format and required columns',
    uploadError: 'File reading failed',
    noValidData: 'No valid data after filtering (too many missing values)',
    dataFiltered: '{total} samples processed: {invalid} invalid, {duplicate} duplicates, {remaining} remaining',
    duplicatesFiltered: '{count} duplicate samples were removed',
    noData: 'No data available for processing',
    processing: 'Processing data...',
    processSuccess: 'Data processing completed',
    processFail: 'Data processing failed',
    processDataFirst: 'Please process the data before prediction',
    noResults: 'No prediction results available for download',
    downloadSuccess: 'Results downloaded successfully',
    downloadFail: 'Failed to download results',
    predicting: 'Predicting tectonic settings...',
    pleaseWait: 'Please wait while we process your data',
    runningTime: 'Running Time'
  },
  welcome: {
    title: 'Welcome to Basalt Tectonic Setting Discrimination System',
    description: 'This system helps you identify the tectonic setting of basalt samples based on their geochemical composition using deep learning technology.',
    stepsTitle: 'How it works',
    step1: 'Upload your file containing basalt geochemical data',
    step2: 'Review the data and click "Start Prediction" to analyze',
    step3: 'View the results in charts and download',
    startButton: 'Get Started',
    dataRequirements: {
      title: 'Data Requirements',
      description: 'Please ensure your data file contains the following geochemical components for basalt samples:',
      columnsTitle: 'Required Columns:'
    },
    sampleData: {
      title: 'Sample Data',
      description: 'Download example data files to see the required format:',
      example1: 'Example 1: Back-arc Basin Samples',
      example2: 'Example 2: Isua Samples',
      example3: 'Example 3: Norseman&Kambalda Samples'
    }
  }
} 