/**
 * TreeView provider for displaying config comparison results
 */

import * as vscode from 'vscode';
import { ComparisonResult, ValueDifference } from './types';

/**
 * Tree item representing a comparison category or key
 */
export class ComparisonItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly category?: 'missing-in-target' | 'missing-in-source' | 'value-diff' | 'matching',
    public readonly keyPath?: string,
    public readonly valueDiff?: ValueDifference
  ) {
    super(label, collapsibleState);

    if (category && !keyPath) {
      // Category header
      this.contextValue = 'category';
      switch (category) {
        case 'missing-in-target':
          this.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground'));
          break;
        case 'missing-in-source':
          this.iconPath = new vscode.ThemeIcon('info', new vscode.ThemeColor('editorInfo.foreground'));
          break;
        case 'value-diff':
          this.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('editorWarning.foreground'));
          break;
        case 'matching':
          this.iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));
          break;
      }
    } else if (keyPath) {
      // Individual key
      this.contextValue = 'configKey';
      this.iconPath = new vscode.ThemeIcon('symbol-key');
      
      // Show value difference in tooltip
      if (valueDiff) {
        this.tooltip = `Source: ${valueDiff.sourceValue}\nTarget: ${valueDiff.targetValue}`;
        this.description = `${valueDiff.sourceValue} → ${valueDiff.targetValue}`;
      }
    }
  }
}

/**
 * Tree data provider for comparison results
 */
export class ComparisonTreeProvider implements vscode.TreeDataProvider<ComparisonItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ComparisonItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private result: ComparisonResult | null = null;

  /**
   * Update the comparison result and refresh the tree
   */
  setResult(result: ComparisonResult | null): void {
    this.result = result;
    this._onDidChangeTreeData.fire();
  }

  /**
   * Clear the comparison result
   */
  clear(): void {
    this.result = null;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ComparisonItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ComparisonItem): Thenable<ComparisonItem[]> {
    if (!this.result) {
      return Promise.resolve([
        new ComparisonItem(
          'No comparison loaded. Right-click a config file to compare.',
          vscode.TreeItemCollapsibleState.None
        )
      ]);
    }

    if (!element) {
      // Root level - show categories
      const categories: ComparisonItem[] = [];

      // Missing in Target (🔴)
      if (this.result.onlyInSource.length > 0) {
        categories.push(new ComparisonItem(
          `🔴 Missing in Target (${this.result.onlyInSource.length})`,
          vscode.TreeItemCollapsibleState.Expanded,
          'missing-in-target'
        ));
      }

      // Missing in Source (🔵)
      if (this.result.onlyInTarget.length > 0) {
        categories.push(new ComparisonItem(
          `🔵 Missing in Source (${this.result.onlyInTarget.length})`,
          vscode.TreeItemCollapsibleState.Expanded,
          'missing-in-source'
        ));
      }

      // Value Differences (🟡)
      if (this.result.valueDifferences.length > 0) {
        categories.push(new ComparisonItem(
          `🟡 Value Differences (${this.result.valueDifferences.length})`,
          vscode.TreeItemCollapsibleState.Expanded,
          'value-diff'
        ));
      }

      // Matching (✅)
      const matchingCount = this.result.common.length - this.result.valueDifferences.length;
      if (matchingCount > 0) {
        categories.push(new ComparisonItem(
          `✅ Matching (${matchingCount})`,
          vscode.TreeItemCollapsibleState.Collapsed,
          'matching'
        ));
      }

      return Promise.resolve(categories);
    }

    // Child level - show keys for each category
    if (element.category === 'missing-in-target') {
      return Promise.resolve(
        this.result.onlyInSource.map(key => 
          new ComparisonItem(key, vscode.TreeItemCollapsibleState.None, 'missing-in-target', key)
        )
      );
    }

    if (element.category === 'missing-in-source') {
      return Promise.resolve(
        this.result.onlyInTarget.map(key => 
          new ComparisonItem(key, vscode.TreeItemCollapsibleState.None, 'missing-in-source', key)
        )
      );
    }

    if (element.category === 'value-diff') {
      return Promise.resolve(
        this.result.valueDifferences.map(diff => 
          new ComparisonItem(diff.key, vscode.TreeItemCollapsibleState.None, 'value-diff', diff.key, diff)
        )
      );
    }

    if (element.category === 'matching') {
      const diffKeys = new Set(this.result.valueDifferences.map(d => d.key));
      const matching = this.result.common.filter(k => !diffKeys.has(k));
      return Promise.resolve(
        matching.map(key => 
          new ComparisonItem(key, vscode.TreeItemCollapsibleState.None, 'matching', key)
        )
      );
    }

    return Promise.resolve([]);
  }
}
