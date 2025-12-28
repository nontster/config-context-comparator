/**
 * Config Context Comparator - VS Code Extension
 * Compare configuration files across environments (UAT, Production)
 * with context-aware key detection
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ComparisonTreeProvider } from './treeProvider';
import { compareConfigFiles, generateSummary } from './comparator';

let treeProvider: ComparisonTreeProvider;

export function activate(context: vscode.ExtensionContext) {
  console.log('Config Context Comparator is now active!');

  // Register Tree View
  treeProvider = new ComparisonTreeProvider();
  vscode.window.registerTreeDataProvider('configComparison', treeProvider);

  // Command: Compare Two Config Files (from command palette)
  const compareFilesCmd = vscode.commands.registerCommand(
    'config-comparator.compareFiles',
    async () => {
      try {
        // Select source file
        const sourceUri = await vscode.window.showOpenDialog({
          canSelectMany: false,
          openLabel: 'Select Source File (e.g., UAT)',
          filters: {
            'Config Files': ['json', 'yaml', 'yml', 'toml', 'ini', 'xml', 'properties'],
            'All Files': ['*']
          }
        });

        if (!sourceUri || sourceUri.length === 0) {
          return;
        }

        // Select target file
        const targetUri = await vscode.window.showOpenDialog({
          canSelectMany: false,
          openLabel: 'Select Target File (e.g., Production)',
          filters: {
            'Config Files': ['json', 'yaml', 'yml', 'toml', 'ini', 'xml', 'properties'],
            'All Files': ['*']
          }
        });

        if (!targetUri || targetUri.length === 0) {
          return;
        }

        await performComparison(sourceUri[0].fsPath, targetUri[0].fsPath);
      } catch (error) {
        vscode.window.showErrorMessage(`Comparison failed: ${error}`);
      }
    }
  );

  // Command: Quick Compare (from context menu)
  const quickCompareCmd = vscode.commands.registerCommand(
    'config-comparator.quickCompare',
    async (uri: vscode.Uri) => {
      try {
        const sourceFile = uri.fsPath;
        const sourceDir = path.dirname(sourceFile);
        const sourceBasename = path.basename(sourceFile);

        // Try to find matching files for comparison (e.g., uat -> prod)
        const files = await fs.promises.readdir(sourceDir);
        const configFiles = files.filter(f => {
          const ext = path.extname(f).toLowerCase();
          return ['.json', '.yaml', '.yml', '.toml', '.ini', '.xml', '.properties'].includes(ext);
        });

        // Suggest files to compare with
        const suggestions = configFiles
          .filter(f => f !== sourceBasename)
          .map(f => ({
            label: f,
            description: path.join(sourceDir, f)
          }));

        if (suggestions.length === 0) {
          // No config files in same directory, show file picker
          const targetUri = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Select Target File to Compare',
            defaultUri: vscode.Uri.file(sourceDir),
            filters: {
              'Config Files': ['json', 'yaml', 'yml', 'toml', 'ini', 'xml', 'properties'],
              'All Files': ['*']
            }
          });

          if (targetUri && targetUri.length > 0) {
            await performComparison(sourceFile, targetUri[0].fsPath);
          }
          return;
        }

        // Show quick pick with suggestions
        const selected = await vscode.window.showQuickPick(suggestions, {
          placeHolder: 'Select file to compare with...',
          title: `Compare ${sourceBasename} with:`
        });

        if (selected) {
          await performComparison(sourceFile, selected.description!);
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Quick compare failed: ${error}`);
      }
    }
  );

  // Command: Clear comparison
  const clearCmd = vscode.commands.registerCommand(
    'config-comparator.clearComparison',
    () => {
      treeProvider.clear();
      vscode.window.showInformationMessage('Comparison cleared.');
    }
  );

  context.subscriptions.push(compareFilesCmd, quickCompareCmd, clearCmd);
}

/**
 * Perform comparison between two files and update TreeView
 */
async function performComparison(sourcePath: string, targetPath: string): Promise<void> {
  try {
    // Show progress
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Comparing configurations...',
        cancellable: false
      },
      async () => {
        // Read files
        const sourceContent = await fs.promises.readFile(sourcePath, 'utf-8');
        const targetContent = await fs.promises.readFile(targetPath, 'utf-8');

        // Compare
        const result = compareConfigFiles(
          sourceContent,
          path.basename(sourcePath),
          targetContent,
          path.basename(targetPath)
        );

        // Update tree view
        treeProvider.setResult(result);

        // Show summary
        const summary = generateSummary(result);
        vscode.window.showInformationMessage(
          `Comparison complete! Missing in Target: ${result.onlyInSource.length}, Missing in Source: ${result.onlyInTarget.length}, Value Diffs: ${result.valueDifferences.length}`,
          'View Details'
        ).then(selection => {
          if (selection === 'View Details') {
            // Focus on the tree view
            vscode.commands.executeCommand('configComparison.focus');
          }
        });
      }
    );
  } catch (error) {
    throw error;
  }
}

export function deactivate() {}
