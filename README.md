# Basalt Tectonic Setting Discrimination System

A front-end application that uses deep learning technology to identify the tectonic setting of basalt samples based on their geochemical composition data.

## Features

- Support for multiple file formats (CSV, XLSX, XLS)
- Real-time data preview and validation
- Deep learning model for tectonic setting prediction
- Intuitive data visualization (pie and bar charts)
- Export functionality for prediction results
- Bilingual interface (English/Chinese)
- Responsive design for different screen sizes

## Tech Stack

- Vue 3
- Vite
- Element Plus
- TensorFlow.js
- ECharts
- Vue I18n
- XLSX

## Project Structure

```
src/
├── App.vue                 # Root component
├── main.js                 # Entry file
├── style.css              # Global styles
├── i18n/                  # Internationalization config
├── locales/               # Language files
│   ├── en.js             # English translations
│   └── zh.js             # Chinese translations
└── components/
    ├── LangSwitch.vue    # Language switch component
    └── BasaltDiscrimination/  # Main feature module
        ├── index.vue         # Main component
        ├── components/       # Sub-components
        ├── composables/      # Composable functions
        └── constants/        # Constants definition
```

## Installation and Setup

1. Clone the repository
\`\`\`
git clone [repository-url]
\`\`\`

2. Install dependencies
\`\`\`
npm install
\`\`\`

3. Run development server
\`\`\`
npm run dev
\`\`\`

4. Build for production
\`\`\`
npm run build
\`\`\`

## Usage Guide

1. Prepare your data file (CSV, XLSX, or XLS format) with the following geochemical components:
   - Major elements (SiO2, TiO2, Al2O3, etc.)
   - Trace elements (Rb, Sr, Y, Zr, etc.)
   - Rare earth elements (La, Ce, Pr, Nd, etc.)

2. Upload data file:
   - Click the "Get Started" button
   - Drag and drop your file or click to select
   - System will automatically validate the file format

3. Data preprocessing:
   - Review data preview to confirm data format
   - Click "Process Data" button to:
     * Remove duplicate samples
     * Normalize data values
     * Prepare data for prediction
   - System will display preprocessing statistics

4. Prediction and analysis:
   - After data preprocessing is complete
   - Click "Predict" button to start analysis
   - System will display prediction results and visualizations

5. Export results:
   - Click "Download Results" button
   - System will generate a CSV file containing:
     * Original data
     * Preprocessing results
     * Prediction results

## Supported Tectonic Settings

- Back-arc Basin
- Continental Flood Basalt
- Continental Rift
- Continental Arc
- Intra-oceanic Arc
- Island Arc
- Ocean Island
- Oceanic Plateau
- Mid-ocean Ridge

## Development Notes

- Built with Vite build tool
- Uses Composition API and `<script setup>` syntax
- Element Plus for UI components
- TensorFlow.js for model inference
- ECharts for data visualization
- Internationalization support (i18n)

## Deployment

The project can be deployed to any static web hosting service:

1. Build the project
\`\`\`bash
npm run build
\`\`\`

2. Deploy the `dist` directory to your server

## Important Notes

- Ensure your data file contains all required geochemical components
- Data format must match system requirements
- Recommended browsers: Chrome, Firefox, Safari
- Initial model download may take some time on first load

## License

MIT License

Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
