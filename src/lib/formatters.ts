/**
 * 数值格式化工具函数
 * 根据业务需求对不同类型的数值进行格式化
 */

/**
 * 格式化重量相关数值 - 保留小数点后三位
 * @param value 数值
 * @param unit 单位（可选）
 * @returns 格式化后的字符串
 */
export function formatWeight(value: number | string | null | undefined, unit?: string): string {
  if (value === null || value === undefined || value === '') return '--';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '--';
  
  const formatted = numValue.toFixed(3);
  return unit ? `${formatted}${unit}` : formatted;
}

/**
 * 格式化百分比相关数值（水份、品位等） - 保留小数点后两位
 * @param value 数值
 * @param unit 单位（可选，默认为%）
 * @returns 格式化后的字符串
 */
export function formatPercentage(value: number | string | null | undefined, unit: string = '%'): string {
  if (value === null || value === undefined || value === '') return '--';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '--';
  
  const formatted = numValue.toFixed(2);
  return `${formatted}${unit}`;
}

/**
 * 智能格式化数值 - 根据单位自动判断格式化方式
 * @param value 数值
 * @param unit 单位
 * @returns 格式化后的字符串
 */
export function formatValue(value: number | string | null | undefined, unit?: string): string {
  if (value === null || value === undefined || value === '') return '--';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '--';
  
  // 根据单位判断格式化方式
  if (!unit || typeof unit !== 'string') {
    // 无单位或单位不是字符串时默认保留2位小数
    return numValue.toFixed(2);
  }

  // 重量相关单位 - 保留3位小数
  const weightUnits = ['t', 'kg', 'g', 'ton', '吨', '千克', '克'];
  if (weightUnits.includes(unit.toLowerCase())) {
    return formatWeight(value, unit);
  }

  // 百分比相关单位 - 保留2位小数
  const percentageUnits = ['%', 'percent', '百分比'];
  if (percentageUnits.includes(unit.toLowerCase())) {
    return formatPercentage(value, unit);
  }
  
  // 其他单位默认保留2位小数
  const formatted = numValue.toFixed(2);
  return `${formatted}${unit}`;
}

/**
 * 格式化图表显示数值
 * @param value 数值
 * @param unit 单位
 * @returns 格式化后的字符串
 */
export function formatChartValue(value: number | string | null | undefined, unit?: string): string {
  return formatValue(value, unit);
}

/**
 * 格式化表格显示数值
 * @param value 数值
 * @param unit 单位
 * @param precision 精度（可选，覆盖默认规则）
 * @returns 格式化后的字符串
 */
export function formatTableValue(
  value: number | string | null | undefined, 
  unit?: string, 
  precision?: number
): string {
  if (value === null || value === undefined || value === '') return '--';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '--';
  
  // 如果指定了精度，直接使用
  if (precision !== undefined) {
    const formatted = numValue.toFixed(precision);
    return unit ? `${formatted}${unit}` : formatted;
  }
  
  // 否则使用智能格式化
  return formatValue(value, unit);
}

/**
 * 检查是否为重量相关单位
 * @param unit 单位
 * @returns 是否为重量单位
 */
export function isWeightUnit(unit?: string): boolean {
  if (!unit || typeof unit !== 'string') return false;
  const weightUnits = ['t', 'kg', 'g', 'ton', '吨', '千克', '克'];
  return weightUnits.includes(unit.toLowerCase());
}

/**
 * 检查是否为百分比相关单位
 * @param unit 单位
 * @returns 是否为百分比单位
 */
export function isPercentageUnit(unit?: string): boolean {
  if (!unit || typeof unit !== 'string') return false;
  const percentageUnits = ['%', 'percent', '百分比'];
  return percentageUnits.includes(unit.toLowerCase());
}
