/**
 * Configuration file parsers with automatic format detection
 * Ported from Python config-cmp.py
 */

import * as yaml from 'yaml';
import * as toml from '@iarna/toml';
import * as ini from 'ini';
import { XMLParser } from 'fast-xml-parser';
import { ConfigFormat, ConfigObject, FlatConfig } from './types';

/**
 * Detect configuration format by analyzing content patterns
 * @param content File content to analyze
 * @returns Detected format or null if unable to detect
 */
export function detectFormat(content: string): ConfigFormat | null {
  const stripped = content.trim();

  // 1. JSON: starts with { or [
  if (stripped.startsWith('{') || stripped.startsWith('[')) {
    try {
      JSON.parse(stripped);
      return 'json';
    } catch {
      // Not valid JSON, continue detection
    }
  }

  // 2. XML: starts with < or has <?xml declaration
  if (stripped.startsWith('<') || content.toLowerCase().includes('<?xml')) {
    return 'xml';
  }

  // 3. Check for section headers [section]
  const hasSection = /^\s*\[[^\[\]]+\]\s*$/m.test(content);

  // 4. TOML/INI: has [section] with key=value
  const hasSectionAssignment = /^[a-zA-Z_][a-zA-Z0-9_\-]*\s*=/m.test(content);
  if (hasSection && hasSectionAssignment) {
    // Try TOML first (supports more features)
    try {
      toml.parse(content);
      return 'toml';
    } catch {
      return 'ini';
    }
  }

  // 5. Properties: has key=value or key.subkey=value pattern (no sections)
  const hasProperties = /^[a-zA-Z_][a-zA-Z0-9_.\-]*\s*=\s*\S/m.test(content);
  if (hasProperties && !hasSection) {
    return 'properties';
  }

  // 6. YAML: has key: pattern
  if (/^[a-zA-Z_][a-zA-Z0-9_]*\s*:/m.test(content)) {
    return 'yaml';
  }

  return null;
}

/**
 * Get format from file extension as fallback
 */
export function getFormatFromExtension(filepath: string): ConfigFormat | null {
  const ext = filepath.toLowerCase().split('.').pop();
  const extMap: Record<string, ConfigFormat> = {
    'json': 'json',
    'yaml': 'yaml',
    'yml': 'yaml',
    'toml': 'toml',
    'ini': 'ini',
    'xml': 'xml',
    'properties': 'properties',
  };
  return extMap[ext || ''] || null;
}

/**
 * Parse JSON content
 */
function parseJson(content: string): ConfigObject {
  return JSON.parse(content);
}

/**
 * Parse YAML content
 */
function parseYaml(content: string): ConfigObject {
  return yaml.parse(content) || {};
}

/**
 * Parse TOML content
 */
function parseToml(content: string): ConfigObject {
  return toml.parse(content) as ConfigObject;
}

/**
 * Parse INI content
 */
function parseIni(content: string): ConfigObject {
  return ini.parse(content);
}

/**
 * Parse XML content
 */
function parseXml(content: string): ConfigObject {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });
  return parser.parse(content);
}

/**
 * Parse Java-style properties file
 */
function parseProperties(content: string): ConfigObject {
  const props: ConfigObject = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      props[key.trim()] = valueParts.join('=').trim();
    }
  }
  return props;
}

/**
 * Parse configuration content with format detection
 * @param content File content
 * @param filepath File path (used for extension fallback)
 * @returns Parsed configuration object and detected format
 */
export function parseConfig(content: string, filepath: string): { config: ConfigObject; format: ConfigFormat } {
  // Try content-based detection first
  let format = detectFormat(content);

  // Fallback to extension-based if content detection fails
  if (!format) {
    format = getFormatFromExtension(filepath);
    if (!format) {
      throw new Error(`Unable to detect format for ${filepath}`);
    }
  }

  let config: ConfigObject;

  switch (format) {
    case 'json':
      config = parseJson(content);
      break;
    case 'yaml':
      config = parseYaml(content);
      break;
    case 'toml':
      config = parseToml(content);
      break;
    case 'ini':
      config = parseIni(content);
      break;
    case 'xml':
      config = parseXml(content);
      break;
    case 'properties':
      config = parseProperties(content);
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  return { config, format };
}

/**
 * Flatten nested configuration object to dot-notation keys
 * @param obj Object to flatten
 * @param prefix Current key prefix
 * @param sep Separator (default: '.')
 * @returns Flattened key-value pairs
 */
export function flattenConfig(obj: unknown, prefix: string = '', sep: string = '.'): FlatConfig {
  const items: FlatConfig = {};

  if (obj === null || obj === undefined) {
    if (prefix) {
      items[prefix] = null;
    }
    return items;
  }

  if (typeof obj !== 'object') {
    if (prefix) {
      items[prefix] = obj as string | number | boolean;
    }
    return items;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const arrayKey = prefix ? `${prefix}[${index}]` : `[${index}]`;
      Object.assign(items, flattenConfig(item, arrayKey, sep));
    });
    return items;
  }

  // Regular object
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const newKey = prefix ? `${prefix}${sep}${key}` : key;

    if (value !== null && typeof value === 'object') {
      Object.assign(items, flattenConfig(value, newKey, sep));
    } else {
      items[newKey] = value as string | number | boolean | null;
    }
  }

  return items;
}
