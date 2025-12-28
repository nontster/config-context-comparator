/**
 * Unit tests for comparator module
 */

import * as assert from 'assert';
import { compareFlatConfigs, compareConfigFiles } from '../comparator';
import { FlatConfig, ValueDifference } from '../types';

suite('Comparator Test Suite', () => {

  suite('compareFlatConfigs', () => {
    test('should identify keys only in source', () => {
      const source: FlatConfig = { a: 1, b: 2, c: 3 };
      const target: FlatConfig = { a: 1, b: 2 };
      
      const result = compareFlatConfigs(source, target);
      
      assert.deepStrictEqual(result.onlyInSource, ['c']);
      assert.deepStrictEqual(result.onlyInTarget, []);
    });

    test('should identify keys only in target', () => {
      const source: FlatConfig = { a: 1 };
      const target: FlatConfig = { a: 1, b: 2, c: 3 };
      
      const result = compareFlatConfigs(source, target);
      
      assert.deepStrictEqual(result.onlyInSource, []);
      assert.deepStrictEqual(result.onlyInTarget, ['b', 'c']);
    });

    test('should identify value differences', () => {
      const source: FlatConfig = { host: 'uat-db', port: 5432 };
      const target: FlatConfig = { host: 'prod-db', port: 5432 };
      
      const result = compareFlatConfigs(source, target);
      
      assert.strictEqual(result.valueDifferences.length, 1);
      assert.strictEqual(result.valueDifferences[0].key, 'host');
      assert.strictEqual(result.valueDifferences[0].sourceValue, 'uat-db');
      assert.strictEqual(result.valueDifferences[0].targetValue, 'prod-db');
    });

    test('should identify common keys', () => {
      const source: FlatConfig = { a: 1, b: 2 };
      const target: FlatConfig = { a: 1, b: 2 };
      
      const result = compareFlatConfigs(source, target);
      
      assert.deepStrictEqual(result.common.sort(), ['a', 'b']);
      assert.strictEqual(result.valueDifferences.length, 0);
    });

    test('should handle empty configs', () => {
      const source: FlatConfig = {};
      const target: FlatConfig = {};
      
      const result = compareFlatConfigs(source, target);
      
      assert.deepStrictEqual(result.onlyInSource, []);
      assert.deepStrictEqual(result.onlyInTarget, []);
      assert.deepStrictEqual(result.common, []);
    });

    test('should handle real-world UAT vs Production scenario', () => {
      const uatConfig: FlatConfig = {
        'database.host': 'uat-db.example.com',
        'database.port': 5432,
        'database.debug': true,
        'cache.enabled': true,
        'logging.level': 'DEBUG'
      };
      
      const prodConfig: FlatConfig = {
        'database.host': 'prod-db.example.com',
        'database.port': 5432,
        'cache.enabled': true,
        'logging.level': 'WARN',
        'monitoring.enabled': true
      };
      
      const result = compareFlatConfigs(uatConfig, prodConfig);
      
      // Keys only in UAT (missing in prod - potential issues!)
      assert.deepStrictEqual(result.onlyInSource, ['database.debug']);
      
      // Keys only in Production (new prod configs)
      assert.deepStrictEqual(result.onlyInTarget, ['monitoring.enabled']);
      
      // Value differences
      const diffKeys = result.valueDifferences.map((d: ValueDifference) => d.key).sort();
      assert.deepStrictEqual(diffKeys, ['database.host', 'logging.level']);
    });
  });

  suite('compareConfigFiles', () => {
    test('should compare YAML files', () => {
      const sourceYaml = `database:
  host: uat-db
  port: 5432`;
      
      const targetYaml = `database:
  host: prod-db
  port: 5432`;
      
      const result = compareConfigFiles(sourceYaml, 'uat.yaml', targetYaml, 'prod.yaml');
      
      assert.strictEqual(result.sourceFormat, 'yaml');
      assert.strictEqual(result.targetFormat, 'yaml');
      assert.strictEqual(result.valueDifferences.length, 1);
      assert.strictEqual(result.valueDifferences[0].key, 'database.host');
    });

    test('should compare JSON files', () => {
      const sourceJson = '{"api": {"url": "https://uat.api.com", "timeout": 30}}';
      const targetJson = '{"api": {"url": "https://prod.api.com", "timeout": 10}}';
      
      const result = compareConfigFiles(sourceJson, 'uat.json', targetJson, 'prod.json');
      
      assert.strictEqual(result.sourceFormat, 'json');
      assert.strictEqual(result.valueDifferences.length, 2); // url and timeout differ
    });

    test('should detect missing keys in production', () => {
      const uatJson = '{"feature_flag": true, "debug_mode": true}';
      const prodJson = '{"feature_flag": true}';
      
      const result = compareConfigFiles(uatJson, 'uat.json', prodJson, 'prod.json');
      
      assert.deepStrictEqual(result.onlyInSource, ['debug_mode']);
    });
  });
});
