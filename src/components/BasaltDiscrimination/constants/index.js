// 定义需要提取的列
export const COLUMNS_TO_EXTRACT = [
  "NA2O(WT%)", "MGO(WT%)", "AL2O3(WT%)", "SIO2(WT%)", "P2O5(WT%)", "K2O(WT%)",
  "CAO(WT%)", "TIO2(WT%)", "MNO(WT%)", "FEOT(WT%)", "RB(PPM)", "V(PPM)",
  "CR(PPM)", "CO(PPM)", "NI(PPM)", "BA(PPM)", "SR(PPM)", "Y(PPM)", "ZR(PPM)",
  "NB(PPM)", "LA(PPM)", "CE(PPM)", "PR(PPM)", "ND(PPM)", "SM(PPM)", "EU(PPM)",
  "GD(PPM)", "TB(PPM)", "DY(PPM)", "HO(PPM)", "ER(PPM)", "YB(PPM)", "LU(PPM)",
  "HF(PPM)", "TA(PPM)", "TH(PPM)"
]

export const TECTONIC_SETTINGS = [
  'BACK-ARC_BASIN',
  'CONTINENTAL FLOOD BASALT',
  'CONTINENTAL_RIFT',
  'Continental arc',
  'Intra-oceanic arc',
  'Island arc',
  'OCEAN ISLAND',
  'OCEANIC PLATEAU',
  'Mid-Oceanic Ridge'
]

export const TECTONIC_SETTINGS_MAP = {
  'BACK-ARC_BASIN': '弧后盆地',
  'CONTINENTAL FLOOD BASALT': '大陆溢流玄武岩',
  'CONTINENTAL_RIFT': '大陆裂谷',
  'Continental arc': '大陆弧',
  'Intra-oceanic arc': '洋内弧',
  'Island arc': '岛弧',
  'OCEAN ISLAND': '洋岛',
  'OCEANIC PLATEAU': '洋底高原',
  'Mid-Oceanic Ridge': '弧后盆地'
} 