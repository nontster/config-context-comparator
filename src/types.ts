/**
 * Type definitions for Config Context Comparator
 */

/**
 * Supported configuration file formats
 */
export type ConfigFormat =
  | "json"
  | "yaml"
  | "toml"
  | "ini"
  | "xml"
  | "properties";

/**
 * Parsed configuration object (nested structure)
 */
export type ConfigObject = Record<string, unknown>;

/**
 * Flattened configuration with dot-notation keys
 */
export type FlatConfig = Record<string, string | number | boolean | null>;

/**
 * Value difference between two configs
 */
export interface ValueDifference {
  key: string;
  sourceValue: unknown;
  targetValue: unknown;
}

/**
 * Result of comparing two configuration files
 */
export interface ComparisonResult {
  /** Keys only present in source file */
  onlyInSource: string[];
  /** Keys only present in target file */
  onlyInTarget: string[];
  /** Keys present in both files */
  common: string[];
  /** Keys with different values */
  valueDifferences: ValueDifference[];
  /** Metadata */
  sourceFile: string;
  targetFile: string;
  sourceFormat: ConfigFormat;
  targetFormat: ConfigFormat;
}

/**
 * Parse result from a configuration file
 */
export interface ParseResult {
  format: ConfigFormat;
  raw: ConfigObject;
  flat: FlatConfig;
}
