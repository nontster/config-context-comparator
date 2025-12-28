/**
 * Configuration comparison logic
 */

import { ComparisonResult, FlatConfig, ValueDifference, ConfigFormat } from './types';
import { parseConfig, flattenConfig } from './parsers';

/**
 * Compare two flattened configurations
 * @param source Source (e.g., UAT) flattened config
 * @param target Target (e.g., Production) flattened config
 * @returns Comparison result with missing keys and value differences
 */
export function compareFlatConfigs(source: FlatConfig, target: FlatConfig): Omit<ComparisonResult, 'sourceFile' | 'targetFile' | 'sourceFormat' | 'targetFormat'> {
  const sourceKeys = new Set(Object.keys(source));
  const targetKeys = new Set(Object.keys(target));

  // Keys only in source
  const onlyInSource = [...sourceKeys].filter(k => !targetKeys.has(k)).sort();

  // Keys only in target
  const onlyInTarget = [...targetKeys].filter(k => !sourceKeys.has(k)).sort();

  // Common keys
  const common = [...sourceKeys].filter(k => targetKeys.has(k)).sort();

  // Value differences
  const valueDifferences: ValueDifference[] = common
    .filter(key => {
      const sourceVal = source[key];
      const targetVal = target[key];
      // Compare as strings to handle type differences
      return String(sourceVal) !== String(targetVal);
    })
    .map(key => ({
      key,
      sourceValue: source[key],
      targetValue: target[key],
    }));

  return {
    onlyInSource,
    onlyInTarget,
    common,
    valueDifferences,
  };
}

/**
 * Compare two configuration files
 * @param sourceContent Source file content
 * @param sourceFilename Source filename (for format detection)
 * @param targetContent Target file content
 * @param targetFilename Target filename (for format detection)
 * @returns Full comparison result
 */
export function compareConfigFiles(
  sourceContent: string,
  sourceFilename: string,
  targetContent: string,
  targetFilename: string
): ComparisonResult {
  // Parse both configs
  const sourceParsed = parseConfig(sourceContent, sourceFilename);
  const targetParsed = parseConfig(targetContent, targetFilename);

  // Flatten both configs
  const sourceFlat = flattenConfig(sourceParsed.config);
  const targetFlat = flattenConfig(targetParsed.config);

  // Compare
  const comparison = compareFlatConfigs(sourceFlat, targetFlat);

  return {
    ...comparison,
    sourceFile: sourceFilename,
    targetFile: targetFilename,
    sourceFormat: sourceParsed.format,
    targetFormat: targetParsed.format,
  };
}

/**
 * Generate a summary of the comparison
 */
export function generateSummary(result: ComparisonResult): string {
  const lines: string[] = [];
  
  lines.push(`📊 Config Comparison Summary`);
  lines.push(`Source: ${result.sourceFile} (${result.sourceFormat})`);
  lines.push(`Target: ${result.targetFile} (${result.targetFormat})`);
  lines.push('');
  lines.push(`🔴 Missing in Target: ${result.onlyInSource.length}`);
  lines.push(`🔵 Missing in Source: ${result.onlyInTarget.length}`);
  lines.push(`🟡 Value Differences: ${result.valueDifferences.length}`);
  lines.push(`✅ Matching Keys: ${result.common.length - result.valueDifferences.length}`);

  return lines.join('\n');
}
