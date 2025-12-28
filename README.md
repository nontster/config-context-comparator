# Config Context Comparator

🔍 **Context-aware configuration file comparison for VS Code**

Compare configuration files across environments (UAT, Production, etc.) with intelligent key detection - not just text diff!

## Features

- **🔴 Missing Key Detection**: Instantly see which keys exist in source but not in target
- **🔵 Extra Key Detection**: Find keys in target that don't exist in source
- **🟡 Value Difference Highlighting**: Compare values for matching keys
- **✅ Matching Confirmation**: See all keys that match perfectly

### Supported Formats

| Format     | Extensions      |
| ---------- | --------------- |
| JSON       | `.json`         |
| YAML       | `.yaml`, `.yml` |
| TOML       | `.toml`         |
| INI        | `.ini`          |
| XML        | `.xml`          |
| Properties | `.properties`   |

## Usage

### Option 1: Context Menu (Quick Compare)

1. Right-click on any config file in Explorer
2. Select **"Compare with..."**
3. Choose a file to compare against
4. View results in the **Config Comparison** panel

### Option 2: Command Palette

1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type **"Compare Config Files"**
3. Select source file (e.g., UAT config)
4. Select target file (e.g., Production config)
5. View results in the **Config Comparison** panel

## Understanding Results

The comparison TreeView shows:

- **🔴 Missing in Target**: Keys that exist in source but not target (potential production issues!)
- **🔵 Missing in Source**: Keys in target that don't exist in source (new production configs?)
- **🟡 Value Differences**: Same key, different values between environments
- **✅ Matching**: Keys with identical values in both files

## Example

Comparing `app-config-uat.yaml`:

```yaml
database:
  host: uat-db.example.com
  port: 5432
  debug: true
```

With `app-config-prod.yaml`:

```yaml
database:
  host: prod-db.example.com
  port: 5432
```

Results:

- 🔴 `database.debug` - Missing in Production
- 🟡 `database.host` - Value differs: `uat-db.example.com` → `prod-db.example.com`
- ✅ `database.port` - Matches (5432)

## Installation

### From Source

```bash
# Clone and install
cd config-context-comparator
npm install

# Compile
npm run compile

# Test in VS Code
# Press F5 to open Extension Development Host
```

### From VSIX (coming soon)

```bash
npm run package
# Install the generated .vsix file
```

## Requirements

- VS Code 1.107.0 or higher

## Release Notes

### 0.1.0

- Initial release
- Support for JSON, YAML, TOML, INI, XML, Properties
- TreeView comparison results
- Context menu integration
- Content-based format detection

---

**Made with ❤️**
