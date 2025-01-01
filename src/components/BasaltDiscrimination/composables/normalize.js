/**
 * 数据标准化模块
 * 基于预先计算好的分位数将输入数据标准化到1-255范围
 */

/**
 * 使用保存的分位数标准化单个值
 * @param {number} val - 需要标准化的值
 * @param {number[]} columnQuantiles - 该列的分位数数组
 * @returns {number} - 标准化后的值（1-255）
 */
function normalizeValue(val, columnQuantiles) {
    // 处理缺失值
    if (isNaN(val)) return 0;
    
    // 处理边界情况
    if (val <= columnQuantiles[0]) return 1;
    if (val > columnQuantiles[columnQuantiles.length - 1]) return 255;
    
    // 在分位数范围内查找对应区间
    for (let j = 1; j < 254; j++) {
        if (columnQuantiles[j - 1] < val && val <= columnQuantiles[j]) {
            return j + 1;
        }
    }
    return 254;
}

/**
 * 标准化数据的主函数
 * @param {number[][]} data - 需要标准化的数据数组
 * @param {Object} quantiles - 分位数对象，从JSON文件加载
 * @param {string[]} columns - 列名数组，用于匹配分位数
 * @returns {number[][]} - 标准化后的数据
 */
async function normalizeData(data, columns) {
    try {
        // 从public/model目录加载分位数文件
        const response = await fetch('/model/saved_quantiles.json');
        const quantiles = await response.json();

        // 对每一行数据进行标准化
        const normalizedData = data.map(row => {
            return row.map((val, colIndex) => {
                const columnName = columns[colIndex];
                if (!quantiles[columnName]) {
                    console.error(`没有找到列 ${columnName} 的分位数数据`);
                    return val;
                }
                return normalizeValue(val, quantiles[columnName]);
            });
        });

        return normalizedData;

    } catch (error) {
        console.error('加载或处理分位数文件时出错:', error);
        throw error;
    }
}

// 导出函数供 Vue 组件使用
export {
    normalizeData,
    normalizeValue
};

/* 使用示例：
在 Vue 组件中：

import { normalizeData } from './normalize.js';

// 定义列名数组（必须与分位数JSON中的键名完全匹配）
const columns = [
    "NA2O(WT%)", "MGO(WT%)", "AL2O3(WT%)", "SIO2(WT%)", 
    "P2O5(WT%)", "K2O(WT%)", "CAO(WT%)", "TIO2(WT%)", 
    "MNO(WT%)", "FEOT(WT%)", ...
];

async function processData() {
    try {
        const normalizedData = await normalizeData(this.rawData, columns);
        this.processedData = normalizedData;
    } catch (error) {
        console.error('数据标准化失败:', error);
    }
}
*/