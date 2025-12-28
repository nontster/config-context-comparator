/**
 * Unit tests for parsers module
 */

import * as assert from 'assert';
import { detectFormat, parseConfig, flattenConfig } from '../parsers';

suite('Parser Test Suite', () => {

  suite('detectFormat', () => {
    test('should detect JSON format', () => {
      assert.strictEqual(detectFormat('{"key": "value"}'), 'json');
      assert.strictEqual(detectFormat('  { "nested": { "key": 1 } }  '), 'json');
      assert.strictEqual(detectFormat('[1, 2, 3]'), 'json');
    });

    test('should detect YAML format', () => {
      assert.strictEqual(detectFormat('key: value'), 'yaml');
      assert.strictEqual(detectFormat('database:\n  host: localhost'), 'yaml');
    });

    test('should detect XML format', () => {
      assert.strictEqual(detectFormat('<?xml version="1.0"?><root/>'), 'xml');
      assert.strictEqual(detectFormat('<config><key>value</key></config>'), 'xml');
    });

    test('should detect TOML format', () => {
      const tomlContent = `[database]
host = "localhost"
port = 5432`;
      assert.strictEqual(detectFormat(tomlContent), 'toml');
    });

    test('should detect INI format', () => {
      // INI is detected when TOML parsing fails
      const iniContent = `[client]
host = localhost`;
      const format = detectFormat(iniContent);
      assert.ok(format === 'toml' || format === 'ini');
    });

    test('should detect Properties format', () => {
      assert.strictEqual(detectFormat('server.port=8080'), 'properties');
      assert.strictEqual(detectFormat('db.url = jdbc:mysql://localhost'), 'properties');
    });
  });

  suite('flattenConfig', () => {
    test('should flatten simple object', () => {
      const input = { a: 1, b: 'hello' };
      const result = flattenConfig(input);
      assert.deepStrictEqual(result, { a: 1, b: 'hello' });
    });

    test('should flatten nested object', () => {
      const input = {
        database: {
          host: 'localhost',
          port: 5432
        }
      };
      const result = flattenConfig(input);
      assert.deepStrictEqual(result, {
        'database.host': 'localhost',
        'database.port': 5432
      });
    });

    test('should flatten arrays', () => {
      const input = {
        servers: ['a', 'b', 'c']
      };
      const result = flattenConfig(input);
      assert.deepStrictEqual(result, {
        'servers[0]': 'a',
        'servers[1]': 'b',
        'servers[2]': 'c'
      });
    });

    test('should handle deeply nested structures', () => {
      const input = {
        level1: {
          level2: {
            level3: {
              value: 'deep'
            }
          }
        }
      };
      const result = flattenConfig(input);
      assert.strictEqual(result['level1.level2.level3.value'], 'deep');
    });
  });

  suite('parseConfig', () => {
    test('should parse JSON content', () => {
      const content = '{"name": "test", "version": 1}';
      const result = parseConfig(content, 'test.json');
      assert.strictEqual(result.format, 'json');
      assert.deepStrictEqual(result.config, { name: 'test', version: 1 });
    });

    test('should parse YAML content', () => {
      const content = `name: test
version: 1`;
      const result = parseConfig(content, 'test.yaml');
      assert.strictEqual(result.format, 'yaml');
      assert.deepStrictEqual(result.config, { name: 'test', version: 1 });
    });

    test('should parse Properties content', () => {
      const content = `name=test
version=1`;
      const result = parseConfig(content, 'test.properties');
      assert.strictEqual(result.format, 'properties');
      assert.deepStrictEqual(result.config, { name: 'test', version: '1' });
    });
  });
});
